import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import { Provider } from 'jotai'
import { isAuthenticatedAtom, activeToolAtom, strokesAtom } from '../store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock drive API
vi.mock('../drive', () => ({
  initDriveApi: vi.fn((cb) => cb()),
  checkIsAuthenticated: vi.fn(() => true),
  saveBoardToDrive: vi.fn(),
  loadBoardFromDriveId: vi.fn(),
  registerAuthExpiredCallback: vi.fn(),
  isTokenExpired: vi.fn(() => false),
  checkFileExists: vi.fn(),
}))

import { useHydrateAtoms } from 'jotai/utils'

function HydrateAtoms({
  initialValues,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues: any
  children: React.ReactNode
}) {
  useHydrateAtoms(initialValues)
  return children
}

function AppWrapper({
  children,
  initialValues = [],
}: {
  children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?: any
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <HydrateAtoms initialValues={initialValues}>
          <TooltipProvider>{children}</TooltipProvider>
        </HydrateAtoms>
      </Provider>
    </QueryClientProvider>
  )
}

describe('Canvas Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('draws a stroke on the canvas', async () => {
    const { container } = render(<App />, {
      wrapper: ({ children }) => (
        <AppWrapper
          initialValues={[
            [isAuthenticatedAtom, true],
            [activeToolAtom, 'draw'],
            [strokesAtom, []],
          ]}
        >
          {children}
        </AppWrapper>
      ),
    })

    const canvas = container.querySelector('svg')!

    // Simulate drawing
    fireEvent.pointerDown(canvas, {
      clientX: 100,
      clientY: 100,
      buttons: 1,
      button: 0,
      pointerId: 1,
    })
    fireEvent.pointerMove(canvas, {
      clientX: 110,
      clientY: 110,
      buttons: 1,
      pointerId: 1,
    })
    fireEvent.pointerMove(canvas, {
      clientX: 120,
      clientY: 120,
      buttons: 1,
      pointerId: 1,
    })
    fireEvent.pointerUp(canvas, { clientX: 120, clientY: 120, pointerId: 1 })

    // Verify stroke was added
    const paths = canvas.querySelectorAll('path')
    // One for the drawn stroke
    expect(paths.length).toBeGreaterThan(0)
  })

  it('erases a stroke when clicking it with the eraser tool', async () => {
    // We need to inject a stroke first
    const { container } = render(<App />, {
      wrapper: ({ children }) => (
        <AppWrapper
          initialValues={[
            [isAuthenticatedAtom, true],
            [activeToolAtom, 'eraser'],
            [
              strokesAtom,
              [
                [
                  [100, 100, 0.5],
                  [110, 110, 0.5],
                ],
              ],
            ],
          ]}
        >
          {children}
        </AppWrapper>
      ),
    })

    const canvas = container.querySelector('svg')!
    let paths = canvas.querySelectorAll('path')
    expect(paths.length).toBe(1)

    // Click the path to erase it
    fireEvent.pointerDown(paths[0], {
      clientX: 105,
      clientY: 105,
      buttons: 1,
      button: 0,
      pointerId: 1,
    })

    // Check if it was removed
    await waitFor(() => {
      paths = canvas.querySelectorAll('path')
      expect(paths.length).toBe(0)
    })
  })

  it('pans the camera with right-click drag', async () => {
    const { container } = render(<App />, {
      wrapper: ({ children }) => (
        <AppWrapper initialValues={[[isAuthenticatedAtom, true]]}>
          {children}
        </AppWrapper>
      ),
    })

    const canvas = container.querySelector('svg')!
    const group = canvas.querySelector('g')!

    // Initial transform
    expect(group.getAttribute('transform')).toContain('translate(0, 0)')

    // Right-click drag
    fireEvent.pointerDown(canvas, {
      clientX: 100,
      clientY: 100,
      buttons: 2,
      button: 2,
      pointerId: 1,
    })
    fireEvent.pointerMove(canvas, {
      clientX: 150,
      clientY: 150,
      buttons: 2,
      pointerId: 1,
    })
    fireEvent.pointerUp(canvas, { clientX: 150, clientY: 150, pointerId: 1 })

    // Verify camera moved
    expect(group.getAttribute('transform')).toContain('translate(50, 50)')
  })

  it('loads the last edited board on authentication if it still exists', async () => {
    const mockLastBoard = {
      id: 'board-123',
      name: 'My Board.void',
      parentId: 'root',
    }
    localStorage.setItem(
      'void-last-edited-board',
      JSON.stringify(mockLastBoard),
    )

    const mockBoardData = {
      strokes: [[[10, 10, 0.5]]],
      texts: [
        {
          id: 'text-1',
          content: 'hello from drive',
          x: 0,
          y: 0,
          w: 280,
          h: 160,
          isEditing: false,
          cardColor: '#FEFCE8',
        },
      ],
      images: [],
      connections: [],
      camera: { x: 10, y: 10, zoom: 1 },
    }

    const driveAPI = await import('../drive')
    vi.mocked(driveAPI.checkFileExists).mockResolvedValueOnce(true)
    vi.mocked(driveAPI.loadBoardFromDriveId).mockResolvedValueOnce(
      mockBoardData,
    )

    const { container } = render(<App />, {
      wrapper: ({ children }) => (
        <AppWrapper initialValues={[[isAuthenticatedAtom, true]]}>
          {children}
        </AppWrapper>
      ),
    })

    await waitFor(() => {
      expect(driveAPI.checkFileExists).toHaveBeenCalledWith('board-123')
      expect(driveAPI.loadBoardFromDriveId).toHaveBeenCalledWith('board-123')
    })

    // Check that elements from the loaded board are rendered
    const canvas = container.querySelector('svg')!
    await waitFor(() => {
      const paths = canvas.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })
  })
})
