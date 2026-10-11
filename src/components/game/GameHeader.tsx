import { Link, useNavigate } from "@tanstack/react-router"
import { Shield, Radio, LogOut, Award } from "lucide-react"
import logoImage from "../../assets/logo.png"
import { useAuth } from "../../context/useAuth"

interface GameHeaderProps {
  currentStageNumber: number
  isWsConnected: boolean
}

export function GameHeader({ currentStageNumber, isWsConnected }: GameHeaderProps) {
  const { team, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: "/login" })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Stage info */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img src={logoImage} alt="Logo" className="size-7 object-contain" />
            <span className="font-display text-sm font-bold tracking-[0.14em] text-primary">
              CØDETECTOR
            </span>
          </Link>

          <div className="hidden h-4 w-px bg-border/60 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Award className="size-3.5" />
              <span>MÀN {String(currentStageNumber).padStart(2, "0")}</span>
            </div>
            <span className="hidden font-mono text-xs text-muted-foreground md:inline">
              HỒ SƠ CHUYÊN ÁN PARALLAX
            </span>
          </div>
        </div>

        {/* Right: Team info, WS connection & Sign out */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* WS Realtime badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isWsConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                isWsConnected ? "animate-pulse bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <Radio className="size-3" />
            <span className="hidden sm:inline">
              {isWsConnected ? "ĐỒNG BỘ REALTIME" : "ĐANG KẾT NỐI LẠI"}
            </span>
          </div>

          {/* Team Name badge */}
          {team && (
            <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/30 px-3 py-1 text-xs">
              <Shield className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground">
                {team.team_name}
              </span>
            </div>
          )}

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Đăng xuất"
            className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
