import { render, fireEvent, screen, waitFor } from '@testing-library/react'
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
}))

import { useHydrateAtoms } from 'jotai/utils'

function HydrateAtoms({ initialValues, children }: any) {
  useHydrateAtoms(initialValues)
  return children
}

function AppWrapper({ children, initialValues = [] }: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <HydrateAtoms initialValues={initialValues}>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </HydrateAtoms>
      </Provider>
    </QueryClientProvider>
  )
}

describe('Canvas Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('draws a stroke on the canvas', async () => {
    const { container } = render(<App />, { 
      wrapper: ({children}) => (
        <AppWrapper initialValues={[
          [isAuthenticatedAtom, true], 
          [activeToolAtom, 'draw'],
          [strokesAtom, []]
        ]}>
          {children}
        </AppWrapper>
      )
    })

    const canvas = container.querySelector('svg')!

    // Simulate drawing
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, buttons: 1, button: 0, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 110, buttons: 1, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 120, buttons: 1, pointerId: 1 })
    fireEvent.pointerUp(canvas, { clientX: 120, clientY: 120, pointerId: 1 })

    // Verify stroke was added
    const paths = canvas.querySelectorAll('path')
    // One for the drawn stroke
    expect(paths.length).toBeGreaterThan(0)
  })

  it('erases a stroke when clicking it with the eraser tool', async () => {
    // We need to inject a stroke first
    const { container } = render(<App />, { 
      wrapper: ({children}) => (
        <AppWrapper initialValues={[
          [isAuthenticatedAtom, true], 
          [activeToolAtom, 'eraser'],
          [strokesAtom, [[[100, 100, 0.5], [110, 110, 0.5]]]]
        ]}>
          {children}
        </AppWrapper>
      )
    })

    const canvas = container.querySelector('svg')!
    let paths = canvas.querySelectorAll('path')
    expect(paths.length).toBe(1)

    // Click the path to erase it
    fireEvent.pointerDown(paths[0], { clientX: 105, clientY: 105, buttons: 1, button: 0, pointerId: 1 })
    
    // Check if it was removed
    await waitFor(() => {
      paths = canvas.querySelectorAll('path')
      expect(paths.length).toBe(0)
    })
  })

  it('pans the camera with right-click drag', async () => {
    const { container } = render(<App />, { 
      wrapper: ({children}) => (
        <AppWrapper initialValues={[[isAuthenticatedAtom, true]]}>
          {children}
        </AppWrapper>
      )
    })

    const canvas = container.querySelector('svg')!
    const group = canvas.querySelector('g')!
    
    // Initial transform
    expect(group.getAttribute('transform')).toContain('translate(0, 0)')

    // Right-click drag
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100, buttons: 2, button: 2, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 150, clientY: 150, buttons: 2, pointerId: 1 })
    fireEvent.pointerUp(canvas, { clientX: 150, clientY: 150, pointerId: 1 })

    // Verify camera moved
    expect(group.getAttribute('transform')).toContain('translate(50, 50)')
  })
})
