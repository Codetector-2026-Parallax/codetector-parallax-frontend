import React, { useState } from 'react';
import { loginWithCredentials } from '../api';
import type { ThemeMode } from '../theme/theme';
import type { AuthUser } from '../types';

interface AuthLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter your assigned team email/username and password.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const result = await loginWithCredentials(username, password);
    setSubmitting(false);
    if (result.ok) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="cp-page-frame">
      <div className="cp-frame-inner">
        {/* Top Banner */}
        <header className="cp-top-banner">
          <div className="cp-banner-left">
            <div className="cp-logo-tile">
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
          <div className="cp-banner-center">
            <h1 className="cp-event-title">
              <span className="cp-event-title-gold">CODETECTOR PARALLAX</span>
              {' — '}CASE RECORD
            </h1>
          </div>
          <div className="cp-banner-right">
            <button
              type="button"
              className="cp-theme-toggle"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} display mode`}
              aria-label="Toggle display mode"
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
            </button>
            <span className="cp-phone-callout">JSCLUB · EST. 1996 EDITION</span>
          </div>
        </header>

        {/* Login Stage (Matches ../metabase AuthLogin UI) */}
        <main className="cp-login-stage">
          <div className="cp-login-catalog-grid">
            {/* Left Column: Singular Antique Gold CTA Panel (components.cta-block-gold) */}
            <section className="cp-cta-block-gold">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <span
                    className="cp-sticker-badge"
                    style={{ boxShadow: '2px 2px 0px var(--color-frame-ink)' }}
                  >
                    CONTEST TERMINAL
                  </span>
                  <img
                    src="/assets/xhieupeo.jpg"
                    alt="JSClub Seal"
                    className="cp-cert-seal"
                  />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: 900,
                    lineHeight: 1.05,
                    margin: '0 0 10px 0',
                    textTransform: 'uppercase',
                  }}
                >
                  CODETECTOR PARALLAX
                </h2>
                <p style={{ margin: '0 0 12px 0' }}>
                  Welcome to the official JSClub Case Record &amp; Investigation
                  workstation. Sign in with your assigned Metabase team
                  credentials to inspect the <strong>MuniDB_Hard</strong> ERD,
                  request real-life hints, and submit case answers.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--border-strong)',
                  padding: '10px 12px',
                  fontSize: '12px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-ink)',
                    marginBottom: '4px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '3px',
                  }}
                >
                  CONTEST ENFORCEMENT RULES
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>8 sequential investigation questions (Q1 → Q8).</li>
                  <li>Maximum 6 attempts per question (-3 pts per retry).</li>
                  <li>Instant database answer verification on submit.</li>
                  <li>Single-use &ldquo;Nước cờ mạo hiểm&rdquo; unlocked from Q4.</li>
                </ul>
              </div>
            </section>

            {/* Right Column: Sign-In Form Card */}
            <section className="cp-auth-card">
              <div className="cp-eyebrow-olive">TEAM SIGN-IN</div>

              {errorMsg && (
                <div className="cp-schema-notice-error" role="alert">
                  <strong>Authentication Error:</strong> {errorMsg}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <label
                  htmlFor="cp-login-identifier"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    TEAM EMAIL ADDRESS OR USERNAME
                  </span>
                  <input
                    id="cp-login-identifier"
                    type="text"
                    className="cp-input"
                    placeholder="team01@contest.local"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </label>

                <label
                  htmlFor="cp-login-password"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    PASSWORD
                  </span>
                  <input
                    id="cp-login-password"
                    type="password"
                    className="cp-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="cp-btn-primary"
                  style={{ padding: '10px 16px', marginTop: '4px' }}
                  disabled={submitting}
                >
                  {submitting
                    ? 'AUTHENTICATING TERMINAL...'
                    : '▶ ENTER CASE RECORD'}
                </button>
              </form>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--color-ink)',
                  opacity: 0.78,
                }}
              >
                Accounts are issued by BTC. Need credentials assistance? Contact
                the JSClub Proctor Desk.
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
