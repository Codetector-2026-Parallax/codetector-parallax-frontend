import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ContestErdMetadata, ErdTableMetadata } from '../types';

interface ErdCanvasProps {
  erd: ContestErdMetadata | null;
  loading: boolean;
  highlightedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
  caseRelatedTables?: string[];
  activeQuestionNumber?: number;
  unlockedDatabases?: string[];
  activeDatabase?: string;
  onSelectDatabase?: (db: string) => void;
  style?: React.CSSProperties;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DomainKey = 'ALL' | 'MUSEUM' | 'PARKING' | 'PERSON' | 'FINANCE' | 'INCIDENT' | 'TRANSIT' | 'AVIATION';

const NODE_WIDTH = 248;
const HEADER_HEIGHT = 28;
const ROW_HEIGHT = 22;

/**
 * Deterministic investigative layout for the Parallax chapter tables and legacy MuniDB tables.
 * Strictly mirrors domain groupings from assets/erd.pdf:
 * - Chặng 1: Ngân hàng & Giao dịch (Col 0), Xe thuê & Hồ sơ người (Col 1), Cuộc gọi & Bảo tàng (Col 2)
 * - Chặng 2: Sự cố & Dấu vết mạng (Col 3), Đặt chỗ & Phương tiện (Col 4), Chuyến bay & Vé (Col 5)
 */
const PREFERRED_TABLE_GRID: Record<
  string,
  { col: number; row: number; domain: Exclude<DomainKey, 'ALL'> }
> = {
  // Page 1 (Chặng 1) Domain 1: Ngân hàng và Giao dịch
  bankbranch: { col: 0, row: 0, domain: 'FINANCE' },
  atm: { col: 0, row: 1, domain: 'FINANCE' },
  atmtransaction: { col: 0, row: 2, domain: 'FINANCE' },

  // Page 1 (Chặng 1) Domain 2: Xe thuê và Hồ sơ người
  rentalagency: { col: 1, row: 0, domain: 'PERSON' },
  vehicle: { col: 1, row: 1, domain: 'PERSON' },
  rental: { col: 1, row: 2, domain: 'PERSON' },
  person: { col: 1, row: 3, domain: 'PERSON' },

  // Page 1 (Chặng 1) Domain 3: Cuộc gọi và Bảo tàng
  phonecall: { col: 2, row: 0, domain: 'MUSEUM' },
  callevidence: { col: 2, row: 1, domain: 'MUSEUM' },
  museumvisit: { col: 2, row: 2, domain: 'MUSEUM' },
  museumevent: { col: 2, row: 3, domain: 'MUSEUM' },

  // Page 2 (Chặng 2) Domain 1: C4 Sự cố và Dấu vết mạng
  powercontrollog: { col: 3, row: 0, domain: 'INCIDENT' },
  ipsession: { col: 3, row: 1, domain: 'INCIDENT' },
  networkregistration: { col: 3, row: 2, domain: 'INCIDENT' },

  // Page 2 (Chặng 2) Domain 2: C5 Đặt chỗ và Phương tiện
  booking: { col: 4, row: 0, domain: 'TRANSIT' },
  journeyleg: { col: 4, row: 1, domain: 'TRANSIT' },
  vehiclelog: { col: 4, row: 2, domain: 'TRANSIT' },

  // Page 2 (Chặng 2) Domain 3: C7 và C8 Chuyến bay và Vé
  flight: { col: 5, row: 0, domain: 'AVIATION' },
  ticket: { col: 5, row: 1, domain: 'AVIATION' },
  flightpassenger: { col: 5, row: 2, domain: 'AVIATION' },
  ticketevent: { col: 5, row: 3, domain: 'AVIATION' },

  // Legacy MuniDB fallback mappings
  museum: { col: 0, row: 3, domain: 'MUSEUM' },
  room: { col: 0, row: 4, domain: 'MUSEUM' },
  artifact: { col: 0, row: 5, domain: 'MUSEUM' },
  theft_report: { col: 0, row: 6, domain: 'MUSEUM' },
  museum_ticket: { col: 1, row: 4, domain: 'MUSEUM' },
  museum_log: { col: 1, row: 5, domain: 'MUSEUM' },
  carpark: { col: 1, row: 6, domain: 'PARKING' },
  camera_device: { col: 1, row: 7, domain: 'PARKING' },
  carpark_history: { col: 1, row: 8, domain: 'PARKING' },
  witness_statement: { col: 2, row: 4, domain: 'PERSON' },
  driver_license: { col: 2, row: 5, domain: 'PERSON' },
  car: { col: 2, row: 6, domain: 'PERSON' },
  carrental: { col: 2, row: 7, domain: 'PERSON' },
  sim_registration: { col: 3, row: 3, domain: 'FINANCE' },
  call_log: { col: 3, row: 4, domain: 'FINANCE' },
  bank_account: { col: 3, row: 5, domain: 'FINANCE' },
  bank_card: { col: 3, row: 6, domain: 'FINANCE' },
  data_dictionary: { col: 3, row: 7, domain: 'FINANCE' },
};

export const ErdCanvas: React.FC<ErdCanvasProps> = ({
  erd,
  loading,
  highlightedTable,
  onSelectTable,
  unlockedDatabases,
  activeDatabase,
  onSelectDatabase,
  style,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(0.72);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });

