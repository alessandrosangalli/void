import { useEffect, useMemo } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  cameraAtom,
  strokesAtom,
  textsAtom,
  imagesAtom,
  explorerStateAtom,
  activeBoardAtom,
  isAuthenticatedAtom,
  isLocalModeAtom,
  applyTextNodeDefaults,
  selectedNodeAtom,
  connectionsAtom,
  pushHistoryAtom,
} from './store'
import { Toolbar } from './components/Toolbar'
import { FileExplorer } from './components/FileExplorer'
import { WelcomeScreen } from './components/WelcomeScreen'
import { CardLayer } from './components/CardLayer'
import { initDriveApi, checkIsAuthenticated } from './drive'
import { useBoardEvents } from './hooks/useBoardEvents'
import { useAutoSave } from './hooks/useAutoSave'
import { getSvgPathFromStroke } from './lib/utils'

function getSidePoint(
  node: { x: number; y: number; w: number; h: number },
  side: 'top' | 'right' | 'bottom' | 'left',
) {
  switch (side) {
    case 'top':
      return { x: node.x + node.w / 2, y: node.y }
    case 'right':
      return { x: node.x + node.w, y: node.y + node.h / 2 }
    case 'bottom':
      return { x: node.x + node.w / 2, y: node.y + node.h }
    case 'left':
      return { x: node.x, y: node.y + node.h / 2 }
  }
}

function getArrowPoints(
  fromNode: { x: number; y: number; w: number; h: number },
  toNode: { x: number; y: number; w: number; h: number },
  fromSide?: 'top' | 'right' | 'bottom' | 'left',
  toSide?: 'top' | 'right' | 'bottom' | 'left',
) {
  const cx1 = fromNode.x + fromNode.w / 2
  const cy1 = fromNode.y + fromNode.h / 2
  const cx2 = toNode.x + toNode.w / 2
  const cy2 = toNode.y + toNode.h / 2

  const dx = cx2 - cx1
  const dy = cy2 - cy1

  let dynStartX: number
  let dynStartY: number
  let dynEndX: number
  let dynEndY: number

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      dynStartX = fromNode.x + fromNode.w
      dynStartY = cy1
      dynEndX = toNode.x
      dynEndY = cy2
    } else {
      dynStartX = fromNode.x
      dynStartY = cy1
      dynEndX = toNode.x + toNode.w
      dynEndY = cy2
    }
  } else {
    if (dy > 0) {
      dynStartX = cx1
      dynStartY = fromNode.y + fromNode.h
      dynEndX = cx2
      dynEndY = toNode.y
    } else {
      dynStartX = cx1
      dynStartY = fromNode.y
      dynEndX = cx2
      dynEndY = toNode.y + toNode.h
    }
  }

  const startX = fromSide ? getSidePoint(fromNode, fromSide).x : dynStartX
  const startY = fromSide ? getSidePoint(fromNode, fromSide).y : dynStartY
  const endX = toSide ? getSidePoint(toNode, toSide).x : dynEndX
  const endY = toSide ? getSidePoint(toNode, toSide).y : dynEndY

  return { startX, startY, endX, endY }
}

