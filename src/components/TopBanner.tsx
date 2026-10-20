import React, { useEffect, useRef, useState } from 'react';
import type { ThemeMode } from '../theme/theme';
import type { AuthUser, TeamProgressInfo, TeamScoreSummary } from '../types';

interface TopBannerProps {
  user: AuthUser;
  progress?: TeamProgressInfo | null;
  scoreSummary?: TeamScoreSummary | null;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  user,
  progress,
  scoreSummary,
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

      {/* Center: Codetector Parallax - Case Record */}
      <div className="cp-banner-center">
        <h1 className="cp-event-title">
          <span className="cp-event-title-gold">CODETECTOR PARALLAX</span>
          {' — '}
          {user.role === 'ADMIN' ? 'ADMIN CONTROL DESK' : 'CASE RECORD'}
        </h1>
        {user.role === 'USER' && scoreSummary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cp-sticker-badge" title="Live Team Progress">
              <span>PROGRESS: {progress?.progressText ?? '0/8'}</span>
            </div>
            <div
              className="cp-sticker-badge"
              style={{
                borderColor: 'var(--badge-error-border)',
                backgroundColor: 'rgba(217, 83, 79, 0.12)',
                color: 'var(--badge-error-text)',
                fontWeight: 700,
              }}
              title="Total point deductions from retries, hints, and penalties"
            >
              <span>⚠️ PENALTY: -{scoreSummary.totalPenalty}</span>
            </div>
            <div
              className="cp-sticker-badge"
              style={{
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                fontWeight: 700,
                padding: '3px 10px',
              }}
              title="Current score held by the team"
            >
              <span>🏆 SCORE: {scoreSummary.score ?? scoreSummary.finalScore} PTS</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Theme Toggle + User Profile Icon -> AUTHENTICATED TEAM, LOGOUT */}
      <div className="cp-banner-right" ref={menuRef}>
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
                <span>Display Mode:</span>
                <strong>{theme === 'dark' ? 'DARK EDITION' : 'LIGHT EDITION'}</strong>
              </div>
              {user.role === 'USER' && scoreSummary && (
                <>
                  <div className="cp-profile-meta-row">
                    <span>Case Progress:</span>
                    <strong>{progress?.progressText ?? '0/8'}</strong>
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
                      🏆 {scoreSummary.score ?? scoreSummary.finalScore} pts
                    </strong>
                  </div>
                </>
              )}

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
                ⎋ LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

