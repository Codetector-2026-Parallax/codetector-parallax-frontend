import { useState } from "react"
import { BookOpen, Check, ChevronLeft, ChevronRight, Lock, Circle, Trophy } from "lucide-react"
import type { ChapterOutline } from "../../types/game"

interface QuestionSidebarProps {
  outline: ChapterOutline | null
  selectedQuestion?: number
  isLoading: boolean
  onSelect: (questionNumber: number) => void
}

export function QuestionSidebar({ outline, selectedQuestion, isLoading, onSelect }: QuestionSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const total = outline?.total_questions ?? 3
  const completed = outline?.completed_questions ?? 0

  return (
    <aside className={`shrink-0 border-b border-border/60 bg-card/30 md:border-b-0 md:border-r ${collapsed ? "md:w-14" : "md:w-60"}`}>
      <div className="flex h-12 items-center justify-between gap-2 border-b border-border/40 px-3">
        <div className={`flex items-center gap-2 text-primary ${collapsed ? "md:hidden" : ""}`}>
          <BookOpen className="size-4" />
          <span className="font-mono text-[11px] font-bold tracking-widest">MỤC LỤC</span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Mở mục lục" : "Thu gọn mục lục"}
          title={collapsed ? "Mở mục lục" : "Thu gọn mục lục"}
          className="hidden size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary md:flex"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        <span className="text-xs text-muted-foreground md:hidden">{completed}/{total} câu hoàn thành</span>
      </div>
      <div className={`px-4 pb-4 pt-5 ${collapsed ? "md:hidden" : ""}`}>
        <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-primary">CHẶNG 1</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{outline?.title ?? "Truy tìm thủ phạm"}</h2>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tiến độ điều tra</span><span className="font-mono text-primary">{completed}/{total}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${completed / total * 100}%` }} />
        </div>
      </div>
      <nav aria-label="Câu hỏi Chặng 1" className="flex gap-1 overflow-x-auto p-2 md:flex-col">
        {outline?.questions.map((question) => {
          const locked = question.status === "locked"
          const done = question.status === "completed"
          const selected = selectedQuestion === question.question_number
          const StatusIcon = locked ? Lock : done ? Check : Circle
          return (
            <button
              key={question.question_number}
              type="button"
              disabled={locked || isLoading}
              onClick={() => onSelect(question.question_number)}
              aria-current={selected ? "step" : undefined}
              aria-label={`Câu ${question.question_number}: ${question.title}${locked ? " (Đang khóa)" : done ? " (Đã hoàn thành)" : " (Đang làm)"}`}
              title={locked ? "Hoàn thành câu trước để mở khóa" : question.title}
              className={`flex min-w-0 items-start gap-2.5 rounded-lg border px-3 py-3 text-left transition-colors ${collapsed ? "md:justify-center md:px-1" : ""} ${selected ? "border-primary/35 bg-primary/10 text-primary" : locked ? "border-transparent text-muted-foreground/40" : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground"} disabled:cursor-not-allowed`}
            >
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center ${done ? "text-emerald-400" : ""}`}><StatusIcon className="size-3.5" /></span>
              <span className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                <span className="block whitespace-nowrap font-mono text-xs font-semibold">Câu {question.question_number}</span>
                <span className="mt-1 hidden text-[11px] leading-relaxed md:block">{question.title}</span>
              </span>
            </button>
          )
        })}
      </nav>
      {outline?.is_completed && <div className={`m-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 ${collapsed ? "md:hidden" : ""}`}><Trophy className="size-4 shrink-0" />Đã hoàn thành Chặng 1</div>}
    </aside>
  )
}
