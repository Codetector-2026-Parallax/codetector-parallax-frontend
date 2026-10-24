import React from 'react';
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
  onActivateRiskMove: (questionNumber: number) => Promise<void>;
  onToggleSidebar?: () => void;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  questions,
  progress,
  scoreSummary,
  selectedQuestionNumber,
  style,
  onSelectQuestion,
  onToggleSidebar,
}) => {
  const completedCount = progress?.completedCount ?? 0;
  const totalQuestions = progress?.totalQuestions ?? 3;
  const pct = Math.min(100, Math.round((completedCount / totalQuestions) * 100));

  const renderStatusBadge = (q: QuestionSummaryItem) => {
    if (!q.isUnlocked) {
      return (
        <span className="cp-sticker-badge" title="Hoàn thành hồ sơ trước đó để mở khóa">
          🔒 KHÓA
        </span>
      );
    }
    if (q.status === 'DONE') {
      return <span className="cp-sticker-badge cp-sticker-badge-success">✓ XONG</span>;
    }
    if (q.status === 'FAILED') {
      return <span className="cp-sticker-badge cp-sticker-badge-error">✕ KẾT THÚC</span>;
    }
    return <span className="cp-sticker-badge cp-sticker-badge-running">● ĐANG LÀM</span>;
  };

  return (
    <aside
      className="cp-question-sidebar"
      style={style}
      aria-label="Case Questions List Sidebar"
    >
      {/* Synchronized Ribbon Card Header */}
      <div className="cp-ribbon-header">
        <div className="cp-ribbon-header-left" style={{ minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
          <span className="cp-ribbon-swatch cp-ribbon-swatch-utility" style={{ flexShrink: 0 }} />
          <h2
            className="cp-ribbon-title"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
          >
            PIECES LIST
          </h2>
        </div>
        <div className="cp-ribbon-actions" style={{ flexShrink: 0 }}>
          <span className="cp-sticker-badge" style={{ borderColor: 'var(--color-primary)' }}>
            {completedCount}/{totalQuestions}
          </span>
          {onToggleSidebar && (
            <button
              type="button"
              className="cp-mini-tag-btn"
              onClick={onToggleSidebar}
              title="Ẩn danh sách câu hỏi"
              style={{ flexShrink: 0 }}
            >
              ◀ ẨN DS
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Subbar: Progress Meter, Score & Penalty */}
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

        {/* Team Score Strip */}
        <div className="cp-score-summary-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div
            className="cp-score-cell"
            style={{
              backgroundColor: 'var(--color-surface)',
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
              ⚠️ TỔNG ĐIỂM TRỪ
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
              backgroundColor: 'var(--color-surface)',
              padding: '6px 10px',
            }}
          >
            <span
              className="cp-score-cell-label"
              style={{
                color: 'var(--color-muted)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }}
            >
              🏆 ĐIỂM HIỆN TẠI
            </span>
            <span
              className="cp-score-cell-val"
              style={{
                color: 'var(--color-ink)',
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
      </div>

      {/* Persistent Questions List */}
      <div className="cp-question-list" role="list">
        {questions.map((q) => {
          const isSelected = q.questionNumber === selectedQuestionNumber;
          const isDone = q.status === 'DONE';
          const isFailed = q.status === 'FAILED';

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
                    <span className="cp-q-number-badge">Mảnh ghép số {q.questionNumber}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {q.status === 'DONE' ? (
                      <span
                        className="cp-sticker-badge cp-sticker-badge-success"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '1px 6px',
                        }}
                      >
                        +{q.gainedPoints || q.basePoints} PTS
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
                          fontWeight: 800,
                          color: 'var(--color-accent-ink, var(--color-primary))',
                        }}
                      >
                        {q.basePoints} PTS
                      </span>
                    )}
                    {renderStatusBadge(q)}
                  </div>
                </div>

                {/* Chapter Title Row (Dedicated full width) */}
                <div style={{ marginTop: '5px', marginBottom: '6px' }}>
                  <div
                    className="cp-q-title-text"
                    style={{ fontSize: '13px', lineHeight: 1.35, fontWeight: 700 }}
                  >
                    {q.title}
                  </div>
                </div>

                {/* Sub-Investigation Indicators (Left) & Hint Button (Right) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    flexWrap: 'wrap',
                    borderTop: '1px dotted var(--border-color)',
                    paddingTop: '6px',
                  }}
                >
                  {/* Indicators */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {q.investigations && q.investigations.length > 0 ? (
                      q.investigations.map((inv) => {
                        const isInvDone = inv.status === 'DONE';
                        const isInvFailed = inv.status === 'FAILED';
                        const isInvLocked = !inv.isUnlocked;
                        return (
                          <span
                            key={inv.index}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '0px',
                              border: isInvDone
                                ? '1px solid var(--badge-success-border)'
                                : isInvFailed
                                  ? '1px solid var(--badge-error-border)'
                                  : isInvLocked
                                    ? '1px dashed var(--border-color)'
                                    : '1px solid var(--color-primary)',
                              backgroundColor: isInvDone
                                ? 'var(--badge-success-bg)'
                                : isInvFailed
                                  ? 'var(--badge-error-bg)'
                                  : isInvLocked
                                    ? 'transparent'
                                    : 'var(--color-primary-subtle)',
                              color: isInvDone
                                ? 'var(--badge-success-text)'
                                : isInvFailed
                                  ? 'var(--badge-error-text)'
                                  : isInvLocked
                                    ? 'var(--color-muted)'
                                    : 'var(--color-accent-ink, var(--color-primary))',
                            }}
                            title={`${inv.title}: ${
                              isInvDone
                                ? 'Đã giải quyết (+50 pts)'
                                : isInvFailed
                                  ? 'Hết lượt thử'
                                  : isInvLocked
                                    ? 'Đang khóa'
                                    : 'Đang điều tra'
                            }`}
                          >
                            {inv.key}: {isInvDone ? '✓' : isInvFailed ? '✕' : isInvLocked ? '🔒' : '●'}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>CÂU HỎI ĐƠN</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
