import { Table, Clock, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { QueryResult } from "../../types/game"

interface QueryOutputPanelProps {
  result: QueryResult | null
  isRunning: boolean
}

export function QueryOutputPanel({ result, isRunning }: QueryOutputPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyJson = () => {
    if (!result?.rows) return
    navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="content-panel flex h-full flex-col rounded-xl border border-border/80 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Header with Stats */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/60 py-2.5 pl-4 pr-24">
        <div className="flex items-center gap-2">
          <Table className="size-4 text-primary" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            OUTPUT // KẾT QUẢ TRUY VẤN
          </h2>
        </div>

        {/* Stats badges */}
        {result && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  <span>{result.row_count} DÒNG</span>
                </div>
                <div className="flex items-center gap-1 rounded bg-secondary/80 px-2 py-0.5 text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{result.execution_time_ms} ms</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  title="Sao chép JSON"
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-destructive">
                <AlertTriangle className="size-3" />
                <span>LỖI CÚ PHÁP</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-auto p-0 bg-[#0d0e12]/80 custom-scrollbar">
        {isRunning ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-xs font-mono text-muted-foreground">
            <span className="animate-pulse">ĐANG THỰC THI TRUY VẤN TRONG SANDBOX...</span>
          </div>
        ) : !result ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-xs font-mono text-muted-foreground/60">
            <Table className="size-8 mb-2 opacity-30" />
            <p>CHƯA CÓ KẾT QUẢ TRUY VẤN</p>
            <p className="text-[11px] mt-1">Viết câu lệnh SQL ở khung bên trên và nhấn RUN (hoặc Ctrl+Enter)</p>
          </div>
        ) : !result.success ? (
          <div className="p-4 sm:p-5">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive-foreground font-mono space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-destructive">
                <AlertTriangle className="size-4" />
                <span>THÔNG BÁO TỪ HỆ THỐNG:</span>
              </div>
              <p className="leading-relaxed break-words">{result.error}</p>
            </div>
          </div>
        ) : result.rows.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-xs font-mono text-muted-foreground">
            <span>Truy vấn thành công nhưng không có bản ghi nào khớp điều kiện (0 dòng).</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="sticky top-0 bg-secondary/80 backdrop-blur border-b border-border/80">
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground w-12 text-center border-r border-border/40">
                    #
                  </th>
                  {result.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3 font-bold text-primary tracking-wider uppercase border-r border-border/40 last:border-r-0 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-border/30 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-muted-foreground/50 border-r border-border/30 text-[11px]">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="py-2 px-3 text-foreground/90 border-r border-border/30 last:border-r-0 whitespace-nowrap"
                      >
                        {cell === null ? (
                          <span className="italic text-muted-foreground/40">NULL</span>
                        ) : typeof cell === "boolean" ? (
                          <span className={cell ? "text-emerald-400 font-bold" : "text-destructive font-bold"}>
                            {String(cell)}
                          </span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
