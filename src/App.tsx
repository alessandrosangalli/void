import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { cameraAtom, strokesAtom, textsAtom, imagesAtom, explorerStateAtom, activeBoardAtom, isAuthenticatedAtom } from './store'
import type { TextNode } from './store'
import { Toolbar } from './components/Toolbar'
import { FileExplorer } from './components/FileExplorer'
import { WelcomeScreen } from './components/WelcomeScreen'
import { initDriveApi, checkIsAuthenticated } from './drive'
import { useBoardEvents } from './hooks/useBoardEvents'
import { useAutoSave } from './hooks/useAutoSave'
import { getSvgPathFromStroke } from './lib/utils'

function EditingTextarea({ text, camera, onSave, onComplete }: { text: TextNode, camera: {x:number, y:number, zoom:number}, onSave: (id: string, content: string) => void, onComplete: (id: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div style={{ position: 'fixed', left: text.x * camera.zoom + camera.x - 12, top: text.y * camera.zoom + camera.y - 12, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <style>{`
        @keyframes popIn { from { transform: scale(0.95) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .text-editor-container { background: white; border-radius: 16px; padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05); display: flex; flexDirection: column; gap: 8px; }
        .editor-textarea { background: #f8f9fa; border: 1px solid transparent; outline: none; font-family: 'Outfit', 'Inter', sans-serif; resize: none; min-width: 300px; min-height: 80px; padding: 16px; border-radius: 12px; transition: 0.2s; line-height: 1.5; color: #111; }
        .editor-textarea:focus { background: #fff; border-color: #111; }
        .btn-premium-confirm { background: #111; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); align-self: flex-end; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .btn-premium-confirm:hover { background: #333; transform: scale(1.02); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
      `}</style>
      <div className="text-editor-container">
        <textarea ref={ref} className="editor-textarea" style={{ fontSize: `${24 * camera.zoom}px` }} value={text.content} onChange={(e) => onSave(text.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onComplete(text.id); e.stopPropagation(); }} />
        <button className="btn-premium-confirm" onClick={() => onComplete(text.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Confirmar
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [camera] = useAtom(cameraAtom)
  const [strokes] = useAtom(strokesAtom)
  const [texts, setTexts] = useAtom(textsAtom)
  const [images] = useAtom(imagesAtom)
  const [explorerState, setExplorerState] = useAtom(explorerStateAtom)
  const [activeBoard] = useAtom(activeBoardAtom)
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom)

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleImageUpload,
    handleNodeInteraction,
    currentStroke,
    cursorStyle,
    activeTool
  } = useBoardEvents()

  useAutoSave({
    boardState: { strokes, texts, images, camera },
    activeBoard,
    isAuthenticated
  })

  useEffect(() => { initDriveApi(() => { if (checkIsAuthenticated()) setIsAuthenticated(true) }) }, [setIsAuthenticated])

  const updateText = (id: string, content: string) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, content } : t))
  }
  const completeText = (id: string) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, isEditing: false } : t).filter(t => t.content.trim() !== ''))
  }

  useEffect(() => { 
    setTexts(prev => prev.map(t => t.isEditing ? { ...t, isEditing: false } : t).filter(t => t.content.trim() !== '')) 
  }, [activeTool, setTexts])

  return (
    <>
      {!isAuthenticated && <WelcomeScreen />}
      <input type="file" id="image-upload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <svg 
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', touchAction: 'none', cursor: cursorStyle, backgroundColor: '#f8f9fa' }} 
        onPointerDown={handlePointerDown} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onPointerCancel={handlePointerUp} 
        onWheel={handleWheel} 
        onContextMenu={(e) => e.preventDefault()}
      >
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          {images.map(img => (
            <image key={img.id} href={img.url} x={img.x} y={img.y} width={img.w} height={img.h} 
              onPointerDown={(e) => handleNodeInteraction(e, 'image', img.id)} 
              style={{ pointerEvents: activeTool === 'eraser' || activeTool === 'move' ? 'all' : 'none' }} 
            />
          ))}
          {strokes.map((s, i) => (
            <path key={i} d={getSvgPathFromStroke(s)} fill="#111" 
              onPointerDown={(e) => handleNodeInteraction(e, 'stroke', i)} 
              style={{ pointerEvents: activeTool === 'eraser' || activeTool === 'move' ? 'all' : 'none' }} 
            />
          ))}
          {currentStroke.length > 0 && <path d={getSvgPathFromStroke(currentStroke)} fill="#111" style={{ pointerEvents: 'none' }} />}
          {texts.map(t => !t.isEditing && ( 
            <text key={t.id} x={t.x} y={t.y + 24} 
              style={{ fontFamily: 'sans-serif', fontSize: '24px', fill: '#111', userSelect: 'none', WebkitUserSelect: 'none', cursor: activeTool === 'text' ? 'text' : activeTool === 'move' ? 'grab' : activeTool === 'eraser' ? 'cell' : 'default', pointerEvents: activeTool === 'text' || activeTool === 'move' || activeTool === 'eraser' ? 'all' : 'none' }} 
              onDoubleClick={() => setTexts(p => p.map(x => x.id === t.id ? { ...x, isEditing: true } : x))} 
              onPointerDown={(e) => handleNodeInteraction(e, 'text', t.id)}
            >
              {t.content}
            </text> 
          ))}
        </g>
      </svg>
      {texts.filter(t => t.isEditing).map(t => ( <EditingTextarea key={t.id} text={t} camera={camera} onSave={updateText} onComplete={completeText} /> ))}
      {isAuthenticated && <Toolbar />}
      <FileExplorer isOpen={explorerState.isOpen} onClose={() => setExplorerState(s => ({ ...s, isOpen: false }))} />
    </>
  )
}
