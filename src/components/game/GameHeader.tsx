import { Link, useNavigate } from "@tanstack/react-router"
import { LogOut, Award, Trophy, Database } from "lucide-react"
import logoImage from "../../assets/logo.png"
import { useAuth } from "../../context/useAuth"
import { TimerPanel } from "./TimerPanel"

interface GameHeaderProps {
  currentStageNumber: number
  totalQuestions?: number
  onOpenErd: () => void
}

export function GameHeader({ currentStageNumber, totalQuestions = 3, onOpenErd }: GameHeaderProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: "/login" })
  }

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 sm:px-4">
        {/* Left: Brand & Stage info */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img src={logoImage} alt="Logo" className="size-7 object-contain" />
            <span className="hidden font-display text-sm font-bold tracking-[0.14em] text-primary sm:inline">
              CØDETECTOR
            </span>
          </Link>

          <div className="hidden h-4 w-px bg-border/60 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Award className="hidden size-3.5 sm:block" />
              <span>CHẶNG 01</span>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground xl:inline">
              CÂU {Math.min(currentStageNumber, totalQuestions)} / {totalQuestions} · HỒ SƠ CHUYÊN ÁN
            </span>
          </div>
        </div>

        <TimerPanel />

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <nav aria-label="Công cụ phòng điều tra" className="flex items-center gap-1 rounded-lg border border-[#34312b] bg-[#191916] p-1">
          <button
            type="button"
            onClick={onOpenErd}
            aria-label="Mở sơ đồ DB"
            aria-haspopup="dialog"
            title="Mở sơ đồ cơ sở dữ liệu"
            className="flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground sm:px-3"
          >
            <Database className="size-3.5" />
            <span className="hidden sm:inline">Sơ đồ DB</span>
          </button>
          {/* Leaderboard button */}
          <Link
            to="/leaderboard"
            aria-label="Bảng xếp hạng"
            className="flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground sm:px-3"
            title="Xem Bảng Xếp Hạng Trực Tiếp"
          >
            <Trophy className="size-3.5" />
            <span className="hidden sm:inline">Bảng xếp hạng</span>
          </Link>
          </nav>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
