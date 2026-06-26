import { useAtom, useSetAtom } from 'jotai'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { KeyRound, CloudOff } from 'lucide-react'
import {
  isSessionExpiredAtom,
  isAuthenticatedAtom,
  isLocalModeAtom,
  syncStatusAtom,
  activeBoardAtom,
} from '../store'
import type { Point, TextNode, ImageNode, Connection } from '../store'
import { loginToDrive, saveBoardToDrive } from '../drive'
import { toast } from 'sonner'

export function SessionExpiredDialog({
  isOpen,
  boardState,
}: {
  isOpen: boolean
  boardState: {
    strokes: Point[][]
    texts: TextNode[]
    images: ImageNode[]
    connections: Connection[]
    camera: { x: number; y: number; zoom: number }
  }
}) {
  const setIsSessionExpired = useSetAtom(isSessionExpiredAtom)
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom)
  const setIsLocalMode = useSetAtom(isLocalModeAtom)
  const setSyncStatus = useSetAtom(syncStatusAtom)
  const [activeBoard, setActiveBoard] = useAtom(activeBoardAtom)

  const handleReconnect = () => {
    loginToDrive(() => {
      setIsSessionExpired(false)
      setIsAuthenticated(true)
      setIsLocalMode(false)
      setSyncStatus('saving')

      // Trigger immediate sync on successful re-authentication
      const hasContent =
        boardState.strokes.length > 0 ||
        boardState.texts.length > 0 ||
        boardState.images.length > 0 ||
        (boardState.connections && boardState.connections.length > 0)

      if (activeBoard) {
        saveBoardToDrive(activeBoard.name, boardState, activeBoard.parentId)
          .then(() => {
            setSyncStatus('synced')
            toast.success(
              'Sessão reestabelecida e alterações salvas no Google Drive!',
              {
                id: 'reauth-success',
              },
            )
          })
          .catch((err) => {
            console.error('Failed to save after re-auth:', err)
            setSyncStatus('error')
            toast.error(
              'Sessão reestabelecida, mas ocorreu um erro ao salvar o board.',
              {
                id: 'reauth-save-error',
              },
            )
          })
      } else if (hasContent) {
        const autoName = 'Meu Board.void'
        saveBoardToDrive(autoName, boardState, 'root')
          .then(() => {
            setSyncStatus('synced')
            setActiveBoard({
              id: 'auto-created',
              name: autoName,
              parentId: 'root',
            })
            toast.success(
              'Sessão reestabelecida e board criado no Google Drive!',
              {
                id: 'reauth-success',
              },
            )
          })
          .catch((err) => {
            console.error('Failed to save auto-board after re-auth:', err)
            setSyncStatus('error')
            toast.error(
              'Sessão reestabelecida, mas ocorreu um erro ao salvar o board.',
              {
                id: 'reauth-save-error',
              },
            )
          })
      } else {
        setSyncStatus('synced')
        toast.success('Sessão reestabelecida com sucesso!', {
          id: 'reauth-success',
        })
      }
    })
  }

  const handleGoOffline = () => {
    setIsSessionExpired(false)
    setIsAuthenticated(false)
    setIsLocalMode(true)
    setSyncStatus('local')
    toast.info(
      'Modo offline ativado. Suas alterações serão salvas localmente neste navegador.',
      {
        id: 'offline-mode-info',
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md gap-6 p-6" showCloseButton={false}>
        <DialogHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-2">
            <KeyRound className="h-6 w-6 stroke-[2]" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-foreground">
            Sessão Expirada
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
            Sua conexão com o Google Drive expirou. Suas alterações atuais estão
            salvas com segurança no navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button
            onClick={handleReconnect}
            size="lg"
            className="w-full h-11 font-semibold text-sm bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl"
          >
            Reconectar Google Drive
          </Button>

          <Button
            onClick={handleGoOffline}
            variant="outline"
            size="lg"
            className="w-full h-11 font-semibold text-sm border-foreground/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all rounded-xl flex items-center justify-center gap-2"
          >
            <CloudOff className="h-4 w-4" />
            Continuar Offline (Modo Local)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
