import { useState, useRef, useMemo } from "react"
import {
  Database,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Table2,
  Key,
  Infinity as InfinityIcon,
} from "lucide-react"

interface ColumnDef {
  name: string
  type: string
  isPk?: boolean
  isFk?: boolean
}

interface TableNode {
  id: string
  name: string
  displayName: string
  x: number
  y: number
  width: number
  columns: ColumnDef[]
  color: {
    header: string
    border: string
    badge: string
  }
}

interface RelationWire {
  id: string
  fromTable: string
  fromCol: string
  toTable: string
  toCol: string
  label: string
}

// 10 Bảng định vị theo đúng bố cục không gian diagram của SQL Server
const INITIAL_TABLES: TableNode[] = [
  // 1. Call_log (Góc trên bên trái)
  {
    id: "Call_log",
    name: "Call_log",
    displayName: "Nhật ký cuộc gọi",
    x: 40,
    y: 30,
    width: 210,
    color: {
      header: "bg-red-950/60 text-red-300",
      border: "border-red-500/40",
      badge: "text-red-400 bg-red-500/10",
    },
    columns: [
      { name: "id_call", type: "int", isPk: true },
      { name: "calling_time", type: "datetime" },
      { name: "id_caller", type: "varchar", isFk: true },
      { name: "id_receiver", type: "varchar", isFk: true },
      { name: "duration_time", type: "float" },
    ],
  },

  // 2. User (Bảng nhân vật trung tâm bên trái)
  {
    id: "User",
    name: "User",
    displayName: "Hồ sơ nhân vật",
    x: 100,
    y: 260,
    width: 210,
    color: {
      header: "bg-purple-950/60 text-purple-300",
      border: "border-purple-500/50",
      badge: "text-purple-400 bg-purple-500/10",
    },
    columns: [
      { name: "id_user", type: "int", isPk: true },
      { name: "name", type: "varchar" },
      { name: "gender", type: "varchar" },
      { name: "age", type: "int" },
      { name: "dob", type: "date" },
      { name: "job", type: "varchar" },
    ],
  },

  // 3. ATM_Transaction (Phía trên giữa)
  {
    id: "ATM_Transaction",
    name: "ATM_Transaction",
    displayName: "Giao dịch ATM",
    x: 360,
    y: 30,
    width: 210,
    color: {
      header: "bg-emerald-950/60 text-emerald-300",
      border: "border-emerald-500/40",
      badge: "text-emerald-400 bg-emerald-500/10",
    },
    columns: [
      { name: "transaction_id", type: "int", isPk: true },
      { name: "person_id", type: "int", isFk: true },
      { name: "atm_id", type: "int", isFk: true },
      { name: "transaction_time", type: "datetime" },
      { name: "amount", type: "decimal" },
    ],
  },

  // 4. ATM (Góc trên bên phải)
  {
    id: "ATM",
    name: "ATM",
    displayName: "Cây ATM",
    x: 660,
    y: 30,
    width: 190,
    color: {
      header: "bg-emerald-950/40 text-emerald-400",
      border: "border-emerald-500/30",
      badge: "text-emerald-400 bg-emerald-500/10",
    },
    columns: [
      { name: "id_atm", type: "int", isPk: true },
      { name: "name", type: "varchar" },
      { name: "address", type: "varchar" },
    ],
  },

  // 5. Museum_log (Trung tâm)
  {
    id: "Museum_log",
    name: "Museum_log",
    displayName: "Nhật ký bảo tàng",
    x: 420,
    y: 260,
    width: 210,
    color: {
      header: "bg-amber-950/60 text-amber-300",
      border: "border-amber-500/50",
      badge: "text-amber-400 bg-amber-500/10",
    },
    columns: [
      { name: "id_visit", type: "int", isPk: true },
      { name: "id_user", type: "int", isFk: true },
      { name: "id_museum", type: "int", isFk: true },
      { name: "id_room", type: "int" },
      { name: "event_type", type: "varchar" },
      { name: "recorded_at", type: "datetime" },
    ],
  },

  // 6. Museum (Bên phải giữa)
  {
    id: "Museum",
    name: "Museum",
    displayName: "Bảo tàng Aureum",
    x: 740,
    y: 220,
    width: 200,
    color: {
      header: "bg-amber-950/40 text-amber-400",
      border: "border-amber-500/30",
      badge: "text-amber-400 bg-amber-500/10",
    },
    columns: [
      { name: "id_museum", type: "int", isPk: true },
      { name: "name", type: "varchar" },
      { name: "address", type: "varchar" },
    ],
  },

  // 7. carRental (Góc dưới bên trái)
  {
    id: "carRental",
    name: "carRental",
    displayName: "Hợp đồng thuê xe",
    x: 30,
    y: 500,
    width: 220,
    color: {
      header: "bg-cyan-950/60 text-cyan-300",
      border: "border-cyan-500/40",
      badge: "text-cyan-400 bg-cyan-500/10",
    },
    columns: [
      { name: "id_rental", type: "int", isPk: true },
      { name: "id_car", type: "int", isFk: true },
      { name: "id_dealer", type: "int" },
      { name: "id_renter", type: "int", isFk: true },
      { name: "id_driver", type: "int", isFk: true },
      { name: "rental_time", type: "datetime" },
      { name: "return_time", type: "datetime" },
      { name: "organization", type: "varchar" },
    ],
  },

  // 8. Car (Dưới giữa)
  {
    id: "Car",
    name: "Car",
    displayName: "Phương tiện xe",
    x: 350,
    y: 540,
    width: 200,
    color: {
      header: "bg-blue-950/60 text-blue-300",
      border: "border-blue-500/40",
      badge: "text-blue-400 bg-blue-500/10",
    },
    columns: [
      { name: "id_car", type: "int", isPk: true },
      { name: "plate_number", type: "varchar" },
      { name: "brand", type: "varchar" },
      { name: "create_date", type: "date" },
      { name: "is_rental", type: "bit" },
      { name: "color", type: "varchar" },
    ],
  },

  // 9. carPark_History (Dưới bên phải)
  {
    id: "carPark_History",
    name: "carPark_History",
    displayName: "Camera bãi đỗ xe",
    x: 630,
    y: 540,
    width: 210,
    color: {
      header: "bg-blue-950/60 text-blue-300",
      border: "border-blue-500/40",
      badge: "text-blue-400 bg-blue-500/10",
    },
    columns: [
      { name: "id_location", type: "var", isPk: true },
      { name: "id_carpark", type: "int", isFk: true },
      { name: "id_car", type: "int", isFk: true },
      { name: "entrace_time", type: "datetime" },
      { name: "exit_time", type: "datetime" },
      { name: "camera_code", type: "varchar" },
    ],
  },

  // 10. Carpark (Góc dưới ngoài cùng bên phải)
  {
    id: "Carpark",
    name: "Carpark",
    displayName: "Bãi đỗ xe",
    x: 800,
    y: 400,
    width: 190,
    color: {
      header: "bg-blue-950/40 text-blue-300",
      border: "border-blue-500/30",
      badge: "text-blue-400 bg-blue-500/10",
    },
    columns: [
      { name: "id_carpark", type: "int", isPk: true },
      { name: "id_museum", type: "int", isFk: true },
      { name: "name", type: "varchar" },
      { name: "address", type: "varchar" },
    ],
  },
]

