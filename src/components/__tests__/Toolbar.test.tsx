import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Toolbar } from '../Toolbar'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/components/ui/tooltip'
import { syncStatusAtom, activeBoardAtom } from '../../store'
import { useSetAtom } from 'jotai'

// Mock drive module
vi.mock('../../drive', () => ({
  saveBoardToDrive: vi.fn(),
}))

function ToolbarTestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <TooltipProvider>{children}</TooltipProvider>
    </Provider>
  )
}

describe('Toolbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tool buttons', () => {
    render(<Toolbar />, { wrapper: ToolbarTestWrapper })
    expect(screen.getByRole('button', { name: /Mover/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Desenhar/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apagar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Texto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Imagem/i })).toBeInTheDocument()
  })

  it('displays the current board name or generic title if none', () => {
    render(<Toolbar />, { wrapper: ToolbarTestWrapper })
    expect(screen.getByText('Board Sem Título')).toBeInTheDocument()

    const BoardInjector = () => {
      const setBoard = useSetAtom(activeBoardAtom)
      setBoard({ id: '1', name: 'MyAwesomeBoard.void', parentId: 'root' })
      return null
    }

    render(
      <ToolbarTestWrapper>
        <BoardInjector />
        <Toolbar />
      </ToolbarTestWrapper>,
    )

    expect(screen.getByText('MyAwesomeBoard')).toBeInTheDocument()
  })

  it('shows correct sync status', () => {
    const StatusInjector = ({
      status,
    }: {
      status: 'local' | 'saving' | 'synced' | 'error'
    }) => {
      const setStatus = useSetAtom(syncStatusAtom)
      setStatus(status)
      return null
    }

    const { unmount } = render(
      <ToolbarTestWrapper>
        <StatusInjector status="saving" />
        <Toolbar />
      </ToolbarTestWrapper>,
    )
    expect(screen.getByText('Salvando...')).toBeInTheDocument()
    unmount()

    render(
      <ToolbarTestWrapper>
        <StatusInjector status="synced" />
        <Toolbar />
      </ToolbarTestWrapper>,
    )
    expect(screen.getByText('Sincronizado')).toBeInTheDocument()
  })
})
