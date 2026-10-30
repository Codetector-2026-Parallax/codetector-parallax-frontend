import React, { useEffect, useRef, useState } from 'react';
import { getSqlEditorUrl, getStoredMetabaseSession } from '../api';
import type { ThemeMode } from '../theme/theme';
import type { AuthUser, TeamProgressInfo, TeamScoreSummary } from '../types';

interface TopBannerProps {
  user: AuthUser;
  progress?: TeamProgressInfo | null;
  scoreSummary?: TeamScoreSummary | null;
  activeContestId?: string;
  onOpenContestSelect?: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  user,
  progress,
  scoreSummary,
  activeContestId,
  onOpenContestSelect,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const teamDisplayName = user.teamName || user.username || 'TEAM';
  const initials = teamDisplayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleOpenSqlEditor = () => {
    const baseUrl = getSqlEditorUrl();
    const session = getStoredMetabaseSession();
    const targetUrl = session ? `${baseUrl}?session=${encodeURIComponent(session)}` : baseUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="cp-top-banner">
      {/* Left: JSClub Logo */}
      <div className="cp-banner-left" style={{ minWidth: 0, flexShrink: 0 }}>
        <div className="cp-logo-tile" title="JSClub — Japanese Software Engineers Club">
          <img
            src="/assets/codetector-logo.png"
            alt="JSClub Logo"
            className="cp-logo-img"
          />
        </div>
        <div className="cp-brand-tag">
          <span className="cp-brand-club">JSCLUB CONTEST</span>
          <span className="cp-brand-sub">Japanese Software Engineers Club</span>
        </div>
      </div>

      {/* Center: Codetector Parallax - Case Record */}
      <div className="cp-banner-center" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <h1
          className="cp-event-title"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
        >
          <span className="cp-event-title-gold">CODETECTOR PARALLAX</span>
          {' — '}
          {user.role === 'ADMIN' ? 'ADMIN CONTROL DESK' : 'CASE RECORD'}
        </h1>
        {user.role === 'USER' && scoreSummary && (
          <div
            className="cp-banner-score-badges"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              flexWrap: 'nowrap',
              minWidth: 0,
            }}
          >
            <div className="cp-sticker-badge" title="Live Team Progress">
              <span>PROGRESS: {progress?.progressText ?? '0/3'}</span>
            </div>
            <div
              className="cp-sticker-badge cp-sticker-badge-error"
              title="Total point deductions from retries, hints, and penalties"
            >
              <span>PENALTY: -{Math.max(0, Number(scoreSummary.totalPenalty) || 0)}</span>
            </div>
            <div
              className="cp-sticker-badge cp-sticker-badge-score"
              title="Current score held by the team"
            >
              <span>{Number(scoreSummary.score ?? scoreSummary.finalScore) || 0} PTS</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Theme Toggle + User Profile Icon -> AUTHENTICATED TEAM, LOGOUT */}
      <div className="cp-banner-right" ref={menuRef} style={{ minWidth: 0, flexShrink: 0 }}>
        {onOpenContestSelect && (
          <button
            type="button"
            className="cp-theme-toggle"
            onClick={onOpenContestSelect}
            title="Bấm để chuyển đổi đấu trường Huấn Luyện hoặc Chính Thức"
            style={{
              borderColor: activeContestId === 'training' ? 'var(--glass)' : 'var(--color-primary)',
              color: activeContestId === 'training' ? 'var(--glass)' : 'var(--color-primary-text)',
              backgroundColor: activeContestId === 'training' ? 'var(--tint-slate)' : 'var(--tint-brass)',
            }}
          >
            <span>{activeContestId === 'training' ? 'HUẤN LUYỆN' : 'CHÍNH THỨC'}</span>
            <span style={{ fontSize: '9px', opacity: 0.8 }}>[ĐỔI]</span>
          </button>
        )}

        <button
          type="button"
          className="cp-theme-toggle"
          onClick={handleOpenSqlEditor}
          title="Mở SQL Editor (Metabase) — Phiên đăng nhập được đồng bộ tự động"
          data-testid="open-sql-editor-button"
          style={{
            borderColor: 'var(--border-mid)',
            backgroundColor: 'var(--tint-paper)',
          }}
        >
          <span>🗄️</span>
          <span>SQL EDITOR</span>
          <span style={{ fontSize: '9px', opacity: 0.8 }}>↗</span>
        </button>

        <button
          type="button"
          className="cp-theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} display mode`}
          aria-label="Toggle display mode"
          data-testid="theme-toggle-button"
        >
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span>{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
        </button>

        <button
          type="button"
          className="cp-profile-trigger"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="User profile menu"
          data-testid="profile-dropdown-trigger"
        >
          <span className="cp-profile-avatar">{initials}</span>
          <span>{teamDisplayName}</span>
          <span style={{ fontSize: '10px' }}>{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen && (
          <div
            className="cp-profile-dropdown"
            role="menu"
            data-testid="profile-dropdown-menu"
          >
            <div className="cp-profile-dropdown-header">
              <div className="cp-profile-team-label">AUTHENTICATED TEAM</div>
              <div className="cp-profile-team-name" data-testid="profile-team-name">
                {teamDisplayName}
              </div>
              <div className="cp-profile-email">{user.email}</div>
            </div>
            <div className="cp-profile-dropdown-body">
              <div className="cp-profile-meta-row">
                <span>Role:</span>
                <strong>{user.role === 'ADMIN' ? 'ADMIN' : 'CONTESTANT'}</strong>
              </div>
              <div className="cp-profile-meta-row">
                <span>Theme:</span>
                <strong>{theme === 'dark' ? 'MIDNIGHT INVESTIGATION' : 'VINTAGE INVESTIGATION ARCHIVE'}</strong>
              </div>
              {user.role === 'USER' && scoreSummary && (
                <>
                  <div className="cp-profile-meta-row">
                    <span>Case Progress:</span>
                    <strong>{progress?.progressText ?? '0/3'}</strong>
                  </div>
                  <div className="cp-profile-meta-row">
                    <span>Total Penalty:</span>
                    <strong style={{ color: 'var(--badge-error-text)' }}>
                      -{scoreSummary.totalPenalty} pts
                    </strong>
                  </div>
                  <div className="cp-profile-meta-row">
                    <span>Current Score:</span>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '13px' }}>
                      {scoreSummary.score ?? scoreSummary.finalScore} pts
                    </strong>
                  </div>
                </>
              )}

              {onOpenContestSelect && (
                <button
                  type="button"
                  className="cp-btn-secondary"
                  style={{ width: '100%', marginBottom: '6px' }}
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenContestSelect();
                  }}
                >
                  ĐỔI ĐẤU TRƯỜNG
                </button>
              )}

              <button
                type="button"
                className="cp-btn-secondary"
                style={{ width: '100%', marginBottom: '6px' }}
                onClick={() => {
                  setDropdownOpen(false);
                  handleOpenSqlEditor();
                }}
              >
                🗄️ MỞ SQL EDITOR ↗
              </button>

              <button
                type="button"
                className="cp-btn-primary"
                style={{ width: '100%', marginTop: '4px' }}
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                data-testid="logout-button"
              >
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

