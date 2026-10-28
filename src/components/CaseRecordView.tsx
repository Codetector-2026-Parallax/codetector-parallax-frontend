import React, { useEffect, useState } from 'react';
import type { QuestionDetailData, QuestionInvestigationItem } from '../types';
import { MarkdownView } from './MarkdownView';

interface CaseRecordViewProps {
  detail: QuestionDetailData | null;
  loading: boolean;
  error: string | null;
  isLiveConnected?: boolean;
  style?: React.CSSProperties;
  onSubmitAnswer: (
    questionNumber: number,
    answerContent: string,
    investigationIndex?: number,
    useRiskMove?: boolean
  ) => Promise<{
    isCorrect: boolean;
    feedbackMessage: string;
    nextQuestionUnlocked: number | null;
  } | null>;
  onSelectRelatedTable?: (tableName: string) => void;
  onNavigateQuestion: (questionNumber: number) => void;
  onRequestHint?: (questionNumber: number, hintType: 'LOW' | 'HIGH') => Promise<void>;
  requestingHintKey?: string | null;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export const CaseRecordView: React.FC<CaseRecordViewProps> = ({
  detail,
  loading,
  error,
  isLiveConnected = true,
  style,
  onSubmitAnswer,
  onSelectRelatedTable,
  onRequestHint,
  requestingHintKey,
  isSidebarHidden,
  onToggleSidebar,
}) => {
  const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
  const [submittingInv, setSubmittingInv] = useState<number | null>(null);
  const [instantFeedback, setInstantFeedback] = useState<{
    invIndex: number;
    isCorrect: boolean;
    message: string;
    nextQ: number | null;
  } | null>(null);

  const [enlargedImage, setEnlargedImage] = useState<{ src: string; title: string } | null>(null);

  const q = detail?.question;
  const currentInvIndex = q?.currentInvestigationIndex ?? 1;

  // Active main tab state: 'story' | 'investigations' | 'history'
  const [activeMainTab, setActiveMainTab] = useState<'story' | 'investigations' | 'history'>('story');
  // Active subtab inside investigations: index of investigation (1, 2, ...)
  const [activeInvIndex, setActiveInvIndex] = useState<number>(1);

  // Reset inputs & tab when switching question numbers
  useEffect(() => {
    setAnswerInputs({});
    setInstantFeedback(null);
    const initialInv = q?.currentInvestigationIndex ?? 1;
    setActiveInvIndex(initialInv);
    if (q?.story || q?.content) {
      setActiveMainTab('story');
    } else {
      setActiveMainTab('investigations');
    }
  }, [q?.questionNumber]);

  const handleInputChange = (invIndex: number, value: string) => {
    setAnswerInputs((prev) => ({ ...prev, [invIndex]: value }));
  };

  const handleFormSubmit = async (invIndex: number, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q || submittingInv !== null) return;
    const inputVal = (answerInputs[invIndex] ?? '').trim();
    if (!inputVal) return;

    setSubmittingInv(invIndex);
    setInstantFeedback(null);
    try {
      const res = await onSubmitAnswer(q.questionNumber, inputVal, invIndex, false);
      if (res) {
        setInstantFeedback({
          invIndex,
          isCorrect: res.isCorrect,
          message: res.feedbackMessage,
          nextQ: res.nextQuestionUnlocked,
        });
        if (res.isCorrect) {
          setAnswerInputs((prev) => ({ ...prev, [invIndex]: '' }));
          const nextInv = q.investigations?.find((item) => item.index === invIndex + 1);
          if (nextInv) {
            setActiveInvIndex(nextInv.index);
            setActiveMainTab('investigations');
          }
        }
      }
    } finally {
      setSubmittingInv(null);
    }
  };

