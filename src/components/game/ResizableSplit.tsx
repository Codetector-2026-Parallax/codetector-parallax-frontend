import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type KeyboardEvent, type ReactNode } from "react"

interface ResizableSplitProps {
  children: [ReactNode, ReactNode]
  direction: "horizontal" | "vertical"
  label: string
  storageKey: string
  initialSize?: number
  minFirst?: number
  minSecond?: number
  stackOnMobile?: boolean
  className?: string
  firstCollapsed?: boolean
  secondCollapsed?: boolean
}

const desktopQuery = "(min-width: 768px)"

function subscribeToViewport(callback: () => void) {
  const query = window.matchMedia(desktopQuery)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

function isDesktop() {
  return window.matchMedia(desktopQuery).matches
}

export function ResizableSplit({
  children, direction, label, storageKey, initialSize = 50,
  minFirst = 120, minSecond = 120, stackOnMobile = false, className = "",
  firstCollapsed = false, secondCollapsed = false,
}: ResizableSplitProps) {
  const desktop = useSyncExternalStore(subscribeToViewport, isDesktop, () => true)
  const horizontal = direction === "horizontal" && (!stackOnMobile || desktop)
  const collapsedBasis = "42px"
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; position: number; size: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      const value = saved === null ? initialSize : Number(saved)
      return Number.isFinite(value) && value >= 10 && value <= 90 ? value : initialSize
    } catch {
      return initialSize
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(size))
    } catch {
      // Resizing still works when browser storage is unavailable.
    }
  }, [size, storageKey])

  useEffect(() => {
    if (!dragging) return
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = horizontal ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"
    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }
  }, [dragging, horizontal])

  function availableSpace() {
    const rect = containerRef.current?.getBoundingClientRect()
    return Math.max(1, ((horizontal ? rect?.width : rect?.height) ?? 1) - 8)
  }

  function clampSize(nextSize: number) {
    const available = availableSpace()
    const minimum = Math.max(10, Math.min(45, (minFirst / available) * 100))
    const maximum = 100 - Math.max(10, Math.min(45, (minSecond / available) * 100))
    return Math.max(minimum, Math.min(maximum, nextSize))
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, position: horizontal ? event.clientX : event.clientY, size }
    setDragging(true)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const position = horizontal ? event.clientX : event.clientY
    setSize(clampSize(drag.size + ((position - drag.position) / availableSpace()) * 100))
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const decrease = horizontal ? "ArrowLeft" : "ArrowUp"
    const increase = horizontal ? "ArrowRight" : "ArrowDown"
    const step = event.shiftKey ? 10 : 2
    if (event.key === decrease || event.key === increase) {
      event.preventDefault()
      setSize(clampSize(size + (event.key === increase ? step : -step)))
    } else if (event.key === "Home" || event.key === "End" || event.key === "Enter") {
      event.preventDefault()
      setSize(clampSize(event.key === "Enter" ? initialSize : event.key === "Home" ? 0 : 100))
    }
  }

  return (
    <div ref={containerRef} className={`flex min-h-0 min-w-0 ${horizontal ? "flex-row" : "flex-col"} ${className}`}>
      <div
        className="min-h-0 min-w-0 overflow-hidden transition-[flex-basis] duration-200"
        style={firstCollapsed ? { flex: `0 0 ${collapsedBasis}` } : { flex: secondCollapsed ? "1 1 0%" : `${size} 1 0%` }}
      >
        {children[0]}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuemin={10}
        aria-valuemax={90}
        aria-valuenow={Math.round(size)}
        aria-valuetext={`${Math.round(size)}% / ${Math.round(100 - size)}%`}
        title="Kéo để đổi kích thước · Nhấp đúp để đặt lại · Dùng phím mũi tên để điều chỉnh"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => setSize(clampSize(initialSize))}
        aria-hidden={firstCollapsed || secondCollapsed}
        className={`group relative z-10 shrink-0 touch-none select-none items-center justify-center rounded-sm outline-none transition-colors hover:bg-primary/10 focus-visible:bg-primary/15 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/60 ${firstCollapsed || secondCollapsed ? "hidden" : "flex"} ${horizontal ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"} ${dragging ? "bg-primary/15" : ""}`}
      >
        <span className={`rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary ${horizontal ? "h-8 w-0.5" : "h-0.5 w-8"} ${dragging ? "!bg-primary" : ""}`} />
      </div>
      <div
        className="min-h-0 min-w-0 overflow-hidden transition-[flex-basis] duration-200"
        style={secondCollapsed ? { flex: `0 0 ${collapsedBasis}` } : { flex: firstCollapsed ? "1 1 0%" : `${100 - size} 1 0%` }}
      >
        {children[1]}
      </div>
    </div>
  )
}
