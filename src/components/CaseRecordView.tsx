import React, { useEffect, useState } from 'react';
import type { QuestionDetailData } from '../types';

interface CaseRecordViewProps {
  detail: QuestionDetailData | null;
  loading: boolean;
  error: string | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isLiveConnected?: boolean;
  style?: React.CSSProperties;
  onSubmitAnswer: (
    questionNumber: number,
    answerContent: string,
    useRiskMove: boolean
  ) => Promise<{
    isCorrect: boolean;
    feedbackMessage: string;
    nextQuestionUnlocked: number | null;
  } | null>;
  onSelectRelatedTable?: (tableName: string) => void;
  onNavigateQuestion: (questionNumber: number) => void;
}

export const CaseRecordView: React.FC<CaseRecordViewProps> = ({
  detail,
  loading,
  error,
  isSidebarOpen,
  onToggleSidebar,
  isLiveConnected = true,
  style,
  onSubmitAnswer,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    nextQ: number | null;
  } | null>(null);

  const q = detail?.question;

  // Reset local input & banner only when switching to a different question number
  useEffect(() => {
    setAnswerInput('');
    setInstantFeedback(null);
  }, [q?.questionNumber]);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q || !answerInput.trim() || submitting) return;
    setSubmitting(true);
    setInstantFeedback(null);
    try {
      const res = await onSubmitAnswer(
        q.questionNumber,
        answerInput.trim(),
        false
      );
      if (res) {
        setInstantFeedback({
          isCorrect: res.isCorrect,
          message: res.feedbackMessage,
          nextQ: res.nextQuestionUnlocked,
        });
        if (res.isCorrect) {
          setAnswerInput('');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleFormSubmit();
    }
  };

  return (
    <section
      className={`cp-case-column ${!isSidebarOpen ? 'cp-case-column-expanded' : ''}`}
      style={style}
      aria-label="Question Dossier and Answer Submission"
    >
      {/* Synchronized Ribbon Header (Matches Metabase Ribbon Header) */}
      <div className="cp-ribbon-header">
        <div className="cp-ribbon-header-left">
          <span className="cp-ribbon-swatch" />
          <h2 className="cp-ribbon-title">DOSSIER</h2>
          <button
            type="button"
            className="cp-mini-tag-btn"
            onClick={onToggleSidebar}
            aria-expanded={isSidebarOpen}
            title={
              isSidebarOpen
                ? 'Ẩn danh sách câu hỏi (Hide Questions List)'
                : 'Hiện danh sách câu hỏi (Show Questions List)'
            }
          >
            {isSidebarOpen ? '◀ HIDE LIST' : '▶ SHOW LIST'}
          </button>
        </div>

        <div className="cp-ribbon-actions">
          <span
            className="cp-live-indicator"
            title="Real-time status & points synchronization active"
          >
            <span className="cp-live-dot" />
            <span>{isLiveConnected ? 'LIVE SYNC' : 'SYNCING'}</span>
          </span>

          {q && (
            <span className="cp-sticker-badge">
              CASE #{String(q.questionNumber).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="cp-case-scroll">
        {loading && !q && (
          <div className="cp-dossier-card" style={{ padding: '16px' }} aria-busy="true">
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
              LOADING CASE RECORD DOSSIER...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="cp-schema-notice-error" role="alert">
            <strong>Case Access Error:</strong> {error}
          </div>
        )}

        {q && (
          /* ─── COMBINED QUESTION DOSSIER & SUBMIT CARD ─── */
          <article className="cp-dossier-card">
            <header className="cp-dossier-header">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  INVESTIGATION QUESTION #{q.questionNumber} OF 8
                </span>
                <span
                  className={[
                    'cp-sticker-badge',
                    q.status === 'DONE'
                      ? 'cp-sticker-badge-success'
                      : q.status === 'FAILED'
                        ? 'cp-sticker-badge-error'
                        : 'cp-sticker-badge-running',
                  ].join(' ')}
                >
                  STATUS: {q.status.replace('_', ' ')}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 800,
                  lineHeight: 1.3,
                  margin: 0,
                  color: 'var(--color-ink)',
                }}
              >
                {q.title}
              </h3>
            </header>

            {/* Question Information Bar: Status, Points, Attempts, Nước cờ mạo hiểm */}
            <div className="cp-dossier-meta-grid">
              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">STATUS</span>
                <span
                  className="cp-score-cell-val"
                  style={{
                    color:
                      q.status === 'DONE'
                        ? 'var(--badge-success-text)'
                        : q.status === 'FAILED'
                          ? 'var(--badge-error-text)'
                          : 'var(--badge-running-text)',
                  }}
                >
                  {q.status.replace('_', ' ')}
                  {q.status === 'DONE' && q.completedAt
                    ? ` (${new Date(q.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })})`
                    : ''}
                </span>
              </div>

              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">
                  {q.status === 'DONE' ? 'POINTS EARNED' : q.status === 'FAILED' ? 'POINTS EARNED' : 'QUESTION VALUE'}
                </span>
                <span
                  className="cp-score-cell-val"
                  style={{
                    color:
                      q.status === 'DONE'
                        ? 'var(--badge-success-text)'
                        : q.status === 'FAILED'
                          ? 'var(--badge-error-text)'
                          : 'var(--color-primary)',
                    fontWeight: 800,
                  }}
                >
                  {q.status === 'DONE'
                    ? `+${q.gainedPoints || q.basePoints} PTS`
                    : q.status === 'FAILED'
                      ? '0 PTS'
                      : q.hasRiskMove
                        ? `★ ${q.basePoints * 2} PTS (2X)`
                        : `${q.basePoints} PTS`}
                </span>
              </div>

              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">ATTEMPTS</span>
                <span className="cp-score-cell-val">
                  {q.attemptsUsed}/{q.maxAttempts}
                </span>
              </div>

              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">NƯỚC CỜ MẠO HIỂM</span>
                <span
                  className="cp-score-cell-val"
                  style={{
                    color: q.hasRiskMove
                      ? q.status === 'FAILED'
                        ? 'var(--badge-error-text)'
                        : 'var(--color-primary)'
                      : 'var(--color-muted)',
                  }}
                >
                  {q.hasRiskMove
                    ? q.status === 'DONE'
                      ? '★ RESOLVED (2X)'
                      : q.status === 'FAILED'
                        ? '✕ FAILED (0 PTS)'
                        : '★ ACTIVE (2X)'
                    : q.status === 'DONE' || q.status === 'FAILED'
                      ? 'LOCKED'
                      : 'NO'}
                </span>
              </div>
            </div>

            {/* Unified Body: Question Content, Clues, Hints & Answer Submission */}
            <div className="cp-dossier-body">
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                    marginBottom: '6px',
                    letterSpacing: '0.3px',
                  }}
                >
                  ĐỀ BÀI &amp; HỒ SƠ ĐIỀU TRA (CASE BRIEFING)
                </div>
                <p style={{ margin: 0, color: 'var(--color-ink)', lineHeight: 1.6 }}>
                  {q.content}
                </p>
              </div>

              {q.caseDossier?.clues && q.caseDossier.clues.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--color-canvas)',
                    border: '1px solid var(--border-color)',
                    borderLeft: '3px solid var(--color-primary)',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-primary)',
                      marginBottom: '6px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    🔍 MANH MỐI TRỌNG TÂM (INVESTIGATIVE CLUES)
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '13px',
                      lineHeight: 1.55,
                    }}
                  >
                    {q.caseDossier.clues.map((clue, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-Life Hint Requests Status on this Question */}
              {detail.unlockedHints && detail.unlockedHints.length > 0 && (
                <div
                  style={{
                    border: '1px solid var(--badge-running-border)',
                    backgroundColor: 'var(--badge-running-bg)',
                    padding: '8px 10px',
                    fontSize: '12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--badge-running-text)',
                      marginBottom: '4px',
                    }}
                  >
                    💡 REAL-LIFE HINT REQUEST STATUS
                  </div>
                  {detail.unlockedHints.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dotted var(--badge-running-border)',
                        paddingTop: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <span>
                        <strong>{h.hint_type} HINT</strong> (-
                        {h.deducted_points || h.suggested_penalty} pts)
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {h.status === 'DELIVERED'
                          ? `✓ DELIVERED (-${h.deducted_points} PTS)`
                          : h.status === 'REQUESTED'
                            ? `⏳ PROCTOR DELIVERING (-${h.deducted_points || h.suggested_penalty} PTS APPLIED)`
                            : '✕ NOT DELIVERED (0 PTS WAIVED)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── COMBINED SUBMIT SECTION ─── */}
              <div
                style={{
                  borderTop: '1px solid var(--border-strong)',
                  paddingTop: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="cp-ribbon-swatch" />
                    <span className="cp-ribbon-title">SUBMIT</span>
                  </div>
                </div>

                {/* Immediate Response Banner for Incorrect Submissions */}
                {instantFeedback && !instantFeedback.isCorrect && (
                  <div
                    role="status"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--badge-error-border)',
                      backgroundColor: 'var(--badge-error-bg)',
                      color: 'var(--badge-error-text)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      ✕ REJECTED — ANSWER DOES NOT MATCH CASE DATABASE
                    </div>
                    <div style={{ fontSize: '13px' }}>{instantFeedback.message}</div>
                  </div>
                )}

                {q.status === 'DONE' ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      border: '1px solid var(--badge-success-border)',
                      backgroundColor: 'var(--badge-success-bg)',
                      color: 'var(--badge-success-text)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span>
                      ✓ QUESTION {q.questionNumber} COMPLETED (+{q.gainedPoints || q.basePoints} PTS AWARDED TO SCORE).
                    </span>
                    {q.completedAt && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        ⏱ SOLVED AT {new Date(q.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </span>
                    )}
                  </div>
                ) : q.status === 'FAILED' || q.remainingAttempts <= 0 ? (
                  <div
                    style={{
                      padding: '12px',
                      border: '1px solid var(--badge-error-border)',
                      backgroundColor: 'var(--badge-error-bg)',
                      color: 'var(--badge-error-text)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    ✕ ALL 6 ATTEMPTS EXHAUSTED ON QUESTION {q.questionNumber}.
                  </div>
                ) : (
                  <form
                    onSubmit={handleFormSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                  >
                    <label
                      htmlFor="cp-answer-box"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>INPUT YOUR INVESTIGATION ANSWER</span>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {q.remainingAttempts} / {q.maxAttempts} ATTEMPTS REMAINING
                      </span>
                    </label>

                    <textarea
                      id="cp-answer-box"
                      className="cp-input"
                      rows={3}
                      placeholder={
                        q.caseDossier?.answer_format ||
                        'Enter the exact ID, name, or license plate found in MuniDB_Hard...'
                      }
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ resize: 'vertical', fontFamily: 'var(--font-mono)' }}
                      required
                    />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                      }}
                    >
                      <button
                        type="submit"
                        className="cp-btn-primary"
                        disabled={submitting || !answerInput.trim()}
                      >
                        {submitting ? 'CHECKING DATABASE...' : '▶ SUBMIT ANSWER'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Submission Attempt History */}
                {detail.submissions && detail.submissions.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--color-muted)',
                        marginBottom: '6px',
                      }}
                    >
                      SUBMISSION HISTORY (CÂU {q.questionNumber})
                    </div>
                    <table className="cp-data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Answer Submitted</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.submissions.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', width: '36px' }}>
                              #{sub.attempt_number}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                              {sub.answer_content}
                            </td>
                            <td style={{ width: '96px' }}>
                              <span
                                className={[
                                  'cp-sticker-badge',
                                  sub.status === 'ACCEPTED'
                                    ? 'cp-sticker-badge-success'
                                    : sub.status === 'REJECTED'
                                      ? 'cp-sticker-badge-error'
                                      : 'cp-sticker-badge-running',
                                ].join(' ')}
                              >
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
};

