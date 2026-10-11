import { useState, useEffect } from "react"
import {
  X,
  FileEdit,
  Send,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react"
import type { StageData, SubmitResponse } from "../../types/game"

interface SubmissionDossierModalProps {
  isOpen: boolean
  onClose: () => void
  stage: StageData | null
  onSubmitAnswers: (answers: Record<string, string>) => Promise<SubmitResponse | void>
  isSubmitting: boolean
}

export function SubmissionDossierModal({
  isOpen,
  onClose,
  stage,
  onSubmitAnswers,
  isSubmitting,
}: SubmissionDossierModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [submitFeedback, setSubmitFeedback] = useState<SubmitResponse | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Reset form when stage changes or modal opens
  useEffect(() => {
    if (stage) {
      const initial: Record<string, string> = {}
      stage.form_schema.forEach((field) => {
        initial[field.key] = formValues[field.key] || ""
      })
      setFormValues(initial)
      setSubmitFeedback(null)
      setIsConfirming(false)
    }
  }, [stage, isOpen])

  if (!isOpen || !stage) return null

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    if (submitFeedback && !submitFeedback.is_correct) {
      setSubmitFeedback(null)
    }
  }

  // Bước 1: Người dùng bấm Nộp -> Chuyển sang bước xác nhận
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirming(true)
  }

  // Bước 2: Xác nhận chính thức gửi bài
  const handleFinalSubmit = async () => {
    const res = await onSubmitAnswers(formValues)
    if (res) {
      setSubmitFeedback(res)
      if (res.is_correct) {
        // Đúng -> Đóng modal sau 1 giây
        setTimeout(() => {
          onClose()
        }, 800)
      } else {
        // Sai -> Quay lại form để người dùng chỉnh sửa
        setIsConfirming(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-enter-fade">
      <div className="content-panel w-full max-w-lg rounded-2xl border border-primary/50 bg-card/95 shadow-[0_0_50px_rgba(202,160,82,0.2)] overflow-hidden animate-enter-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-secondary/40 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
              <FileEdit className="size-4" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                HỒ SƠ BÁO CÁO PHÁ ÁN
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground">
                GIAI ĐOẠN {stage.stage_number}: {stage.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex size-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {!isConfirming ? (
            /* ================= BƯỚC 1: ĐIỀN THÔNG TIN ================= */
            <form onSubmit={handlePreSubmit} className="space-y-4">
              <div className="space-y-3.5">
                {stage.form_schema.map((field) => {
                  const isFailed = submitFeedback?.failed_fields?.includes(field.key)
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">
                        {field.label}{" "}
                        {field.required !== false && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <input
                        type={field.type || "text"}
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                        required={field.required !== false}
                        className={`w-full rounded-lg border bg-background/80 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-colors ${
                          isFailed
                            ? "border-destructive focus:border-destructive ring-1 ring-destructive/40"
                            : "border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                        }`}
                      />
                      {isFailed && (
                        <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          <span>Thông tin trường này chưa chính xác!</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Feedback Alert if failed */}
              {submitFeedback && !submitFeedback.is_correct && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs flex items-start gap-2.5 text-destructive-foreground">
                  <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                  <div className="leading-relaxed">{submitFeedback.message}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border/80 px-4 py-2 text-xs font-mono font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  ĐÓNG
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_15px_rgba(202,160,82,0.25)] hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <span>TIẾP TỤC XÁC NHẬN</span>
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* ================= BƯỚC 2: XÁC NHẬN NỘP HỒ SƠ ================= */
            <div className="space-y-4 animate-enter-fade">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs font-mono">
                  <AlertTriangle className="size-4" />
                  <span>XÁC NHẬN GỬI HỒ SƠ PHÁ ÁN</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn có chắc chắn muốn nộp các manh mối dưới đây không? Sau khi nộp thành công, kết quả sẽ được ghi nhận và **tự động đồng bộ sang màn tiếp theo cho toàn đội**.
                </p>
              </div>

              {/* Review Answers Summary */}
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5 space-y-2 text-xs font-mono">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  TỔNG HỢP MANH MỐI BẠN ĐÃ ĐIỀN:
                </span>
                <div className="space-y-1.5 pt-1">
                  {stage.form_schema.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between border-b border-border/40 pb-1 last:border-b-0"
                    >
                      <span className="text-muted-foreground">{field.label}:</span>
                      <strong className="text-primary font-semibold truncate max-w-[220px]">
                        {formValues[field.key] || "(Chưa điền)"}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg border border-border/80 px-4 py-2 text-xs font-mono font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>KIỂM TRA LẠI</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_rgba(202,160,82,0.3)] hover:bg-primary/90 transition-all disabled:opacity-60 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>ĐANG ĐỐI CHIẾU...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      <span>XÁC NHẬN NỘP ÁN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
