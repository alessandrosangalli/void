import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { saveBoardToDrive } from '../drive'
import { useSetAtom } from 'jotai'
import { syncStatusAtom } from '../store'
import { toast } from 'sonner'
import type { Point, TextNode, ImageNode } from '../store'

interface BoardState {
  strokes: Point[][]
  texts: TextNode[]
  images: ImageNode[]
  camera: { x: number; y: number; zoom: number }
}

export function useAutoSave({
  boardState,
  activeBoard,
  isAuthenticated
}: {
  boardState: BoardState
  activeBoard: { id: string; name: string; parentId: string } | null
  isAuthenticated: boolean
}) {
  const setSyncStatus = useSetAtom(syncStatusAtom)
  const timerRef = useRef<any>(null)
  const isFirstMount = useRef(true)

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { fileName: string; state: BoardState; folderId: string }) => {
      await saveBoardToDrive(data.fileName, data.state, data.folderId)
    },
    onMutate: () => {
      setSyncStatus('saving')
    },
    onSuccess: () => {
      setSyncStatus('synced')
    },
    onError: () => {
      setSyncStatus('error')
      toast.error('Erro de conexão ao salvar. O sistema tentará novamente.', {
        id: 'drive-error',
      })
    }
  })

  useEffect(() => {
    if (!activeBoard || !isAuthenticated) {
      setSyncStatus('local')
      return
    }

    if (isFirstMount.current) {
      isFirstMount.current = false
      setSyncStatus('synced')
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    
    // Indicate that there are unsaved changes
    setSyncStatus('saving')

    timerRef.current = setTimeout(() => {
      mutate({
        fileName: activeBoard.name,
        state: boardState,
        folderId: activeBoard.parentId
      })
    }, import.meta.env.MODE === 'test' ? 10 : 2500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [boardState, activeBoard, isAuthenticated, mutate, setSyncStatus])

  return { isSaving: isPending }
}
