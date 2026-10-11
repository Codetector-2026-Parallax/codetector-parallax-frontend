import { useState, useEffect } from "react"
import { Clock, Hourglass, Flame } from "lucide-react"

interface TimerPanelProps {
  initialSeconds?: number
}

export function TimerPanel({ initialSeconds = 45 * 60 }: TimerPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isActive] = useState(true)

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, secondsLeft])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / initialSeconds) * 100))

  return (
    <div className="content-panel flex h-full flex-col justify-between rounded-xl border border-border/80 p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Top: Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary animate-pulse" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            TIMER // THỜI GIAN
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 font-mono">
          <Hourglass className="size-3" />
          <span>VÒNG 1</span>
        </div>
      </div>

      {/* Middle: Digital Countdown Display */}
      <div className="my-auto py-3 text-center">
        <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-primary drop-shadow-[0_0_15px_rgba(202,160,82,0.4)]">
          {formattedTime}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Flame className="size-3 text-destructive animate-bounce" />
          <span>CHUYÊN ÁN ĐANG DIỄN RA</span>
        </div>
      </div>

      {/* Bottom: Progress Bar */}
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>TIẾN TRÌNH THỜI GIAN</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-amber-300 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
