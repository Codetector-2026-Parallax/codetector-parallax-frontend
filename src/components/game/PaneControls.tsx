import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react"
import type { ReactNode } from "react"

interface PaneControlsProps {
  children: ReactNode
  label: string
  collapsed: boolean
  collapseDirection: "up" | "down"
  maximized: boolean
  onToggleCollapse?: () => void
  onToggleMaximize: () => void
}

export function PaneControls({
  children,
  label,
  collapsed,
  collapseDirection,
  maximized,
  onToggleCollapse,
  onToggleMaximize,
}: PaneControlsProps) {
  const CollapseIcon = collapseDirection === "up"
    ? (collapsed ? ChevronDown : ChevronUp)
    : (collapsed ? ChevronUp : ChevronDown)

  return (
    <section className="group/pane relative h-full min-h-0 min-w-0" aria-label={label}>
      <div className="absolute right-2 top-2 z-20 flex h-8 items-center overflow-hidden rounded-lg border border-border/80 bg-[#28282a]/95 text-muted-foreground shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={onToggleMaximize}
          aria-label={maximized ? `Khôi phục ${label}` : `Phóng to ${label}`}
          title={maximized ? "Khôi phục bố cục" : "Phóng to ô"}
          className="flex h-full w-9 items-center justify-center transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
        {onToggleCollapse && <><div className="h-4 w-px bg-border/70" />
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? `Mở ${label}` : `Thu gọn ${label}`}
          title={collapsed ? "Mở lại ô" : "Thu gọn ô"}
          className="flex h-full w-9 items-center justify-center transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <CollapseIcon className="size-5" />
        </button></>}
      </div>
      <div className={`h-full min-h-0 min-w-0 transition-opacity ${collapsed ? "pointer-events-none opacity-70" : ""}`}>
        {children}
      </div>
    </section>
  )
}
