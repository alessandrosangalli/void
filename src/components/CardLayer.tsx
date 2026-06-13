import { useState, useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { textsAtom, cameraAtom, activeToolAtom, selectedNodeAtom, pushHistoryAtom } from '../store'
import { CardNode } from './CardNode'
import { CardToolbar } from './CardToolbar'
import type { Editor } from '@tiptap/react'

export function CardLayer({
  onNodeInteraction,
}: {
  onNodeInteraction: (
    e: React.PointerEvent,
    type: 'text',
    id: string,
  ) => void
}) {
  const [texts, setTexts] = useAtom(textsAtom)
  const [camera] = useAtom(cameraAtom)
  const [activeTool] = useAtom(activeToolAtom)
  const [selectedNode] = useAtom(selectedNodeAtom)
  const pushHistory = useSetAtom(pushHistoryAtom)
  const [editors, setEditors] = useState<Map<string, Editor>>(new Map())

  const editingNode = texts.find((t) => t.isEditing)
  const editingEditor = editingNode ? editors.get(editingNode.id) || null : null

  const handleEditorReady = useCallback(
    (id: string, editor: Editor | null) => {
      setEditors((prev) => {
        const next = new Map(prev)
        if (editor) {
          next.set(id, editor)
        } else {
          next.delete(id)
        }
        return next
      })
    },
    [],
  )

  const handleUpdateContent = useCallback(
    (id: string, content: string) => {
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, content } : t)),
      )
    },
    [setTexts],
  )

  const handleUpdateSize = useCallback(
    (id: string, w: number, h: number) => {
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, w, h } : t)),
      )
    },
    [setTexts],
  )

  const handleUpdateCardColor = useCallback(
    (id: string, cardColor: string) => {
      pushHistory()
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, cardColor } : t)),
      )
    },
    [setTexts, pushHistory],
  )

  const handleStartEditing = useCallback(
    (id: string) => {
      pushHistory()
      setTexts((prev) =>
        prev.map((t) => ({
          ...t,
          isEditing: t.id === id,
        })),
      )
    },
    [setTexts, pushHistory],
  )

  const handleStopEditing = useCallback(
    (id: string) => {
      pushHistory()
      setTexts((prev) =>
        prev
          .map((t) => (t.id === id ? { ...t, isEditing: false } : t))
          .filter((t) => {
            const plainText = t.content
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .trim()
            return plainText !== ''
          }),
      )
    },
    [setTexts, pushHistory],
  )

  const handleDelete = useCallback(
    (id: string) => {
      pushHistory()
      setTexts((prev) => prev.filter((t) => t.id !== id))
    },
    [setTexts, pushHistory],
  )

  const handleResizeStart = useCallback(() => {
    pushHistory()
  }, [pushHistory])

  const handleDragStart = useCallback(
    (e: React.PointerEvent, id: string) => {
      onNodeInteraction(e, 'text', id)
    },
    [onNodeInteraction],
  )

  // Compute toolbar position
  const toolbarPosition = editingNode
    ? {
        x: Math.max(
          8,
          Math.min(
            editingNode.x * camera.zoom + camera.x,
            window.innerWidth - 600,
          ),
        ),
        y: Math.max(
          8,
          editingNode.y * camera.zoom + camera.y - 50,
        ),
      }
    : { x: 0, y: 0 }

  return (
    <>
      {texts.map((node) => (
        <CardNode
          key={node.id}
          node={node}
          camera={camera}
          activeTool={activeTool}
          isSelected={selectedNode?.type === 'text' && selectedNode.id === node.id}
          onUpdateContent={handleUpdateContent}
          onUpdateSize={handleUpdateSize}
          onStartEditing={handleStartEditing}
          onStopEditing={handleStopEditing}
          onDelete={handleDelete}
          onResizeStart={handleResizeStart}
          onDragStart={handleDragStart}
          onEditorReady={handleEditorReady}
        />
      ))}
      {editingNode && (
        <div data-card-toolbar>
          <CardToolbar
            editor={editingEditor}
            cardColor={editingNode.cardColor}
            onChangeCardColor={(color) =>
              handleUpdateCardColor(editingNode.id, color)
            }
            position={toolbarPosition}
          />
        </div>
      )}
    </>
  )
}
