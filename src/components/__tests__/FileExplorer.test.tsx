import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileExplorer } from '../FileExplorer'
import { Provider } from 'jotai'
import * as driveAPI from '../../drive'

// Mock drive module
vi.mock('../../drive', () => ({
  listFilesAndFolders: vi.fn(),
  createFolder: vi.fn(),
  deleteFile: vi.fn(),
  moveFile: vi.fn(),
  saveBoardToDrive: vi.fn(),
  loadBoardFromDriveId: vi.fn(),
}))

function ExplorerWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>
}

describe('FileExplorer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(driveAPI.listFilesAndFolders).mockResolvedValue([
      {
        id: 'folder1',
        name: 'My Folder',
        mimeType: 'application/vnd.google-apps.folder',
      },
      { id: 'board1', name: 'My Board.void', mimeType: 'application/json' },
    ])
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <FileExplorer isOpen={false} onClose={() => {}} />,
      { wrapper: ExplorerWrapper },
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders and fetches items when opened', async () => {
    render(<FileExplorer isOpen={true} onClose={() => {}} />, {
      wrapper: ExplorerWrapper,
    })

    // Check loading state or immediately fetched items depending on mock timing
    await waitFor(() => {
      expect(screen.getByText('My Folder')).toBeInTheDocument()
    })

    expect(screen.getByText('My Board')).toBeInTheDocument() // The component strips .void
    expect(driveAPI.listFilesAndFolders).toHaveBeenCalledWith('root')
  })

  it('filters items based on search input', async () => {
    render(<FileExplorer isOpen={true} onClose={() => {}} />, {
      wrapper: ExplorerWrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('My Folder')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar por nome...')
    fireEvent.change(searchInput, { target: { value: 'Folder' } })

    expect(screen.getByText('My Folder')).toBeInTheDocument()
    expect(screen.queryByText('My Board')).not.toBeInTheDocument()
  })

  it('allows creating a new folder', async () => {
    vi.mocked(driveAPI.createFolder).mockResolvedValue()

    render(<FileExplorer isOpen={true} onClose={() => {}} />, {
      wrapper: ExplorerWrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Nova Pasta')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Nova Pasta'))

    const input = screen.getByPlaceholderText('Nome da pasta...')
    fireEvent.change(input, { target: { value: 'New Test Folder' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(driveAPI.createFolder).toHaveBeenCalledWith(
        'New Test Folder',
        'root',
      )
    })
  })

  it('calls loadBoardFromDriveId and closes when a board is clicked', async () => {
    const onClose = vi.fn()
    vi.mocked(driveAPI.loadBoardFromDriveId).mockResolvedValue({
      strokes: [],
      texts: [],
      images: [],
      camera: { x: 0, y: 0, zoom: 1 },
    })

    render(<FileExplorer isOpen={true} onClose={onClose} />, {
      wrapper: ExplorerWrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('My Board')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('My Board'))

    await waitFor(() => {
      expect(driveAPI.loadBoardFromDriveId).toHaveBeenCalledWith('board1')
      expect(onClose).toHaveBeenCalled()
    })
  })
})
