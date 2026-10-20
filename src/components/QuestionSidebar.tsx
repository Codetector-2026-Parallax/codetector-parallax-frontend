import React, { useState } from 'react';
import type {
  QuestionSummaryItem,
  TeamProgressInfo,
  TeamScoreSummary,
} from '../types';

interface QuestionSidebarProps {
  questions: QuestionSummaryItem[];
  progress: TeamProgressInfo | null;
  scoreSummary: TeamScoreSummary | null;
  selectedQuestionNumber: number;
  style?: React.CSSProperties;
  onSelectQuestion: (questionNumber: number) => void;
  onRequestHint: (questionNumber: number, hintType: 'LOW' | 'HIGH') => Promise<void>;
  requestingHintKey: string | null;
  onActivateRiskMove: (questionNumber: number) => Promise<void>;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  questions,
  progress,
  scoreSummary,
  selectedQuestionNumber,
  style,
  onSelectQuestion,
  onRequestHint,
  requestingHintKey,
  onActivateRiskMove,
}) => {
  const [openHintMenuQ, setOpenHintMenuQ] = useState<number | null>(null);
  const [activatingRiskQ, setActivatingRiskQ] = useState<number | null>(null);

  const completedCount = progress?.completedCount ?? 0;
  const totalQuestions = progress?.totalQuestions ?? 8;
  const pct = Math.min(100, Math.round((completedCount / totalQuestions) * 100));

  const handleRiskMoveClick = async (questionNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activatingRiskQ !== null) return;
    setActivatingRiskQ(questionNumber);
    try {
      await onActivateRiskMove(questionNumber);
    } finally {
      setActivatingRiskQ(null);
    }
  };

  const renderStatusBadge = (q: QuestionSummaryItem) => {
    if (!q.isUnlocked) {
      return (
        <span className="cp-sticker-badge" title="Complete previous question to unlock">
          🔒 LOCKED
        </span>
      );
    }
    if (q.status === 'DONE') {
      return <span className="cp-sticker-badge cp-sticker-badge-success">✓ DONE</span>;
    }
    if (q.status === 'FAILED') {
      return <span className="cp-sticker-badge cp-sticker-badge-error">✕ FAILED</span>;
    }
    return <span className="cp-sticker-badge cp-sticker-badge-running">● NOT DONE</span>;
  };

  return (
    <aside
      className="cp-question-sidebar"
      style={style}
      aria-label="Case Questions List Sidebar"
    >
      {/* Synchronized Ribbon Card Header (Matches Metabase SchemaBrowser) */}
      <div className="cp-ribbon-header">
        <div className="cp-ribbon-header-left">
          <span className="cp-ribbon-swatch cp-ribbon-swatch-utility" />
          <h2 className="cp-ribbon-title">QUESTIONS LIST</h2>
        </div>
        <div className="cp-ribbon-actions">
          <span className="cp-sticker-badge" style={{ borderColor: 'var(--color-primary)' }}>
            {completedCount}/{totalQuestions} CÂU
          </span>
        </div>
      </div>

      {/* Sidebar Subbar: Progress Meter, Penalty/Final Score & Risk Move Status */}
      <div className="cp-sidebar-header">
        <div
          className="cp-progress-meter"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="cp-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Team Score Strip (Penalty & Score separated) */}
        <div className="cp-score-summary-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div
            className="cp-score-cell"
            style={{
              backgroundColor: 'rgba(217, 83, 79, 0.07)',
              borderRight: '1px solid var(--border-color)',
              padding: '6px 10px',
            }}
          >
            <span
              className="cp-score-cell-label"
              style={{
                color: 'var(--badge-error-text)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }}
            >
              ⚠️ TOTAL PENALTY
            </span>
            <span
              className="cp-score-cell-val"
              style={{
                color: 'var(--badge-error-text)',
                fontSize: '16px',
                fontWeight: 800,
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              -{scoreSummary?.totalPenalty ?? 0} PTS
            </span>
          </div>
          <div
            className="cp-score-cell"
            style={{
              backgroundColor: 'var(--color-primary-subtle)',
              padding: '6px 10px',
            }}
          >
            <span
              className="cp-score-cell-label"
              style={{
                color: 'var(--color-primary)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }}
            >
              🏆 CURRENT SCORE
            </span>
            <span
              className="cp-score-cell-val"
              style={{
                color: 'var(--color-primary)',
                fontSize: '16px',
                fontWeight: 800,
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              {scoreSummary?.score ?? scoreSummary?.finalScore ?? 0} PTS
            </span>
          </div>
        </div>

        {/* Risk Move Global Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--color-canvas)',
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          <span>★ NƯỚC CỜ MẠO HIỂM:</span>
          <span style={{ color: 'var(--color-primary)' }}>
            {progress?.riskMoveUsedOnQuestion
              ? `USED ON Q${progress.riskMoveUsedOnQuestion}`
              : progress?.riskMoveUnlocked
                ? 'READY (Q4–Q8)'
                : 'UNLOCKS AT Q4'}
          </span>
        </div>
      </div>

      {/* Persistent Questions List with Risk Move above Hint Box */}
      <div className="cp-question-list" role="list">
        {questions.map((q) => {
          const isSelected = q.questionNumber === selectedQuestionNumber;
          const isDone = q.status === 'DONE';
          const isFailed = q.status === 'FAILED';
          const isHintLocked = !q.isUnlocked || isDone || isFailed;
          const isHintOpen = openHintMenuQ === q.questionNumber && !isHintLocked;
          const lowHintReq = q.hintRequests?.find((h) => h.hint_type === 'LOW');
          const highHintReq = q.hintRequests?.find((h) => h.hint_type === 'HIGH');
          const hasAnyHint = Boolean(lowHintReq || highHintReq);

          const hasRiskMoveOption = q.questionNumber >= 4;
          const riskUsedElsewhere =
            progress?.riskMoveUsedOnQuestion !== null &&
            progress?.riskMoveUsedOnQuestion !== undefined &&
            progress.riskMoveUsedOnQuestion !== q.questionNumber;
          const isRiskMoveLocked =
            !q.isUnlocked ||
            isFailed ||
            isDone ||
            riskUsedElsewhere ||
            q.hasRiskMove;

          return (
            <div
              key={q.questionNumber}
              role="listitem"
              className={[
                'cp-question-item',
                isSelected ? 'cp-question-item-active' : '',
                !q.isUnlocked ? 'cp-question-item-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div
                className="cp-question-item-main"
                role="button"
                tabIndex={q.isUnlocked ? 0 : -1}
                aria-disabled={!q.isUnlocked}
                onClick={() => {
                  if (q.isUnlocked) {
                    onSelectQuestion(q.questionNumber);
                  }
                }}
                onKeyDown={(e) => {
                  if (q.isUnlocked && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectQuestion(q.questionNumber);
                  }
                }}
              >
                {/* Top Meta Row: Q# + Points Badge + Status Badge */}
                <div className="cp-question-item-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="cp-q-number-badge">CÂU {q.questionNumber}</span>
                    {q.status === 'DONE' ? (
                      <span
                        className="cp-sticker-badge cp-sticker-badge-success"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '1px 6px',
                        }}
                        title={`Awarded +${q.gainedPoints || q.basePoints} points to team score`}
                      >
                        +{q.gainedPoints || q.basePoints} PTS{q.hasRiskMove ? ' (★ 2X)' : ''}
                      </span>
                    ) : q.status === 'FAILED' ? (
                      <span
                        className="cp-sticker-badge cp-sticker-badge-error"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                        }}
                      >
                        0 PTS
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                        }}
                      >
                        {q.hasRiskMove ? `★ ${q.basePoints * 2} PTS (2X)` : `${q.basePoints} PTS`}
                      </span>
                    )}
                  </div>
                  {renderStatusBadge(q)}
                </div>

                {/* Question Title + Risk Move Button (Q4+) above Hint Box */}
                <div className="cp-q-title-row">
                  <span className="cp-q-title-text">{q.title}</span>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {hasRiskMoveOption && (
                      <button
                        type="button"
                        className={[
                          'cp-q-hint-trigger',
                          q.hasRiskMove ? 'cp-q-hint-trigger-active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={isRiskMoveLocked || activatingRiskQ === q.questionNumber}
                        title={
                          isFailed
                            ? 'Question failed — Risk Move is locked'
                            : isDone
                              ? 'Question completed — Risk Move is locked'
                              : !q.isUnlocked
                                ? 'Unlock question first to use Risk Move'
                                : q.hasRiskMove
                                  ? 'Nước cờ mạo hiểm active on this question (calculated on correct answer or 6/6 failed attempts)'
                                  : riskUsedElsewhere
                                    ? `Nước cờ mạo hiểm already used on Question ${progress?.riskMoveUsedOnQuestion}`
                                    : 'Activate Nước cờ mạo hiểm (2x points on correct answer, 0 pts if 6/6 attempts fail)'
                        }
                        onClick={(e) => handleRiskMoveClick(q.questionNumber, e)}
                      >
                        <span>
                          {activatingRiskQ === q.questionNumber
                            ? '★ ACTIVATING...'
                            : q.hasRiskMove
                              ? isFailed || isDone
                                ? '🔒 2X RISK'
                                : '★ 2X RISK'
                              : isRiskMoveLocked
                                ? '🔒 RISK MOVE'
                                : '★ RISK MOVE'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className={[
                        'cp-q-hint-trigger',
                        isHintOpen || hasAnyHint ? 'cp-q-hint-trigger-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={isHintLocked}
                      title={
                        isFailed
                          ? 'Question failed — Hint box is locked'
                          : isDone
                            ? 'Question completed — Hint box is locked'
                            : q.isUnlocked
                              ? 'Choose or request a real-life Hint for this question'
                              : 'Unlock question first to request hints'
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isHintLocked) return;
                        setOpenHintMenuQ((prev) =>
                          prev === q.questionNumber ? null : q.questionNumber
                        );
                      }}
                    >
                      <span>{isHintLocked ? '🔒 HINT' : '💡 HINT'}</span>
                      {hasAnyHint && (
                        <span>({(lowHintReq ? 1 : 0) + (highHintReq ? 1 : 0)})</span>
                      )}
                      {!isHintLocked && <span>{isHintOpen ? '▲' : '▼'}</span>}
                    </button>
                  </div>
                </div>

                {/* Attempts & Solved Time Meta */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                  }}
                >
                  <span>
                    Attempts: {q.attemptsUsed}/{q.maxAttempts}
                    {q.submissionPenalty > 0 && (
                      <span style={{ color: 'var(--badge-error-text)', marginLeft: '4px' }}>
                        (-{q.submissionPenalty} pts)
                      </span>
                    )}
                  </span>
                  {q.status === 'DONE' && q.completedAt && (
                    <span style={{ color: 'var(--badge-success-text)', fontWeight: 700 }}>
                      ⏱ Solved: {new Date(q.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  )}
                  {q.hintPenaltyPoints > 0 && (
                    <span style={{ color: 'var(--badge-error-text)', fontWeight: 700 }}>
                      Hint: -{q.hintPenaltyPoints} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Inline Hint Choice Drawer under Question Title */}
              {isHintOpen && !isHintLocked && (
                <div
                  className="cp-hint-choice-drawer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>REQUEST REAL-LIFE HINT (CÂU {q.questionNumber})</span>
                    <span>BTC DELIVERY</span>
                  </div>

                  {/* Choice 1: Low-Value Hint (-10 pts) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      padding: '4px 6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        LOW HINT (-10 PTS)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {lowHintReq
                          ? lowHintReq.status === 'DELIVERED'
                            ? `✓ Delivered by BTC (-${lowHintReq.deducted_points} pts)`
                            : lowHintReq.status === 'REQUESTED'
                              ? `⏳ -${lowHintReq.deducted_points || 10} pts deducted — Waiting for BTC delivery`
                              : `✕ Not delivered (0 pts waived)`
                          : 'Directional clue delivered by Proctor'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={lowHintReq ? 'cp-btn-secondary' : 'cp-btn-primary'}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      disabled={
                        isHintLocked ||
                        Boolean(lowHintReq && lowHintReq.status !== 'UNDELIVERED' && lowHintReq.status !== 'WAIVED') ||
                        requestingHintKey === `${q.questionNumber}-LOW`
                      }
                      onClick={() => onRequestHint(q.questionNumber, 'LOW')}
                    >
                      {lowHintReq
                        ? lowHintReq.status === 'DELIVERED'
                          ? 'DELIVERED'
                          : lowHintReq.status === 'REQUESTED'
                            ? 'USED (-10)'
                            : 'REQUEST'
                        : requestingHintKey === `${q.questionNumber}-LOW`
                          ? 'SENDING...'
                          : 'USE HINT'}
                    </button>
                  </div>

                  {/* Choice 2: High-Value Hint (-25 pts) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      padding: '4px 6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        HIGH HINT (-25 PTS)
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {highHintReq
                          ? highHintReq.status === 'DELIVERED'
                            ? `✓ Delivered by BTC (-${highHintReq.deducted_points} pts)`
                            : highHintReq.status === 'REQUESTED'
                              ? `⏳ -${highHintReq.deducted_points || 25} pts deducted — Waiting for BTC delivery`
                              : `✕ Not delivered (0 pts waived)`
                          : 'Deep analytical clue delivered by Proctor'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={highHintReq ? 'cp-btn-secondary' : 'cp-btn-primary'}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      disabled={
                        isHintLocked ||
                        Boolean(highHintReq && highHintReq.status !== 'UNDELIVERED' && highHintReq.status !== 'WAIVED') ||
                        requestingHintKey === `${q.questionNumber}-HIGH`
                      }
                      onClick={() => onRequestHint(q.questionNumber, 'HIGH')}
                    >
                      {highHintReq
                        ? highHintReq.status === 'DELIVERED'
                          ? 'DELIVERED'
                          : highHintReq.status === 'REQUESTED'
                            ? 'USED (-25)'
                            : 'REQUEST'
                        : requestingHintKey === `${q.questionNumber}-HIGH`
                          ? 'SENDING...'
                          : 'USE HINT'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

