import { useState, useRef, useEffect, useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { 
  activeToolAtom, 
  cameraAtom, 
  strokesAtom, 
  textsAtom, 
  imagesAtom 
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

  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isRightClickDragging, setIsRightClickDragging] = useState(false)
  const [draggingNode, setDraggingNode] = useState<{ type: 'image' | 'text' | 'stroke', id: string | number } | null>(null)
  const [lastPointer, setLastPointer] = useState<[number, number] | null>(null)

  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map())
  const lastPinchDist = useRef<number | null>(null)

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      const key = e.key.toLowerCase()
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
  }, [setActiveTool, setCamera])

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
    
    if (activeTool === 'eraser' || e.target instanceof HTMLTextAreaElement) return
    
    const { x: wx, y: wy } = screenToWorld(e.clientX, e.clientY, camera)
    
    if (activeTool === 'text') { 
      const id = Math.random().toString(36).substr(2, 9)
      setTexts(prev => [
        ...prev.map(t => ({ ...t, isEditing: false })), 
        { id, x: wx, y: wy - 15, content: '', isEditing: true }
      ])
      return 
    }
    
    ;(e.target as Element).setPointerCapture(e.pointerId)
    
    if (activeTool === 'draw') {
      setCurrentStroke([[wx, wy, e.pressure]])
    } else if (activeTool === 'move') { 
      setIsDragging(true)
      setLastPointer([e.clientX, e.clientY]) 
    }
  }, [activeTool, camera, setTexts])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
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
  }, [activeTool, camera, isRightClickDragging, lastPointer, isDragging, draggingNode, setCamera, setImages, setTexts, setStrokes])

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
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
  }, [activeTool, currentStroke, setStrokes])

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
  }, [camera, setImages])

  const handleNodeInteraction = useCallback((e: React.PointerEvent, type: 'image' | 'stroke' | 'text', id: string | number) => {
    if (activeTool === 'eraser') {
      e.stopPropagation()
      if (type === 'image') setImages(p => p.filter(i => i.id !== id))
      else if (type === 'stroke') setStrokes(p => p.filter((_, idx) => idx !== id))
      else if (type === 'text') setTexts(p => p.filter(x => x.id !== id))
    } else if (activeTool === 'move' && e.button === 0) {
      e.stopPropagation()
      setDraggingNode({ type, id })
      setLastPointer([e.clientX, e.clientY])
    }
  }, [activeTool, setImages, setStrokes, setTexts])

  const cursorStyle = isRightClickDragging ? 'grabbing' : 
                      activeTool === 'draw' ? 'crosshair' : 
                      activeTool === 'text' ? 'text' : 
                      activeTool === 'eraser' ? 'cell' : 
                      activeTool === 'move' ? (isDragging ? 'grabbing' : 'grab') : 'default'

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleImageUpload,
    handleNodeInteraction,
    currentStroke,
    cursorStyle,
    activeTool
  }
}
