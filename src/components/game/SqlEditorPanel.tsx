import { useRef } from "react"
import { Code2, Play, RotateCcw, Loader2 } from "lucide-react"

interface SqlEditorPanelProps {
  sql: string
  onChangeSql: (sql: string) => void
  onRunQuery: () => void
  isRunning: boolean
}

const TEMPLATE_QUERIES = [
  { label: "Xem toàn bộ Cổ vật", sql: "SELECT * FROM artifacts;" },
  { label: "Nhật ký truy cập gần nhất", sql: "SELECT * FROM access_logs ORDER BY log_time DESC LIMIT 20;" },
  { label: "Tìm nghi phạm tiềm năng", sql: "SELECT * FROM suspects;" },
]

export function SqlEditorPanel({
  sql,
  onChangeSql,
  onRunQuery,
  isRunning,
}: SqlEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle keyboard shortcut: Ctrl + Enter / Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      if (!isRunning) {
        onRunQuery()
      }
    }
    // Allow Tab key to insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newSql = sql.substring(0, start) + "  " + sql.substring(end)
      onChangeSql(newSql)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  // Calculate line numbers
  const lineCount = Math.max(sql.split("\n").length, 6)
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="content-panel flex h-full flex-col rounded-xl border border-border/80 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Header & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-primary" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            IDE // SQL SANDBOX
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick templates */}
          <div className="hidden sm:flex items-center gap-1">
            {TEMPLATE_QUERIES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => onChangeSql(tmpl.sql)}
                className="rounded px-2 py-1 text-[11px] font-mono text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/60 hidden sm:block" />

          {/* Clear button */}
          <button
            type="button"
            onClick={() => onChangeSql("")}
            title="Làm mới câu lệnh"
            className="flex size-7 items-center justify-center rounded border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>

          {/* Run Query Button */}
          <button
            type="button"
            onClick={onRunQuery}
            disabled={isRunning || !sql.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold font-mono tracking-wider text-primary-foreground shadow-[0_0_15px_rgba(202,160,82,0.25)] hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>CHẠY...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>RUN (Ctrl+Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="relative flex-1 flex overflow-hidden bg-[#0d0e12]">
        {/* Line Numbers */}
        <div className="w-10 select-none py-3 text-right pr-3 font-mono text-xs text-muted-foreground/40 bg-black/20 border-r border-border/40">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => onChangeSql(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="-- Viết câu lệnh SQL truy vấn điều tra tại đây...
-- Ví dụ: SELECT * FROM artifacts WHERE status = 'MISSING';"
            spellCheck={false}
            className="size-full resize-none border-none bg-transparent p-3 font-mono text-xs sm:text-sm text-foreground/95 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 leading-6 custom-scrollbar"
          />
        </div>
      </div>
    </div>
  )
}
