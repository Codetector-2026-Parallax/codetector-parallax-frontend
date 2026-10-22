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
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DomainKey = 'ALL' | 'MUSEUM' | 'PARKING' | 'PERSON' | 'FINANCE';

const NODE_WIDTH = 248;
const HEADER_HEIGHT = 28;
const ROW_HEIGHT = 22;

/**
 * Deterministic investigative layout for the Parallax chapter tables and legacy MuniDB tables.
 */
const PREFERRED_TABLE_GRID: Record<
  string,
  { col: number; row: number; domain: Exclude<DomainKey, 'ALL'> }
> = {
  // Parallax Chapter 1, 2, 3 tables
  vehicle: { col: 0, row: 0, domain: 'MUSEUM' },
  museumvisit: { col: 0, row: 1, domain: 'MUSEUM' },
  museumevent: { col: 0, row: 2, domain: 'MUSEUM' },

  person: { col: 1, row: 0, domain: 'PERSON' },
  phonecall: { col: 1, row: 1, domain: 'PERSON' },
  callevidence: { col: 1, row: 2, domain: 'PERSON' },

  rental: { col: 2, row: 0, domain: 'PERSON' },
  rentalagency: { col: 2, row: 1, domain: 'PERSON' },

  bankbranch: { col: 3, row: 0, domain: 'FINANCE' },
  atm: { col: 3, row: 1, domain: 'FINANCE' },
  atmtransaction: { col: 3, row: 2, domain: 'FINANCE' },

  // Legacy MuniDB fallback mappings
  museum: { col: 0, row: 3, domain: 'MUSEUM' },
  room: { col: 0, row: 4, domain: 'MUSEUM' },
  artifact: { col: 0, row: 5, domain: 'MUSEUM' },
  theft_report: { col: 0, row: 6, domain: 'MUSEUM' },
  museum_ticket: { col: 1, row: 3, domain: 'MUSEUM' },
  museum_log: { col: 1, row: 4, domain: 'MUSEUM' },
  carpark: { col: 1, row: 5, domain: 'PARKING' },
  camera_device: { col: 1, row: 6, domain: 'PARKING' },
  carpark_history: { col: 1, row: 7, domain: 'PARKING' },
  witness_statement: { col: 2, row: 2, domain: 'PERSON' },
  driver_license: { col: 2, row: 3, domain: 'PERSON' },
  car: { col: 2, row: 4, domain: 'PERSON' },
  carrental: { col: 2, row: 5, domain: 'PERSON' },
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

  // Calculate base positions + custom user drag offsets for all 22 tables
  const basePositions = useMemo(() => {
    const map = new Map<string, NodePosition>();
    const colOffsets = [28, 326, 624, 922, 1220];
    const colHeights = [28, 28, 28, 28, 28];

    const sortedTables = [...tables].sort((a, b) => {
      const posA = PREFERRED_TABLE_GRID[a.tableName.toLowerCase()];
      const posB = PREFERRED_TABLE_GRID[b.tableName.toLowerCase()];
      const colA = posA?.col ?? 4;
      const colB = posB?.col ?? 4;
      if (colA !== colB) return colA - colB;
      return (posA?.row ?? 99) - (posB?.row ?? 99);
    });

    for (const tbl of sortedTables) {
      const key = tbl.tableName.toLowerCase();
      const pref = PREFERRED_TABLE_GRID[key];
      const colIdx = pref ? pref.col : 4;
      const nodeHeight = HEADER_HEIGHT + tbl.columns.length * ROW_HEIGHT + 6;
      const x = colOffsets[colIdx] ?? 1220;
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
      aria-label="MuniDB_Hard Interactive ERD Viewer"
    >
      {/* Synchronized Primary ERD Ribbon Header (Matches Metabase Ribbon Header) */}
      <div className="cp-ribbon-header">
        {/* Left: ERD Title, Number of Tables & Key Legend */}
        <div className="cp-ribbon-header-left">
          <span className="cp-ribbon-swatch" />
          <h2 className="cp-ribbon-title">ERD SCHEMA</h2>
          <span className="cp-sticker-badge" title="Live introspected MuniDB_Hard tables">
            {erd?.numberOfTables ?? 22} TABLES
          </span>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-ui)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-muted)',
            }}
          >
            <span className="cp-key-badge cp-key-pk">PK</span>
            <span className="cp-key-badge cp-key-fk">FK</span>
          </div>

          {copiedSqlText && (
            <span className="cp-sticker-badge cp-sticker-badge-success">
              ✓ COPIED: {copiedSqlText}
            </span>
          )}
        </div>

        {/* Right: Isolate Connected + Zoom Controls + Fit + Reset + Fullscreen */}
        <div className="cp-ribbon-actions">
          <button
            type="button"
            className={`cp-mini-tag-btn ${isolateConnected ? 'cp-mini-tag-btn-accent' : ''}`}
            onClick={() => setIsolateConnected((prev) => !prev)}
            title="Dim unrelated tables and highlight only direct FK neighbors"
          >
            🎯 ISOLATE
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleDecreaseZoom}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            −
          </button>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              minWidth: '38px',
              textAlign: 'center',
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
          >
            +
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleFitView}
            title="Fit all 22 tables into view"
          >
            ⊡ FIT
          </button>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={handleResetLayout}
            title="Reset dragged table positions"
          >
            ↺ RESET
          </button>
          <button
            type="button"
            className="cp-btn-primary"
            style={{ padding: '4px 8px', fontSize: '10px' }}
            onClick={() => setIsFullscreen((prev) => !prev)}
            title="Toggle Fullscreen ERD mode"
          >
            {isFullscreen ? '✕ EXIT' : '⛶ FULLSCREEN'}
          </button>
        </div>
      </div>

      {/* Chapter Database Selection Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: '0.4px',
            whiteSpace: 'nowrap',
          }}
        >
          CHAPTER DB:
        </span>
        {[
          { id: 'parallax_c1', shortName: 'C1', title: 'Chương 1: Hiện Trường & Phương Tiện', qRange: 'Câu 1' },
          { id: 'parallax_c2', shortName: 'C2', title: 'Chương 2: Nhân Thân & Liên Lạc', qRange: 'Câu 2-4' },
          { id: 'parallax_c3', shortName: 'C3', title: 'Chương 3: Sự Kiện & Dòng Tiền', qRange: 'Câu 5-8' },
        ].map((ch) => {
          const isUnlocked = unlockedDatabases ? unlockedDatabases.includes(ch.id) : ch.id === 'parallax_c1';
          const isCurrent = (activeDatabase || erd?.databaseName || 'parallax_c1') === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelectDatabase && onSelectDatabase(ch.id)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: isCurrent ? 800 : 600,
                padding: '4px 8px',
                border: isCurrent
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--border-color)',
                backgroundColor: isCurrent
                  ? 'var(--color-card)'
                  : isUnlocked
                    ? 'transparent'
                    : 'var(--color-canvas)',
                color: isCurrent
                  ? 'var(--color-primary)'
                  : isUnlocked
                    ? 'var(--color-ink)'
                    : 'var(--color-muted)',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.55,
                borderRadius: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              title={
                isUnlocked
                  ? `${ch.title} (${ch.qRange}) — Xem ERD ${ch.id}`
                  : `🔒 Khóa: Hoàn thành hoặc hết lượt câu hỏi trước để mở ${ch.title} (${ch.qRange})`
              }
            >
              <span>{isUnlocked ? (isCurrent ? '📂' : '📁') : '🔒'}</span>
              <span>{ch.shortName} ({ch.qRange})</span>
            </button>
          );
        })}
        {loading && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-primary)',
              marginLeft: 'auto',
            }}
          >
            ⏳ Đang tải schema...
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
            width: '1500px',
            height: '1300px',
            position: 'relative',
          }}
        >
          {/* SVG Relationship Lines Layer */}
          <svg
            width="1500"
            height="1300"
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

              const srcRight = srcPos.x + srcPos.width;
              const tgtRight = tgtPos.x + tgtPos.width;

              let x1 = srcRight;
              let x2 = tgtPos.x;
              if (srcPos.x > tgtRight) {
                x1 = srcPos.x;
                x2 = tgtRight;
              } else if (Math.abs(srcPos.x - tgtPos.x) < 20) {
                x1 = srcRight;
                x2 = tgtRight;
              }

              const dx = Math.max(44, Math.abs(x2 - x1) * 0.45);
              const c1x = x1 >= srcRight ? x1 + dx : x1 - dx;
              const c2x = x2 <= tgtPos.x ? x2 - dx : x2 + dx;

              const isRelatedToHighlight =
                activeTableLower === srcKey || activeTableLower === tgtKey;

              return (
                <path
                  key={`${rel.constraintName}-${idx}`}
                  d={`M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={
                    isRelatedToHighlight ? 'var(--erd-line-active)' : 'var(--erd-line)'
                  }
                  strokeWidth={isRelatedToHighlight ? 2.6 : 1.35}
                  opacity={
                    activeTableLower && !isRelatedToHighlight
                      ? 0.2
                      : 0.92
                  }
                  markerEnd={
                    isRelatedToHighlight
                      ? 'url(#erd-arrow-active)'
                      : 'url(#erd-arrow)'
                  }
                />
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

