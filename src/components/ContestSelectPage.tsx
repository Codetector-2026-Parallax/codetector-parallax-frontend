import React, { useEffect, useState } from 'react';
import {
  fetchAdminContests,
  fetchContests,
  getApiUrl,
  getStoredToken,
  setActiveContestId,
  stopAdminContest,
  toggleAdminContest,
} from '../api';
import type { ThemeMode } from '../theme/theme';
import type { AuthUser, ContestInfo } from '../types';

interface ContestSelectPageProps {
  user: AuthUser;
  currentContestId: string;
  onSelectContest: (contestId: string) => void;
  onBackToWorkstation?: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const DEFAULT_CONTESTS: ContestInfo[] = [
  {
    id: 'training',
    name: 'training',
    title: 'Đấu Trường Huấn Luyện SQL',
    description:
      '3 câu hỏi truy vấn dữ liệu SQL thuần túy trên cơ sở dữ liệu munihard.sql (bãi đỗ xe, cây ATM, nhật ký bảo tàng).',
    target_database: 'contestdb',
    is_active: false,
  },
  {
    id: 'official',
    name: 'official',
    title: 'Đại Án Parallax (Chính Thức)',
    description:
      '3 chương điều tra đại án vụ trộm bảo vật tại bảo tàng Aureum trên các phân hệ cơ sở dữ liệu parallax_c1 đến c3.',
    target_database: 'parallax_c1',
    is_active: false,
  },
];

export const ContestSelectPage: React.FC<ContestSelectPageProps> = ({
  user,
  currentContestId,
  onSelectContest,
  onBackToWorkstation,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [contests, setContests] = useState<ContestInfo[]>(DEFAULT_CONTESTS);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmStopContest, setConfirmStopContest] = useState<ContestInfo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user.role === 'ADMIN';
  const teamDisplayName = user.teamName || user.username || 'TEAM';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadContests = async () => {
    try {
      const data = isAdmin ? await fetchAdminContests() : await fetchContests();
      if (Array.isArray(data) && data.length > 0) {
        setContests(data);
      }
    } catch (err: any) {
      console.warn('[CONTEST SELECT] Could not fetch contests, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();

    // Real-time SSE updates only for contest status changes on the selection page
    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      const token = getStoredToken();
      const sseUrl = getApiUrl(token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events');
      es = new EventSource(sseUrl);
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type === 'CONTEST_STATUS_CHANGED') {
            loadContests();
          }
        } catch {
          // ignore
        }
      };
    }

    return () => {
      es?.close();
    };
  }, [isAdmin]);

  const handleChoose = (contestId: string, isActive: boolean) => {
    if (!isActive && !isAdmin) {
      setError('Đấu trường này hiện đang tạm dừng hoặc chưa mở cửa.');
      return;
    }
    setActiveContestId(contestId);
    onSelectContest(contestId);
  };

  const handleToggleContest = async (contestId: string, currentIsActive?: boolean) => {
    setActionLoading(true);
    try {
      const targetContest = contests.find((c) => c.id === contestId);
      const nextIsActive = typeof currentIsActive === 'boolean' ? !currentIsActive : (targetContest ? !targetContest.is_active : undefined);
      const updated = await toggleAdminContest(contestId, nextIsActive);
      showToast(`Đã ${updated.is_active ? 'BẬT (Mở cửa)' : 'TẮT (Tạm dừng)'} đấu trường "${updated.title}".`);
      await loadContests();
    } catch (err: any) {
      showToast(err?.message || 'Không thể thay đổi trạng thái đấu trường');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteStopContest = async () => {
    if (!confirmStopContest) return;
    setActionLoading(true);
    try {
      const updated = await stopAdminContest(confirmStopContest.id);
      showToast(`✓ Đã DỪNG & ĐẶT LẠI toàn bộ tiến độ của đấu trường "${updated.title}".`);
      setConfirmStopContest(null);
      await loadContests();
    } catch (err: any) {
      showToast(err?.message || 'Không thể dừng đấu trường');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="cp-page-frame">
      <div className="cp-frame-inner">
        {/* Top Banner (Synchronized with Codetector Parallax Dell 1996 Style) */}
        <header className="cp-top-banner">
          <div className="cp-banner-left">
            <div className="cp-logo-tile" title="JSClub — Japanese Software Engineering Club">
              <img
                src="/assets/codetector-logo.png"
                alt="JSClub Logo"
                className="cp-logo-img"
              />
            </div>
            <div className="cp-brand-tag">
              <span className="cp-brand-club">JSCLUB CONTEST</span>
              <span className="cp-brand-sub">Japanese Software Club</span>
            </div>
          </div>

          <div className="cp-banner-center">
            <h1 className="cp-event-title">
              <span className="cp-event-title-gold">CODETECTOR PARALLAX</span>
              {' — '}
              {isAdmin ? 'QUẢN TRỊ ĐẤU TRƯỜNG' : 'LỰA CHỌN ĐẤU TRƯỜNG'}
            </h1>
          </div>

          <div className="cp-banner-right">
            <button
              type="button"
              className="cp-theme-toggle"
              onClick={onToggleTheme}
              title={`Chuyển sang chế độ ${theme === 'dark' ? 'Sáng (Light)' : 'Tối (Dark)'}`}
              aria-label="Toggle display mode"
              data-testid="theme-toggle-button"
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
            </button>

            <div
              className="cp-sticker-badge"
              style={{
                textTransform: 'none',
                boxShadow: '1px 1px 0px var(--color-frame-ink)',
              }}
              title={isAdmin ? 'Tài khoản Quản trị viên' : 'Đội thi đã đăng nhập'}
            >
              <span style={{ color: 'var(--color-muted)' }}>
                {isAdmin ? 'Ban tổ chức: ' : 'Đội thi: '}
              </span>
              <strong style={{ color: 'var(--color-primary-text)' }}>
                {teamDisplayName}
              </strong>
            </div>

            <button
              type="button"
              className="cp-btn-secondary"
              onClick={onLogout}
              style={{ padding: '5px 10px', fontSize: '11px' }}
              title="Đăng xuất khỏi phiên làm việc"
            >
              ⎋ ĐĂNG XUẤT
            </button>
          </div>
        </header>

        {/* Stage Content: Dell 1996 Brutalist Minimalist Catalog Grid */}
        <main
          className="cp-login-stage"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '36px 20px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-canvas)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Page Header Dossier Panel */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--border-strong)',
                borderTop: '3px solid var(--color-primary)',
                boxShadow: '3px 3px 0px var(--color-frame-ink)',
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span
                  className="cp-sticker-badge"
                  style={{ boxShadow: '2px 2px 0px var(--color-frame-ink)' }}
                >
                  {isAdmin ? 'HỆ THỐNG ĐIỀU HÀNH BAN TỔ CHỨC' : 'HỆ THỐNG ĐẤU TRƯỜNG CODETECTOR'}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                  }}
                >
                  EST. 1996 · CASE RECORD ARCHIVE
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  fontWeight: 900,
                  color: 'var(--color-ink)',
                  textTransform: 'uppercase',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                {isAdmin ? 'LỰA CHỌN ĐẤU TRƯỜNG QUẢN TRỊ' : 'LỰA CHỌN PHÂN HỆ THI ĐẤU'}
              </h2>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--color-muted)',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                {isAdmin
                  ? 'Chọn phân hệ đấu trường để vào bảng điều hành trực tiếp (Manh mối thực tế, Bảng xếp hạng, Nhật ký nộp bài, Đáp án DB). Bạn cũng có thể Bắt đầu, Tạm dừng hoặc Dừng & Đặt lại tiến độ của từng đấu trường ngay tại đây.'
                  : 'Vui lòng lựa chọn đấu trường thi đấu để hệ thống tự động đồng bộ hồ sơ vụ án, nạp bộ câu hỏi và cấp quyền truy vấn tương ứng trên SQL Editor.'}
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div
                style={{
                  backgroundColor: 'var(--badge-error-bg)',
                  border: '1px solid var(--badge-error-border)',
                  color: 'var(--badge-error-text)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '2px 2px 0px var(--color-frame-ink)',
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 2-Column Brutalist Arena Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '20px',
              }}
            >
              {contests.map((c) => {
                const isSelected = currentContestId === c.id;
                const isTraining = c.id === 'training';
                const canEnter = c.is_active || isAdmin;

                return (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--border-strong)',
                      borderTop: `3px solid ${isTraining ? 'var(--glass)' : 'var(--color-primary)'}`,
                      boxShadow: isSelected
                        ? '4px 4px 0px var(--color-frame-ink)'
                        : '2px 2px 0px var(--color-frame-ink)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: canEnter ? 1 : 0.65,
                      position: 'relative',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      {/* Synchronized Ribbon Header */}
                      <div
                        className="cp-ribbon-header"
                        style={{
                          borderBottom: '1px solid var(--border-strong)',
                          backgroundColor: isSelected
                            ? 'var(--color-surface-elevated)'
                            : 'var(--color-surface)',
                        }}
                      >
                        <div className="cp-ribbon-header-left">
                          <span
                            className="cp-ribbon-swatch"
                            style={{
                              backgroundColor: isTraining
                                ? 'var(--glass)'
                                : 'var(--color-primary)',
                            }}
                          />
                          <span
                            className="cp-sticker-badge"
                            style={{
                              fontSize: '10px',
                              boxShadow: '1px 1px 0px var(--color-frame-ink)',
                            }}
                          >
                            {c.id.toUpperCase()}
                          </span>
                          <strong
                            className="cp-ribbon-title"
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '12px',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                            }}
                          >
                            {isTraining
                              ? 'HUẤN LUYỆN SQL (MUNIHARD)'
                              : 'ĐẠI ÁN PARALLAX (OFFICIAL)'}
                          </strong>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            className={`cp-sticker-badge ${
                              c.is_active
                                ? 'cp-sticker-badge-success'
                                : 'cp-sticker-badge-error'
                            }`}
                          >
                            {c.is_active ? '● MỞ CỬA' : '✕ TẠM DỪNG'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div style={{ padding: '18px 20px' }}>
                        <h3
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '17px',
                            fontWeight: 900,
                            color: 'var(--color-ink)',
                            margin: '0 0 8px 0',
                            lineHeight: '1.2',
                          }}
                        >
                          {c.title}
                        </h3>

                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--color-muted)',
                            lineHeight: '1.5',
                            margin: '0 0 16px 0',
                          }}
                        >
                          {c.description}
                        </p>

                        {/* Inset Sunken Well (Architecture Specs & Live Metrics) */}
                        <div
                          style={{
                            backgroundColor: 'var(--color-surface-sunken)',
                            border: '1px solid var(--border-color)',
                            padding: '12px 14px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            marginBottom: '16px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--color-muted)' }}>
                              DATABASE ĐÍCH:
                            </span>
                            <strong style={{ color: 'var(--color-primary-text)' }}>
                              {c.target_database}
                            </strong>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--color-muted)' }}>
                              CẤU TRÚC ĐỀ:
                            </span>
                            <span
                              style={{
                                color: 'var(--color-ink)',
                                fontWeight: 600,
                              }}
                            >
                              {isTraining
                                ? '3 Câu hỏi SQL thuần túy'
                                : '3 Chương điều tra đại án'}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--color-muted)' }}>
                              SỐ CÂU HỎI TRONG DB:
                            </span>
                            <span style={{ color: 'var(--color-ink)' }}>
                              {c.questionCount ?? 3} câu
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--color-muted)' }}>
                              ĐỘI THI ĐÃ NỘP BÀI:
                            </span>
                            <span style={{ color: 'var(--color-ink)' }}>
                              {c.activeTeamCount ?? 0} đội
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--color-muted)' }}>
                              TRUY VẬN SQL / METABASE:
                            </span>
                            <span
                              style={{
                                color: c.is_active ? 'var(--success)' : 'var(--evidence-red-text)',
                                fontWeight: 600,
                              }}
                            >
                              {c.is_active ? 'Cho phép truy cập' : 'Bị khóa (403)'}
                            </span>
                          </div>
                        </div>

                        {/* Admin Arena Control Row */}
                        {isAdmin && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '14px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleContest(c.id)}
                              disabled={actionLoading}
                              className={c.is_active ? 'cp-btn-secondary' : 'cp-btn-primary'}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: '11px',
                                letterSpacing: '0.5px',
                              }}
                              title={
                                c.is_active
                                  ? 'Tạm dừng đấu trường (chặn truy cập thí sinh nhưng giữ nguyên tiến độ)'
                                  : 'Mở cửa đấu trường cho thí sinh truy cập'
                              }
                            >
                              {c.is_active ? '⏸ TẠM DỪNG' : '▶ BẬT / TIẾP TỤC'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmStopContest(c)}
                              disabled={actionLoading}
                              className="cp-btn-danger"
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: '11px',
                                letterSpacing: '0.5px',
                              }}
                              title="Dừng đấu trường và xóa sạch toàn bộ tiến độ của các đội thi"
                            >
                              ⏹ DỪNG &amp; RESET
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Entry Action Button */}
                    <div style={{ padding: '0 20px 20px 20px' }}>
                      <button
                        type="button"
                        disabled={!canEnter && !isAdmin}
                        onClick={() => handleChoose(c.id, c.is_active)}
                        className="cp-btn-primary"
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          fontSize: '12px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {isAdmin
                          ? `🛠️ QUẢN TRỊ ${c.title.toUpperCase()} →`
                          : canEnter
                          ? `VÀO ${c.title.toUpperCase()} →`
                          : 'ĐẤU TRƯỜNG ĐANG TẠM DỪNG'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back to Workstation if navigating from TopBanner switch button */}
            {onBackToWorkstation && (
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={onBackToWorkstation}
                  className="cp-btn-secondary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '12px',
                  }}
                >
                  ← QUAY LẠI BÀN LÀM VIỆC HIỆN TẠI
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal for STOPPING Contest (Dell 1996 Brutalist Style) */}
      {confirmStopContest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--scrim-modal, rgba(0, 0, 0, 0.75))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--border-strong)',
              boxShadow: '6px 6px 0px var(--color-frame-ink)',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <div
              className="cp-ribbon-header"
              style={{
                borderBottom: '1px solid var(--border-strong)',
                backgroundColor: 'var(--badge-error-bg)',
                color: 'var(--badge-error-text)',
              }}
            >
              <div className="cp-ribbon-header-left">
                <span
                  className="cp-ribbon-swatch"
                  style={{ backgroundColor: 'var(--evidence-red)' }}
                />
                <strong
                  className="cp-ribbon-title"
                  style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 900 }}
                >
                  ⚠️ XÁC NHẬN DỪNG &amp; ĐẶT LẠI TIẾN ĐỘ
                </strong>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--color-ink)',
                  lineHeight: '1.6',
                  margin: '0 0 16px 0',
                }}
              >
                Bạn có chắc chắn muốn <strong>DỪNG</strong> đấu trường{' '}
                <strong>{confirmStopContest.title}</strong>?
              </p>

              <div
                style={{
                  backgroundColor: 'var(--color-surface-sunken)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--evidence-red-text)',
                  lineHeight: '1.6',
                  marginBottom: '20px',
                }}
              >
                ● Đấu trường sẽ chuyển sang trạng thái <strong>TẠM DỪNG / ĐÃ DỪNG</strong>.<br />
                ● <strong>XÓA TOÀN BỘ</strong> lịch sử nộp bài, điểm số, manh mối và tiến độ giải án của tất cả các đội thi.<br />
                ● Quyền truy vấn cơ sở dữ liệu trên SQL Editor / Metabase sẽ bị thu hồi ngay lập tức.<br />
                ● Các đội thi đang trong đấu trường sẽ tự động bị điều hướng về màn hình chọn đấu trường.<br />
                ● Thao tác này <strong>KHÔNG THỂ HOÀN TÁC</strong>!
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="cp-btn-secondary"
                  onClick={() => setConfirmStopContest(null)}
                  disabled={actionLoading}
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  className="cp-btn-danger"
                  onClick={handleExecuteStopContest}
                  disabled={actionLoading}
                  style={{ boxShadow: '2px 2px 0px var(--color-frame-ink)' }}
                >
                  {actionLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN DỪNG & XÓA TIẾN ĐỘ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="cp-toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
