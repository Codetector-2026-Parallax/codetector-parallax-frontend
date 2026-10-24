import React, { useCallback, useEffect, useState } from 'react';
import {
  adjustTeamScore,
  confirmAdminHintDelivery,
  fetchAdminHints,
  fetchAdminLeaderboard,
  fetchAdminQuestions,
  fetchAdminSubmissions,
  solveAdminHintRequest,
  updateAdminQuestionAnswers,
  getStoredToken,
  getApiUrl,
} from '../api';
import type {
  AdminHintRequestRecord,
  AdminQuestionConfig,
  AdminSubmissionRecord,
  LeaderboardEntry,
} from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'HINTS' | 'LEADERBOARD' | 'SUBMISSIONS' | 'ANSWERS'
  >('HINTS');

  const [hints, setHints] = useState<AdminHintRequestRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmissionRecord[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters for Submissions
  const [subQuestionFilter, setSubQuestionFilter] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('');

  // Score Adjustment Modal State
  const [adjustTeam, setAdjustTeam] = useState<LeaderboardEntry | null>(null);
  const [adjType, setAdjType] = useState<
    | 'DIRECT_BONUS'
    | 'DIRECT_PENALTY'
    | 'UNDERGROUND_DEAL'
    | 'CHEAT_PENALTY'
    | 'RISK_MOVE_PENALTY'
  >('DIRECT_PENALTY');
  const [adjPoints, setAdjPoints] = useState<number>(10);
  const [adjReason, setAdjReason] = useState<string>('');
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  // Answer Key Editing State
  const [editingQ, setEditingQ] = useState<number | null>(null);
  const [editingAnswersText, setEditingAnswersText] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadAllAdminData = useCallback(
    async (silent: boolean = false) => {
      if (!silent) setLoading(true);
      try {
        const [hintsData, lbData, subsData, qData] = await Promise.all([
          fetchAdminHints(),
          fetchAdminLeaderboard(),
          fetchAdminSubmissions({
            questionNumber: subQuestionFilter ? Number(subQuestionFilter) : undefined,
            status: subStatusFilter || undefined,
          }),
          fetchAdminQuestions(),
        ]);
        setHints(hintsData.hintRequests);
        setLeaderboard(lbData.leaderboard);
        setSubmissions(subsData.submissions);
        setQuestions(qData.questions);
      } catch (err: any) {
        if (!silent) {
          showToast(err?.message || 'Error loading admin data');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [subQuestionFilter, subStatusFilter]
  );

  useEffect(() => {
    loadAllAdminData(false);
    const timer = setInterval(() => loadAllAdminData(true), 4000);

    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      const token = getStoredToken();
      const ssePath = token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events';
      es = new EventSource(getApiUrl(ssePath));
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type && payload.type !== 'CONNECTED') {
            loadAllAdminData(true);
          }
        } catch {
          // ignore heartbeat/non-json
        }
      };
    }

    return () => {
      clearInterval(timer);
      es?.close();
    };
  }, [loadAllAdminData]);

  const pendingHintsCount = hints.filter((h) => h.status === 'REQUESTED').length;

  const handleConfirmDelivery = async (hintId: number, delivered: boolean) => {
    try {
      await confirmAdminHintDelivery(
        hintId,
        delivered,
        delivered
          ? 'Real-life hint delivered to team (confirmed by Admin)'
          : 'Hint marked as NOT delivered (penalty waived)'
      );
      showToast(
        delivered
          ? `Confirmed delivery for Hint Request #${hintId}.`
          : `Marked Hint Request #${hintId} as NOT delivered (penalty waived).`
      );
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update hint delivery status');
    }
  };

  const handleAdjustScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTeam || !adjReason.trim() || adjPoints <= 0) return;
    setAdjSubmitting(true);
    try {
      await adjustTeamScore(adjustTeam.teamId, {
        adjustmentType: adjType,
        points: Number(adjPoints),
        reason: adjReason.trim(),
      });
      showToast(`Updated score for ${adjustTeam.teamName}.`);
      setAdjustTeam(null);
      setAdjReason('');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to adjust score');
    } finally {
      setAdjSubmitting(false);
    }
  };

  const handleSaveAnswerKeys = async (questionNumber: number) => {
    const parsed = editingAnswersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length === 0) {
      showToast('Please provide at least one valid answer line.');
      return;
    }
    try {
      await updateAdminQuestionAnswers(questionNumber, parsed);
      showToast(`Saved database answer keys for Question ${questionNumber}.`);
      setEditingQ(null);
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update answer keys');
    }
  };

  return (
    <main className="cp-admin-shell" aria-label="Minimalist Admin Operations Dashboard">
      {/* Minimalist Top Sub-Navigation */}
      <nav className="cp-admin-nav" aria-label="Admin Section Navigation">
        <div className="cp-icon-tab-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'HINTS'}
            className={`cp-icon-tab-btn ${activeTab === 'HINTS' ? 'cp-icon-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('HINTS')}
          >
            <span>💡 HINT REQUESTS (REAL-LIFE)</span>
            {pendingHintsCount > 0 && (
              <span className="cp-key-badge cp-key-pk">{pendingHintsCount} NEW</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'LEADERBOARD'}
            className={`cp-icon-tab-btn ${
              activeTab === 'LEADERBOARD' ? 'cp-icon-tab-btn-active' : ''
            }`}
            onClick={() => setActiveTab('LEADERBOARD')}
          >
            <span>🏆 LEADERBOARD &amp; USERS ({leaderboard.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SUBMISSIONS'}
            className={`cp-icon-tab-btn ${
              activeTab === 'SUBMISSIONS' ? 'cp-icon-tab-btn-active' : ''
            }`}
            onClick={() => setActiveTab('SUBMISSIONS')}
          >
            <span>📋 SUBMISSIONS LOG ({submissions.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ANSWERS'}
            className={`cp-icon-tab-btn ${
              activeTab === 'ANSWERS' ? 'cp-icon-tab-btn-active' : ''
            }`}
            onClick={() => setActiveTab('ANSWERS')}
          >
            <span>🔑 DB ANSWER KEYS (8)</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cp-live-indicator">
            <span className="cp-live-dot" />
            <span>LIVE REAL-TIME SYNC</span>
          </span>
          <button
            type="button"
            className="cp-btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            onClick={() => loadAllAdminData(false)}
            disabled={loading}
          >
            {loading ? 'SYNCING...' : '↻ REFRESH'}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="cp-admin-content">
        {/* ─── TAB 1: REAL-LIFE HINT REQUESTS SOLVER ─── */}
        {activeTab === 'HINTS' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 className="cp-ribbon-title" style={{ fontSize: '14px' }}>
                  REAL-LIFE HINT DELIVERY QUEUE
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  Points are directly decreased when teams use hints. Admin confirms whether each physical hint has been delivered to the team.
                </div>
              </div>
              <span
                className={`cp-sticker-badge ${
                  pendingHintsCount > 0
                    ? 'cp-sticker-badge-running'
                    : 'cp-sticker-badge-success'
                }`}
              >
                PENDING DELIVERY: {pendingHintsCount}
              </span>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Team</th>
                    <th>Question Requested</th>
                    <th>Hint Level</th>
                    <th>Penalty</th>
                    <th>Requested At</th>
                    <th>Delivery Status</th>
                    <th>Action (Confirm Delivery)</th>
                  </tr>
                </thead>
                <tbody>
                  {hints.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        No hint requests received from teams yet.
                      </td>
                    </tr>
                  ) : (
                    hints.map((hr) => (
                      <tr key={hr.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{hr.id}</td>
                        <td>
                          <strong>{hr.team_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                            {hr.username}
                          </div>
                        </td>
                        <td>
                          <strong>Câu {hr.question_number}:</strong> {hr.question_title}
                        </td>
                        <td>
                          <span
                            className={`cp-key-badge ${
                              hr.hint_type === 'HIGH' ? 'cp-key-pk' : 'cp-key-fk'
                            }`}
                          >
                            {hr.hint_type} HINT
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          -{hr.deducted_points || hr.suggested_penalty} pts
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {new Date(hr.requested_at).toLocaleTimeString()}
                        </td>
                        <td>
                          <span
                            className={[
                              'cp-sticker-badge',
                              hr.status === 'DELIVERED'
                                ? 'cp-sticker-badge-success'
                                : hr.status === 'REQUESTED'
                                  ? 'cp-sticker-badge-running'
                                  : 'cp-sticker-badge-error',
                            ].join(' ')}
                          >
                            {hr.status === 'DELIVERED'
                              ? '✓ DELIVERED'
                              : hr.status === 'REQUESTED'
                                ? '⏳ PENDING DELIVERY'
                                : '✕ NOT DELIVERED'}
                          </span>
                        </td>
                        <td>
                          {hr.status === 'REQUESTED' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="cp-btn-primary"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handleConfirmDelivery(hr.id, true)}
                              >
                                ✓ CONFIRM DELIVERED
                              </button>
                              <button
                                type="button"
                                className="cp-btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handleConfirmDelivery(hr.id, false)}
                              >
                                ✕ NOT DELIVERED
                              </button>
                            </div>
                          ) : hr.status === 'DELIVERED' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                Delivered at{' '}
                                {hr.decided_at
                                  ? new Date(hr.decided_at).toLocaleTimeString()
                                  : '—'}
                              </span>
                              <button
                                type="button"
                                className="cp-btn-secondary"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                title="Revert to pending delivery"
                                onClick={() => handleConfirmDelivery(hr.id, false)}
                              >
                                ✕ REVERT
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                Marked not delivered (0 pts)
                              </span>
                              <button
                                type="button"
                                className="cp-btn-primary"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={() => handleConfirmDelivery(hr.id, true)}
                              >
                                ✓ DELIVER
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ─── TAB 2: LEADERBOARD & TEAM PROGRESSION MATRIX ─── */}
        {activeTab === 'LEADERBOARD' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 className="cp-ribbon-title" style={{ fontSize: '14px' }}>
                  LIVE LEADERBOARD, QUESTION STATUS MATRIX &amp; SCORE CONTROL
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  Ranked by: Score (DESC) → Penalty (ASC) → Solve Time (ASC) | Score (points currently held) and Penalty (deductions) are tracked separately.
                </div>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Progress</th>
                    <th>Q1</th>
                    <th>Q2</th>
                    <th>Q3</th>
                    <th>Q4</th>
                    <th>Q5</th>
                    <th>Q6</th>
                    <th>Q7</th>
                    <th>Q8</th>
                    <th>Total Time</th>
                    <th>Penalty</th>
                    <th>Score</th>
                    <th>Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.teamId}>
                      <td
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          color:
                            entry.rank <= 3 ? 'var(--color-primary)' : 'var(--color-ink)',
                        }}
                      >
                        #{entry.rank}
                      </td>
                      <td>
                        <strong>{entry.teamName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          {entry.email}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        <div>{entry.progress.progressText}</div>
                        {entry.progress.lastAcceptedAt && (
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: 400,
                              color: 'var(--color-muted)',
                            }}
                            title={`Last solved at ${new Date(entry.progress.lastAcceptedAt).toLocaleString()}`}
                          >
                            ⏱ {new Date(entry.progress.lastAcceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </div>
                        )}
                      </td>
                      {entry.questionStatuses.map((qs: any) => {
                        const solvedTimeStr =
                          qs.status === 'DONE' && qs.completedAt
                            ? new Date(qs.completedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false,
                              })
                            : null;
                        return (
                          <td
                            key={qs.questionNumber}
                            style={{
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <span
                                className={[
                                  'cp-sticker-badge',
                                  qs.status === 'DONE'
                                    ? 'cp-sticker-badge-success'
                                    : qs.status === 'FAILED'
                                      ? 'cp-sticker-badge-error'
                                      : '',
                                ].join(' ')}
                                style={{ padding: '2px 5px', fontSize: '10px' }}
                                title={`Q${qs.questionNumber}: ${qs.status} (${qs.attemptsUsed}/6 attempts)${qs.status === 'DONE' ? ` | Earned: +${qs.earnedGrossPoints} pts` : ''}${solvedTimeStr ? ` — Solved at ${solvedTimeStr}` : ''}`}
                              >
                                {qs.status === 'DONE'
                                  ? `✓ +${qs.earnedGrossPoints}`
                                  : qs.status === 'FAILED'
                                    ? '✕'
                                    : '·'}
                                {qs.riskMoveActive ? '★' : ''}
                                {qs.attemptsUsed > 1 ? ` (${qs.attemptsUsed})` : ''}
                              </span>
                              {solvedTimeStr && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    color: 'var(--color-muted)',
                                    lineHeight: 1.1,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {solvedTimeStr}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      {/* Total Time Column replacing Earned */}
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          color:
                            entry.totalTimeSpentFormatted && entry.totalTimeSpentFormatted !== '—'
                              ? 'var(--color-primary)'
                              : 'var(--color-muted)',
                        }}
                        title={`Total time spent solving questions: ${entry.totalTimeSpentFormatted || '—'} (${entry.progress.completedCount} solved)`}
                      >
                        {entry.totalTimeSpentFormatted && entry.totalTimeSpentFormatted !== '—' ? (
                          <span>⏱ {entry.totalTimeSpentFormatted}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--badge-error-text)',
                          fontWeight: 700,
                        }}
                      >
                        -{entry.totalPenalty}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        <span
                          className="cp-sticker-badge cp-sticker-badge-success"
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '2px 8px',
                          }}
                        >
                          {entry.score ?? entry.finalScore} PTS
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="cp-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => setAdjustTeam(entry)}
                        >
                          ± ADJUST
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Minimalist Score Adjustment Dialog */}
            {adjustTeam && (
              <div
                style={{
                  borderTop: '2px solid var(--color-primary)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  padding: '14px 16px',
                }}
              >
                <form
                  onSubmit={handleAdjustScoreSubmit}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 120px 2fr auto',
                    gap: '10px',
                    alignItems: 'end',
                  }}
                >
                  <div>
                    <div className="cp-score-cell-label">TARGET TEAM</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {adjustTeam.teamName} (Score: {adjustTeam.score ?? adjustTeam.finalScore} pts | Penalty: -{adjustTeam.totalPenalty} pts)
                    </div>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="cp-score-cell-label">ADJUSTMENT TYPE</span>
                    <select
                      className="cp-input"
                      value={adjType}
                      onChange={(e) => setAdjType(e.target.value as any)}
                    >
                      <option value="DIRECT_BONUS">DIRECT BONUS (+)</option>
                      <option value="DIRECT_PENALTY">DIRECT PENALTY (-)</option>
                      <option value="UNDERGROUND_DEAL">THƯƠNG VỤ NGẦM (-)</option>
                      <option value="CHEAT_PENALTY">ĐIỂM GIAN LẬN (-)</option>
                      <option value="RISK_MOVE_PENALTY">NƯỚC CỜ MẠO HIỂM PENALTY (-)</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="cp-score-cell-label">POINTS</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      className="cp-input"
                      value={adjPoints}
                      onChange={(e) => setAdjPoints(Number(e.target.value))}
                      required
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="cp-score-cell-label">REASON / AUDIT NOTE</span>
                    <input
                      type="text"
                      className="cp-input"
                      placeholder="e.g. Purchased underground clue or manual bonus..."
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      required
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="submit"
                      className="cp-btn-primary"
                      disabled={adjSubmitting}
                    >
                      {adjSubmitting ? 'APPLYING...' : 'APPLY'}
                    </button>
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      onClick={() => setAdjustTeam(null)}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {/* ─── TAB 3: SUBMISSIONS LOG (AUTO-GRADED) ─── */}
        {activeTab === 'SUBMISSIONS' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 className="cp-ribbon-title" style={{ fontSize: '14px' }}>
                  TEAM SUBMISSIONS LOG (INSTANT DATABASE AUTO-VERIFIED)
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="cp-input"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  value={subQuestionFilter}
                  onChange={(e) => setSubQuestionFilter(e.target.value)}
                  aria-label="Filter by question"
                >
                  <option value="">All Questions (Q1–Q8)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Question {n}
                    </option>
                  ))}
                </select>

                <select
                  className="cp-input"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Team</th>
                    <th>Question</th>
                    <th>Attempt</th>
                    <th>Submitted Answer</th>
                    <th>Risk Move</th>
                    <th>Auto-Check Result</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        No submissions matching current filter.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{sub.id}</td>
                        <td>
                          <strong>{sub.team_name}</strong>
                        </td>
                        <td>
                          Câu {sub.question_number} ({sub.base_points} pts)
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {sub.attempt_number}/6
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {sub.answer_content}
                        </td>
                        <td>
                          {sub.risk_move_used ? (
                            <span className="cp-key-badge cp-key-pk">★ 2X RISK</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <span
                            className={[
                              'cp-sticker-badge',
                              sub.status === 'ACCEPTED'
                                ? 'cp-sticker-badge-success'
                                : 'cp-sticker-badge-error',
                            ].join(' ')}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {new Date(sub.submitted_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ─── TAB 4: DATABASE ANSWER KEYS CONFIGURATION ─── */}
        {activeTab === 'ANSWERS' && (
          <section className="cp-dossier-card">
            <header className="cp-dossier-header">
              <h2 className="cp-ribbon-title" style={{ fontSize: '14px' }}>
                DATABASE ANSWER KEYS (QUESTIONS.ACCEPTED_ANSWERS)
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Contestants receive immediate verification against these database-stored
                answers upon submitting.
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th>Q#</th>
                    <th>Title</th>
                    <th>Base Points</th>
                    <th>Accepted Answers in Database</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const isEditing = editingQ === q.question_number;
                    return (
                      <tr key={q.question_number}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          Q{q.question_number}
                        </td>
                        <td>
                          <strong>{q.title}</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {q.base_points} pts
                        </td>
                        <td>
                          {isEditing ? (
                            <textarea
                              className="cp-input"
                              rows={4}
                              style={{
                                width: '100%',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                              }}
                              value={editingAnswersText}
                              onChange={(e) => setEditingAnswersText(e.target.value)}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {(q.accepted_answers || []).map((ans: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="cp-q-hint-trigger"
                                  style={{ fontFamily: 'var(--font-mono)', cursor: 'default' }}
                                >
                                  {ans}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ width: '140px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="cp-btn-primary"
                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => handleSaveAnswerKeys(q.question_number)}
                              >
                                SAVE
                              </button>
                              <button
                                type="button"
                                className="cp-btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => setEditingQ(null)}
                              >
                                CANCEL
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="cp-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => {
                                setEditingQ(q.question_number);
                                setEditingAnswersText(
                                  (q.accepted_answers || []).join('\n')
                                );
                              }}
                            >
                              ✎ EDIT KEYS
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {toastMsg && (
        <div className="cp-toast" role="status">
          {toastMsg}
        </div>
      )}
    </main>
  );
};
