import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ImageViewerModalProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ src, title, onClose }) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const minScale = 0.5;
  const maxScale = 5.0;
  const step = 0.25;

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(maxScale, Number((prev + step).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(minScale, Number((prev - step).toFixed(2)));
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleToggleFit = useCallback(() => {
    if (scale !== 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.deltaY < 0) {
      // Zoom in
      setScale((prev) => Math.min(maxScale, Number((prev + 0.15).toFixed(2))));
    } else {
      // Zoom out
      setScale((prev) => {
        const next = Math.max(minScale, Number((prev - 0.15).toFixed(2)));
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile / tablets
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const percentage = Math.round(scale * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 24, 0.85)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        userSelect: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ece9d8)',
          border: '2px solid var(--border-strong, #002244)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 1px 1px 0 #fff',
          width: '95vw',
          maxWidth: '1280px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Retro Title Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-primary, #003366)',
            color: '#ffffff',
            padding: '6px 12px',
            borderBottom: '2px solid var(--border-strong, #002244)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-display, "MS Sans Serif", Tahoma, sans-serif)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              KÍNH LÚP THÁM TỬ — {title.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={onClose}
            style={{
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: '#c00',
              color: '#fff',
              border: '1px solid #700',
              cursor: 'pointer',
            }}
            title="Đóng cửa sổ (Esc)"
          >
            ĐÓNG
          </button>
        </div>

        {/* Toolbar with Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--color-surface-elevated, #dfdcc8)',
            borderBottom: '1px solid var(--border-color, #7f9db9)',
            fontSize: '12px',
          }}
        >
          {/* Zoom Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={handleZoomIn}
              disabled={scale >= maxScale}
              title="Phóng to (+)"
              style={{ padding: '3px 9px', fontWeight: 700, fontSize: '13px' }}
            >
              Phóng to
            </button>
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={handleZoomOut}
              disabled={scale <= minScale}
              title="Thu nhỏ (-)"
              style={{ padding: '3px 9px', fontWeight: 700, fontSize: '13px' }}
            >
              Thu nhỏ
            </button>
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={handleResetZoom}
              title="Đặt lại kích thước gốc 100% (R)"
              style={{ padding: '3px 9px', fontSize: '12px' }}
            >
              100% (Gốc)
            </button>
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={handleToggleFit}
              title="Chuyển đổi phóng to / vừa khung (Nhấp đúp ảnh)"
              style={{ padding: '3px 9px', fontSize: '12px' }}
            >
              {scale === 1 ? 'Phóng đại 2X' : 'Vừa màn hình'}
            </button>

            {/* Current Zoom Level Badge */}
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: 'var(--color-surface, #fff)',
                border: '1px solid var(--border-color, #999)',
                marginLeft: '4px',
                minWidth: '55px',
                textAlign: 'center',
              }}
            >
              {percentage}%
            </span>
          </div>

          {/* Quick instructions / tips */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-muted, #555)',
              fontStyle: 'italic',
            }}
          >
            Cuộn chuột để Zoom • Kéo chuột để di chuyển • Nhấp đúp để phóng to 2X • Nhấn ESC để đóng
          </div>
        </div>

        {/* Zoomable Image Viewport Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleToggleFit}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#1a1f29',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in',
          }}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            <img
              src={src}
              alt={title}
              draggable={false}
              style={{
                maxWidth: '90vw',
                maxHeight: '76vh',
                objectFit: 'contain',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                imageRendering: 'auto',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Footer info bar */}
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: 'var(--color-surface, #ece9d8)',
            borderTop: '1px solid var(--border-color, #7f9db9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--color-ink, #222)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <span>VẬT CHỨNG: {title}</span>
          <span>TỶ LỆ HIỆN TẠI: {percentage}% (Tối đa: 500%)</span>
        </div>
      </div>
    </div>
  );
};
