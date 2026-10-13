import { useState, useRef, useMemo, useEffect } from "react"
import {
  Database,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Table2,
  Key,
  Infinity as InfinityIcon,
  Scan,
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

// Schema MuniDB, đối chiếu với sqljs (2).sql.
const INITIAL_TABLES: TableNode[] = [
  {
    id: "User",
    name: "User",
    displayName: "Hồ sơ nhân vật",
    x: 380,
    y: 380,
    width: 280,
    color: {header: "bg-purple-950/60 text-purple-300",border: "border-purple-500/50",badge: "text-purple-400 bg-purple-500/10"},
    columns: [
      {name: "id_user",type: "int",isPk: true},
      {name: "name",type: "nvarchar(100)"},
      {name: "gender",type: "nvarchar(20)"},
      {name: "age",type: "int"},
      {name: "dob",type: "date"},
      {name: "job",type: "nvarchar(100)"},
      {name: "address",type: "nvarchar(255)"},
    ],
  },
  {
    id: "Museum",
    name: "Museum",
    displayName: "Bảo tàng",
    x: 1400,
    y: 380,
    width: 280,
    color: {header: "bg-amber-950/60 text-amber-300",border: "border-amber-500/40",badge: "text-amber-400 bg-amber-500/10"},
    columns: [
      {name: "id_museum",type: "int",isPk: true},
      {name: "name",type: "nvarchar(100)"},
      {name: "address",type: "nvarchar(255)"},
    ],
  },
  {
    id: "Room",
    name: "Room",
    displayName: "Phòng trưng bày",
    x: 1060,
    y: 380,
    width: 280,
    color: {header: "bg-amber-950/60 text-amber-300",border: "border-amber-500/40",badge: "text-amber-400 bg-amber-500/10"},
    columns: [
      {name: "id_room",type: "int",isPk: true},
      {name: "id_museum",type: "int",isFk: true},
      {name: "name",type: "nvarchar(100)"},
    ],
  },
  {
    id: "artifact",
    name: "artifact",
    displayName: "Hiện vật",
    x: 1060,
    y: 1060,
    width: 280,
    color: {header: "bg-amber-950/60 text-amber-300",border: "border-amber-500/40",badge: "text-amber-400 bg-amber-500/10"},
    columns: [
      {name: "id_artifact",type: "int",isPk: true},
      {name: "id_room",type: "int",isFk: true},
      {name: "name",type: "nvarchar(100)"},
    ],
  },
  {
    id: "Theft_report",
    name: "Theft_report",
    displayName: "Báo cáo mất trộm",
    x: 1400,
    y: 1060,
    width: 280,
    color: {header: "bg-amber-950/60 text-amber-300",border: "border-amber-500/40",badge: "text-amber-400 bg-amber-500/10"},
    columns: [
      {name: "id_report",type: "int",isPk: true},
      {name: "id_artifact",type: "int",isFk: true},
      {name: "last_seen_at",type: "datetime2"},
      {name: "discovered_at",type: "datetime2"},
    ],
  },
  {
    id: "Carpark",
    name: "Carpark",
    displayName: "Bãi đỗ xe",
    x: 1060,
    y: 720,
    width: 280,
    color: {header: "bg-blue-950/60 text-blue-300",border: "border-blue-500/40",badge: "text-blue-400 bg-blue-500/10"},
    columns: [
      {name: "id_carpark",type: "int",isPk: true},
      {name: "id_museum",type: "int",isFk: true},
      {name: "name",type: "nvarchar(100)"},
      {name: "address",type: "nvarchar(255)"},
    ],
  },
  {
    id: "Car",
    name: "Car",
    displayName: "Phương tiện",
    x: 380,
    y: 720,
    width: 280,
    color: {header: "bg-blue-950/60 text-blue-300",border: "border-blue-500/40",badge: "text-blue-400 bg-blue-500/10"},
    columns: [
      {name: "id_car",type: "int",isPk: true},
      {name: "plate_number",type: "varchar(20)"},
      {name: "brand",type: "nvarchar(50)"},
      {name: "create_date",type: "date"},
      {name: "is_rental",type: "bit"},
      {name: "color",type: "nvarchar(50)"},
    ],
  },
  {
    id: "carPark_History",
    name: "carPark_History",
    displayName: "Lịch sử bãi đỗ",
    x: 720,
    y: 720,
    width: 280,
    color: {header: "bg-blue-950/60 text-blue-300",border: "border-blue-500/40",badge: "text-blue-400 bg-blue-500/10"},
    columns: [
      {name: "id_location",type: "int",isFk: true},
      {name: "id_car",type: "int",isPk: true,isFk: true},
      {name: "entrance_time",type: "datetime2",isPk: true},
      {name: "exit_time",type: "datetime2"},
      {name: "camera_code",type: "varchar(50)"},
    ],
  },
  {
    id: "carRental",
    name: "carRental",
    displayName: "Hợp đồng thuê xe",
    x: 40,
    y: 720,
    width: 280,
    color: {header: "bg-blue-950/60 text-blue-300",border: "border-blue-500/40",badge: "text-blue-400 bg-blue-500/10"},
    columns: [
      {name: "id_rental",type: "int",isPk: true},
      {name: "id_car",type: "int",isFk: true},
      {name: "id_dealer",type: "int",isFk: true},
      {name: "id_renter",type: "int",isFk: true},
      {name: "id_driver",type: "int",isFk: true},
      {name: "rental_time",type: "datetime2"},
      {name: "return_time",type: "datetime2"},
      {name: "organization",type: "nvarchar(100)"},
    ],
  },
  {
    id: "ATM",
    name: "ATM",
    displayName: "Cây ATM",
    x: 1060,
    y: 40,
    width: 280,
    color: {header: "bg-emerald-950/60 text-emerald-300",border: "border-emerald-500/40",badge: "text-emerald-400 bg-emerald-500/10"},
    columns: [
      {name: "id_atm",type: "int",isPk: true},
      {name: "name",type: "nvarchar(100)"},
      {name: "address",type: "nvarchar(255)"},
    ],
  },
  {
    id: "ATM_Transaction",
    name: "ATM_Transaction",
    displayName: "Giao dịch ATM",
    x: 720,
    y: 40,
    width: 280,
    color: {header: "bg-emerald-950/60 text-emerald-300",border: "border-emerald-500/40",badge: "text-emerald-400 bg-emerald-500/10"},
    columns: [
      {name: "transaction_id",type: "int",isPk: true},
      {name: "person_id",type: "int",isFk: true},
      {name: "atm_id",type: "int",isFk: true},
      {name: "transaction_time",type: "datetime2"},
      {name: "amount",type: "decimal(18,2)"},
    ],
  },
  {
    id: "Call_log",
    name: "Call_log",
    displayName: "Nhật ký cuộc gọi",
    x: 40,
    y: 40,
    width: 280,
    color: {header: "bg-purple-950/60 text-purple-300",border: "border-purple-500/50",badge: "text-purple-400 bg-purple-500/10"},
    columns: [
      {name: "id_call",type: "int",isPk: true},
      {name: "calling_time",type: "datetime2"},
      {name: "id_caller",type: "int",isFk: true},
      {name: "id_receiver",type: "int",isFk: true},
      {name: "duration_time",type: "float"},
    ],
  },
  {
    id: "Museum_log",
    name: "Museum_log",
    displayName: "Nhật ký bảo tàng",
    x: 720,
    y: 380,
    width: 280,
    color: {header: "bg-amber-950/60 text-amber-300",border: "border-amber-500/40",badge: "text-amber-400 bg-amber-500/10"},
    columns: [
      {name: "id_visit",type: "int",isPk: true},
      {name: "id_user",type: "int",isFk: true},
      {name: "id_room",type: "int",isFk: true},
      {name: "event_type",type: "varchar(20)"},
      {name: "recorded_at",type: "datetime2"},
    ],
  },
  {
    id: "witness_statement",
    name: "witness_statement",
    displayName: "Lời khai nhân chứng",
    x: 40,
    y: 380,
    width: 280,
    color: {header: "bg-purple-950/60 text-purple-300",border: "border-purple-500/50",badge: "text-purple-400 bg-purple-500/10"},
    columns: [
      {name: "id_statement",type: "int",isPk: true},
      {name: "id_witness",type: "int",isFk: true},
      {name: "statement_text",type: "nvarchar(max)"},
      {name: "recorded_at",type: "datetime2"},
    ],
  },
]

const RELATION_WIRES: RelationWire[] = [
  {id: "Room_id_museum",fromTable: "Museum",fromCol: "id_museum",toTable: "Room",toCol: "id_museum",label: "Museum.id_museum → Room.id_museum"},
  {id: "artifact_id_room",fromTable: "Room",fromCol: "id_room",toTable: "artifact",toCol: "id_room",label: "Room.id_room → artifact.id_room"},
  {id: "Theft_report_id_artifact",fromTable: "artifact",fromCol: "id_artifact",toTable: "Theft_report",toCol: "id_artifact",label: "artifact.id_artifact → Theft_report.id_artifact"},
  {id: "Carpark_id_museum",fromTable: "Museum",fromCol: "id_museum",toTable: "Carpark",toCol: "id_museum",label: "Museum.id_museum → Carpark.id_museum"},
  {id: "carPark_History_id_location",fromTable: "Carpark",fromCol: "id_carpark",toTable: "carPark_History",toCol: "id_location",label: "Carpark.id_carpark → carPark_History.id_location"},
  {id: "carPark_History_id_car",fromTable: "Car",fromCol: "id_car",toTable: "carPark_History",toCol: "id_car",label: "Car.id_car → carPark_History.id_car"},
  {id: "carRental_id_car",fromTable: "Car",fromCol: "id_car",toTable: "carRental",toCol: "id_car",label: "Car.id_car → carRental.id_car"},
  {id: "carRental_id_dealer",fromTable: "User",fromCol: "id_user",toTable: "carRental",toCol: "id_dealer",label: "User.id_user → carRental.id_dealer"},
  {id: "carRental_id_renter",fromTable: "User",fromCol: "id_user",toTable: "carRental",toCol: "id_renter",label: "User.id_user → carRental.id_renter"},
  {id: "carRental_id_driver",fromTable: "User",fromCol: "id_user",toTable: "carRental",toCol: "id_driver",label: "User.id_user → carRental.id_driver"},
  {id: "ATM_Transaction_person_id",fromTable: "User",fromCol: "id_user",toTable: "ATM_Transaction",toCol: "person_id",label: "User.id_user → ATM_Transaction.person_id"},
  {id: "ATM_Transaction_atm_id",fromTable: "ATM",fromCol: "id_atm",toTable: "ATM_Transaction",toCol: "atm_id",label: "ATM.id_atm → ATM_Transaction.atm_id"},
  {id: "Call_log_id_caller",fromTable: "User",fromCol: "id_user",toTable: "Call_log",toCol: "id_caller",label: "User.id_user → Call_log.id_caller"},
  {id: "Call_log_id_receiver",fromTable: "User",fromCol: "id_user",toTable: "Call_log",toCol: "id_receiver",label: "User.id_user → Call_log.id_receiver"},
  {id: "Museum_log_id_user",fromTable: "User",fromCol: "id_user",toTable: "Museum_log",toCol: "id_user",label: "User.id_user → Museum_log.id_user"},
  {id: "Museum_log_id_room",fromTable: "Room",fromCol: "id_room",toTable: "Museum_log",toCol: "id_room",label: "Room.id_room → Museum_log.id_room"},
  {id: "witness_statement_id_witness",fromTable: "User",fromCol: "id_user",toTable: "witness_statement",toCol: "id_witness",label: "User.id_user → witness_statement.id_witness"},
]

interface ErdVisualizerPanelProps {
  onInsertToEditor?: (text: string) => void
  reservePaneControls?: boolean
}

function fitDiagram(tables: TableNode[], width: number, height: number) {
  const left = Math.min(...tables.map((table) => table.x))
  const top = Math.min(...tables.map((table) => table.y))
  const right = Math.max(...tables.map((table) => table.x + table.width))
  const bottom = Math.max(...tables.map((table) => table.y + 36 + table.columns.length * 24))
  const zoom = Math.max(0.12, Math.min(1.4, (width - 32) / (right - left), (height - 32) / (bottom - top)))
  return {
    zoom,
    pan: { x: (width - (right - left) * zoom) / 2 - left * zoom, y: (height - (bottom - top) * zoom) / 2 - top * zoom },
  }
}

function readingView(table: TableNode, width: number) {
  const zoom = Math.max(0.85, Math.min(1, (width - 48) / table.width))
  return { zoom, pan: { x: 24 - table.x * zoom, y: 24 - table.y * zoom } }
}

export function ErdVisualizerPanel({ onInsertToEditor, reservePaneControls = true }: ErdVisualizerPanelProps) {
  const [tables, setTables] = useState<TableNode[]>(INITIAL_TABLES)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: -356, y: -356 })
  const [focusedTable, setFocusedTable] = useState("User")
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null)
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      if (width <= 32 || height <= 32) return
      const view = readingView(INITIAL_TABLES[0], width)
      setZoom(view.zoom)
      setPan(view.pan)
      observer.disconnect()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

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
    setTables(INITIAL_TABLES)
    setFocusedTable("User")
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const view = readingView(INITIAL_TABLES[0], rect.width)
    setZoom(view.zoom)
    setPan(view.pan)
  }

  const handleFocusTable = (id: string) => {
    const table = tables.find((node) => node.id === id)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!table || !rect) return
    const view = readingView(table, rect.width)
    setFocusedTable(id)
    setZoom(view.zoom)
    setPan(view.pan)
  }

  const handleZoom = (delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const nextZoom = Math.max(0.12, Math.min(1.4, zoom + delta))
    const center = { x: rect.width / 2, y: rect.height / 2 }
    setPan({ x: center.x - (center.x - pan.x) / zoom * nextZoom, y: center.y - (center.y - pan.y) / zoom * nextZoom })
    setZoom(nextZoom)
  }

  const handleFitView = (nodes = tables) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const view = fitDiagram(nodes, rect.width, rect.height)
    setZoom(view.zoom)
    setPan(view.pan)
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
      const forward = toT.x >= fromT.x
      const fromX = fromT.x + (forward ? fromT.width : 0)
      const fromY = fromT.y + 43 + fromT.columns.findIndex((col) => col.name === wire.fromCol) * 24

      // Điểm neo kết thúc (To Table)
      const toX = toT.x + (forward ? 0 : toT.width)
      const toY = toT.y + 43 + toT.columns.findIndex((col) => col.name === wire.toCol) * 24

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
    <div className="content-panel @container flex h-full flex-col rounded-xl border border-border/80 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Top Toolbar (SQL Server Style) */}
      <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/70 py-2 pl-3.5 ${reservePaneControls ? "pr-24" : "pr-3.5"}`}>
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground" title="Cấu trúc theo sqljs (2).sql">
            MuniDB <span className="font-normal text-muted-foreground">· {INITIAL_TABLES.length} bảng</span>
          </h2>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => handleFitView()}
            title="Vừa khung: hiển thị toàn bộ sơ đồ"
            className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
          >
            <Scan className="size-3.5" />
            <span>Vừa khung</span>
          </button>
          <div className="flex items-center rounded-lg border border-border/70 bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
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
              onClick={() => handleZoom(-0.1)}
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
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Legend & Hint Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-primary/[0.02] px-3.5 py-2 text-[11px] text-muted-foreground">
        <select
          aria-label="Đi đến bảng"
          value={focusedTable}
          onChange={(event) => handleFocusTable(event.target.value)}
          className="h-7 max-w-44 rounded-md border border-border/60 bg-[#111318] px-2 font-mono text-[11px] text-foreground outline-none focus:border-primary"
        >
          {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
        </select>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Key className="size-3 text-amber-400" />
            <span>Khóa chính</span>
          </span>
          <span className="flex items-center gap-1">
            <InfinityIcon className="size-3 text-cyan-400" />
            <span>Khóa ngoại</span>
          </span>
        </div>
        <span className="hidden text-muted-foreground/70 @min-[700px]:inline">
          Kéo nền để di chuyển · Kéo tiêu đề để sắp xếp bảng
        </span>
      </div>

      {/* Interactive 2D Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            width: "2000px",
            height: "1500px",
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
                <g key={wire.id} data-relation={wire.id} className="cursor-pointer pointer-events-auto">
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
                  data-table={table.name}
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
                    <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold">
                      <Table2 className="size-3.5 shrink-0" />
                      <span className="truncate" title={table.name}>{table.name}</span>
                    </div>
                    <span
                      className={`max-w-28 shrink-0 truncate rounded px-1 text-[9px] font-mono font-medium ${table.color.badge}`}
                      title={table.displayName}
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
                          ) : !col.isFk ? (
                            <span className="size-3 block shrink-0" />
                          ) : null}
                          {col.isFk && (
                            <span className="rounded bg-cyan-500/20 px-0.5 text-[8px] font-bold text-cyan-400 border border-cyan-500/30">
                              FK
                            </span>
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