// Các đường dây liên kết quan hệ (Relationship Wires)
const RELATION_WIRES: RelationWire[] = [
  // Call_log -> User
  {
    id: "call_user",
    fromTable: "User",
    fromCol: "id_user",
    toTable: "Call_log",
    toCol: "id_caller",
    label: "1 : N (Cuộc gọi)",
  },
  // ATM_Transaction -> User
  {
    id: "atm_user",
    fromTable: "User",
    fromCol: "id_user",
    toTable: "ATM_Transaction",
    toCol: "person_id",
    label: "1 : N (Người rút)",
  },
  // ATM_Transaction -> ATM
  {
    id: "atm_trans_atm",
    fromTable: "ATM",
    fromCol: "id_atm",
    toTable: "ATM_Transaction",
    toCol: "atm_id",
    label: "1 : N (Cây ATM)",
  },
  // Museum_log -> User
  {
    id: "museum_user",
    fromTable: "User",
    fromCol: "id_user",
    toTable: "Museum_log",
    toCol: "id_user",
    label: "1 : N (Khách quẹt thẻ)",
  },
  // Museum_log -> Museum
  {
    id: "museum_log_museum",
    fromTable: "Museum",
    fromCol: "id_museum",
    toTable: "Museum_log",
    toCol: "id_museum",
    label: "1 : N (Bảo tàng)",
  },
  // Carpark -> Museum
  {
    id: "carpark_museum",
    fromTable: "Museum",
    fromCol: "id_museum",
    toTable: "Carpark",
    toCol: "id_museum",
    label: "1 : N (Bãi xe)",
  },
  // carPark_History -> Carpark
  {
    id: "history_carpark",
    fromTable: "Carpark",
    fromCol: "id_carpark",
    toTable: "carPark_History",
    toCol: "id_carpark",
    label: "1 : N (Bãi đỗ)",
  },
  // carPark_History -> Car
  {
    id: "history_car",
    fromTable: "Car",
    fromCol: "id_car",
    toTable: "carPark_History",
    toCol: "id_car",
    label: "1 : N (Xe vào bãi)",
  },
  // carRental -> Car
  {
    id: "rental_car",
    fromTable: "Car",
    fromCol: "id_car",
    toTable: "carRental",
    toCol: "id_car",
    label: "1 : N (Xe được thuê)",
  },
  // carRental -> User
  {
    id: "rental_user",
    fromTable: "User",
    fromCol: "id_user",
    toTable: "carRental",
    toCol: "id_renter",
    label: "1 : N (Người đứng tên thuê)",
  },
]

