import { useEffect, useRef } from "react"
import { Database, X } from "lucide-react"
import { ErdVisualizerPanel } from "./ErdVisualizerPanel"

interface ErdDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsertToEditor: (text: string) => void
}

export function ErdDialog({ isOpen, onClose, onInsertToEditor }: ErdDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    else if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="erd-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      className="fixed inset-0 m-auto h-[94dvh] max-h-none w-[96vw] max-w-none overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Database className="size-5 shrink-0 text-primary" />
          <div>
            <h2 id="erd-dialog-title" className="text-sm font-semibold">Sơ đồ cơ sở dữ liệu MuniDB</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Tra cứu bảng và quan hệ · Chọn cột để chèn vào SQL editor</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng sơ đồ DB" title="Đóng (Esc)" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <ErdVisualizerPanel reservePaneControls={false} onInsertToEditor={(text) => { onInsertToEditor(text); onClose() }} />
      </div>
    </dialog>
  )
}
