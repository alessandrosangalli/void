import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAutoSave } from '../useAutoSave'
import { TestWrapper } from '../../test/utils'
import * as driveAPI from '../../drive'
import { useAtomValue, useSetAtom } from 'jotai'
import { syncStatusAtom } from '../../store'

// Mock the drive API module
vi.mock('../../drive', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    saveBoardToDrive: vi.fn(),
  }
})

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  }
}))
import { toast } from 'sonner'

// A small helper to read/write the syncStatusAtom
function useSyncStatusTest() {
  const status = useAtomValue(syncStatusAtom)
  const setStatus = useSetAtom(syncStatusAtom)
  return { status, setStatus }
}

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  const mockBoardState = {
    strokes: [],
    texts: [],
    images: [],
    camera: { x: 0, y: 0, zoom: 1 }
  }

  const mockActiveBoard = { id: '1', name: 'test.void', parentId: 'root' }

  it('sets status to local if not authenticated or no active board', () => {
    let currentStatus = ''
    renderHook(() => {
      const { status } = useSyncStatusTest()
      currentStatus = status
      useAutoSave({
        boardState: mockBoardState,
        activeBoard: null,
        isAuthenticated: false
      })
    }, { wrapper: TestWrapper })

    expect(currentStatus).toBe('local')
  })

  it('debounces save operations by 2500ms', async () => {
    const { rerender } = renderHook(
      (props) => {
        const { status } = useSyncStatusTest()
        useAutoSave(props)
        return status
      },
      {
        wrapper: TestWrapper,
        initialProps: {
          boardState: mockBoardState,
          activeBoard: mockActiveBoard,
          isAuthenticated: true
        }
      }
    )

    // First mount sets status to 'synced' and doesn't trigger save
    expect(driveAPI.saveBoardToDrive).not.toHaveBeenCalled()

    // Trigger an update (simulating user drawing)
    rerender({
      boardState: { ...mockBoardState, strokes: [[[0, 0, 0]]] },
      activeBoard: mockActiveBoard,
      isAuthenticated: true
    })

    // Trigger another update (user draws more before timer finishes)
    rerender({
      boardState: { ...mockBoardState, strokes: [[[0, 0, 0]], [[1, 1, 1]]] },
      activeBoard: mockActiveBoard,
      isAuthenticated: true
    })

    // Ensure React Query executes the mutation
    await waitFor(() => {
      expect(driveAPI.saveBoardToDrive).toHaveBeenCalledTimes(1)
    })
    
    // It should have been called with the latest state
    expect(driveAPI.saveBoardToDrive).toHaveBeenCalledWith(
      'test.void',
      { ...mockBoardState, strokes: [[[0, 0, 0]], [[1, 1, 1]]] },
      'root'
    )
  })

  it('handles save errors and sets error status', async () => {
    vi.mocked(driveAPI.saveBoardToDrive).mockRejectedValueOnce(new Error('Network error'))

    const { rerender, result } = renderHook(
      (props) => {
        const { status } = useSyncStatusTest()
        useAutoSave(props)
        return status
      },
      {
        wrapper: TestWrapper,
        initialProps: {
          boardState: mockBoardState,
          activeBoard: mockActiveBoard,
          isAuthenticated: true
        }
      }
    )

    // Trigger update
    rerender({
      boardState: { ...mockBoardState, strokes: [[[1, 2, 3]]] },
      activeBoard: mockActiveBoard,
      isAuthenticated: true
    })

    // Wait for mutation to fail and status to update
    await waitFor(() => {
      expect(result.current).toBe('error')
    })

    expect(toast.error).toHaveBeenCalled()
  })
})
