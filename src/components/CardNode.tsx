import { useRef, useCallback, useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import { useTipTapEditor } from '../hooks/useTipTapEditor'
import { type TextNode, getCardTheme } from '../store'
import type { Editor } from '@tiptap/react'

export function CardNode({
  node,
  camera,
  activeTool,
  isSelected,
  onUpdateContent,
  onUpdateSize,
  onStartEditing,
  onStopEditing,
  onDelete,
  onResizeStart,
  onDragStart,
  onEditorReady,
}: {
  node: TextNode
  camera: { x: number; y: number; zoom: number }
  activeTool: string
  isSelected: boolean
  onUpdateContent: (id: string, content: string) => void
  onUpdateSize: (id: string, w: number, h: number) => void
  onStartEditing: (id: string) => void
  onStopEditing: (id: string) => void
  onDelete: (id: string) => void
  onResizeStart: () => void
  onDragStart: (e: React.PointerEvent, id: string) => void
  onEditorReady: (id: string, editor: Editor | null) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef(false)
  const resizeStartRef = useRef<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  const editor = useTipTapEditor({
    content: node.content || '<p></p>',
    onUpdate: (html) => {
      onUpdateContent(node.id, html)
    },
    onExit: () => {
      onStopEditing(node.id)
    },
  })

  // Report editor to parent for toolbar
  useEffect(() => {
    onEditorReady(node.id, editor)
    return () => onEditorReady(node.id, null)
  }, [editor, node.id, onEditorReady])

  // Focus editor when entering edit mode
  useEffect(() => {
    if (node.isEditing && editor) {
      setTimeout(() => editor.commands.focus('end'), 50)
    }
  }, [node.isEditing, editor])

  // Click outside to stop editing
  useEffect(() => {
    if (!node.isEditing) return
    const handleClickOutside = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        // Check if click is on the toolbar
        const target = e.target as HTMLElement
        if (target.closest('[data-card-toolbar]')) return
        onStopEditing(node.id)
      }
    }
    // Small delay to avoid the double-click that initiated editing
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [node.isEditing, node.id, onStopEditing])

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onResizeStart()
      resizingRef.current = true
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: node.w,
        h: node.h,
      }
      ;(e.target as Element).setPointerCapture(e.pointerId)
    },
    [node.w, node.h, onResizeStart],
  )

  const handleResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizingRef.current || !resizeStartRef.current) return
      const dx = (e.clientX - resizeStartRef.current.x) / camera.zoom
      const dy = (e.clientY - resizeStartRef.current.y) / camera.zoom
      const newW = Math.max(200, resizeStartRef.current.w + dx)
      const newH = Math.max(80, resizeStartRef.current.h + dy)
      onUpdateSize(node.id, newW, newH)
    },
    [camera.zoom, node.id, onUpdateSize],
  )

  const handleResizeEnd = useCallback(() => {
    resizingRef.current = false
    resizeStartRef.current = null
  }, [])

  // Computed position/size
  const left = node.x * camera.zoom + camera.x
  const top = node.y * camera.zoom + camera.y
  const width = node.w * camera.zoom
  const height = node.h * camera.zoom
  const fontSize = 16 * camera.zoom

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a')) {
      e.stopPropagation()
      return
    }

    if (node.isEditing) {
      // Don't propagate when editing - let TipTap handle it
      e.stopPropagation()
      return
    }

    if (activeTool === 'eraser') {
      e.stopPropagation()
      onDelete(node.id)
      return
    }

    if (activeTool === 'move') {
      e.stopPropagation()
      onDragStart(e, node.id)
      return
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a')) {
      e.stopPropagation()
      return
    }
    e.stopPropagation()
    if (activeTool === 'text' || activeTool === 'move') {
      onStartEditing(node.id)
    }
  }

  // Handle Ctrl+Enter and Escape to exit editing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onStopEditing(node.id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onStopEditing(node.id)
    }
  }

  const cursor =
    activeTool === 'eraser'
      ? 'cell'
      : activeTool === 'move'
        ? 'grab'
        : activeTool === 'text'
          ? 'text'
          : 'default'

  const theme = getCardTheme(node.cardColor)

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left,
        top,
        width,
        height,
        zIndex: node.isEditing ? 10000 : 100,
        cursor,
        pointerEvents:
          activeTool === 'draw' && !node.isEditing ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      <style>{`
            .card-node-container {
              width: 100%;
              height: 100%;
              border-radius: ${12 * camera.zoom}px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              transition: box-shadow 0.2s;
              position: relative;
            }
            .card-node-container:hover .card-resize-handle {
              opacity: 1;
            }
            .card-node-container .ProseMirror {
              outline: none;
              height: 100%;
              overflow-y: auto;
              padding: ${12 * camera.zoom}px ${16 * camera.zoom}px;
              font-family: 'Outfit', 'Inter', system-ui, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.5;
              color: #111;
              word-break: break-word;
            }
            .card-node-container .ProseMirror p {
              margin: 0 0 ${4 * camera.zoom}px 0;
            }
            .card-node-container .ProseMirror ul {
              padding-left: ${20 * camera.zoom}px;
              margin: ${4 * camera.zoom}px 0;
            }
            .card-node-container .ProseMirror li {
              margin: ${2 * camera.zoom}px 0;
            }
            .card-node-container .ProseMirror a,
            .card-node-content a {
              color: #2563EB;
              text-decoration: underline;
              cursor: pointer;
            }
            .card-node-container .ProseMirror a:hover,
            .card-node-content a:hover {
              color: #1d4ed8;
            }
            .card-node-content {
              width: 100%;
              height: 100%;
              overflow-y: auto;
              padding: ${12 * camera.zoom}px ${16 * camera.zoom}px;
              font-family: 'Outfit', 'Inter', system-ui, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.5;
              color: #111;
              word-break: break-word;
            }
            .card-node-content p { margin: 0 0 ${4 * camera.zoom}px 0; }
            .card-node-content ul { padding-left: ${20 * camera.zoom}px; margin: ${4 * camera.zoom}px 0; }
            .card-resize-handle {
              position: absolute;
              bottom: 0;
              right: 0;
              width: ${20 * camera.zoom}px;
              height: ${20 * camera.zoom}px;
              cursor: nwse-resize;
              opacity: 0;
              transition: opacity 0.15s;
              z-index: 10;
            }
            .card-resize-handle::after {
              content: '';
              position: absolute;
              bottom: ${4 * camera.zoom}px;
              right: ${4 * camera.zoom}px;
              width: ${10 * camera.zoom}px;
              height: ${10 * camera.zoom}px;
              border-right: ${2 * camera.zoom}px solid rgba(0,0,0,0.25);
              border-bottom: ${2 * camera.zoom}px solid rgba(0,0,0,0.25);
              border-radius: 0 0 ${3 * camera.zoom}px 0;
            }
          `}</style>

      <div
        className="card-node-container"
        style={{
          background: theme.bg,
          boxShadow: node.isEditing
            ? `0 8px 32px rgba(0,0,0,0.15), 0 0 0 ${2 * camera.zoom}px #111`
            : isSelected
              ? `0 4px 16px rgba(0,0,0,0.1), 0 0 0 ${2 * camera.zoom}px #2196F3`
              : `0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px ${theme.border}`,
        }}
      >
        {node.isEditing ? (
          <EditorContent editor={editor} style={{ height: '100%' }} />
        ) : (
          <div
            className="card-node-content"
            dangerouslySetInnerHTML={{
              __html: node.content || '<p></p>',
            }}
          />
        )}

        {/* Resize handle */}
        {!node.isEditing && (
          <div
            className="card-resize-handle"
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
          />
        )}
      </div>
    </div>
  )
}
