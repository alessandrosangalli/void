import { useState, useEffect, useMemo } from 'react'
import { listFilesAndFolders, createFolder, loadBoardFromDriveId, deleteFile, moveFile, saveBoardToDrive } from '../drive'
import type { DriveFile } from '../drive'
import { useAtom, useSetAtom } from 'jotai'
import { strokesAtom, textsAtom, imagesAtom, cameraAtom, activeBoardAtom } from '../store'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Folder, FileJson, Search, MoreVertical, Plus, Trash2, Home, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileExplorerProps {
  isOpen: boolean
  onClose: () => void
}

export function FileExplorer({ isOpen, onClose }: FileExplorerProps) {
  const [currentFolder, setCurrentFolder] = useState<{id: string, name: string}>({id: 'root', name: 'Início'})
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([])
  const [items, setItems] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [menuItemId, setMenuItemId] = useState<string | null>(null)

  const setStrokes = useSetAtom(strokesAtom)
  const setTexts = useSetAtom(textsAtom)
  const setImages = useSetAtom(imagesAtom)
  const setCamera = useSetAtom(cameraAtom)
  const [activeBoard, setActiveBoard] = useAtom(activeBoardAtom)

  const fetchItems = async (folderId: string) => {
    setLoading(true)
    try {
      const result = await listFilesAndFolders(folderId)
      setItems(result)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (isOpen) fetchItems(currentFolder.id)
  }, [isOpen, currentFolder.id])

  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  }, [items, search])

  const folders = filteredItems.filter(i => i.mimeType === 'application/vnd.google-apps.folder')
  const boards = filteredItems.filter(i => i.mimeType !== 'application/vnd.google-apps.folder')

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return setIsCreatingFolder(false)
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase() && i.mimeType === 'application/vnd.google-apps.folder')) {
      toast.error(`A pasta "${name}" já existe.`)
      return
    }
    const tempId = 'temp-' + Math.random()
    const optimisticFolder: DriveFile = { id: tempId, name, mimeType: 'application/vnd.google-apps.folder' }
    setItems(prev => [optimisticFolder, ...prev])
    setIsCreatingFolder(false)
    setNewFolderName('')
    try {
      await createFolder(name, currentFolder.id)
      await fetchItems(currentFolder.id)
    } catch (e) {
      setItems(prev => prev.filter(i => i.id !== tempId))
      toast.error('Falha ao criar pasta')
    }
  }

  const handleCreateBoard = async () => {
    const name = newBoardName.trim()
    if (!name) return setIsCreatingBoard(false)
    const fileName = name + '.void'
    if (items.some(i => i.name.toLowerCase() === fileName.toLowerCase() && i.mimeType !== 'application/vnd.google-apps.folder')) {
      toast.error(`O board "${name}" já existe.`)
      return
    }
    const tempId = 'temp-' + Math.random()
    const optimisticBoard: DriveFile = { id: tempId, name: fileName, mimeType: 'application/json' }
    setItems(prev => [...prev, optimisticBoard])
    setIsCreatingBoard(false)
    setNewBoardName('')
    try {
      const emptyState = { strokes: [], texts: [], images: [], camera: { x: 0, y: 0, zoom: 1 } }
      await saveBoardToDrive(fileName, emptyState, currentFolder.id)
      await fetchItems(currentFolder.id)
      toast.success('Board criado com sucesso')
    } catch (e) {
      setItems(prev => prev.filter(i => i.id !== tempId))
      toast.error('Falha ao criar board')
    }
  }

  const handleDelete = async (id: string) => {
    const originalItems = [...items]
    setItems(prev => prev.filter(i => i.id !== id))
    setMenuItemId(null)
    try {
      await deleteFile(id)
      if (activeBoard?.id === id) setActiveBoard(null)
      toast.success('Item movido para a lixeira')
    } catch (e) {
      setItems(originalItems)
      toast.error('Falha ao excluir item')
    }
  }

  const navigateTo = (folder: {id: string, name: string}) => {
    if (folder.id === currentFolder.id) return
    const idx = folderHistory.findIndex(f => f.id === folder.id)
    if (idx !== -1) { setFolderHistory(folderHistory.slice(0, idx)) } 
    else { setFolderHistory([...folderHistory, currentFolder]) }
    setCurrentFolder(folder)
  }

  const openBoard = async (board: DriveFile) => {
    setLoading(true)
    try {
      const data = await loadBoardFromDriveId(board.id)
      if (data) {
        setStrokes(data.strokes || [])
        setTexts(data.texts || [])
        setImages(data.images || [])
        setCamera(data.camera || { x: 0, y: 0, zoom: 1 })
        setActiveBoard({ id: board.id, name: board.name, parentId: currentFolder.id })
        onClose()
      }
    } catch (e) { 
      toast.error('Falha ao carregar board')
    } finally { setLoading(false) }
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const originalItems = [...items]
    setItems(prev => prev.filter(i => i.id !== draggedId))
    try {
      await moveFile(draggedId, currentFolder.id, targetId)
      await fetchItems(currentFolder.id)
      toast.success('Item movido com sucesso')
    } catch (e) {
      setItems(originalItems)
      toast.error('Falha ao mover item')
    }
    setDraggedId(null)
    setDropTargetId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col sm:rounded-3xl border-none shadow-2xl bg-white" onClick={() => setMenuItemId(null)}>
        
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 border-b border-muted">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Meus Boards</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              className="pl-10 h-12 bg-muted/50 border-none rounded-2xl text-base focus-visible:ring-1" 
              placeholder="Buscar por nome..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onClick={e => e.stopPropagation()} 
            />
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-xl font-semibold gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); navigateTo({id: 'root', name: 'Início'}); }}
              onDragOver={e => { e.preventDefault(); setDropTargetId('root'); }} 
              onDragLeave={() => setDropTargetId(null)} 
              onDrop={() => handleDrop('root')}
            >
              <Home className="h-4 w-4" />
              Início
            </Button>
            
            {folderHistory.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl font-semibold text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); navigateTo(f); }}
                  onDragOver={e => { e.preventDefault(); setDropTargetId(f.id); }} 
                  onDragLeave={() => setDropTargetId(null)} 
                  onDrop={() => handleDrop(f.id)}
                >
                  {f.name}
                </Button>
              </div>
            ))}
            
            {currentFolder.id !== 'root' && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-sm font-bold px-3 py-1 bg-muted rounded-xl">{currentFolder.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6">
            
            {/* Create Board Card */}
            {!isCreatingBoard ? (
              <div 
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-black text-white cursor-pointer hover:bg-black/80 transition-all hover:-translate-y-1 shadow-lg h-[140px]"
                onClick={(e) => { e.stopPropagation(); setIsCreatingBoard(true); }}
              >
                <Plus className="h-8 w-8 stroke-[3]" />
                <span className="font-bold text-sm">Novo Board</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white border-2 border-primary/20 shadow-sm h-[140px]">
                <FileJson className="h-8 w-8 text-primary" />
                <Input 
                  autoFocus 
                  value={newBoardName} 
                  onChange={e => setNewBoardName(e.target.value)} 
                  onBlur={handleCreateBoard} 
                  onKeyDown={e => e.key === 'Enter' && handleCreateBoard()} 
                  onClick={e => e.stopPropagation()} 
                  className="h-8 text-center font-bold border-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-none" 
                  placeholder="Nome do board..."
                />
              </div>
            )}

            {/* Create Folder Card */}
            {!isCreatingFolder ? (
              <div 
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white border-2 border-dashed border-muted-foreground/20 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-all hover:-translate-y-1 h-[140px]"
                onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(true); }}
              >
                <Plus className="h-8 w-8 stroke-[3]" />
                <span className="font-bold text-sm">Nova Pasta</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white border-2 border-primary/20 shadow-sm h-[140px]">
                <Folder className="h-8 w-8 text-primary" />
                <Input 
                  autoFocus 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)} 
                  onBlur={handleCreateFolder} 
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} 
                  onClick={e => e.stopPropagation()} 
                  className="h-8 text-center font-bold border-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 shadow-none" 
                  placeholder="Nome da pasta..."
                />
              </div>
            )}

            {/* Folders */}
            {folders.map(f => (
              <div 
                key={f.id} 
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white border border-transparent hover:border-muted shadow-sm cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group h-[140px]",
                  f.id.startsWith('temp-') && "opacity-50 pointer-events-none grayscale",
                  draggedId === f.id && "opacity-40",
                  dropTargetId === f.id && "border-primary bg-primary/5 ring-4 ring-primary/10"
                )}
                draggable 
                onDragStart={() => setDraggedId(f.id)} 
                onDragOver={e => { e.preventDefault(); setDropTargetId(f.id); }} 
                onDragLeave={() => setDropTargetId(null)} 
                onDrop={() => handleDrop(f.id)} 
                onClick={(e) => { e.stopPropagation(); navigateTo(f); }}
              >
                <Folder className="h-10 w-10 text-blue-500 fill-blue-500/20" />
                <span className="font-bold text-sm text-center line-clamp-2 px-2 leading-tight">{f.name}</span>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                  onClick={e => { e.stopPropagation(); setMenuItemId(menuItemId === f.id ? null : f.id); }}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>

                {menuItemId === f.id && (
                  <div className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border p-1 z-10 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Boards */}
            {boards.map(b => (
              <div 
                key={b.id} 
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white border border-transparent hover:border-muted shadow-sm cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group h-[140px]",
                  b.id.startsWith('temp-') && "opacity-50 pointer-events-none",
                  draggedId === b.id && "opacity-40"
                )}
                draggable 
                onDragStart={() => setDraggedId(b.id)} 
                onClick={(e) => { e.stopPropagation(); openBoard(b); }}
              >
                <div className="h-12 w-16 bg-muted rounded-xl flex items-center justify-center border border-muted-foreground/10 group-hover:bg-muted/80 transition-colors">
                  <FileJson className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-bold text-sm text-center line-clamp-2 px-2 leading-tight">{b.name.replace('.void', '')}</span>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                  onClick={e => { e.stopPropagation(); setMenuItemId(menuItemId === b.id ? null : b.id); }}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>

                {menuItemId === b.id && (
                  <div className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border p-1 z-10 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t flex justify-between items-center text-xs font-semibold text-muted-foreground">
          <span>{loading ? 'Sincronizando com o Google Drive...' : `${items.length} itens encontrados`}</span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1"><Folder className="h-3 w-3" /> Pasta</span>
            <span className="flex items-center gap-1"><FileJson className="h-3 w-3" /> Board</span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
