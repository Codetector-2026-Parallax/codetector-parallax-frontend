import { Award, ArrowRight } from "lucide-react"

interface StageClearModalProps {
  isOpen: boolean
  completedStageNumber: number
  nextStageNumber: number
  nextTitle: string
  chapterCompleted?: boolean
  onClose: () => void
}

export function StageClearModal({
  isOpen,
  completedStageNumber,
  nextStageNumber,
  nextTitle,
  chapterCompleted = false,
  onClose,
}: StageClearModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-enter-fade">
      <div className="content-panel w-full max-w-md rounded-2xl border border-primary/60 p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(202,160,82,0.25)] animate-enter-scale">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 border border-primary/40 text-primary drop-shadow-[0_0_15px_rgba(202,160,82,0.4)]">
          <Award className="size-8" />
        </div>

        <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-foreground">
          {chapterCompleted ? "HOÀN THÀNH CHẶNG 1!" : "GIẢI MÃ CHÍNH XÁC!"}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {chapterCompleted ? "Đội đã trả lời đúng cả 3 câu hỏi và hoàn thành hồ sơ vụ trộm Bảo tàng X." : <>Đội đã trả lời đúng <span className="font-semibold text-primary">Câu {completedStageNumber}</span> của Chặng 1.</>}
        </p>

        {!chapterCompleted && <div className="my-6 rounded-xl border border-border/80 bg-secondary/40 p-4 text-left space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
            CÂU HỎI ĐÃ MỞ KHÓA:
          </span>
          <p className="font-display text-base font-semibold text-foreground">
            Câu {nextStageNumber}: {nextTitle}
          </p>
        </div>}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(202,160,82,0.3)] active:scale-[0.98]"
        >
          <span>{chapterCompleted ? "XEM LẠI HỒ SƠ" : "TIẾP TỤC ĐIỀU TRA"}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
