import { useState } from "react"
import { FileText, FileEdit, HelpCircle, Loader2, Sparkles, ShieldAlert } from "lucide-react"
import type { StageData, SubmitResponse } from "../../types/game"
import { SubmissionDossierModal } from "./SubmissionDossierModal"

interface ProblemDossierPanelProps {
  stage: StageData | null
  isLoading: boolean
  onSubmitAnswers: (answers: Record<string, string>) => Promise<SubmitResponse | void>
  isSubmitting: boolean
}

export function ProblemDossierPanel({
  stage,
  isLoading,
  onSubmitAnswers,
  isSubmitting,
}: ProblemDossierPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading || !stage) {
    return (
      <div className="content-panel flex h-full flex-col justify-center items-center rounded-xl border border-border/80 p-6">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground font-mono">ĐANG TẢI HỒ SƠ CHUYÊN ÁN...</p>
      </div>
    )
  }

  return (
    <>
      <div className="content-panel flex h-full flex-col rounded-xl border border-border/80 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              ĐỀ BÀI // HỒ SƠ VỤ ÁN
            </h2>
          </div>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
            GIAI ĐOẠN {stage.stage_number}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm custom-scrollbar flex flex-col justify-between">
          <div className="space-y-4">
            {/* Title & Story */}
            <div className="space-y-2">
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                {stage.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground text-xs sm:text-sm">
                {stage.story_description}
              </p>
            </div>

            {/* Clues guide if available */}
            {stage.clues_guide && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5 text-xs text-amber-200/90">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <HelpCircle className="size-3.5" />
                  <span>GỢI Ý ĐIỀU TRA</span>
                </div>
                <p className="leading-relaxed">{stage.clues_guide}</p>
              </div>
            )}
          </div>

          {/* Call-to-action Card for Dossier Submission */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent p-4 space-y-3 shadow-[0_0_25px_rgba(202,160,82,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3.5" />
                  <span>HỒ SƠ BÁO CÁO PHÁ ÁN</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Đã thu thập đủ manh mối từ SQL Sandbox? Mở hồ sơ báo cáo để điền kết quả và xác nhận qua màn.
                </p>
              </div>

              <div className="hidden sm:flex size-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shrink-0">
                <ShieldAlert className="size-4" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold font-mono uppercase tracking-[0.14em] text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(202,160,82,0.35)] active:scale-[0.99]"
            >
              <FileEdit className="size-4" />
              <span>ĐIỀN & NỘP HỒ SƠ PHÁ ÁN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submission Popup Modal with Confirmation Step */}
      <SubmissionDossierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stage={stage}
        onSubmitAnswers={onSubmitAnswers}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
