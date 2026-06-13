import { atom } from 'jotai'

export type ToolType = 'draw' | 'move' | 'eraser' | 'text'
export const activeToolAtom = atom<ToolType>('draw')
export const cameraAtom = atom<{ x: number; y: number; zoom: number }>({
  x: 0,
  y: 0,
  zoom: 1,
})

export type Point = [number, number, number]
export const strokesAtom = atom<Point[][]>([])

export const CARD_COLORS = [
  '#FFF9C4', // Yellow (default)
  '#FCE4EC', // Pink
  '#E3F2FD', // Blue
  '#E8F5E9', // Green
  '#F3E5F5', // Purple
  '#FFFFFF', // White
] as const

export const TEXT_NODE_DEFAULTS = {
  w: 280,
  h: 160,
  cardColor: '#FFF9C4' as string,
}

export type TextNode = {
  id: string
  x: number
  y: number
  w: number
  h: number
  content: string
  isEditing: boolean
  cardColor: string
}

export function applyTextNodeDefaults(node: Partial<TextNode> & { id: string; x: number; y: number; content: string }): TextNode {
  return {
    ...node,
    w: node.w ?? TEXT_NODE_DEFAULTS.w,
    h: node.h ?? TEXT_NODE_DEFAULTS.h,
    cardColor: node.cardColor ?? TEXT_NODE_DEFAULTS.cardColor,
    isEditing: node.isEditing ?? false,
  }
}

export const textsAtom = atom<TextNode[]>([])

export type SelectedNode = { type: 'text' | 'image'; id: string } | null
export const selectedNodeAtom = atom<SelectedNode>(null)

export type ImageNode = {
  id: string
  x: number
  y: number
  w: number
  h: number
  url: string
}
export const imagesAtom = atom<ImageNode[]>([])

export const explorerStateAtom = atom<{
  isOpen: boolean
  mode: 'save' | 'load'
}>({ isOpen: false, mode: 'load' })
export const activeBoardAtom = atom<{
  id: string
  name: string
  parentId: string
} | null>(null)

export const isAuthenticatedAtom = atom<boolean>(false)
export const isLocalModeAtom = atom<boolean>(false)

export type SyncStatus = 'synced' | 'saving' | 'error' | 'local'
export const syncStatusAtom = atom<'local' | 'saving' | 'synced' | 'error'>(
  'local',
)

// Undo/Redo History
export type BoardState = {
  strokes: Point[][]
  texts: TextNode[]
  images: ImageNode[]
}

export const undoStackAtom = atom<BoardState[]>([])
export const redoStackAtom = atom<BoardState[]>([])

export const pushHistoryAtom = atom(
  null,
  (get, set) => {
    const currentState: BoardState = {
      strokes: get(strokesAtom),
      texts: get(textsAtom),
      images: get(imagesAtom),
    }
    set(undoStackAtom, (prev) => [...prev, currentState])
    set(redoStackAtom, []) // Clear redo stack on new action
  }
)

export const undoAtom = atom(
  null,
  (get, set) => {
    const undoStack = get(undoStackAtom)
    if (undoStack.length === 0) return

    const nextUndoStack = [...undoStack]
    const prevState = nextUndoStack.pop()!

    const currentState: BoardState = {
      strokes: get(strokesAtom),
      texts: get(textsAtom),
      images: get(imagesAtom),
    }
    set(redoStackAtom, (prev) => [...prev, currentState])

    set(strokesAtom, prevState.strokes)
    set(textsAtom, prevState.texts)
    set(imagesAtom, prevState.images)
    set(undoStackAtom, nextUndoStack)
    set(selectedNodeAtom, null)
  }
)

export const redoAtom = atom(
  null,
  (get, set) => {
    const redoStack = get(redoStackAtom)
    if (redoStack.length === 0) return

    const nextRedoStack = [...redoStack]
    const nextState = nextRedoStack.pop()!

    const currentState: BoardState = {
      strokes: get(strokesAtom),
      texts: get(textsAtom),
      images: get(imagesAtom),
    }
    set(undoStackAtom, (prev) => [...prev, currentState])

    set(strokesAtom, nextState.strokes)
    set(textsAtom, nextState.texts)
    set(imagesAtom, nextState.images)
    set(redoStackAtom, nextRedoStack)
    set(selectedNodeAtom, null)
  }
)
