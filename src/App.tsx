import { useEffect, useMemo } from 'react'
import { useAtom } from 'jotai'
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
} from './store'
import { Toolbar } from './components/Toolbar'
import { FileExplorer } from './components/FileExplorer'
import { WelcomeScreen } from './components/WelcomeScreen'
import { CardLayer } from './components/CardLayer'
import { initDriveApi, checkIsAuthenticated } from './drive'
import { useBoardEvents } from './hooks/useBoardEvents'
import { useAutoSave } from './hooks/useAutoSave'
import { getSvgPathFromStroke } from './lib/utils'



export default function App() {
  const [camera, setCamera] = useAtom(cameraAtom)
  const [strokes, setStrokes] = useAtom(strokesAtom)
  const [texts, setTexts] = useAtom(textsAtom)
  const [images, setImages] = useAtom(imagesAtom)
  const [explorerState, setExplorerState] = useAtom(explorerStateAtom)
  const [activeBoard] = useAtom(activeBoardAtom)
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom)
  const [isLocalMode] = useAtom(isLocalModeAtom)
  const [selectedNode] = useAtom(selectedNodeAtom)

  const {
    handlePointerDown,
    handleWheel,
    handleImageUpload,
    handleNodeInteraction,
    currentStroke,
    cursorStyle,
    activeTool,
  } = useBoardEvents()

  const boardState = useMemo(
    () => ({ strokes, texts, images, camera }),
    [strokes, texts, images, camera],
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
          // Camera zoom might be 0 if not saved correctly, so we check
          if (data.camera && data.camera.zoom > 0) setCamera(data.camera)
        } catch (e) {
          console.error('Failed to load local board', e)
        }
      }
    }
  }, [isLocalMode, setStrokes, setTexts, setImages, setCamera])

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
        <g
          transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}
        >
          {images.map((img) => {
            const isSelected = selectedNode?.type === 'image' && selectedNode.id === img.id
            return (
              <g key={img.id}>
                <image
                  href={img.url}
                  x={img.x}
                  y={img.y}
                  width={img.w}
                  height={img.h}
                  onPointerDown={(e) => handleNodeInteraction(e, 'image', img.id)}
                  style={{
                    pointerEvents:
                      activeTool === 'eraser' || activeTool === 'move'
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
