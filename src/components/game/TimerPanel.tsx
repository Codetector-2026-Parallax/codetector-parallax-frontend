import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface TimerPanelProps {
  initialSeconds?: number
}

export function TimerPanel({ initialSeconds = 45 * 60 }: TimerPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const progressPercent = initialSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / initialSeconds) * 100)) : 0
  const isUrgent = secondsLeft <= 5 * 60

  return (
    <div
      role="timer"
      aria-label={`Thời gian còn lại: ${minutes} phút ${seconds} giây`}
      aria-live="off"
      title={secondsLeft === 0 ? "Đã hết thời gian" : "Thời gian phá án còn lại"}
      className={`flex h-8 shrink-0 items-center gap-2 rounded-lg border px-2.5 font-mono ${isUrgent ? "border-red-400/40 bg-red-400/10 text-red-400" : "border-primary/30 bg-primary/5 text-primary"}`}
    >
      <Clock className="size-3.5 shrink-0" />
      <span className="text-sm font-bold tabular-nums tracking-wider">{formattedTime}</span>
      <div
        role="progressbar"
        aria-label="Thời gian còn lại"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
        className="hidden h-1 w-12 overflow-hidden rounded-full bg-secondary sm:block"
      >
        <div className="h-full rounded-full bg-current transition-[width] duration-1000" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  )
}