export default function App() {
  const [camera, setCamera] = useAtom(cameraAtom)
  const [strokes, setStrokes] = useAtom(strokesAtom)
  const [texts, setTexts] = useAtom(textsAtom)
  const [images, setImages] = useAtom(imagesAtom)
  const [connections, setConnections] = useAtom(connectionsAtom)
  const [explorerState, setExplorerState] = useAtom(explorerStateAtom)
  const [activeBoard] = useAtom(activeBoardAtom)
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom)
  const [isLocalMode] = useAtom(isLocalModeAtom)
  const [selectedNode] = useAtom(selectedNodeAtom)
  const pushHistory = useSetAtom(pushHistoryAtom)

  const {
    handlePointerDown,
    handleWheel,
    handleImageUpload,
    handleNodeInteraction,
    currentStroke,
    cursorStyle,
    activeTool,
    activeArrow,
  } = useBoardEvents()

  const findNode = (id: string, type: 'text' | 'image') => {
    if (type === 'text') return texts.find((t) => t.id === id)
    if (type === 'image') return images.find((img) => img.id === id)
    return undefined
  }

  const boardState = useMemo(
    () => ({ strokes, texts, images, camera, connections }),
    [strokes, texts, images, camera, connections],
  )

  useAutoSave({
    boardState,
    activeBoard,
    isAuthenticated,
    isLocalMode,
  })

  useEffect(() => {
    initDriveApi(() => {
      if (checkIsAuthenticated()) setIsAuthenticated(true)
    })
  }, [setIsAuthenticated])

  useEffect(() => {
    if (isLocalMode) {
      const saved = localStorage.getItem('void-local-board')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          if (data.strokes) setStrokes(data.strokes)
          if (data.texts) setTexts(data.texts.map(applyTextNodeDefaults))
          if (data.images) setImages(data.images)
          if (data.connections) setConnections(data.connections)
          // Camera zoom might be 0 if not saved correctly, so we check
          if (data.camera && data.camera.zoom > 0) setCamera(data.camera)
        } catch (e) {
          console.error('Failed to load local board', e)
        }
      }
    }
  }, [isLocalMode, setStrokes, setTexts, setImages, setConnections, setCamera])

  useEffect(() => {
    setTexts((prev) =>
      prev
        .map((t) => (t.isEditing ? { ...t, isEditing: false } : t))
        .filter((t) => {
          const plainText = t.content
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
          return plainText !== ''
        }),
    )
  }, [activeTool, setTexts])

  return (
    <>
      {!isAuthenticated && !isLocalMode && <WelcomeScreen />}
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          touchAction: 'none',
          cursor: cursorStyle,
          backgroundColor: '#f8f9fa',
        }}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#111" />
          </marker>
        </defs>
        <g
          transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}
        >
          {connections.map((conn) => {
            const fromNode = findNode(conn.from.id, conn.from.type)
            const toNode = findNode(conn.to.id, conn.to.type)
            if (!fromNode || !toNode) return null

            const { startX, startY, endX, endY } = getArrowPoints(
              fromNode,
              toNode,
              conn.from.side,
              conn.to.side,
            )

            return (
              <g key={conn.id}>
                {/* Visual Line */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#111"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Invisible Line for Hover/Erase Click */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="transparent"
                  strokeWidth={12}
                  style={{
                    pointerEvents: activeTool === 'eraser' ? 'all' : 'none',
                    cursor: activeTool === 'eraser' ? 'cell' : 'default',
                  }}
                  onPointerDown={(e) => {
                    if (activeTool === 'eraser') {
                      e.stopPropagation()
                      pushHistory()
                      setConnections((prev) =>
                        prev.filter((c) => c.id !== conn.id),
                      )
                    }
                  }}
                />
              </g>
            )
          })}
          {activeArrow &&
            (() => {
              const fromNode = findNode(
                activeArrow.from.id,
                activeArrow.from.type,
              )
              if (!fromNode) return null
              let startX: number
              let startY: number
              const fromSide = activeArrow.from.side
              if (fromSide) {
                const pt = getSidePoint(fromNode, fromSide)
                startX = pt.x
                startY = pt.y
              } else {
                const cx1 = fromNode.x + fromNode.w / 2
                const cy1 = fromNode.y + fromNode.h / 2
                const dx = activeArrow.currentX - cx1
                const dy = activeArrow.currentY - cy1
                if (Math.abs(dx) > Math.abs(dy)) {
                  startX = dx > 0 ? fromNode.x + fromNode.w : fromNode.x
                  startY = cy1
                } else {
                  startX = cx1
                  startY = dy > 0 ? fromNode.y + fromNode.h : fromNode.y
                }
              }
              return (
                <line
                  x1={startX}
                  y1={startY}
                  x2={activeArrow.currentX}
                  y2={activeArrow.currentY}
                  stroke="#111"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
                />
              )
            })()}
          {images.map((img) => {
            const isSelected =
              selectedNode?.type === 'image' && selectedNode.id === img.id
            return (
              <g key={img.id}>
                <image
                  href={img.url}
                  x={img.x}
                  y={img.y}
                  width={img.w}
                  height={img.h}
                  onPointerDown={(e) =>
                    handleNodeInteraction(e, 'image', img.id)
                  }
                  style={{
                    pointerEvents:
                      activeTool === 'eraser' ||
                      activeTool === 'move' ||
                      activeTool === 'arrow'
                        ? 'all'
                        : 'none',
                  }}
                />
                {isSelected && (
                  <rect
                    x={img.x}
                    y={img.y}
                    width={img.w}
                    height={img.h}
                    fill="none"
                    stroke="#2196F3"
                    strokeWidth={2 / camera.zoom}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {activeTool === 'arrow' && (
                  <>
                    {/* Top handle */}
                    <circle
                      cx={img.x + img.w / 2}
                      cy={img.y}
                      r={6 / camera.zoom}
                      fill="#2196F3"
                      stroke="#ffffff"
                      strokeWidth={2 / camera.zoom}
                      style={{ cursor: 'crosshair' }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        handleNodeInteraction(e, 'image', img.id, 'top')
                      }}
                    />
                    {/* Right handle */}
                    <circle
                      cx={img.x + img.w}
                      cy={img.y + img.h / 2}
                      r={6 / camera.zoom}
                      fill="#2196F3"
                      stroke="#ffffff"
                      strokeWidth={2 / camera.zoom}
                      style={{ cursor: 'crosshair' }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        handleNodeInteraction(e, 'image', img.id, 'right')
                      }}
                    />
                    {/* Bottom handle */}
                    <circle
                      cx={img.x + img.w / 2}
                      cy={img.y + img.h}
                      r={6 / camera.zoom}
                      fill="#2196F3"
                      stroke="#ffffff"
                      strokeWidth={2 / camera.zoom}
                      style={{ cursor: 'crosshair' }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        handleNodeInteraction(e, 'image', img.id, 'bottom')
                      }}
                    />
                    {/* Left handle */}
                    <circle
                      cx={img.x}
                      cy={img.y + img.h / 2}
                      r={6 / camera.zoom}
                      fill="#2196F3"
                      stroke="#ffffff"
                      strokeWidth={2 / camera.zoom}
                      style={{ cursor: 'crosshair' }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        handleNodeInteraction(e, 'image', img.id, 'left')
                      }}
                    />
                  </>
                )}
              </g>
            )
          })}
          {strokes.map((s, i) => (
            <path
              key={i}
              d={getSvgPathFromStroke(s)}
              fill="#111"
              onPointerDown={(e) => handleNodeInteraction(e, 'stroke', i)}
              style={{
                pointerEvents:
                  activeTool === 'eraser' || activeTool === 'move'
                    ? 'all'
                    : 'none',
              }}
            />
          ))}
          {currentStroke.length > 0 && (
            <path
              d={getSvgPathFromStroke(currentStroke)}
              fill="#111"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </g>
      </svg>
      <CardLayer onNodeInteraction={handleNodeInteraction} />
      {(isAuthenticated || isLocalMode) && <Toolbar />}
      <FileExplorer
        isOpen={explorerState.isOpen}
        onClose={() => setExplorerState((s) => ({ ...s, isOpen: false }))}
      />
    </>
  )
}
