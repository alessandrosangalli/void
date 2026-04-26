import { atom } from 'jotai'

export type ToolType = 'draw' | 'move' | 'eraser' | 'text'
export const activeToolAtom = atom<ToolType>('draw')
export const cameraAtom = atom<{ x: number, y: number, zoom: number }>({ x: 0, y: 0, zoom: 1 })

export type Point = [number, number, number]
export const strokesAtom = atom<Point[][]>([])

export type TextNode = { id: string, x: number, y: number, content: string, isEditing: boolean }
export const textsAtom = atom<TextNode[]>([])

export type ImageNode = { id: string, x: number, y: number, w: number, h: number, url: string }
export const imagesAtom = atom<ImageNode[]>([])

export const explorerStateAtom = atom<{isOpen: boolean, mode: 'save'|'load'}>({isOpen: false, mode: 'load'})
export const activeBoardAtom = atom<{id: string, name: string, parentId: string} | null>(null)

export const isAuthenticatedAtom = atom<boolean>(false)

export type SyncStatus = 'synced' | 'saving' | 'error' | 'local'
export const syncStatusAtom = atom<'local' | 'saving' | 'synced' | 'error'>('local')
