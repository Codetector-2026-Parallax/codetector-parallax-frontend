import { useState, useEffect } from "react"
import { FileText, Send, AlertCircle, CheckCircle2, Loader2, Sparkles, HelpCircle } from "lucide-react"
import type { StageData, SubmitResponse } from "../../types/game"

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
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [submitFeedback, setSubmitFeedback] = useState<SubmitResponse | null>(null)

  // Reset form when stage changes
  useEffect(() => {
    if (stage) {
      const initial: Record<string, string> = {}
      stage.form_schema.forEach((field) => {
        initial[field.key] = ""
      })
      setFormValues(initial)
      setSubmitFeedback(null)
    }
  }, [stage])

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    // Clear error message when user starts typing
    if (submitFeedback && !submitFeedback.is_correct) {
      setSubmitFeedback(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stage || isSubmitting) return
    const res = await onSubmitAnswers(formValues)
    if (res) {
      setSubmitFeedback(res)
    }
  }

  if (isLoading || !stage) {
    return (
      <div className="content-panel flex h-full flex-col justify-center items-center rounded-xl border border-border/80 p-6">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground font-mono">ĐANG TẢI HỒ SƠ CHUYÊN ÁN...</p>
      </div>
    )
  }

  return (
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm custom-scrollbar">
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

        {/* Integrated Submission Form */}
        <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              <span>BÁO CÁO KẾT QUẢ ĐIỀU TRA</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Điền đủ & chính xác
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {stage.form_schema.map((field) => {
              const isFailed = submitFeedback?.failed_fields?.includes(field.key)
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    {field.label}{" "}
                    {field.required !== false && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={formValues[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                    required={field.required !== false}
                    className={`w-full rounded-lg border bg-background/80 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-colors ${
                      isFailed
                        ? "border-destructive focus:border-destructive ring-1 ring-destructive/40"
                        : "border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/40"
                    }`}
                  />
                  {isFailed && (
                    <p className="text-[11px] font-medium text-destructive">
                      Trường này chưa chính xác!
                    </p>
                  )}
                </div>
              )
            })}

            {/* Submission Status Alert */}
            {submitFeedback && (
              <div
                className={`rounded-lg border p-3 text-xs flex items-start gap-2.5 ${
                  submitFeedback.is_correct
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive-foreground"
                }`}
              >
                {submitFeedback.is_correct ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                )}
                <div className="leading-relaxed">{submitFeedback.message}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(202,160,82,0.3)] disabled:opacity-60 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>ĐANG ĐỐI CHIẾU HỒ SƠ...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>GỬI HỒ SƠ PHÁ ÁN</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