interface ErdVisualizerPanelProps {
  onInsertToEditor?: (text: string) => void
}

export function ErdVisualizerPanel({ onInsertToEditor }: ErdVisualizerPanelProps) {
  const [tables, setTables] = useState<TableNode[]>(INITIAL_TABLES)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 20, y: 10 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null)
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Map vị trí các table để vẽ đường nối
  const tableMap = useMemo(() => {
    const map = new Map<string, TableNode>()
    tables.forEach((t) => map.set(t.id, t))
    return map
  }, [tables])

  // Xử lý kéo thả (Pan canvas)
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (draggingTableId) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  // Xử lý di chuyển chuột
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    } else if (draggingTableId) {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom

      setTables((prev) =>
        prev.map((t) =>
          t.id === draggingTableId
            ? {
                ...t,
                x: Math.round(mouseCanvasX - dragOffset.x),
                y: Math.round(mouseCanvasY - dragOffset.y),
              }
            : t
        )
      )
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingTableId(null)
  }

  // Bắt đầu kéo Table Card
  const handleMouseDownTable = (e: React.MouseEvent, table: TableNode) => {
    e.stopPropagation()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom

    setDraggingTableId(table.id)
    setDragOffset({
      x: mouseCanvasX - table.x,
      y: mouseCanvasY - table.y,
    })
  }

  // Reset view
  const handleResetView = () => {
    setZoom(0.85)
    setPan({ x: 20, y: 10 })
    setTables(INITIAL_TABLES)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    if (onInsertToEditor) {
      onInsertToEditor(text)
    }
  }

  // Tính toán tọa độ đường nối Bezier chuẩn SQL Server Diagram
  const wiresWithCoords = useMemo(() => {
    return RELATION_WIRES.map((wire) => {
      const fromT = tableMap.get(wire.fromTable)
      const toT = tableMap.get(wire.toTable)
      if (!fromT || !toT) return null

      // Điểm neo bắt đầu (From Table)
      const fromX = fromT.x + fromT.width / 2
      const fromY = fromT.y + 40 // anchor near PK

      // Điểm neo kết thúc (To Table)
      const toX = toT.x + toT.width / 2
      const toY = toT.y + 60 // anchor near FK

      // Tính điểm điều khiển Bezier curve (Cubic Bezier)
      const dx = toX - fromX
      const cx1 = fromX + dx * 0.5
      const cy1 = fromY
      const cx2 = fromX + dx * 0.5
      const cy2 = toY

      const pathData = `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`

      return {
        ...wire,
        pathData,
        midX: (fromX + toX) / 2,
        midY: (fromY + toY) / 2,
      }
    }).filter(Boolean)
  }, [tableMap])

  return (
    <div className="content-panel flex h-full flex-col rounded-xl border border-border/80 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Top Toolbar (SQL Server Style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/70 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            SQL SERVER DIAGRAM // SƠ ĐỒ QUAN HỆ 10 BẢNG
          </h2>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <div className="flex items-center rounded-lg border border-border/70 bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              title="Phóng to"
              className="p-1 hover:text-primary transition-colors"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <span className="px-1.5 text-[10px] text-muted-foreground select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              title="Thu nhỏ"
              className="p-1 hover:text-primary transition-colors"
            >
              <ZoomOut className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetView}
            title="Đặt lại vị trí mặc định"
            className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Legend & Hint Bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-primary/[0.02] px-3.5 py-1 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Key className="size-3 text-amber-400" />
            <strong className="text-amber-400">1</strong> (Phía Khóa chính)
          </span>
          <span className="flex items-center gap-1">
            <InfinityIcon className="size-3 text-cyan-400" />
            <strong className="text-cyan-400">∞</strong> (Phía Khóa ngoại N)
          </span>
        </div>
        <span className="text-primary hidden sm:inline">
          💡 Bạn có thể giữ chuột kéo bàn cờ (Pan) & di chuyển từng bảng (Drag)
        </span>
      </div>

      {/* Interactive 2D Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 overflow-hidden bg-[#0a0b0e] select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)
          `,
          backgroundSize: "24px 24px",
        }}
      >
        {/* Transformable Canvas Layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: "1200px",
            height: "900px",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* SVG Connector Wires Layer */}
          <svg
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            style={{ zIndex: 1 }}
          >
            <defs>
              {/* Marker Arrow */}
              <marker
                id="wire-arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
            </defs>

            {wiresWithCoords.map((wire) => {
              if (!wire) return null
              const isHighlighted =
                hoveredWireId === wire.id ||
                hoveredTableId === wire.fromTable ||
                hoveredTableId === wire.toTable

              return (
                <g key={wire.id} className="cursor-pointer pointer-events-auto">
                  {/* Thick Invisible Path for easy hover */}
                  <path
                    d={wire.pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    onMouseEnter={() => setHoveredWireId(wire.id)}
                    onMouseLeave={() => setHoveredWireId(null)}
                  />

                  {/* Main Bezier Wire */}
                  <path
                    d={wire.pathData}
                    fill="none"
                    stroke={isHighlighted ? "#f59e0b" : "#475569"}
                    strokeWidth={isHighlighted ? "2.5" : "1.5"}
                    strokeDasharray={isHighlighted ? "6 3" : "none"}
                    className="transition-colors duration-200"
                    style={{
                      filter: isHighlighted
                        ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))"
                        : "none",
                    }}
                  />

                  {/* Relation Label Pill */}
                  {isHighlighted && (
                    <foreignObject
                      x={wire.midX - 70}
                      y={wire.midY - 14}
                      width="140"
                      height="28"
                    >
                      <div className="flex items-center justify-center rounded-full border border-primary/60 bg-black/90 px-2 py-0.5 text-[9px] font-mono text-primary shadow-[0_0_15px_rgba(202,160,82,0.4)]">
                        {wire.label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Table Cards Layer */}
          <div className="relative size-full" style={{ zIndex: 2 }}>
            {tables.map((table) => {
              const isHovered =
                hoveredTableId === table.id ||
                (hoveredWireId &&
                  RELATION_WIRES.some(
                    (w) =>
                      w.id === hoveredWireId &&
                      (w.fromTable === table.id || w.toTable === table.id)
                  ))

              return (
                <div
                  key={table.id}
                  style={{
                    position: "absolute",
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                    width: `${table.width}px`,
                  }}
                  onMouseEnter={() => setHoveredTableId(table.id)}
                  onMouseLeave={() => setHoveredTableId(null)}
                  className={`rounded-lg border bg-[#111318] shadow-2xl transition-shadow ${
                    table.color.border
                  } ${
                    isHovered
                      ? "ring-2 ring-primary shadow-[0_0_25px_rgba(202,160,82,0.3)] z-20"
                      : "z-10"
                  }`}
                >
                  {/* Table Header (Draggable Handle) */}
                  <div
                    onMouseDown={(e) => handleMouseDownTable(e, table)}
                    className={`flex cursor-move items-center justify-between border-b border-border/50 px-2.5 py-1.5 rounded-t-lg select-none ${table.color.header}`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold truncate">
                      <Table2 className="size-3.5 shrink-0" />
                      <span className="truncate">{table.name}</span>
                    </div>
                    <span
                      className={`rounded px-1 text-[9px] font-mono font-medium ${table.color.badge}`}
                    >
                      {table.displayName}
                    </span>
                  </div>

                  {/* Columns List (SSMS Format) */}
                  <div className="divide-y divide-border/20 py-0.5 text-xs font-mono">
                    {table.columns.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => handleCopy(`${table.name}.${col.name}`)}
                        className="group w-full flex items-center justify-between px-2.5 py-1 hover:bg-white/[0.06] transition-colors text-left"
                        title="Bấm để copy tên cột vào SQL"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {col.isPk ? (
                            <Key className="size-3 text-amber-400 shrink-0" />
                          ) : col.isFk ? (
                            <span className="rounded bg-cyan-500/20 px-0.5 text-[8px] font-bold text-cyan-400 border border-cyan-500/30">
                              FK
                            </span>
                          ) : (
                            <span className="size-3 block shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              col.isPk
                                ? "font-bold text-amber-300"
                                : col.isFk
                                ? "font-semibold text-cyan-300"
                                : "text-foreground/90 group-hover:text-primary transition-colors"
                            }`}
                          >
                            {col.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 pl-1">
                          {col.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
