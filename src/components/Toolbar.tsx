import { useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import {
  activeToolAtom,
  explorerStateAtom,
  activeBoardAtom,
  strokesAtom,
  textsAtom,
  imagesAtom,
  cameraAtom,
  syncStatusAtom,
  isLocalModeAtom,
  isAuthenticatedAtom,
} from '../store'
import type { ToolType } from '../store'
import { saveBoardToDrive, logoutFromDrive } from '../drive'
import {
  MousePointer2,
  Pencil,
  Eraser,
  Type,
  Image as ImageIcon,
  Folder,
  Plus,
  Minus,
  AlertCircle,
  LogOut,
  Cloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function Toolbar() {
  const [activeTool, setActiveTool] = useAtom(activeToolAtom)
  const [, setExplorerState] = useAtom(explorerStateAtom)
  const [activeBoard, setActiveBoard] = useAtom(activeBoardAtom)
  const syncStatus = useAtomValue(syncStatusAtom)
  const [camera, setCamera] = useAtom(cameraAtom)
  const [isLocalMode, setIsLocalMode] = useAtom(isLocalModeAtom)
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom)

  const handleLogout = () => {
    logoutFromDrive()
    setIsAuthenticated(false)
    setIsLocalMode(false)
    setActiveBoard(null)
  }

  const strokes = useAtomValue(strokesAtom)
  const texts = useAtomValue(textsAtom)
  const images = useAtomValue(imagesAtom)

  const [isNaming, setIsNaming] = useState(false)
  const [tempName, setTempName] = useState('')

  const tools: {
    id: ToolType | 'image'
    label: string
    shortcut?: string
    icon: typeof MousePointer2
  }[] = [
    { id: 'move', label: 'Mover', shortcut: 'Q', icon: MousePointer2 },
    { id: 'draw', label: 'Desenhar', shortcut: 'W', icon: Pencil },
    { id: 'eraser', label: 'Apagar', shortcut: 'E', icon: Eraser },
    { id: 'text', label: 'Texto', shortcut: 'R', icon: Type },
    { id: 'image', label: 'Imagem', icon: ImageIcon },
  ]

  const handleNameSubmit = async () => {
    if (!tempName.trim()) return setIsNaming(false)
    const finalName = tempName.endsWith('.void') ? tempName : tempName + '.void'
    try {
      const boardState = { strokes, texts, images, camera }
      await saveBoardToDrive(finalName, boardState)
      setActiveBoard({ id: 'new', name: finalName, parentId: 'root' })
      setIsNaming(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const factor = direction === 'in' ? 1.2 : direction === 'out' ? 1 / 1.2 : 1
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    setCamera((prev) => {
      if (direction === 'reset') return { zoom: 1, x: 0, y: 0 }
      const nextZoom = Math.min(Math.max(prev.zoom * factor, 0.05), 20)
      const ratio = nextZoom / prev.zoom
      return {
        zoom: nextZoom,
        x: centerX - (centerX - prev.x) * ratio,
        y: centerY - (centerY - prev.y) * ratio,
      }
    })
  }

  const renderSyncIndicator = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Salvando...
          </div>
        )
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600">
            <Cloud className="h-3 w-3 stroke-[3]" />
            Sincronizado
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
            <AlertCircle className="h-3 w-3" />
            Erro de Sincronia
          </div>
        )
      case 'local':
      default:
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Apenas Local
          </div>
        )
    }
  }

  return (
    <div className="fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-3xl border border-black/5 bg-white p-2.5 shadow-2xl z-[1000] max-w-[95vw] overflow-x-auto no-scrollbar backdrop-blur-sm bg-white/90">
      {/* Tools */}
      <div className="flex gap-1">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              render={
                <Button
                  variant={activeTool === tool.id ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    'relative h-10 w-10 rounded-xl transition-all',
                    activeTool === tool.id
                      ? 'shadow-lg scale-105'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                  aria-label={tool.label}
                  onClick={() =>
                    tool.id === 'image'
                      ? document.getElementById('image-upload')?.click()
                      : setActiveTool(tool.id as ToolType)
                  }
                >
                  <tool.icon
                    className={cn(
                      'h-5 w-5',
                      activeTool === tool.id
                        ? 'stroke-[2.5px]'
                        : 'stroke-[2px]',
                    )}
                  />
                  {tool.shortcut && (
                    <span
                      className={cn(
                        'absolute bottom-1 right-1.5 text-[8px] font-black uppercase transition-opacity',
                        activeTool === tool.id ? 'text-white/50' : 'opacity-30',
                      )}
                    >
                      {tool.shortcut}
                    </span>
                  )}
                </Button>
              }
            />
            <TooltipContent side="top" className="text-xs font-bold">
              {tool.label} {tool.shortcut && `(${tool.shortcut})`}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Board Info & Sync */}
      <div className="flex flex-col min-w-[100px] px-1">
        {isNaming ? (
          <Input
            autoFocus
            data-testid="board-name-input"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            onBlur={handleNameSubmit}
            className="h-7 text-xs font-bold bg-muted/50 border-none px-2 focus-visible:ring-1"
          />
        ) : (
          <div
            className="text-[13px] font-bold cursor-pointer max-w-[120px] truncate text-foreground hover:opacity-70 transition-opacity"
            onClick={() => {
              setTempName(activeBoard?.name.replace('.void', '') || '')
              setIsNaming(true)
            }}
          >
            {activeBoard
              ? activeBoard.name.replace('.void', '')
              : 'Board Sem Título'}
          </div>
        )}
        {renderSyncIndicator()}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center bg-muted/50 rounded-xl p-1 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => handleZoom('out')}
          title="Zoom Out"
        >
          <Minus className="h-4 w-4 stroke-[3]" />
        </Button>
        <Button
          variant="ghost"
          className="h-8 px-2 text-[10px] font-black bg-background shadow-sm hover:bg-background"
          onClick={() => handleZoom('reset')}
        >
          {Math.round(camera.zoom * 100)}%
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => handleZoom('in')}
          title="Zoom In"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Global Actions */}
      <div className="flex gap-2 items-center">
        <Button
          variant="secondary"
          className="h-10 rounded-xl font-bold text-xs gap-2 px-4 hover:shadow-md transition-all"
          disabled={isLocalMode}
          onClick={() => setExplorerState({ isOpen: true, mode: 'load' })}
        >
          <Folder className="h-4 w-4 stroke-[2.5]" />
          Boards
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-xl shadow-lg hover:scale-105 transition-transform"
                disabled={isLocalMode}
                onClick={() => setExplorerState({ isOpen: true, mode: 'load' })}
              >
                <Plus className="h-5 w-5 stroke-[3]" />
              </Button>
            }
          />
          <TooltipContent side="top" className="font-bold text-xs">
            Novo Board
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 stroke-[2.5]" />
              </Button>
            }
          />
          <TooltipContent side="top" className="font-bold text-xs">
            Sair
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
