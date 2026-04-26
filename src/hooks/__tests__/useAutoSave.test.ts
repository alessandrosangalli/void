import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAutoSave } from '../useAutoSave'
import { TestWrapper } from '../../test/utils'
import * as driveAPI from '../../drive'
import { useAtomValue, useSetAtom } from 'jotai'
import { syncStatusAtom, type Point } from '../../store'

// Mock the drive API module
vi.mock('../../drive', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    saveBoardToDrive: vi.fn(),
  }
})

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
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
    strokes: [] as Point[][],
    texts: [],
    images: [],
    camera: { x: 0, y: 0, zoom: 1 },
  }

  const mockActiveBoard = { id: '1', name: 'test.void', parentId: 'root' }

  it('sets status to local if not authenticated or no active board', async () => {
    let currentStatus = ''
    renderHook(
      () => {
        const { status } = useSyncStatusTest()
        currentStatus = status
        useAutoSave({
          boardState: mockBoardState,
          activeBoard: null,
          isAuthenticated: false,
          isLocalMode: false,
        })
      },
      { wrapper: TestWrapper },
    )

    await waitFor(() => {
      expect(currentStatus).toBe('local')
    })
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
          isAuthenticated: true,
          isLocalMode: false,
        },
      },
    )

    // First mount sets status to 'synced' and doesn't trigger save
    expect(driveAPI.saveBoardToDrive).not.toHaveBeenCalled()

    // Trigger an update (simulating user drawing)
    rerender({
      boardState: {
        ...mockBoardState,
        strokes: [[[0, 0, 0] as [number, number, number]]],
      },
      activeBoard: mockActiveBoard,
      isAuthenticated: true,
      isLocalMode: false,
    })

    // Trigger another update (user draws more before timer finishes)
    rerender({
      boardState: {
        ...mockBoardState,
        strokes: [
          [[0, 0, 0] as [number, number, number]],
          [[1, 1, 1] as [number, number, number]],
        ],
      },
      activeBoard: mockActiveBoard,
      isAuthenticated: true,
      isLocalMode: false,
    })

    // Ensure React Query executes the mutation
    await waitFor(() => {
      expect(driveAPI.saveBoardToDrive).toHaveBeenCalledTimes(1)
    })

    // It should have been called with the latest state
    expect(driveAPI.saveBoardToDrive).toHaveBeenCalledWith(
      'test.void',
      {
        ...mockBoardState,
        strokes: [
          [[0, 0, 0] as [number, number, number]],
          [[1, 1, 1] as [number, number, number]],
        ],
      },
      'root',
    )
  })

  it('handles save errors and sets error status', async () => {
    vi.mocked(driveAPI.saveBoardToDrive).mockRejectedValueOnce(
      new Error('Network error'),
    )

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
          isAuthenticated: true,
          isLocalMode: false,
        },
      },
    )

    // Trigger update
    rerender({
      boardState: {
        ...mockBoardState,
        strokes: [[[1, 2, 3] as [number, number, number]]],
      },
      activeBoard: mockActiveBoard,
      isAuthenticated: true,
      isLocalMode: false,
    })

    // Wait for mutation to fail and status to update
    await waitFor(() => {
      expect(result.current).toBe('error')
    })

    expect(toast.error).toHaveBeenCalled()
  })

  it('saves to localStorage in local mode', async () => {
    renderHook(
      () => {
        useAutoSave({
          boardState: { ...mockBoardState, strokes: [[[1, 1, 1] as Point]] },
          activeBoard: null,
          isAuthenticated: false,
          isLocalMode: true,
        })
      },
      { wrapper: TestWrapper },
    )

    await waitFor(() => {
      const saved = localStorage.getItem('void-local-board')
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!).strokes).toHaveLength(1)
    })
  })

  it('auto-promotes to Drive board if authenticated but no board active and has content', async () => {
    renderHook(
      () => {
        const { status } = useSyncStatusTest()
        useAutoSave({
          boardState: { ...mockBoardState, strokes: [[[1, 1, 1] as Point]] },
          activeBoard: null,
          isAuthenticated: true,
          isLocalMode: false,
        })
        return status
      },
      { wrapper: TestWrapper },
    )

    await waitFor(() => {
      expect(driveAPI.saveBoardToDrive).toHaveBeenCalledWith(
        'Meu Board.void',
        expect.any(Object),
        'root',
      )
    })
  })
})