  // Stage panning state
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Individual table node dragging state
  const [customOffsets, setCustomOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const didDragNodeRef = useRef<boolean>(false);
  const [draggingNode, setDraggingNode] = useState<{
    key: string;
    startMouseX: number;
    startMouseY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // UX Controls
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isolateConnected, setIsolateConnected] = useState(false);
  const [copiedSqlText, setCopiedSqlText] = useState<string | null>(null);

  const tables = erd?.tables ?? [];
  const relationships = erd?.relationships ?? [];

  // Calculate base positions + custom user drag offsets for all chapter tables
  const basePositions = useMemo(() => {
    const map = new Map<string, NodePosition>();
    const tableKeys = new Set(tables.map((t) => t.tableName.toLowerCase()));
    const isChapter2 = tableKeys.has('powercontrollog') || tableKeys.has('booking') || tableKeys.has('flight') || tableKeys.has('ticket');

    if (isChapter2) {
      // Deterministic 4-column x 3-row grid strictly matching assets/erd.pdf Page 2
      const c2Grid: Record<string, { col: number; row: number }> = {
        museumevent: { col: 0, row: 0 },
        powercontrollog: { col: 1, row: 0 },
        ipsession: { col: 2, row: 0 },
        networkregistration: { col: 3, row: 0 },

        booking: { col: 0, row: 1 },
        journeyleg: { col: 1, row: 1 },
        vehicle: { col: 2, row: 1 },
        vehiclelog: { col: 3, row: 1 },

        flight: { col: 0, row: 2 },
        ticket: { col: 1, row: 2 },
        flightpassenger: { col: 2, row: 2 },
        ticketevent: { col: 3, row: 2 },
      };

      const colOffsets = [28, 308, 588, 868];
      const rowY = [28, 250, 500];

      for (const tbl of tables) {
        const key = tbl.tableName.toLowerCase();
        const pref = c2Grid[key] ?? { col: 0, row: 3 };
        const nodeHeight = HEADER_HEIGHT + tbl.columns.length * ROW_HEIGHT + 6;
        const x = colOffsets[Math.min(pref.col, colOffsets.length - 1)];
        const y = rowY[pref.row] ?? 740;

        map.set(key, {
          x,
          y,
          width: NODE_WIDTH,
          height: nodeHeight,
        });
      }
      return map;
    }

    // Default Chặng 1 / Legacy layout
    const colOffsets = [28, 308, 588, 868];
    const colHeights = [28, 28, 28, 28];

    const sortedTables = [...tables].sort((a, b) => {
      const posA = PREFERRED_TABLE_GRID[a.tableName.toLowerCase()];
      const posB = PREFERRED_TABLE_GRID[b.tableName.toLowerCase()];
      const colA = posA ? Math.min(posA.col, colOffsets.length - 1) : 3;
      const colB = posB ? Math.min(posB.col, colOffsets.length - 1) : 3;
      if (colA !== colB) return colA - colB;
      return (posA?.row ?? 99) - (posB?.row ?? 99);
    });

    for (const tbl of sortedTables) {
      const key = tbl.tableName.toLowerCase();
      const pref = PREFERRED_TABLE_GRID[key];
      const colIdx = pref ? Math.min(pref.col, colOffsets.length - 1) : 3;
      const nodeHeight = HEADER_HEIGHT + tbl.columns.length * ROW_HEIGHT + 6;
      const x = colOffsets[colIdx] ?? 868;
      const y = colHeights[colIdx];

      map.set(key, {
        x,
        y,
        width: NODE_WIDTH,
        height: nodeHeight,
      });

      colHeights[colIdx] = y + nodeHeight + 24;
    }

    return map;
  }, [tables]);

  const positions = useMemo(() => {
    const map = new Map<string, NodePosition>();
    basePositions.forEach((pos, key) => {
      const custom = customOffsets[key];
      map.set(key, {
        ...pos,
        x: custom ? custom.x : pos.x,
        y: custom ? custom.y : pos.y,
      });
    });
    return map;
  }, [basePositions, customOffsets]);

  const activeTableLower = highlightedTable?.toLowerCase() ?? null;

  // Determine 1-hop connected neighbor tables for the currently selected table
  const connectedNeighbors = useMemo(() => {
    const neighbors = new Set<string>();

    if (!activeTableLower) {
      return neighbors;
    }

    for (const rel of relationships) {
      const src = rel.sourceTable.toLowerCase();
      const tgt = rel.targetTable.toLowerCase();
      if (src === activeTableLower) {
        neighbors.add(tgt);
      } else if (tgt === activeTableLower) {
        neighbors.add(src);
      }
    }

    return neighbors;
  }, [activeTableLower, relationships]);

  // Fit entire ERD diagram cleanly into the current viewport dimensions
  const handleFitView = useCallback(() => {
    if (!stageRef.current || positions.size === 0) {
      setZoom(0.68);
      setPan({ x: 20, y: 20 });
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    let maxRight = 1180;
    let maxBottom = 950;
    positions.forEach((p) => {
      if (p.x + p.width > maxRight) maxRight = p.x + p.width;
      if (p.y + p.height > maxBottom) maxBottom = p.y + p.height;
    });

    const pad = 40;
    const scaleX = (rect.width - pad) / maxRight;
    const scaleY = (rect.height - pad) / maxBottom;
    const nextZoom = Math.min(1.15, Math.max(0.36, Number(Math.min(scaleX, scaleY).toFixed(2))));
    const nextPanX = Math.max(12, Math.round((rect.width - maxRight * nextZoom) / 2));
    const nextPanY = Math.max(12, Math.round((rect.height - maxBottom * nextZoom) / 2));

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [positions]);

  const handleIncreaseZoom = () => setZoom((z) => Math.min(1.8, Number((z + 0.12).toFixed(2))));
  const handleDecreaseZoom = () => setZoom((z) => Math.max(0.32, Number((z - 0.12).toFixed(2))));

  const handleResetLayout = () => {
    setCustomOffsets({});
    setIsolateConnected(false);
    onSelectTable(null);
    setTimeout(() => handleFitView(), 20);
  };

  // Zoom-toward-cursor on mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    const delta = e.deltaY < 0 ? 0.09 : -0.09;
    const nextZoom = Math.min(1.8, Math.max(0.32, Number((zoom + delta).toFixed(2))));

    setZoom(nextZoom);
    setPan({
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDraggingStage(true);
    setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const rawDx = e.clientX - draggingNode.startMouseX;
      const rawDy = e.clientY - draggingNode.startMouseY;
      if (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3) {
        didDragNodeRef.current = true;
      }
      const dx = rawDx / zoom;
      const dy = rawDy / zoom;
      setCustomOffsets((prev) => ({
        ...prev,
        [draggingNode.key]: {
          x: Math.round(draggingNode.origX + dx),
          y: Math.round(draggingNode.origY + dy),
        },
      }));
      return;
    }
    if (!isDraggingStage) return;
    setPan({
      x: e.clientX - dragOrigin.x,
      y: e.clientY - dragOrigin.y,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingStage(false);
    setDraggingNode(null);
  };

  const handleCopySql = (sqlText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(sqlText).catch(() => {});
    setCopiedSqlText(sqlText);
    setTimeout(() => {
      setCopiedSqlText((prev) => (prev === sqlText ? null : prev));
    }, 2000);
  };

  return (
    <section
      className={`cp-erd-column ${isFullscreen ? 'cp-erd-column-fullscreen' : ''}`}
      style={style}
      aria-label="MuniDB_Hard Interactive ERD Viewer"
    >
      {/* Synchronized Primary ERD Ribbon Header (Matches Metabase Ribbon Header) */}
      <div
        className="cp-ribbon-header"
        style={{
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          minWidth: 0,
          gap: '6px',
          padding: '6px 10px',
          alignItems: 'center',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: ERD Title, Number of Tables & Key Legend */}
        <div
          className="cp-ribbon-header-left"
          style={{
            minWidth: 0,
            flex: '1 1 auto',
            flexShrink: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="cp-ribbon-swatch" style={{ flexShrink: 0 }} />
          <h2
            className="cp-ribbon-title"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flexShrink: 1,
              fontSize: '14px',
            }}
          >
            ERD SCHEMA
          </h2>
          <span
            className="cp-sticker-badge cp-erd-tables-badge"
            style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '2px 5px', fontSize: '10px' }}
            title="Live introspected database tables"
          >
            {erd?.numberOfTables ?? 0} TABLES
          </span>

          {unlockedDatabases && unlockedDatabases.length > 1 ? (
            <select
              value={activeDatabase || ''}
              onChange={(e) => onSelectDatabase?.(e.target.value)}
              className="cp-input"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                height: '24px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-ink)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="Select ERD Database"
              title="Chuyển đổi database trên sơ đồ ERD"
            >
              {unlockedDatabases.map((db) => (
                <option key={db} value={db}>
                  🗄️ {db.toUpperCase()}
                </option>
              ))}
            </select>
          ) : activeDatabase ? (
            <span
              className="cp-sticker-badge cp-erd-active-db-badge"
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
              }}
              title="Database hiện tại của câu hỏi"
            >
              🗄️ {activeDatabase.toUpperCase()}
            </span>
          ) : null}

          <div
            className="cp-erd-key-legend"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-ui)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-muted)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <span className="cp-key-badge cp-key-pk">PK</span>
            <span className="cp-key-badge cp-key-fk">FK</span>
            <span
              className="cp-key-badge"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--color-muted)',
              }}
              title="Khóa duy nhất (Unique)"
            >
              UQ
            </span>
            <span style={{ fontSize: '9px', opacity: 0.9, marginLeft: '4px' }} title="Nét liền: Khóa ngoại SQL">
              ── SQL FK
            </span>
            <span
              style={{ fontSize: '9px', opacity: 0.9, marginLeft: '3px', color: '#f59e0b' }}
              title="Nét đứt: Đối chiếu nghiệp vụ theo erd.pdf"
            >
              ┄ LOGICAL
            </span>
          </div>

          {copiedSqlText && (
            <span
              className="cp-sticker-badge cp-sticker-badge-success"
              style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '2px 5px', fontSize: '10px' }}
            >
              COPIED: {copiedSqlText}
            </span>
          )}
        </div>

        {/* Right: Isolate Connected + Zoom Controls + Fit + Reset + Fullscreen */}
        <div
          className="cp-ribbon-actions"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
          }}
        >
          <button
            type="button"
            className={`cp-mini-tag-btn ${isolateConnected ? 'cp-mini-tag-btn-accent' : ''}`}
            onClick={() => setIsolateConnected((prev) => !prev)}
            title="Dim unrelated tables and highlight only direct FK neighbors"
            style={{ padding: '3px 6px', fontSize: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            ISOLATE
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleDecreaseZoom}
            title="Zoom Out"
            aria-label="Zoom out"
            style={{ padding: '3px 6px', fontSize: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            −
          </button>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              minWidth: '34px',
              textAlign: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleIncreaseZoom}
            title="Zoom In"
            aria-label="Zoom in"
            style={{ padding: '3px 6px', fontSize: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            +
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleFitView}
            title="Fit all 22 tables into view"
            style={{ padding: '3px 6px', fontSize: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            FIT
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleResetLayout}
            title="Reset dragged table positions"
            style={{ padding: '3px 6px', fontSize: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            RESET
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            style={{ padding: '3px 7px', fontSize: '10px', fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap' }}
            onClick={() => setIsFullscreen((prev) => !prev)}
            title="Toggle Fullscreen ERD mode"
          >
            {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
          </button>
        </div>
      </div>

      {/* Active Database Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--color-muted)',
              letterSpacing: '0.4px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            ACTIVE DATABASE:
          </span>
          <span
            className="cp-sticker-badge"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            🗄️ {erd?.databaseName || activeDatabase || '—'}
          </span>
        </div>
        {loading && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-primary)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Đang tải schema...
          </span>
        )}
      </div>

      {/* Interactive Pan & Zoom ERD Stage */}
      <div
        ref={stageRef}
        className="cp-erd-stage"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (!didDragNodeRef.current && highlightedTable) {
            onSelectTable(null);
          }
        }}
      >
        {/* Bottom-Left Helper Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            zIndex: 20,
            pointerEvents: 'none',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--border-color)',
            padding: '4px 8px',
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--color-muted)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100% - 24px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          DRAG CANVAS TO PAN · DRAG TABLE HEADER TO ARRANGE · SCROLL TO ZOOM · CLICK COLUMN TO COPY SQL
        </div>

        {loading && (
          <div style={{ padding: '24px', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
            LOADING MUNIDB_HARD 22-TABLE SCHEMA...
          </div>
        )}

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '1750px',
            height: '1350px',
            position: 'relative',
          }}
        >
          {/* SVG Relationship Lines Layer */}
          <svg
            width="1750"
            height="1350"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <defs>
              <marker
                id="erd-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--erd-line)" />
              </marker>
              <marker
                id="erd-arrow-active"
                markerWidth="9"
                markerHeight="9"
                refX="8"
                refY="4.5"
                orient="auto"
              >
                <path d="M0,0 L9,4.5 L0,9 Z" fill="var(--erd-line-active)" />
              </marker>
              <marker
                id="erd-arrow-logical"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#d97706" />
              </marker>
              <marker
                id="erd-arrow-logical-active"
                markerWidth="9"
                markerHeight="9"
                refX="8"
                refY="4.5"
                orient="auto"
              >
                <path d="M0,0 L9,4.5 L0,9 Z" fill="#fbbf24" />
              </marker>
            </defs>

            {relationships.map((rel, idx) => {
              const srcKey = rel.sourceTable.toLowerCase();
              const tgtKey = rel.targetTable.toLowerCase();
              const srcPos = positions.get(srcKey);
              const tgtPos = positions.get(tgtKey);
              if (!srcPos || !tgtPos) return null;

              const srcTbl = tables.find((t) => t.tableName.toLowerCase() === srcKey);
              const tgtTbl = tables.find((t) => t.tableName.toLowerCase() === tgtKey);
              const srcColIdx = Math.max(
                0,
                srcTbl?.columns.findIndex(
                  (c) => c.columnName.toLowerCase() === rel.sourceColumn.toLowerCase()
                ) ?? 0
              );
              const tgtColIdx = Math.max(
                0,
                tgtTbl?.columns.findIndex(
                  (c) => c.columnName.toLowerCase() === rel.targetColumn.toLowerCase()
                ) ?? 0
              );

              const y1 = srcPos.y + HEADER_HEIGHT + srcColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const y2 = tgtPos.y + HEADER_HEIGHT + tgtColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

              const srcLeft = srcPos.x;
              const srcRight = srcPos.x + srcPos.width;
              const tgtLeft = tgtPos.x;
              const tgtRight = tgtPos.x + tgtPos.width;

              let pathD = '';
              let midX = 0;
              let midY = 0;

              // Self-referential loop (e.g. Ticket.PreviousTicketId -> Ticket)
              if (srcKey === tgtKey) {
                const loopOffset = 36 + ((idx * 8) % 20);
                const loopX = srcRight + loopOffset;
                pathD = `M ${srcRight} ${y1} L ${loopX} ${y1} L ${loopX} ${y2} L ${srcRight} ${y2}`;
                midX = loopX + 10;
                midY = Math.round((y1 + y2) / 2);
              }
              // Case 1: Source table is to the left of Target table (clear horizontal gap)
              else if (srcRight + 16 <= tgtLeft) {
                midX = Math.round((srcRight + tgtLeft) / 2);
                midY = Math.round((y1 + y2) / 2);
                if (Math.abs(y1 - y2) < 2) {
                  pathD = `M ${srcRight} ${y1} L ${tgtLeft} ${y2}`;
                } else {
                  pathD = `M ${srcRight} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${tgtLeft} ${y2}`;
                }
              }
              // Case 2: Source table is to the right of Target table (clear horizontal gap)
              else if (srcLeft >= tgtRight + 16) {
                midX = Math.round((srcLeft + tgtRight) / 2);
                midY = Math.round((y1 + y2) / 2);
                if (Math.abs(y1 - y2) < 2) {
                  pathD = `M ${srcLeft} ${y1} L ${tgtRight} ${y2}`;
                } else {
                  pathD = `M ${srcLeft} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${tgtRight} ${y2}`;
                }
              }
              // Case 3: Same column or horizontal overlap (tables stacked vertically)
              else {
                const stubOffset = 24 + ((idx * 14) % 48);
                const loopX = Math.max(srcRight, tgtRight) + stubOffset;
                pathD = `M ${srcRight} ${y1} L ${loopX} ${y1} L ${loopX} ${y2} L ${tgtRight} ${y2}`;
                midX = loopX;
                midY = Math.round((y1 + y2) / 2);
              }

              const isLogical = rel.relationshipType === 'LOGICAL';
              const isRelatedToHighlight =
                activeTableLower === srcKey || activeTableLower === tgtKey;

              const strokeColor = isLogical
                ? (isRelatedToHighlight ? '#fbbf24' : '#d97706')
                : (isRelatedToHighlight ? 'var(--erd-line-active)' : 'var(--erd-line)');
              const strokeWidth = isRelatedToHighlight ? 2.5 : (isLogical ? 1.6 : 1.35);
              const markerEnd = isLogical
                ? (isRelatedToHighlight ? 'url(#erd-arrow-logical-active)' : 'url(#erd-arrow-logical)')
                : (isRelatedToHighlight ? 'url(#erd-arrow-active)' : 'url(#erd-arrow)');

              const badgeText = rel.cardinality || (isLogical ? 'LOGICAL' : '1:N');
              const badgeWidth = Math.max(26, badgeText.length * 6 + 8);
              const tooltipText = `${rel.relationshipType === 'LOGICAL' ? '[Nét đứt / Đối chiếu nghiệp vụ]' : '[Nét liền / Khóa ngoại SQL]'} ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn} (${rel.cardinality || '1:N'})${rel.description ? `\n${rel.description}` : ''}`;

              return (
                <g key={`${rel.constraintName}-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isLogical ? '6 4' : undefined}
                    strokeLinejoin="miter"
                    strokeMiterlimit={4}
                    strokeLinecap="square"
                    opacity={
                      activeTableLower && !isRelatedToHighlight
                        ? 0.18
                        : 0.94
                    }
                    markerEnd={markerEnd}
                  >
                    <title>{tooltipText}</title>
                  </path>

                  {/* Cardinality Badge on Relationship Connector */}
                  {(!activeTableLower || isRelatedToHighlight) && midX > 0 && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      opacity={activeTableLower && !isRelatedToHighlight ? 0.3 : 1}
                      style={{ pointerEvents: 'auto', cursor: 'help' }}
                    >
                      <title>{tooltipText}</title>
                      <rect
                        x={-badgeWidth / 2}
                        y={-8}
                        width={badgeWidth}
                        height={16}
                        rx={3}
                        fill={isRelatedToHighlight ? '#0f172a' : '#1e293b'}
                        stroke={isLogical ? '#f59e0b' : (isRelatedToHighlight ? 'var(--erd-line-active)' : '#475569')}
                        strokeWidth={1}
                        strokeDasharray={isLogical ? '2 2' : undefined}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        fontSize={8.5}
                        fontWeight={800}
                        fontFamily="var(--font-mono)"
                        fill={isLogical ? '#fbbf24' : (isRelatedToHighlight ? '#38bdf8' : '#cbd5e1')}
                      >
                        {badgeText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Table Nodes Layer */}
          {tables.map((tbl: ErdTableMetadata) => {
            const key = tbl.tableName.toLowerCase();
            const pos = positions.get(key);
            if (!pos) return null;

            const isHighlighted = activeTableLower === key;
            const isNeighbor = connectedNeighbors.has(key);

            const shouldDim =
              isolateConnected &&
              activeTableLower !== null &&
              !isHighlighted &&
              !isNeighbor;

            return (
              <div
                key={tbl.tableName}
                className={[
                  'cp-erd-table-node',
                  isHighlighted ? 'cp-erd-table-node-highlighted' : '',
                  !isHighlighted && isNeighbor ? 'cp-erd-table-node-neighbor' : '',
                  shouldDim ? 'cp-erd-table-node-dimmed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${NODE_WIDTH}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (didDragNodeRef.current) {
                    didDragNodeRef.current = false;
                    return;
                  }
                  onSelectTable(isHighlighted ? null : tbl.tableName);
                }}
              >
                <div
                  className="cp-erd-table-header"
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    didDragNodeRef.current = false;
                    setDraggingNode({
                      key,
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      origX: pos.x,
                      origY: pos.y,
                    });
                  }}
                  title="Drag header to reposition table · Click to highlight table"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>⊞ {tbl.tableName}</span>
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--color-muted)' }}>
                    {tbl.columns.length} cols
                  </span>
                </div>

                <div>
                  {tbl.columns.map((col) => {
                    return (
                      <div
                        key={col.columnName}
                        className="cp-erd-col-row"
                        onClick={(e) =>
                          handleCopySql(`${tbl.tableName}.${col.columnName}`, e)
                        }
                        title={
                          col.description
                            ? `${col.columnName}: ${col.description} (Click to copy ${tbl.tableName}.${col.columnName})`
                            : col.references
                              ? `FK -> ${col.references.foreignTable}.${col.references.foreignColumn} (Click to copy ${tbl.tableName}.${col.columnName})`
                              : `Click to copy ${tbl.tableName}.${col.columnName}`
                        }
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          {col.isPrimaryKey && (
                            <span className="cp-key-badge cp-key-pk">PK</span>
                          )}
                          {col.isForeignKey && (
                            <span className="cp-key-badge cp-key-fk">FK</span>
                          )}
                          <span
                            style={{
                              fontWeight: col.isPrimaryKey ? 700 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {col.columnName}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--color-muted)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {col.dataType
                            .replace('character varying', 'varchar')
                            .replace('timestamp without time zone', 'timestamp')
                            .replace('double precision', 'float8')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

