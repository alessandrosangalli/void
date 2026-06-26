import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { HelpCircle, Keyboard, MousePointer, Cloud } from 'lucide-react'

export function HelpDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <HelpCircle className="h-5 w-5 stroke-[2.5]" />
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              Guia de Uso & Atalhos
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
            Aprenda a navegar e criar livremente no quadro infinito do Void.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 text-xs text-foreground">
          {/* Section 1: Tools */}
          <div className="grid gap-2 border-b pb-4 border-foreground/5">
            <h3 className="font-bold flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
              <MousePointer className="h-3.5 w-3.5" />
              Ferramentas de Criação
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
              <div className="flex items-start justify-between">
                <span className="font-bold text-foreground/80">
                  Mover / Selecionar
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  Q
                </kbd>
              </div>
              <div className="flex items-start justify-between">
                <span className="font-bold text-foreground/80">
                  Desenhar Livre
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  W
                </kbd>
              </div>
              <div className="flex items-start justify-between">
                <span className="font-bold text-foreground/80">
                  Apagar Elementos
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  E
                </kbd>
              </div>
              <div className="flex items-start justify-between">
                <span className="font-bold text-foreground/80">
                  Criar Nota (Card)
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  R
                </kbd>
              </div>
              <div className="flex items-start justify-between col-span-2 border-t border-foreground/5 pt-2">
                <span className="font-bold text-foreground/80">
                  Upload de Imagem
                </span>
                <span className="text-muted-foreground text-[10px] font-medium">
                  Ícone de Imagem na barra de ferramentas
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Shortcuts */}
          <div className="grid gap-2 border-b pb-4 border-foreground/5">
            <h3 className="font-bold flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
              <Keyboard className="h-3.5 w-3.5" />
              Atalhos de Teclado
            </h3>
            <div className="grid grid-cols-1 gap-2.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Desfazer última alteração
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Refazer alteração desfeita
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Duplicar card ou imagem selecionado
                </span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                  Ctrl + D
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Apagar card ou imagem selecionado
                </span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Backspace
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Delete
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Navigation */}
          <div className="grid gap-2 border-b pb-4 border-foreground/5">
            <h3 className="font-bold flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
              <MousePointer className="h-3.5 w-3.5" />
              Navegação e Câmera
            </h3>
            <div className="grid grid-cols-1 gap-2.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Mover Câmera (Pan)
                </span>
                <span className="text-muted-foreground text-[10px] text-right font-medium">
                  Clique Direito + Arrastar{' '}
                  <span className="font-bold text-foreground/40">ou</span>{' '}
                  Segurar{' '}
                  <kbd className="px-1.5 py-0.5 text-[8px] font-black bg-muted border border-foreground/10 rounded-md">
                    Espaço
                  </kbd>{' '}
                  + Arrastar
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Ajustar Zoom (Mouse / Touchpad)
                </span>
                <span className="text-muted-foreground text-[10px] font-medium">
                  Scroll / Gesto de Pinça (Pinch)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Zoom por Teclado
                </span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Ctrl + +
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Ctrl + -
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Resetar Zoom & Câmera
                </span>
                <div className="flex gap-1.5 items-center">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Shift + 1
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">ou</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Ctrl + 0
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Card Actions */}
          <div className="grid gap-2 border-b pb-4 border-foreground/5">
            <h3 className="font-bold flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
              <Keyboard className="h-3.5 w-3.5" />
              Edição de Notas (Cards)
            </h3>
            <div className="grid grid-cols-1 gap-2.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Iniciar Edição
                </span>
                <span className="text-muted-foreground text-[10px] font-medium">
                  Duplo clique sobre o card
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Confirmar e Salvar Edição
                </span>
                <div className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Esc
                  </kbd>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-black bg-muted border border-foreground/10 rounded-md shadow-xs">
                    Ctrl + Enter
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground/80">
                  Notas Vazias
                </span>
                <span className="text-muted-foreground text-[10px] font-medium">
                  Salvar nota sem conteúdo remove-a automaticamente
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Sync info */}
          <div className="grid gap-2">
            <h3 className="font-bold flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
              <Cloud className="h-3.5 w-3.5" />
              Sincronização & Armazenamento
            </h3>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground font-medium">
              O Void suporta salvamento na nuvem sincronizado diretamente na sua
              conta do{' '}
              <span className="font-bold text-foreground/75">Google Drive</span>{' '}
              (criando arquivos de extensão{' '}
              <code className="text-primary font-bold">.void</code>). Se você
              estiver usando o{' '}
              <span className="font-bold text-foreground/75">Modo Local</span>,
              seus quadros serão mantidos no cache do navegador (localStorage)
              da sua máquina atual.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
