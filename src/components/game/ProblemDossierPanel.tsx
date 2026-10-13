import { useState } from "react"
import { FileText, FileEdit, Loader2 } from "lucide-react"
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#34312b] bg-[#121210] shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
        {/* Panel Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#302e28] bg-[#191916] pl-5 pr-16">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">
              Hồ sơ vụ án
            </h2>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            Câu {stage.question_number} / {stage.total_questions}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 text-sm custom-scrollbar sm:px-6">
          <div className="space-y-7">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Chặng 1 · Truy tìm thủ phạm</p>
              <h3 className="font-display text-2xl font-semibold text-foreground">Vụ trộm Bảo tàng X</h3>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{stage.case_description}</p>
            </div>
            {/* Title & Story */}
            <div className="space-y-3 border-t border-[#5b5548] pt-7">
              <p className="text-xs font-medium text-muted-foreground">Câu hỏi {stage.question_number}</p>
              <h3 className="font-sans text-base font-semibold leading-snug text-foreground sm:text-lg">
                {stage.title}
              </h3>
              <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                {stage.story_description}
              </p>
            </div>

            {/* Clues guide if available */}
            {stage.clues_guide && (
              <div className="space-y-2 rounded-lg border border-[#323129] bg-[#1b1c18] px-4 py-3.5">
                <h4 className="text-sm font-medium text-foreground/85">Định dạng trả lời</h4>
                <p className="text-[13px] leading-7 text-muted-foreground">
                  {stage.clues_guide.replace(/^Định dạng trả lời:\s*/i, "").split(/(\S+_\S+)/g).map((part, index) => (
                    part.includes("_")
                      ? <code key={index} className="break-words font-mono text-[13px] tracking-[0.08em] text-[#e0d3b7]">{part}</code>
                      : part
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>

          {/* Call-to-action Card for Dossier Submission */}
        <div className="shrink-0 border-t border-[#302e28] bg-[#161613] px-5 py-4 sm:px-6">
          {stage.is_completed ? (
            <p className="text-xs leading-6 text-muted-foreground">Bạn đã hoàn thành câu hỏi này. Chọn câu đang mở trong mục lục để tiếp tục điều tra.</p>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#736548] bg-[#3a3428] px-5 py-3 text-sm font-medium leading-5 text-[#eee5d2] transition-colors hover:border-[#96825b] hover:bg-[#484030] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b39a6a]"
            >
              <FileEdit className="size-4" />
              <span>Nộp báo cáo</span>
            </button>
          )}
        </div>
      </div>

      {/* Submission Popup Modal with Confirmation Step */}
      <SubmissionDossierModal
        key={stage.id}
        isOpen={isModalOpen && !stage.is_completed}
        onClose={() => setIsModalOpen(false)}
        stage={stage}
        onSubmitAnswers={onSubmitAnswers}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
