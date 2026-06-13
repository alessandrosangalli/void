import { useState, useRef, useEffect, useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { 
  activeToolAtom, 
  cameraAtom, 
  strokesAtom, 
  textsAtom, 
  imagesAtom,
  TEXT_NODE_DEFAULTS,
  selectedNodeAtom,
  pushHistoryAtom,
  undoAtom,
  redoAtom,
} from '../store'
import type { Point } from '../store'
import {
  screenToWorld,
  zoomAtPoint,
  zoomAtCenter,
  wheelDeltaToZoomFactor,
  panCamera,
  isDiscreteWheelEvent,
  pinchZoomFactor,
  pointerDistance,
  pointerMidpoint,
  fitImageDimensions,
} from '../lib/camera.utils'

export function useBoardEvents() {
  const [activeTool, setActiveTool] = useAtom(activeToolAtom)
  const [camera, setCamera] = useAtom(cameraAtom)
  const setStrokes = useSetAtom(strokesAtom)
  const setTexts = useSetAtom(textsAtom)
  const setImages = useSetAtom(imagesAtom)
  const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom)
  const pushHistory = useSetAtom(pushHistoryAtom)
  const undo = useSetAtom(undoAtom)
  const redo = useSetAtom(redoAtom)

  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSpacePanning, setIsSpacePanning] = useState(false)
  const [isRightClickDragging, setIsRightClickDragging] = useState(false)
  const [draggingNode, setDraggingNode] = useState<{ type: 'image' | 'text' | 'stroke', id: string | number } | null>(null)
  const [lastPointer, setLastPointer] = useState<[number, number] | null>(null)

  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map())
  const lastPinchDist = useRef<number | null>(null)

  // Track spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if ((e.target as HTMLElement)?.isContentEditable) return
      
      if (e.key === ' ') {
        e.preventDefault()
        setIsSpacePanning(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePanning(false)
      }
    }

    const handleBlur = () => {
      setIsSpacePanning(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if ((e.target as HTMLElement)?.isContentEditable) return
      const key = e.key.toLowerCase()

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (key === 'z') {
          e.preventDefault()
          undo()
          return
        } else if (key === 'y') {
          e.preventDefault()
          redo()
          return
        }
      }

      // Delete selected node
      if (key === 'backspace' || key === 'delete') {
        if (selectedNode) {
          e.preventDefault()
          pushHistory()
          if (selectedNode.type === 'text') {
            setTexts(prev => prev.filter(t => t.id !== selectedNode.id))
          } else if (selectedNode.type === 'image') {
            setImages(prev => prev.filter(img => img.id !== selectedNode.id))
          }
          setSelectedNode(null)
        }
      }

      // Duplicate selected node
      if ((e.ctrlKey || e.metaKey) && key === 'd') {
        if (selectedNode) {
          e.preventDefault()
          pushHistory()
          const newId = Math.random().toString(36).substr(2, 9)
          if (selectedNode.type === 'text') {
            setTexts(prev => {
              const target = prev.find(t => t.id === selectedNode.id)
              if (target) {
                return [
                  ...prev,
                  { ...target, id: newId, x: target.x + 20, y: target.y + 20, isEditing: false }
                ]
              }
              return prev
            })
            setSelectedNode({ type: 'text', id: newId })
          } else if (selectedNode.type === 'image') {
            setImages(prev => {
              const target = prev.find(img => img.id === selectedNode.id)
              if (target) {
                return [
                  ...prev,
                  { ...target, id: newId, x: target.x + 20, y: target.y + 20 }
                ]
              }
              return prev
            })
            setSelectedNode({ type: 'image', id: newId })
          }
        }
      }

      // Shift + 1 to reset camera
      if (e.shiftKey && key === '1') {
        e.preventDefault()
        setCamera({ x: 0, y: 0, zoom: 1 })
      }

      if (key === 'q') setActiveTool('move')
      if (key === 'w') setActiveTool('draw')
      if (key === 'e') setActiveTool('eraser')
      if (key === 'r') setActiveTool('text')
      
      if (e.ctrlKey || e.metaKey) {
        const doZoom = (dir: 'in' | 'out' | 'reset') => {
          setCamera(p => zoomAtCenter(p, dir, window.innerWidth, window.innerHeight))
        }
        if (key === '=' || key === '+') { e.preventDefault(); doZoom('in') }
        if (key === '-') { e.preventDefault(); doZoom('out') }
        if (key === '0') { e.preventDefault(); doZoom('reset') }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, setSelectedNode, setTexts, setImages, setActiveTool, setCamera, undo, redo, pushHistory])

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    
    if (activePointers.current.size > 1) {
      const pts = Array.from(activePointers.current.values())
      lastPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      return
    }
    
    if (e.button === 2) { 
      setIsRightClickDragging(true)
      setLastPointer([e.clientX, e.clientY])
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return 
    }

    // Space panning drag start
    if (isSpacePanning && e.button === 0) {
      setIsDragging(true)
      setLastPointer([e.clientX, e.clientY])
      ;(e.target as Element).setPointerCapture(e.pointerId)
      return
    }
    
    if (activeTool === 'eraser' || e.target instanceof HTMLTextAreaElement) return
    
    const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY, camera)
    
    if (activeTool === 'text') { 
      const id = Math.random().toString(36).substr(2, 9)
      pushHistory()
      setTexts(prev => [
        ...prev.map(t => ({ ...t, isEditing: false })), 
        { id, x: wx, y: wy - 15, content: '', isEditing: true, ...TEXT_NODE_DEFAULTS }
      ])
      return 
    }
    
    ;(e.target as Element).setPointerCapture(e.pointerId)
    
    if (activeTool === 'draw') {
      pushHistory()
      setCurrentStroke([[wx, wy, e.pressure]])
    } else if (activeTool === 'move') { 
      setIsDragging(true)
      setLastPointer([e.clientX, e.clientY]) 
      setSelectedNode(null)
    }
  }, [activeTool, camera, setTexts, setSelectedNode, pushHistory, isSpacePanning])

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      
      if (activePointers.current.size === 2 && lastPinchDist.current !== null) {
        const pts = Array.from(activePointers.current.values())
        const dist = pointerDistance(pts[0], pts[1])
        const factor = pinchZoomFactor(dist, lastPinchDist.current)
        lastPinchDist.current = dist
        const mid = pointerMidpoint(pts[0], pts[1])
        setCamera(p => zoomAtPoint(p, factor, mid.x, mid.y))
        return
      }
      
      if (isRightClickDragging && lastPointer) {
        const dx = e.clientX - lastPointer[0]
        const dy = e.clientY - lastPointer[1]
        setCamera(p => panCamera(p, dx, dy))
        setLastPointer([e.clientX, e.clientY])
        return
      }
      
      if (activeTool === 'eraser' || activeTool === 'text') return
      
      if (activeTool === 'draw' && e.buttons === 1) {
        const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY, camera)
        setCurrentStroke(p => [...p, [wx, wy, e.pressure]]) 
      } else if (activeTool === 'move' && lastPointer) {
        const dx = e.clientX - lastPointer[0]
        const dy = e.clientY - lastPointer[1]
        const dwx = dx / camera.zoom
        const dwy = dy / camera.zoom
        
        if (draggingNode?.type === 'image') {
          setImages(p => p.map(i => i.id === draggingNode.id ? { ...i, x: i.x + dwx, y: i.y + dwy } : i))
        } else if (draggingNode?.type === 'text') {
          setTexts(p => p.map(t => t.id === draggingNode.id ? { ...t, x: t.x + dwx, y: t.y + dwy } : t))
        } else if (draggingNode?.type === 'stroke') {
          setStrokes(p => p.map((s, idx) => idx === draggingNode.id ? s.map(pt => [pt[0] + dwx, pt[1] + dwy, pt[2]] as Point) : s))
        } else if (isDragging) {
          setCamera(p => panCamera(p, dx, dy))
        }
        setLastPointer([e.clientX, e.clientY])
      }
    }

    const handleWindowPointerUp = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId)
      if (activePointers.current.size < 2) lastPinchDist.current = null
      
      if (e.button === 2) { 
        setIsRightClickDragging(false)
        setLastPointer(null)
        return 
      }
      
      if (activeTool === 'draw' && currentStroke.length > 0) { 
        setStrokes(p => [...p, currentStroke])
        setCurrentStroke([]) 
      } else if (activeTool === 'move') { 
        setIsDragging(false)
        setDraggingNode(null)
        setLastPointer(null) 
      }
    }

    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [
    activeTool,
    camera,
    isRightClickDragging,
    lastPointer,
    isDragging,
    draggingNode,
    currentStroke,
    setCamera,
    setImages,
    setTexts,
    setStrokes,
  ])

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const discrete = isDiscreteWheelEvent(e.deltaMode, e.deltaY, e.deltaX)
    
    if (e.ctrlKey || e.metaKey || discrete) {
      const factor = wheelDeltaToZoomFactor(e.deltaY, discrete)
      setCamera(p => zoomAtPoint(p, factor, e.clientX, e.clientY))
    } else {
      setCamera(p => panCamera(p, -e.deltaX, -e.deltaY))
    }
  }, [setCamera])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { 
      const reader = new FileReader()
      reader.onload = (ev) => { 
        const img = new Image()
        img.onload = () => { 
          const { w, h } = fitImageDimensions(img.width, img.height, 800)
          pushHistory()
          setImages(p => [
            ...p, 
            { 
              id: Math.random().toString(36).substr(2, 9), 
              x: (window.innerWidth / 2 - camera.x) / camera.zoom - w / 2, 
              y: (window.innerHeight / 2 - camera.y) / camera.zoom - h / 2, 
              w, 
              h, 
              url: ev.target?.result as string 
            }
          ]) 
        }
        img.src = ev.target?.result as string 
      }
      reader.readAsDataURL(e.target.files[0])
      e.target.value = '' 
    }
  }, [camera, setImages, pushHistory])

  const handleNodeInteraction = useCallback((e: React.PointerEvent, type: 'image' | 'stroke' | 'text', id: string | number) => {
    if (activeTool === 'eraser') {
      e.stopPropagation()
      pushHistory()
      if (type === 'image') setImages(p => p.filter(i => i.id !== id))
      else if (type === 'stroke') setStrokes(p => p.filter((_, idx) => idx !== id))
      else if (type === 'text') setTexts(p => p.filter(x => x.id !== id))
    } else if (activeTool === 'move' && e.button === 0) {
      e.stopPropagation()
      pushHistory()
      setDraggingNode({ type, id })
      setLastPointer([e.clientX, e.clientY])
      if (type === 'text' || type === 'image') {
        setSelectedNode({ type, id: id as string })
      }
    }
  }, [activeTool, setImages, setStrokes, setTexts, setSelectedNode, pushHistory])

  const cursorStyle = isSpacePanning ? (isDragging ? 'grabbing' : 'grab') :
                      isRightClickDragging ? 'grabbing' : 
                      activeTool === 'draw' ? 'crosshair' : 
                      activeTool === 'text' ? 'text' : 
                      activeTool === 'eraser' ? 'cell' : 
                      activeTool === 'move' ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return {
    handlePointerDown,
    handleWheel,
    handleImageUpload,
    handleNodeInteraction,
    currentStroke,
    cursorStyle,
    activeTool
  }
}
