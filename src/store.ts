import { atom } from 'jotai'

export type ToolType = 'draw' | 'move' | 'eraser' | 'text' | 'arrow'
export const activeToolAtom = atom<ToolType>('draw')
export const cameraAtom = atom<{ x: number; y: number; zoom: number }>({
  x: 0,
  y: 0,
  zoom: 1,
})

export type Point = [number, number, number]
export const strokesAtom = atom<Point[][]>([])

export const CARD_COLORS = [
  '#FEFCE8', // Yellow (Soft Cream)
  '#FFF1F2', // Pink (Soft Rose)
  '#F0F9FF', // Blue (Soft Sky)
  '#ECFDF5', // Green (Soft Mint)
  '#F5F3FF', // Purple (Soft Lavender)
  '#FFFFFF', // White
] as const

export const CARD_THEME_MAP: Record<string, { bg: string; border: string }> = {
  // New clean colors
  '#FEFCE8': { bg: '#FEFCE8', border: '#FEF08A' }, // Yellow
  '#FFF1F2': { bg: '#FFF1F2', border: '#FECDD3' }, // Pink
  '#F0F9FF': { bg: '#F0F9FF', border: '#BAE6FD' }, // Blue
  '#ECFDF5': { bg: '#ECFDF5', border: '#A7F3D0' }, // Green
  '#F5F3FF': { bg: '#F5F3FF', border: '#DDD6FE' }, // Purple
  '#FFFFFF': { bg: '#FFFFFF', border: '#E2E8F0' }, // White

  // Legacy fallback mapping
  '#FFF9C4': { bg: '#FEFCE8', border: '#FEF08A' }, // Old Yellow -> New Yellow
  '#FCE4EC': { bg: '#FFF1F2', border: '#FECDD3' }, // Old Pink -> New Pink
  '#E3F2FD': { bg: '#F0F9FF', border: '#BAE6FD' }, // Old Blue -> New Blue
  '#E8F5E9': { bg: '#ECFDF5', border: '#A7F3D0' }, // Old Green -> New Green
  '#F3E5F5': { bg: '#F5F3FF', border: '#DDD6FE' }, // Old Purple -> New Purple
}

export function getCardTheme(color: string): { bg: string; border: string } {
  const normalized = color.toUpperCase()
  return CARD_THEME_MAP[normalized] || { bg: color, border: 'rgba(0,0,0,0.08)' }
}

export const TEXT_NODE_DEFAULTS = {
  w: 280,
  h: 160,
  cardColor: '#FEFCE8' as string,
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

export function applyTextNodeDefaults(
  node: Partial<TextNode> & {
    id: string
    x: number
    y: number
    content: string
  },
): TextNode {
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

export interface Connection {
  id: string
  from: { type: 'text' | 'image'; id: string }
  to: { type: 'text' | 'image'; id: string }
}
export const connectionsAtom = atom<Connection[]>([])

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
  connections: Connection[]
}

export const undoStackAtom = atom<BoardState[]>([])
export const redoStackAtom = atom<BoardState[]>([])

export const pushHistoryAtom = atom(null, (get, set) => {
  const currentState: BoardState = {
    strokes: get(strokesAtom),
    texts: get(textsAtom),
    images: get(imagesAtom),
    connections: get(connectionsAtom),
  }
  set(undoStackAtom, (prev) => [...prev, currentState])
  set(redoStackAtom, []) // Clear redo stack on new action
})

export const undoAtom = atom(null, (get, set) => {
  const undoStack = get(undoStackAtom)
  if (undoStack.length === 0) return

  const nextUndoStack = [...undoStack]
  const prevState = nextUndoStack.pop()!

  const currentState: BoardState = {
    strokes: get(strokesAtom),
    texts: get(textsAtom),
    images: get(imagesAtom),
    connections: get(connectionsAtom),
  }
  set(redoStackAtom, (prev) => [...prev, currentState])

  set(strokesAtom, prevState.strokes)
  set(textsAtom, prevState.texts)
  set(imagesAtom, prevState.images)
  set(connectionsAtom, prevState.connections || [])
  set(undoStackAtom, nextUndoStack)
  set(selectedNodeAtom, null)
})

export const redoAtom = atom(null, (get, set) => {
  const redoStack = get(redoStackAtom)
  if (redoStack.length === 0) return

  const nextRedoStack = [...redoStack]
  const nextState = nextRedoStack.pop()!

  const currentState: BoardState = {
    strokes: get(strokesAtom),
    texts: get(textsAtom),
    images: get(imagesAtom),
    connections: get(connectionsAtom),
  }
  set(undoStackAtom, (prev) => [...prev, currentState])

  set(strokesAtom, nextState.strokes)
  set(textsAtom, nextState.texts)
  set(imagesAtom, nextState.images)
  set(connectionsAtom, nextState.connections || [])
  set(redoStackAtom, nextRedoStack)
  set(selectedNodeAtom, null)
})