  const renderInvestigationCard = (inv: QuestionInvestigationItem) => {
    const isCurrentActive =
      inv.isUnlocked &&
      inv.status === 'NOT_DONE' &&
      inv.index === currentInvIndex;

    const isSolved = inv.status === 'DONE';
    const isExhausted = inv.status === 'FAILED';
    const isLocked = !inv.isUnlocked;

    const lowHintReq = detail?.unlockedHints?.find((h) => h.hint_type === 'LOW');
    const highHintReq = detail?.unlockedHints?.find((h) => h.hint_type === 'HIGH');

    return (
      <section
        key={inv.index}
        className="cp-investigation-section"
        style={{
          border: isCurrentActive
            ? '2px solid var(--color-primary)'
            : isSolved
              ? '1px solid var(--badge-success-border)'
              : isExhausted
                ? '1px solid var(--badge-error-border)'
                : '1px solid var(--border-color)',
          backgroundColor: isCurrentActive
            ? 'var(--color-card)'
            : isSolved
              ? 'var(--badge-success-bg)'
              : isExhausted
                ? 'var(--badge-error-bg)'
                : 'var(--color-canvas)',
          borderRadius: '0px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Section Header: Title & Badges */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            gap: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: isSolved
                  ? 'var(--badge-success-bg)'
                  : isExhausted
                    ? 'var(--badge-error-bg)'
                    : isCurrentActive
                      ? 'var(--color-primary)'
                      : 'var(--color-muted)',
                color: isCurrentActive ? 'var(--color-on-primary)' : 'inherit',
                padding: '3px 8px',
                borderRadius: '0px',
                letterSpacing: '0.5px',
                border: isSolved
                  ? '1px solid var(--badge-success-border)'
                  : isExhausted
                    ? '1px solid var(--badge-error-border)'
                    : '1px solid transparent',
              }}
            >
              MANH MỐI {inv.key}
            </span>
            {inv.title &&
              inv.title.trim().toLowerCase() !== `manh mối ${inv.key.toLowerCase()}` &&
              inv.title.trim().toLowerCase() !== 'manh mối' && (
                <h4
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                  }}
                >
                  {inv.title}
                </h4>
              )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSolved ? (
              <span className="cp-sticker-badge cp-sticker-badge-success">
                ✓ ĐÃ GIẢI QUYẾT (+{inv.earnedPoints || inv.basePoints} PTS)
              </span>
            ) : isExhausted ? (
              <span className="cp-sticker-badge cp-sticker-badge-error">
                ✕ HẾT LƯỢT THỬ (0 PTS)
              </span>
            ) : isLocked ? (
              <span className="cp-sticker-badge">
                🔒 ĐANG KHÓA
              </span>
            ) : (
              <span className="cp-sticker-badge cp-sticker-badge-running">
                ● ĐANG ĐIỀU TRA ({inv.attemptsUsed}/6)
              </span>
            )}
          </div>
        </header>

