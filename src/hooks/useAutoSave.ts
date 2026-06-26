import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { saveBoardToDrive, isTokenExpired, triggerAuthExpired } from '../drive'
import { useSetAtom } from 'jotai'
import { syncStatusAtom, activeBoardAtom } from '../store'
import { toast } from 'sonner'
import type { Point, TextNode, ImageNode, Connection } from '../store'

interface BoardState {
  strokes: Point[][]
  texts: TextNode[]
  images: ImageNode[]
  connections: Connection[]
  camera: { x: number; y: number; zoom: number }
}

export function useAutoSave({
  boardState,
  activeBoard,
  isAuthenticated,
  isLocalMode,
}: {
  boardState: BoardState
  activeBoard: { id: string; name: string; parentId: string } | null
  isAuthenticated: boolean
  isLocalMode: boolean
}) {
  const setSyncStatus = useSetAtom(syncStatusAtom)
  const setActiveBoard = useSetAtom(activeBoardAtom)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedStateRef = useRef<string>('')

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      fileName: string
      state: BoardState
      folderId: string
    }) => {
      return await saveBoardToDrive(data.fileName, data.state, data.folderId)
    },
    onMutate: () => {
      setSyncStatus('saving')
    },
    onSuccess: (data) => {
      setSyncStatus('synced')
      if (data) {
        setActiveBoard((prev) => {
          if (!prev) return prev
          if (
            prev.id === 'auto-created' ||
            prev.id === 'new' ||
            prev.id === 'auto'
          ) {
            return {
              ...prev,
              id: data,
            }
          }
          return prev
        })
      }
    },
    onError: () => {
      setSyncStatus('error')
      toast.error('Erro de conexão ao salvar. O sistema tentará novamente.', {
        id: 'drive-error',
      })
    },
  })

  useEffect(() => {
    const currentStateStr = JSON.stringify(boardState)
    if (currentStateStr === lastSavedStateRef.current) return

    // 1. ALWAYS save to local storage as a draft/cache
    if (timerRef.current) clearTimeout(timerRef.current)

    // Only show 'saving' if we are actually going to do something
    setSyncStatus('saving')

    timerRef.current = setTimeout(
      () => {
        localStorage.setItem('void-local-board', JSON.stringify(boardState))
        lastSavedStateRef.current = currentStateStr

        // 2. If authenticated, try to sync
        if (isAuthenticated) {
          if (isTokenExpired()) {
            setSyncStatus('error')
            triggerAuthExpired()
            return
          }

          const hasContent =
            boardState.strokes.length > 0 ||
            boardState.texts.length > 0 ||
            boardState.images.length > 0 ||
            (boardState.connections && boardState.connections.length > 0)

          if (activeBoard) {
            mutate({
              fileName: activeBoard.name,
              state: boardState,
              folderId: activeBoard.parentId,
            })
          } else if (hasContent) {
            // Auto-promote to a cloud board if there's content but no active board
            const autoName = 'Meu Board.void'
            mutate({
              fileName: autoName,
              state: boardState,
              folderId: 'root',
            })
            setActiveBoard({
              id: 'auto-created',
              name: autoName,
              parentId: 'root',
            })
          } else {
            setSyncStatus('local')
          }
        } else {
          setSyncStatus('local')
        }
      },
      import.meta.env.MODE === 'test' ? 10 : 1000,
    )

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    boardState,
    activeBoard,
    isAuthenticated,
    isLocalMode,
    mutate,
    setSyncStatus,
    setActiveBoard,
  ])

  return { isSaving: isPending }
}
