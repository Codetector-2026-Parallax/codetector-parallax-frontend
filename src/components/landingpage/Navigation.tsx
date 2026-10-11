import { Link } from "@tanstack/react-router"
import logoImage from "../../assets/logo.png"
import landingData from "../../data/landingData.json"

function Navigation() {
  const { brand, badge, links } = landingData.navigation

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-5 lg:px-8" aria-label="Navigation">
        <a href="#home" className="flex min-w-0 items-center gap-2 font-display text-lg font-bold tracking-[0.14em] text-primary sm:gap-3 sm:text-xl sm:tracking-[0.18em]">
          <img src={logoImage} alt="JSClub Logo" className="size-5 shrink-0 object-contain sm:size-6" />
          <span className="truncate">{brand}</span>
        </a>
        <div className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:flex">
          {links.map((link, index) => (
            <a key={index} className="transition-colors hover:text-primary" href={link.href}>
              {link.label}
            </a>
          ))}
          <Link
            to="/leaderboard"
            className="flex items-center gap-1.5 font-bold text-amber-400 transition-colors hover:text-amber-300"
          >
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            BẢNG XẾP HẠNG
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            className="md:hidden flex items-center gap-1 rounded-sm border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-400"
          >
            BXH
          </Link>
          <Link
            to="/login"
            preload="intent"
            className="shrink-0 rounded-sm border border-primary/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary transition-all hover:border-primary hover:bg-primary/15 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]"
          >
            {badge}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navigation