        {/* Locked Placeholder View */}
        {isLocked && (
          <div
            style={{
              padding: '16px',
              border: '1px dashed var(--border-color)',
              backgroundColor: 'var(--color-surface-elevated)',
              textAlign: 'center',
              color: 'var(--color-muted)',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🔒</div>
            <strong>Nội dung {inv.title} đang được niêm phong.</strong>
            <div>
              Đội của bạn cần giải quyết hoặc hoàn thành lượt nộp của Manh mối trước đó để mở khóa hồ sơ này.
            </div>
          </div>
        )}

        {/* Unlocked Clue & Task Content */}
        {!isLocked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Clue Story Narrative */}
            {inv.clue && (
              <MarkdownView
                content={inv.clue}
                style={{
                  fontSize: '16px',
                  lineHeight: 1.7,
                  color: 'var(--color-ink)',
                }}
              />
            )}

            {/* Evidence Image Viewer */}
            {inv.image && (
              <figure
                style={{
                  margin: '8px 0',
                  padding: '8px',
                  backgroundColor: 'var(--color-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <img
                  src={inv.image}
                  alt={`Vật chứng ${inv.title}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '280px',
                    objectFit: 'contain',
                    border: '1px solid var(--border-color)',
                    cursor: 'zoom-in',
                  }}
                  onClick={() => setEnlargedImage({ src: inv.image!, title: `Vật chứng: ${inv.title}` })}
                  title="Nhấn để phóng to vật chứng"
                />
                <figcaption
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                    letterSpacing: '0.2px',
                  }}
                >
                  🔍 Hình ảnh vật chứng: {inv.title} (Nhấn ảnh để phóng to)
                </figcaption>
              </figure>
            )}

            {/* Task Prompt Box */}
            <div
              style={{
                backgroundColor: 'var(--color-primary-subtle)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--color-primary)',
                padding: '12px 14px',
                borderRadius: '0px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--color-accent-ink)',
                  letterSpacing: '0.4px',
                  marginBottom: '4px',
                }}
              >
                📋 {inv.taskTitle || `Nhiệm vụ ${inv.key}`}
              </div>
              {inv.taskDescription && (
                <MarkdownView
                  content={inv.taskDescription}
                  style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--color-ink)' }}
                />
              )}
              {inv.submissionFormat && (
                <div
                  style={{
                    marginTop: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    backgroundColor: 'var(--color-canvas)',
                    padding: '4px 8px',
                    border: '1px dashed var(--border-color)',
                    display: 'inline-block',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                  }}
                >
                  <strong>Định dạng nộp:</strong> <MarkdownView content={inv.submissionFormat} inline />
                </div>
              )}
            </div>

            {/* Instant Feedback Notice for this Investigation */}
            {instantFeedback && instantFeedback.invIndex === inv.index && (
              <div
                role="status"
                style={{
                  padding: '10px 12px',
                  border: instantFeedback.isCorrect
                    ? '1px solid var(--badge-success-border)'
                    : '1px solid var(--badge-error-border)',
                  backgroundColor: instantFeedback.isCorrect
                    ? 'var(--badge-success-bg)'
                    : 'var(--badge-error-bg)',
                  color: instantFeedback.isCorrect
                    ? 'var(--badge-success-text)'
                    : 'var(--badge-error-text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{instantFeedback.isCorrect ? '✓' : '✕'}</span>
                <span>{instantFeedback.message}</span>
              </div>
            )}

            {/* Investigation Status: Solved, Failed, or Active Submission Form */}
            {isSolved ? (
              <div
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--badge-success-border)',
                  backgroundColor: 'var(--badge-success-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--badge-success-text)',
                  }}
                >
                  🎯 ĐÁP ÁN CHÍNH THỨC ĐƯỢC XÁC THỰC
                </div>
                {inv.revealedAnswer && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--color-ink)',
                      backgroundColor: 'var(--color-canvas)',
                      padding: '6px 10px',
                      border: '1px solid var(--border-color)',
                      userSelect: 'all',
                    }}
                  >
                    {inv.revealedAnswer}
                  </div>
                )}
              </div>
            ) : isExhausted ? (
              <div
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--badge-error-border)',
                  backgroundColor: 'var(--badge-error-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--badge-error-text)',
                  }}
                >
                  ✕ ĐÃ HẾT 6 LƯỢT THỬ — KHÔNG HOÀN THÀNH MANH MỐI NÀY (0 ĐIỂM)
                </div>
              </div>
            ) : isCurrentActive ? (
              /* Active Submission Form for Current Investigation */
              <form
                onSubmit={(e) => handleFormSubmit(inv.index, e)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}
                >
                  <label
                    htmlFor={`cp-answer-inv-${inv.index}`}
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-primary)',
                    }}
                  >
                    NỘP ĐÁP ÁN CHO {inv.title}
                  </label>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: inv.remainingAttempts <= 2 ? 'var(--badge-error-text)' : 'var(--color-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {inv.remainingAttempts} / {inv.maxAttempts} lượt còn lại
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                  <input
                    id={`cp-answer-inv-${inv.index}`}
                    type="text"
                    className="cp-input"
                    placeholder={inv.submissionFormat ? `Định dạng: ${inv.submissionFormat}` : 'Nhập đáp án điều tra...'}
                    value={answerInputs[inv.index] ?? ''}
                    onChange={(e) => handleInputChange(inv.index, e.target.value)}
                    style={{
                      flex: '1 1 200px',
                      minWidth: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      padding: '8px 10px',
                    }}
                    disabled={submittingInv !== null}
                    required
                  />
                  <button
                    type="submit"
                    className="cp-btn-primary"
                    disabled={submittingInv !== null || !(answerInputs[inv.index] ?? '').trim()}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '8px 14px',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {submittingInv === inv.index ? 'ĐANG KIỂM TRA...' : '▶ NỘP ĐÁP ÁN'}
                  </button>
                </div>
              </form>
            ) : null}

            {/* Investigation Hint Request Box */}
            {onRequestHint && q && (
              <div className="cp-hint-box-container">
                <div className="cp-hint-box-header">
                  <span className="cp-hint-box-title">
                    💡 YÊU CẦU GỢI Ý ĐIỀU TRA ({inv.title})
                  </span>
                  {(lowHintReq || highHintReq) && (
                    <span className="cp-sticker-badge cp-sticker-badge-running">
                      ĐÃ DÙNG {(lowHintReq ? 1 : 0) + (highHintReq ? 1 : 0)}/2 GỢI Ý
                    </span>
                  )}
                </div>

                <div className="cp-hint-options-grid">
                  {/* LOW HINT (-10 pts) */}
                  <button
                    type="button"
                    className={[
                      'cp-hint-option-card',
                      lowHintReq ? 'cp-hint-option-card-used' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={
                      Boolean(lowHintReq) ||
                      requestingHintKey === `${q.questionNumber}-LOW` ||
                      isSolved ||
                      isExhausted
                    }
                    onClick={() => onRequestHint(q.questionNumber, 'LOW')}
                  >
                    <div className="cp-hint-option-top">
                      <span className="cp-hint-option-name">LOW HINT</span>
                      <span className="cp-hint-option-penalty">-10 PTS</span>
                    </div>
                    <div className="cp-hint-option-desc">
                      {lowHintReq
                        ? `Đã kích hoạt (${lowHintReq.status}): Trừ 10 điểm vào Tổng điểm trừ. BTC sẽ bàn giao gợi ý thực tế.`
                        : 'Gợi ý sơ bộ định hướng tư duy điều tra (trừ 10 điểm).'}
                    </div>
                    {lowHintReq?.status === 'DELIVERED' && (
                      <span className="cp-hint-delivered-badge">✓ BTC ĐÃ GIAO GỢI Ý</span>
                    )}
                  </button>

                  {/* HIGH HINT (-25 pts) */}
                  <button
                    type="button"
                    className={[
                      'cp-hint-option-card',
                      highHintReq ? 'cp-hint-option-card-used' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={
                      Boolean(highHintReq) ||
                      requestingHintKey === `${q.questionNumber}-HIGH` ||
                      isSolved ||
                      isExhausted
                    }
                    onClick={() => onRequestHint(q.questionNumber, 'HIGH')}
                  >
                    <div className="cp-hint-option-top">
                      <span className="cp-hint-option-name">HIGH HINT</span>
                      <span className="cp-hint-option-penalty">-25 PTS</span>
                    </div>
                    <div className="cp-hint-option-desc">
                      {highHintReq
                        ? `Đã kích hoạt (${highHintReq.status}): Trừ 25 điểm vào Tổng điểm trừ. BTC sẽ bàn giao gợi ý thực tế.`
                        : 'Gợi ý chuyên sâu với cấu trúc SQL chi tiết (trừ 25 điểm).'}
                    </div>
                    {highHintReq?.status === 'DELIVERED' && (
                      <span className="cp-hint-delivered-badge">✓ BTC ĐÃ GIAO GỢI Ý</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <section
      className="cp-case-column"
      style={style}
      aria-label="Question Dossier and Answer Submission"
    >
      {/* Synchronized Ribbon Header */}
      <div className="cp-ribbon-header">
        <div className="cp-ribbon-header-left" style={{ minWidth: 0, flexShrink: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          {isSidebarHidden && onToggleSidebar && (
            <button
              type="button"
              className="cp-mini-tag-btn cp-mini-tag-btn-accent"
              onClick={onToggleSidebar}
              title="Hiện danh sách mảnh ghép (Show Pieces List)"
              aria-label="Show Pieces List"
              style={{ marginRight: '8px', flexShrink: 0, padding: '2px 7px', fontSize: '11px', fontWeight: 800 }}
              data-testid="unhide-pieces-list-btn"
            >
              ⮞ HIỆN DS
            </button>
          )}
          <span className="cp-ribbon-swatch" style={{ flexShrink: 0 }} />
          <h2
            className="cp-ribbon-title"
            style={{ flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
          >
            CASE RECORD
          </h2>
        </div>

        <div className="cp-ribbon-actions" style={{ flexShrink: 0 }}>
          <span className="cp-live-indicator" title="Đồng bộ trực tiếp với hệ thống">
            <span className="cp-live-dot" />
            <span>{isLiveConnected ? 'LIVE' : 'SYNC'}</span>
          </span>

          {q && (
            <span className="cp-sticker-badge">
              MẢNH GHÉP #{String(q.questionNumber).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div
        className="cp-case-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading && !q && (
          <div className="cp-dossier-card" style={{ padding: '16px', flexShrink: 0 }} aria-busy="true">
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
              ĐANG TẢI HỒ SƠ ĐIỀU TRA...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="cp-schema-notice-error" style={{ flexShrink: 0 }} role="alert">
            <strong>Lỗi truy cập hồ sơ:</strong> {error}
          </div>
        )}

        {q && (
          <article
            className="cp-dossier-card"
            style={{
              flexShrink: 0,
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'visible',
            }}
          >
            {/* Dossier Header: Chapter Title & Database Badge */}
            <header className="cp-dossier-header">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--color-accent-ink, var(--color-primary))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  MẢNH GHÉP SỐ {q.questionNumber} / 3
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {q.targetDatabase && (
                    <span
                      className="cp-sticker-badge"
                      style={{
                        backgroundColor: 'var(--color-canvas)',
                        color: 'var(--color-accent-ink, var(--color-primary))',
                        borderColor: 'var(--color-primary)',
                      }}
                      title={`Cơ sở dữ liệu: ${q.targetDatabase}`}
                    >
                      🗄️ {q.targetDatabase}
                    </span>
                  )}
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

            {/* Information Grid: Status, Points, Attempts */}
            <div className="cp-dossier-meta-grid">
              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">TRẠNG THÁI</span>
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
                  {q.status === 'DONE' ? 'HOÀN THÀNH' : q.status === 'FAILED' ? 'KẾT THÚC' : 'ĐANG THỰC HIỆN'}
                </span>
              </div>

              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">ĐIỂM ĐẠT ĐƯỢC</span>
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
                  +{q.gainedPoints ?? 0} / {q.basePoints} PTS
                </span>
              </div>

              <div className="cp-dossier-meta-item">
                <span className="cp-score-cell-label">TIẾN ĐỘ MANH MỐI</span>
                <span className="cp-score-cell-val">
                  {q.investigations?.filter((i) => i.status === 'DONE').length ?? 0} /{' '}
                  {q.investigations?.length ?? 2}
                </span>
              </div>
            </div>

            {/* Database Tables Note (Bảng hiện có / Bảng mở thêm) */}
            {Array.isArray(q.caseDossier?.related_tables) && q.caseDossier.related_tables.length > 0 && (
              <div
                data-testid="database-tables-note"
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '3px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <strong
                  style={{
                    color: 'var(--color-ink)',
                    fontWeight: 800,
                    fontStyle: 'italic',
                  }}
                >
                  {q.questionNumber === 1 ? 'Bảng hiện có:' : 'Bảng mở thêm:'}
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                  {q.caseDossier.related_tables.map((tbl: string) => (
                    <button
                      key={tbl}
                      type="button"
                      className="cp-mini-tag-btn"
                      onClick={() => onSelectRelatedTable?.(tbl)}
                      title={`Nhấn để định vị bảng ${tbl} trên sơ đồ ERD`}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        cursor: onSelectRelatedTable ? 'pointer' : 'default',
                      }}
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Tabs Bar */}
            <div
              className="cp-tabs-list"
              role="tablist"
              style={{
                borderBottom: '1px solid var(--border-color)',
                marginTop: '12px',
                paddingBottom: '0px',
                gap: '2px',
              }}
            >
              {/* Tab: Story */}
              <button
                type="button"
                role="tab"
                aria-selected={activeMainTab === 'story'}
                className={`cp-tab-btn ${activeMainTab === 'story' ? 'cp-tab-btn-active' : ''}`}
                onClick={() => setActiveMainTab('story')}
              >
                <span>📜 DẪN TRUYỆN</span>
              </button>

              {/* Big Tab: All Investigations */}
              <button
                type="button"
                role="tab"
                aria-selected={activeMainTab === 'investigations'}
                className={`cp-tab-btn ${activeMainTab === 'investigations' ? 'cp-tab-btn-active' : ''}`}
                onClick={() => setActiveMainTab('investigations')}
              >
                <span>🔍 ĐIỀU TRA</span>
                <span
                  className="cp-tab-badge"
                  style={{
                    backgroundColor:
                      q.investigations && q.investigations.every((i) => i.status === 'DONE')
                        ? 'var(--badge-success-bg)'
                        : 'var(--surface-steel-light)',
                    color:
                      q.investigations && q.investigations.every((i) => i.status === 'DONE')
                        ? 'var(--badge-success-text)'
                        : 'inherit',
                    fontSize: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {q.investigations?.filter((i) => i.status === 'DONE').length ?? 0}/{q.investigations?.length ?? 2}
                </span>
              </button>

              {/* Tab: Submissions History */}
              <button
                type="button"
                role="tab"
                aria-selected={activeMainTab === 'history'}
                className={`cp-tab-btn ${activeMainTab === 'history' ? 'cp-tab-btn-active' : ''}`}
                onClick={() => setActiveMainTab('history')}
              >
                <span>📋 LỊCH SỬ NỘP</span>
                <span style={{ fontSize: '10px', opacity: 0.85 }}>({detail.submissions?.length || 0})</span>
              </button>
            </div>

            {/* Dossier Body - Multi-Tab View Panels */}
            <div className="cp-dossier-body">
              {/* Tab 1: Narrative Story Panel */}
              {activeMainTab === 'story' && (
                <div className="cp-tab-content-panel">
                  {q.story || q.content ? (
                    <div
                      className="cp-story-panel"
                      style={{
                        backgroundColor: 'var(--color-dossier-paper)',
                        border: '1px solid var(--border-color)',
                        borderLeft: '4px solid var(--color-primary)',
                        padding: '14px 16px',
                        borderRadius: '0px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--color-dossier-ink)',
                          letterSpacing: '0.4px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>📜 BỐI CẢNH VỤ ÁN</span>
                      </div>
                      <MarkdownView
                        content={q.story || q.content}
                        style={{
                          fontSize: '16px',
                          lineHeight: 1.7,
                          color: 'var(--color-dossier-ink)',
                        }}
                      />

                      {Array.isArray(q.caseDossier?.related_tables) && q.caseDossier.related_tables.length > 0 && (
                        <div
                          style={{
                            marginTop: '12px',
                            fontStyle: 'italic',
                            fontSize: '14px',
                            color: 'var(--color-dossier-ink)',
                          }}
                        >
                          {q.questionNumber === 1 ? 'Bảng hiện có: ' : 'Bảng mở thêm: '}
                          <strong>{q.caseDossier.related_tables.join(', ')}.</strong>
                        </div>
                      )}

                      {/* Fast-track button to active investigation */}
                      {q.investigations && q.investigations.length > 0 && (
                        <div
                          style={{
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px dashed var(--border-color)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            type="button"
                            className="cp-btn cp-btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                            onClick={() => {
                              setActiveMainTab('investigations');
                              setActiveInvIndex(currentInvIndex);
                            }}
                          >
                            <span>
                              BẮT ĐẦU ĐIỀU TRA MANH MỐI{' '}
                              {q.investigations.find((i) => i.index === currentInvIndex)?.key ?? 'A'} ➔
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                        fontSize: '13px',
                      }}
                    >
                      Không có nội dung dẫn truyện cho mảnh ghép này.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Big Investigations Tab with Subtabs */}
              {activeMainTab === 'investigations' && (
                <div className="cp-tab-content-panel">
                  {q.investigations && q.investigations.length > 0 ? (
                    <>
                      {/* Subtab Navigation Bar for Each Investigation */}
                      <div
                        className="cp-subtabs-list"
                        role="tablist"
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '8px',
                          marginBottom: '14px',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: 'var(--color-muted)',
                            marginRight: '2px',
                            userSelect: 'none',
                          }}
                        >
                          MỤC TIÊU:
                        </span>
                        {q.investigations.map((inv) => {
                          const isCurrentActive =
                            inv.isUnlocked &&
                            inv.status === 'NOT_DONE' &&
                            inv.index === currentInvIndex;
                          const isSolved = inv.status === 'DONE';
                          const isExhausted = inv.status === 'FAILED';
                          const isLocked = !inv.isUnlocked;
                          const isSelected = activeInvIndex === inv.index;

                          return (
                            <button
                              key={inv.index}
                              type="button"
                              role="tab"
                              aria-selected={isSelected}
                              className={`cp-subtab-btn ${isSelected ? 'cp-subtab-btn-active' : ''}`}
                              onClick={() => setActiveInvIndex(inv.index)}
                            >
                              <span>MANH MỐI {inv.key}</span>
                              {isSolved ? (
                                <span className="cp-tab-badge cp-tab-badge-done">✓</span>
                              ) : isCurrentActive ? (
                                <span className="cp-tab-badge cp-tab-badge-active">●</span>
                              ) : isExhausted ? (
                                <span className="cp-tab-badge cp-tab-badge-failed">✕</span>
                              ) : isLocked ? (
                                <span className="cp-tab-badge cp-tab-badge-locked">🔒</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Investigation Detail Card */}
                      <div style={{ marginTop: '4px' }}>
                        {(() => {
                          const selectedInv =
                            q.investigations.find((i) => i.index === activeInvIndex) ||
                            q.investigations[0];
                          return renderInvestigationCard(selectedInv);
                        })()}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                        fontSize: '13px',
                      }}
                    >
                      Không tìm thấy dữ liệu manh mối điều tra.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Submission Attempt History */}
              {activeMainTab === 'history' && (
                <div className="cp-tab-content-panel">
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-muted)',
                      marginBottom: '8px',
                    }}
                  >
                    LỊCH SỬ NỘP ĐÁP ÁN (MẢNH GHÉP SỐ {q.questionNumber})
                  </div>
                  {detail.submissions && detail.submissions.length > 0 ? (
                    <table className="cp-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th style={{ width: '90px' }}>Manh mối</th>
                          <th>Đáp án đã nộp</th>
                          <th style={{ width: '100px' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.submissions.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>
                              #{sub.attempt_number}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                              {sub.investigation_index === 1 ? 'Manh mối A' : sub.investigation_index === 2 ? 'Manh mối B' : `Mục #${sub.investigation_index}`}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                              {sub.answer_content}
                            </td>
                            <td>
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
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                        fontSize: '13px',
                      }}
                    >
                      Chưa có lượt nộp đáp án nào cho mảnh ghép này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        )}
      </div>

      {/* Lightbox / Modal for Enlarged Evidence Images */}
      {enlargedImage && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--scrim-modal)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setEnlargedImage(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--border-strong)',
              borderRadius: '0px',
              padding: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.4px',
                }}
              >
                {enlargedImage.title}
              </span>
              <button
                type="button"
                className="cp-mini-tag-btn"
                onClick={() => setEnlargedImage(null)}
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                ✕ ĐÓNG
              </button>
            </div>
            <img
              src={enlargedImage.src}
              alt={enlargedImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
