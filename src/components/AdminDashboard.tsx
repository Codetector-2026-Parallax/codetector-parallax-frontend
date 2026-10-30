import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adjustTeamScore,
  confirmAdminHintDelivery,
  fetchAdminContests,
  fetchAdminHints,
  fetchAdminLeaderboard,
  fetchAdminQuestions,
  fetchAdminSubmissions,
  stopAdminContest,
  toggleAdminContest,
  updateAdminQuestionAnswers,
  getStoredToken,
  getStoredMetabaseSession,
  getApiUrl,
} from '../api';
import type {
  AdminHintRequestRecord,
  AdminQuestionConfig,
  AdminSubmissionRecord,
  ContestInfo,
  LeaderboardEntry,
  AdminRealtimeEvent,
} from '../types';

class AdminSoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('cp_admin_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.enabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem('cp_admin_sound_enabled', String(val));
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playSuccessChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // AudioContext blocked
    }
  }

  public playHintAlert() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // AudioContext blocked
    }
  }

  public playWarning() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // AudioContext blocked
    }
  }
}

const adminSound = new AdminSoundEffects();

interface AdminDashboardProps {
  contestId: string;
  onSwitchContest: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  contestId,
  onSwitchContest,
}) => {
  const [activeTab, setActiveTab] = useState<
    'HINTS' | 'LEADERBOARD' | 'SUBMISSIONS' | 'ANSWERS'
  >('HINTS');

  const [contests, setContests] = useState<ContestInfo[]>([]);
  const [hints, setHints] = useState<AdminHintRequestRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmissionRecord[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmStopThisContest, setConfirmStopThisContest] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time SSE Connection, Audio & Live Activity Feed State
  const [sseStatus, setSseStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => adminSound.isEnabled());
  const [showActivityFeed, setShowActivityFeed] = useState<boolean>(false);
  const [liveEvents, setLiveEvents] = useState<AdminRealtimeEvent[]>([]);
  const [highlightedHintId, setHighlightedHintId] = useState<number | null>(null);
  const [highlightedSubId, setHighlightedSubId] = useState<number | null>(null);
  const [highlightedTeamId, setHighlightedTeamId] = useState<number | null>(null);
  const [reconnectCounter, setReconnectCounter] = useState<number>(0);

  // Tab 1: Hints Filters & Search
  const [hintStatusFilter, setHintStatusFilter] = useState<'ALL' | 'REQUESTED' | 'DELIVERED' | 'NOT_DELIVERED'>('ALL');
  const [hintSearchQuery, setHintSearchQuery] = useState<string>('');

  // Tab 2: Leaderboard Search
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');

  // Tab 3: Submissions Filters & Search
  const [subQuestionFilter, setSubQuestionFilter] = useState<string>('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('');
  const [subTeamQuery, setSubTeamQuery] = useState<string>('');

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
  const [editingInvAnswersText, setEditingInvAnswersText] = useState<Record<string, string>>({});
  const [answersSubmitting, setAnswersSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    adminSound.setEnabled(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      adminSound.playSuccessChime();
    }
  };

  // Load contest metadata & pre-populate all tab badges once when contestId changes
  useEffect(() => {
    fetchAdminContests()
      .then((contestsData) => {
        if (Array.isArray(contestsData)) {
          setContests(contestsData);
        }
      })
      .catch(() => {});

    // Preload hints and leaderboard so tab badges and KPI cards are immediately accurate
    fetchAdminHints(undefined, contestId)
      .then((hData) => setHints(hData.hintRequests))
      .catch(() => {});
    fetchAdminLeaderboard(contestId)
      .then((lbData) => setLeaderboard(lbData.leaderboard))
      .catch(() => {});
    fetchAdminQuestions(contestId)
      .then((qData) => setQuestions(qData.questions))
      .catch(() => {});
  }, [contestId]);

  // Load data for the currently active tab
  const loadAllAdminData = useCallback(
    async (silent: boolean = false) => {
      if (!silent) setLoading(true);
      try {
        if (activeTab === 'HINTS') {
          const hintsData = await fetchAdminHints(undefined, contestId);
          setHints(hintsData.hintRequests);
        } else if (activeTab === 'LEADERBOARD') {
          const lbData = await fetchAdminLeaderboard(contestId);
          setLeaderboard(lbData.leaderboard);
        } else if (activeTab === 'SUBMISSIONS') {
          const subsData = await fetchAdminSubmissions({
            contestId,
            questionNumber: subQuestionFilter ? Number(subQuestionFilter) : undefined,
            status: subStatusFilter || undefined,
          });
          setSubmissions(subsData.submissions);
        } else if (activeTab === 'ANSWERS') {
          const qData = await fetchAdminQuestions(contestId);
          setQuestions(qData.questions);
        }
      } catch (err: any) {
        if (!silent) {
          showToast(err?.message || 'Lỗi khi tải dữ liệu ban tổ chức');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activeTab, contestId, subQuestionFilter, subStatusFilter]
  );

  useEffect(() => {
    loadAllAdminData(false);
    // Low-frequency fallback sync (every 120s when visible); primary updates arrive via SSE
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAllAdminData(true);
      }
    }, 120000);

    let es: EventSource | null = null;
    let isCancelled = false;

    if (typeof EventSource !== 'undefined') {
      setSseStatus('CONNECTING');
      const token = getStoredToken();
      const mbSession = getStoredMetabaseSession();
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (mbSession) params.set('metabase_session', mbSession);

      const ssePath = `/api/events${params.toString() ? '?' + params.toString() : ''}`;
      try {
        es = new EventSource(getApiUrl(ssePath), { withCredentials: true });

        es.onopen = () => {
          if (!isCancelled) setSseStatus('CONNECTED');
        };

        es.onerror = () => {
          if (!isCancelled) setSseStatus('DISCONNECTED');
        };

        es.onmessage = (evt) => {
          if (isCancelled) return;
          try {
            const payload: AdminRealtimeEvent = JSON.parse(evt.data);
            setSseStatus('CONNECTED');

            if (!payload.type || payload.type === 'CONNECTED') {
              return;
            }

            const eventItem: AdminRealtimeEvent = {
              ...payload,
              id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: payload.timestamp || new Date().toISOString(),
            };

            setLiveEvents((prev) => [eventItem, ...prev.slice(0, 29)]);

            const teamLabel = payload.teamName ? `[${payload.teamName}]` : payload.teamId ? `[Đội ${payload.teamId}]` : 'Đội thi';
            const qLabel = payload.questionNumber ? `Câu ${payload.questionNumber}` : 'Câu hỏi';

            if (payload.type === 'HINT_REQUESTED') {
              const penaltyText = payload.penalty ? ` (-${payload.penalty}đ)` : '';
              const typeText = payload.hintType ? ` (${payload.hintType})` : '';
              showToast(`💡 ${teamLabel} vừa YÊU CẦU GỢI Ý${typeText} cho ${qLabel}${penaltyText}!`);
              adminSound.playHintAlert();

              fetchAdminHints(undefined, contestId)
                .then((hData) => {
                  if (isCancelled) return;
                  setHints(hData.hintRequests);
                  if (hData.hintRequests.length > 0) {
                    setHighlightedHintId(hData.hintRequests[0].id);
                    setTimeout(() => setHighlightedHintId(null), 4000);
                  }
                })
                .catch(() => {});
            } else if (payload.type === 'HINT_DELIVERED') {
              showToast(`✓ Đã bàn giao gợi ý cho ${teamLabel} (${qLabel}).`);
              fetchAdminHints(undefined, contestId).then((h) => !isCancelled && setHints(h.hintRequests)).catch(() => {});
              fetchAdminLeaderboard(contestId).then((lb) => !isCancelled && setLeaderboard(lb.leaderboard)).catch(() => {});
            } else if (payload.type === 'HINT_REFUNDED') {
              showToast(`↩ Hoàn điểm phạt gợi ý cho ${teamLabel} (${qLabel}).`);
              fetchAdminHints(undefined, contestId).then((h) => !isCancelled && setHints(h.hintRequests)).catch(() => {});
              fetchAdminLeaderboard(contestId).then((lb) => !isCancelled && setLeaderboard(lb.leaderboard)).catch(() => {});
            } else if (payload.type === 'SUBMISSION_CREATED') {
              const isCorrect = payload.isCorrect;
              const attemptText = payload.attemptNumber ? ` (Lần ${payload.attemptNumber})` : '';
              if (isCorrect) {
                showToast(`✅ ${teamLabel} vừa nộp ĐÚNG ${qLabel}${attemptText}!`);
                adminSound.playSuccessChime();
              } else {
                showToast(`❌ ${teamLabel} vừa nộp SAI ${qLabel}${attemptText}`);
                adminSound.playWarning();
              }

              if (payload.teamId) {
                setHighlightedTeamId(payload.teamId);
                setTimeout(() => setHighlightedTeamId(null), 4000);
              }

              fetchAdminLeaderboard(contestId)
                .then((lb) => !isCancelled && setLeaderboard(lb.leaderboard))
                .catch(() => {});

              fetchAdminSubmissions({
                contestId,
                questionNumber: subQuestionFilter ? Number(subQuestionFilter) : undefined,
                status: subStatusFilter || undefined,
              })
                .then((sData) => {
                  if (isCancelled) return;
                  setSubmissions(sData.submissions);
                  if (sData.submissions.length > 0) {
                    setHighlightedSubId(sData.submissions[0].id);
                    setTimeout(() => setHighlightedSubId(null), 4000);
                  }
                })
                .catch(() => {});
            } else if (payload.type === 'RISK_MOVE_ACTIVATED') {
              showToast(`⚡ ${teamLabel} kích hoạt NƯỚC CỜ MẠO HIỂM tại ${qLabel}!`);
              adminSound.playWarning();
              fetchAdminLeaderboard(contestId).then((lb) => !isCancelled && setLeaderboard(lb.leaderboard)).catch(() => {});
            } else if (payload.type === 'SCORE_ADJUSTED' || payload.type === 'SUBMISSION_REVIEWED') {
              if (payload.teamId) {
                setHighlightedTeamId(payload.teamId);
                setTimeout(() => setHighlightedTeamId(null), 4000);
              }
              fetchAdminLeaderboard(contestId).then((lb) => !isCancelled && setLeaderboard(lb.leaderboard)).catch(() => {});
              if (activeTab === 'SUBMISSIONS') {
                fetchAdminSubmissions({
                  contestId,
                  questionNumber: subQuestionFilter ? Number(subQuestionFilter) : undefined,
                  status: subStatusFilter || undefined,
                }).then((s) => !isCancelled && setSubmissions(s.submissions)).catch(() => {});
              }
            } else if (payload.type === 'CONTEST_STATUS_CHANGED') {
              fetchAdminContests().then((c) => !isCancelled && Array.isArray(c) && setContests(c)).catch(() => {});
            } else if (payload.type === 'ANNOUNCEMENT') {
              showToast(`📢 [THÔNG BÁO] ${payload.message || ''}`);
            } else {
              loadAllAdminData(true);
            }
          } catch {
            // Heartbeat or parse error
          }
        };
      } catch {
        if (!isCancelled) setSseStatus('DISCONNECTED');
      }
    }

    return () => {
      isCancelled = true;
      clearInterval(timer);
      es?.close();
    };
  }, [contestId, activeTab, subQuestionFilter, subStatusFilter, loadAllAdminData, reconnectCounter]);

  const currentContest = contests.find((c) => c.id === contestId);
  const pendingHintsCount = hints.filter((h) => h.status === 'REQUESTED').length;

  const handleConfirmDelivery = async (hintId: number, delivered: boolean) => {
    try {
      await confirmAdminHintDelivery(hintId, delivered);
      showToast(
        delivered
          ? `✓ Đã xác nhận bàn giao gợi ý #${hintId} cho đội thi (áp dụng điểm trừ).`
          : `✓ Đã xác nhận CHƯA bàn giao gợi ý #${hintId} (điểm phạt đã hoàn lại cho đội).`
      );
      await loadAllAdminData(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái bàn giao gợi ý');
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
      showToast(`✓ Đã điều chỉnh điểm cho đội ${adjustTeam.teamName}.`);
      setAdjustTeam(null);
      setAdjReason('');
      await loadAllAdminData(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể điều chỉnh điểm đội thi');
    } finally {
      setAdjSubmitting(false);
    }
  };

  const handleSaveAnswerKeys = async (questionNumber: number) => {
    const parsedInvAnswers: Record<string, string[]> = {};
    for (const [k, txt] of Object.entries(editingInvAnswersText)) {
      const lines = txt
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        parsedInvAnswers[k] = lines;
      }
    }

    let parsed = editingAnswersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (Object.keys(parsedInvAnswers).length > 0) {
      const primaryAnswers = Object.values(parsedInvAnswers)
        .map((arr) => arr[0])
        .filter(Boolean);
      if (primaryAnswers.length > 0) {
        parsed = primaryAnswers;
      }
    }

    if (parsed.length === 0) {
      showToast('Vui lòng nhập ít nhất một đáp án hợp lệ.');
      return;
    }
    setAnswersSubmitting(true);
    try {
      await updateAdminQuestionAnswers(
        questionNumber,
        parsed,
        contestId,
        Object.keys(parsedInvAnswers).length > 0 ? parsedInvAnswers : undefined
      );
      showToast(`✓ Đã lưu bộ đáp án chuẩn cho Câu hỏi ${questionNumber}.`);
      setEditingQ(null);
      await loadAllAdminData(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể lưu đáp án chuẩn');
    } finally {
      setAnswersSubmitting(false);
    }
  };

  const handleToggleContest = async (cId: string) => {
    setActionLoading(true);
    try {
      const targetContest = contests.find((c) => c.id === cId);
      const nextIsActive = targetContest ? !targetContest.is_active : undefined;
      const updated = await toggleAdminContest(cId, nextIsActive);
      showToast(`Đã ${updated.is_active ? 'BẬT (Mở cửa)' : 'TẮT (Tạm dừng)'} đấu trường "${updated.title}".`);
      const cData = await fetchAdminContests().catch(() => []);
      if (Array.isArray(cData)) setContests(cData);
      await loadAllAdminData(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể thay đổi trạng thái đấu trường');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteStopThisContest = async () => {
    setActionLoading(true);
    try {
      const updated = await stopAdminContest(contestId);
      showToast(`✓ Đã DỪNG & ĐẶT LẠI toàn bộ tiến độ của "${updated.title}".`);
      setConfirmStopThisContest(false);
      const cData = await fetchAdminContests().catch(() => []);
      if (Array.isArray(cData)) setContests(cData);
      await loadAllAdminData(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể dừng đấu trường');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Hints
  const filteredHints = useMemo(() => {
    return hints.filter((h) => {
      if (hintStatusFilter === 'REQUESTED' && h.status !== 'REQUESTED') return false;
      if (hintStatusFilter === 'DELIVERED' && h.status !== 'DELIVERED') return false;
      if (hintStatusFilter === 'NOT_DELIVERED' && (h.status === 'REQUESTED' || h.status === 'DELIVERED')) return false;
      if (hintSearchQuery.trim()) {
        const q = hintSearchQuery.toLowerCase().trim();
        const matchTeam = h.team_name?.toLowerCase().includes(q) || h.username?.toLowerCase().includes(q);
        const matchQ = `câu ${h.question_number}`.includes(q) || h.question_title?.toLowerCase().includes(q);
        return matchTeam || matchQ;
      }
      return true;
    });
  }, [hints, hintStatusFilter, hintSearchQuery]);

  // Filtered Leaderboard
  const filteredLeaderboard = useMemo(() => {
    if (!teamSearchQuery.trim()) return leaderboard;
    const q = teamSearchQuery.toLowerCase().trim();
    return leaderboard.filter(
      (e) => e.teamName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)
    );
  }, [leaderboard, teamSearchQuery]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    if (!subTeamQuery.trim()) return submissions;
    const q = subTeamQuery.toLowerCase().trim();
    return submissions.filter((s) => s.team_name?.toLowerCase().includes(q));
  }, [submissions, subTeamQuery]);

  // Submissions summary KPIs
  const subStats = useMemo(() => {
    const total = filteredSubmissions.length;
    const accepted = filteredSubmissions.filter((s) => s.status === 'ACCEPTED').length;
    const rejected = total - accepted;
    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, rejected, acceptRate };
  }, [filteredSubmissions]);

  return (
    <main className="cp-admin-shell" aria-label="Bàn điều khiển quản trị đấu trường">
      {/* ─── 1. TOP MISSION CONTROL RIBBON & ARENA OVERVIEW ─── */}
      <section
        style={{
          borderBottom: '2px solid var(--border-strong)',
          backgroundColor: 'var(--color-surface)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top Control Bar: Switch Arena | Title | Status | Quick Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Left: Switch Button & Arena Identification */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="cp-btn-secondary"
              onClick={onSwitchContest}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.5px',
              }}
              title="Quay lại giao diện lựa chọn đấu trường"
            >
              <span>←</span>
              <span>ĐỔI ĐẤU TRƯỜNG</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 900,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.5px',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {currentContest?.title || contestId.toUpperCase()}
              </h2>

              <span
                className="cp-key-badge cp-key-pk"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '2px 6px',
                }}
                title="Cơ sở dữ liệu đích của đấu trường này"
              >
                DB: {currentContest?.target_database || (contestId === 'training' ? 'contestdb' : 'parallax_c1')}
              </span>

              <span
                className={`cp-sticker-badge ${
                  currentContest?.is_active
                    ? 'cp-sticker-badge-success'
                    : 'cp-sticker-badge-error'
                }`}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                {currentContest?.is_active ? '● ĐANG MỞ CỬA' : '✕ ĐANG TẠM DỪNG'}
              </span>
            </div>
          </div>

          {/* Right: Arena Operations & Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={currentContest?.is_active ? 'cp-btn-secondary' : 'cp-btn-primary'}
              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}
              onClick={() => handleToggleContest(contestId)}
              disabled={actionLoading}
              title={
                currentContest?.is_active
                  ? 'Tạm dừng đấu trường (chặn truy cập thí sinh nhưng giữ nguyên tiến độ)'
                  : 'Mở cửa đấu trường cho thí sinh truy cập'
              }
            >
              {currentContest?.is_active ? '⏸ TẠM DỪNG' : '▶ BẬT / TIẾP TỤC'}
            </button>

            <button
              type="button"
              className="cp-btn-danger"
              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}
              onClick={() => setConfirmStopThisContest(true)}
              disabled={actionLoading}
              title="Dừng đấu trường và xóa sạch toàn bộ tiến độ của các đội thi trong đấu trường này"
            >
              ⏹ DỪNG &amp; RESET
            </button>

            <div
              style={{
                height: '20px',
                width: '1px',
                backgroundColor: 'var(--border-soft)',
                margin: '0 4px',
              }}
            />

            <button
              type="button"
              className={`cp-live-indicator cp-live-indicator-${sseStatus.toLowerCase()}`}
              onClick={() => {
                if (sseStatus === 'DISCONNECTED') {
                  setReconnectCounter((prev) => prev + 1);
                }
              }}
              style={{
                cursor: sseStatus === 'DISCONNECTED' ? 'pointer' : 'default',
                background: 'none',
              }}
              title={
                sseStatus === 'CONNECTED'
                  ? 'Thời gian thực đã kết nối (SSE)'
                  : sseStatus === 'CONNECTING'
                  ? 'Đang kết nối lại máy chủ SSE...'
                  : 'Mất kết nối máy chủ - Nhấn để kết nối lại'
              }
            >
              <span className="cp-live-dot" />
              <span>
                {sseStatus === 'CONNECTED'
                  ? 'LIVE REALTIME'
                  : sseStatus === 'CONNECTING'
                  ? 'KẾT NỐI LẠI...'
                  : 'MẤT KẾT NỐI (THỬ LẠI)'}
              </span>
            </button>

            <button
              type="button"
              className="cp-btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={toggleSound}
              title={soundEnabled ? 'Nhấn để tắt chuông âm thanh thông báo' : 'Nhấn để bật chuông âm thanh thông báo'}
            >
              <span>{soundEnabled ? '🔔 ÂM BẬT' : '🔕 ÂM TẮT'}</span>
            </button>

            <button
              type="button"
              className="cp-btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: showActivityFeed ? 'var(--color-primary)' : undefined,
                color: showActivityFeed ? '#ffffff' : undefined,
              }}
              onClick={() => setShowActivityFeed((prev) => !prev)}
              title="Bật/Tắt bảng sự kiện trực tiếp của thí sinh"
            >
              <span>📡 LIVE FEED</span>
              {liveEvents.length > 0 && (
                <span
                  style={{
                    backgroundColor: showActivityFeed ? 'rgba(255,255,255,0.3)' : 'var(--badge-success-bg)',
                    color: showActivityFeed ? '#fff' : 'var(--badge-success-text)',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    fontSize: '10px',
                  }}
                >
                  {liveEvents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className="cp-btn-secondary"
              style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
              onClick={() => loadAllAdminData(false)}
              disabled={loading || actionLoading}
              title="Tải lại toàn bộ dữ liệu quản trị"
            >
              {loading ? 'ĐANG TẢI...' : '⟳ LÀM MỚI'}
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
          }}
        >
          {/* Card 1: Teams */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-sunken)',
              border: '1px solid var(--border-soft)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                ĐỘI THI ĐĂNG KÝ
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800 }}>
                {leaderboard.length || currentContest?.activeTeamCount || 0} đội
              </div>
            </div>
            <span style={{ fontSize: '18px', opacity: 0.8 }}>👥</span>
          </div>

          {/* Card 2: Pending Hints */}
          <div
            style={{
              backgroundColor: pendingHintsCount > 0 ? 'var(--tint-oxblood)' : 'var(--color-surface-sunken)',
              border: `1px solid ${pendingHintsCount > 0 ? 'var(--badge-error-border)' : 'var(--border-soft)'}`,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: pendingHintsCount > 0 ? 'var(--badge-error-text)' : 'var(--color-muted)',
                  textTransform: 'uppercase',
                  fontWeight: pendingHintsCount > 0 ? 700 : 400,
                }}
              >
                GỢI Ý CHỜ PHÁT
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: pendingHintsCount > 0 ? 'var(--badge-error-text)' : 'var(--color-ink)',
                }}
              >
                {pendingHintsCount} yêu cầu
              </div>
            </div>
            <span style={{ fontSize: '18px' }}>💡</span>
          </div>

          {/* Card 3: Submissions */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-sunken)',
              border: '1px solid var(--border-soft)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                TỔNG LƯỢT NỘP BÀI
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800 }}>
                {submissions.length} lượt
              </div>
            </div>
            <span style={{ fontSize: '18px', opacity: 0.8 }}>📋</span>
          </div>

          {/* Card 4: Questions in DB */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-sunken)',
              border: '1px solid var(--border-soft)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                CÂU HỎI TRONG ĐẤU TRƯỜNG
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800 }}>
                {questions.length || currentContest?.questionCount || 3} câu
              </div>
            </div>
            <span style={{ fontSize: '18px', opacity: 0.8 }}>🔑</span>
          </div>
        </div>

        {/* Live Activity Feed Drawer */}
        {showActivityFeed && (
          <div className="cp-live-feed-panel" style={{ marginTop: '4px', marginBottom: 0 }}>
            <div className="cp-live-feed-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cp-live-dot" style={{ backgroundColor: '#22c55e', width: '6px', height: '6px', borderRadius: '50%' }} />
                <span>NHẬT KÝ SỰ KIỆN TRỰC TIẾP (REALTIME LIVE TICKER)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                  {liveEvents.length} sự kiện gần nhất
                </span>
                <button
                  type="button"
                  onClick={() => setLiveEvents([])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: 'var(--color-muted)', fontWeight: 700 }}
                  title="Xóa nhật ký sự kiện"
                >
                  [XÓA FEED]
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivityFeed(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
                  title="Đóng bảng feed"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="cp-live-feed-list">
              {liveEvents.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  Chưa có sự kiện nào trong phiên hiện tại. Sự kiện nộp bài, gợi ý, mạo hiểm sẽ xuất hiện tự động theo thời gian thực.
                </div>
              ) : (
                liveEvents.map((evt) => (
                  <div key={evt.id} className="cp-live-feed-item">
                    <span className="cp-live-feed-time">
                      {new Date(evt.timestamp).toLocaleTimeString('vi-VN', { hour12: false })}
                    </span>
                    <span style={{ fontSize: '13px' }}>
                      {evt.type === 'HINT_REQUESTED' && '💡'}
                      {evt.type === 'HINT_DELIVERED' && '✓'}
                      {evt.type === 'HINT_REFUNDED' && '↩'}
                      {evt.type === 'SUBMISSION_CREATED' && (evt.isCorrect ? '✅' : '❌')}
                      {evt.type === 'RISK_MOVE_ACTIVATED' && '⚡'}
                      {evt.type === 'SCORE_ADJUSTED' && '⚖️'}
                      {evt.type === 'ANNOUNCEMENT' && '📢'}
                      {evt.type === 'CONTEST_STATUS_CHANGED' && '🏁'}
                    </span>
                    <div style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>
                      <strong>{evt.teamName || (evt.teamId ? `Đội ${evt.teamId}` : 'Hệ thống')}:</strong>{' '}
                      {evt.type === 'HINT_REQUESTED' && `Yêu cầu gợi ý ${evt.hintType || ''} Câu ${evt.questionNumber} (-${evt.penalty || 10}đ)`}
                      {evt.type === 'HINT_DELIVERED' && `Đã bàn giao gợi ý Câu ${evt.questionNumber}`}
                      {evt.type === 'HINT_REFUNDED' && `Hoàn điểm phạt gợi ý Câu ${evt.questionNumber}`}
                      {evt.type === 'SUBMISSION_CREATED' && (evt.isCorrect ? `Nộp ĐÚNG Câu ${evt.questionNumber} (Lần ${evt.attemptNumber || 1})` : `Nộp SAI Câu ${evt.questionNumber} (Lần ${evt.attemptNumber || 1})`)}
                      {evt.type === 'RISK_MOVE_ACTIVATED' && `Kích hoạt Nước cờ mạo hiểm tại Câu ${evt.questionNumber}`}
                      {evt.type === 'SCORE_ADJUSTED' && `Điều chỉnh điểm số`}
                      {evt.type === 'ANNOUNCEMENT' && evt.message}
                      {evt.type === 'CONTEST_STATUS_CHANGED' && `Thay đổi trạng thái đấu trường (${evt.action || ''})`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─── 2. TAB NAVIGATION BAR ─── */}
      <nav
        className="cp-admin-nav"
        aria-label="Admin Section Navigation"
        style={{
          padding: '8px 16px 0 16px',
          borderBottom: '1px solid var(--border-strong)',
        }}
      >
        <div className="cp-icon-tab-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'HINTS'}
            className={`cp-icon-tab-btn ${activeTab === 'HINTS' ? 'cp-icon-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('HINTS')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>💡 HÀNG ĐỢI GỢI Ý (REAL-LIFE)</span>
            {pendingHintsCount > 0 ? (
              <span
                className="cp-sticker-badge cp-sticker-badge-error"
                style={{ padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}
              >
                {pendingHintsCount} MỚI
              </span>
            ) : (
              <span style={{ fontSize: '11px', opacity: 0.7 }}>({hints.length})</span>
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
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🏆 BẢNG XẾP HẠNG &amp; TIẾN ĐỘ</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>({leaderboard.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SUBMISSIONS'}
            className={`cp-icon-tab-btn ${
              activeTab === 'SUBMISSIONS' ? 'cp-icon-tab-btn-active' : ''
            }`}
            onClick={() => setActiveTab('SUBMISSIONS')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📋 NHẬT KÝ NỘP BÀI</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>({submissions.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ANSWERS'}
            className={`cp-icon-tab-btn ${
              activeTab === 'ANSWERS' ? 'cp-icon-tab-btn-active' : ''
            }`}
            onClick={() => setActiveTab('ANSWERS')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🔑 ĐÁP ÁN CHUẨN TRONG DB</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>({questions.length})</span>
          </button>
        </div>
      </nav>

      {/* ─── 3. TAB CONTENT WORKSTATION ─── */}
      <div className="cp-admin-content" style={{ padding: '16px' }}>
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: REAL-LIFE HINT DELIVERY QUEUE                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'HINTS' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'column',
                gap: '12px',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h2 className="cp-ribbon-title" style={{ fontSize: '14px', margin: 0 }}>
                    HÀNG ĐỢI PHÁT MANH MỐI NGOÀI ĐỜI THẬT (REAL-LIFE HINT DELIVERY)
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Điểm số của đội thi đã bị trừ tự động ngay khi bấm yêu cầu. Ban tổ chức kiểm tra và xác nhận phát phong bì gợi ý thực tế tại bàn thi.
                  </div>
                </div>

                <span
                  className={`cp-sticker-badge ${
                    pendingHintsCount > 0 ? 'cp-sticker-badge-running' : 'cp-sticker-badge-success'
                  }`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  {pendingHintsCount > 0 ? `⏳ CẦN PHÁT NGAY: ${pendingHintsCount}` : '✓ TẤT CẢ ĐÃ ĐƯỢC XỬ LÝ'}
                </span>
              </div>

              {/* Filter Pills & Team Search Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  backgroundColor: 'var(--color-surface-sunken)',
                  padding: '8px 10px',
                  border: '1px solid var(--border-soft)',
                }}
              >
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={hintStatusFilter === 'ALL' ? 'cp-btn-primary' : 'cp-btn-secondary'}
                    style={{ padding: '3px 10px', fontSize: '11px' }}
                    onClick={() => setHintStatusFilter('ALL')}
                  >
                    TẤT CẢ ({hints.length})
                  </button>

                  <button
                    type="button"
                    className={hintStatusFilter === 'REQUESTED' ? 'cp-btn-primary' : 'cp-btn-secondary'}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: pendingHintsCount > 0 ? 800 : 400,
                    }}
                    onClick={() => setHintStatusFilter('REQUESTED')}
                  >
                    ⏳ CHỜ PHÁT ({pendingHintsCount})
                  </button>

                  <button
                    type="button"
                    className={hintStatusFilter === 'DELIVERED' ? 'cp-btn-primary' : 'cp-btn-secondary'}
                    style={{ padding: '3px 10px', fontSize: '11px' }}
                    onClick={() => setHintStatusFilter('DELIVERED')}
                  >
                    ✓ ĐÃ PHÁT ({hints.filter((h) => h.status === 'DELIVERED').length})
                  </button>

                  <button
                    type="button"
                    className={hintStatusFilter === 'NOT_DELIVERED' ? 'cp-btn-primary' : 'cp-btn-secondary'}
                    style={{ padding: '3px 10px', fontSize: '11px' }}
                    onClick={() => setHintStatusFilter('NOT_DELIVERED')}
                  >
                    ✕ HỦY / KHÔNG PHÁT ({hints.filter((h) => h.status !== 'REQUESTED' && h.status !== 'DELIVERED').length})
                  </button>
                </div>

                {/* Search Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    className="cp-input"
                    style={{ fontSize: '11px', padding: '4px 8px', width: '220px' }}
                    placeholder="🔍 Tìm theo tên đội hoặc câu hỏi..."
                    value={hintSearchQuery}
                    onChange={(e) => setHintSearchQuery(e.target.value)}
                  />
                  {hintSearchQuery && (
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      style={{ padding: '3px 6px', fontSize: '10px' }}
                      onClick={() => setHintSearchQuery('')}
                      title="Xóa bộ lọc tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Mã #</th>
                    <th>Đội thi</th>
                    <th>Câu hỏi</th>
                    <th>Cấp độ gợi ý</th>
                    <th>Điểm trừ</th>
                    <th>Thời điểm yêu cầu</th>
                    <th>Trạng thái</th>
                    <th style={{ minWidth: '220px' }}>Thao tác Ban tổ chức</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHints.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>💡</div>
                        Không có yêu cầu gợi ý nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredHints.map((hr) => {
                      const isPending = hr.status === 'REQUESTED';

                      return (
                        <tr
                          key={hr.id}
                          className={highlightedHintId === hr.id ? 'cp-row-highlight-warning' : undefined}
                          style={{
                            backgroundColor: isPending ? 'var(--tint-brass)' : undefined,
                            borderLeft: isPending ? '4px solid var(--color-primary)' : undefined,
                          }}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{hr.id}</td>
                          <td>
                            <strong>{hr.team_name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{hr.username}</div>
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
                              {hr.hint_type === 'HIGH' ? 'GỢI Ý LỚN (HIGH)' : 'GỢI Ý NHỎ (LOW)'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--badge-error-text)' }}>
                            -{hr.deducted_points || hr.suggested_penalty} pts
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            {new Date(hr.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </td>
                          <td>
                            <span
                              className={[
                                'cp-sticker-badge',
                                hr.status === 'DELIVERED'
                                  ? 'cp-sticker-badge-success'
                                  : isPending
                                  ? 'cp-sticker-badge-running'
                                  : 'cp-sticker-badge-error',
                              ].join(' ')}
                              style={{ fontSize: '10px' }}
                            >
                              {hr.status === 'DELIVERED'
                                ? '✓ ĐÃ GIAO'
                                : isPending
                                ? '⏳ CHỜ GIAO THỰC TẾ'
                                : '✕ CHƯA GIAO (ĐÃ HOÀN ĐIỂM)'}
                            </span>
                          </td>
                          <td>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="cp-btn-primary"
                                  style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
                                  onClick={() => handleConfirmDelivery(hr.id, true)}
                                  title="Xác nhận đã bàn giao gợi ý thực tế cho đội thi"
                                >
                                  ✓ ĐÃ GIAO THỰC TẾ
                                </button>
                                <button
                                  type="button"
                                  className="cp-btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '11px' }}
                                  onClick={() => handleConfirmDelivery(hr.id, false)}
                                  title="Xác nhận chưa/không giao gợi ý trong thực tế (Hoàn lại 100% điểm phạt cho đội)"
                                >
                                  ✕ CHƯA GIAO (HOÀN ĐIỂM)
                                </button>
                              </div>
                            ) : hr.status === 'DELIVERED' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                  Đã giao lúc {hr.decided_at ? new Date(hr.decided_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—'}
                                </span>
                                <button
                                  type="button"
                                  className="cp-btn-secondary"
                                  style={{ padding: '2px 6px', fontSize: '10px' }}
                                  title="Đổi thành chưa giao thực tế và hoàn trả điểm phạt cho đội thi"
                                  onClick={() => handleConfirmDelivery(hr.id, false)}
                                >
                                  ✕ Chưa giao (Hoàn điểm)
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                  Đã hoàn điểm (0 pts phạt)
                                </span>
                                <button
                                  type="button"
                                  className="cp-btn-primary"
                                  style={{ padding: '2px 6px', fontSize: '10px' }}
                                  title="Xác nhận đã giao thực tế và áp dụng điểm trừ"
                                  onClick={() => handleConfirmDelivery(hr.id, true)}
                                >
                                  ✓ Đã giao thực tế
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: LIVE LEADERBOARD, DYNAMIC QUESTION MATRIX & SCORE CONTROL    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'LEADERBOARD' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'column',
                gap: '12px',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h2 className="cp-ribbon-title" style={{ fontSize: '14px', margin: 0 }}>
                    BẢNG XẾP HẠNG &amp; MA TRẬN TIẾN ĐỘ THÍ SINH
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Thứ hạng: Điểm hiện có (Giảm dần) → Điểm trừ Penalty (Tăng dần) → Tổng thời gian giải án (Tăng dần).
                  </div>
                </div>

                {/* Team Search Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    className="cp-input"
                    style={{ fontSize: '11px', padding: '4px 8px', width: '220px' }}
                    placeholder="🔍 Tìm kiếm đội thi hoặc email..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                  />
                  {teamSearchQuery && (
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      style={{ padding: '3px 6px', fontSize: '10px' }}
                      onClick={() => setTeamSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    ({filteredLeaderboard.length}/{leaderboard.length} đội)
                  </span>
                </div>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Hạng</th>
                    <th style={{ minWidth: '160px' }}>Đội thi</th>
                    <th style={{ width: '90px' }}>Tiến độ</th>

                    {/* DYNAMIC QUESTION COLUMNS based strictly on questions belonging to this contest */}
                    {questions.map((q) => (
                      <th
                        key={q.question_number}
                        style={{ textAlign: 'center', minWidth: '75px' }}
                        title={`Câu hỏi ${q.question_number}: ${q.title} (${q.base_points} điểm)`}
                      >
                        Q{q.question_number}
                      </th>
                    ))}

                    <th style={{ minWidth: '100px' }}>Tổng thời gian</th>
                    <th style={{ minWidth: '80px' }}>Penalty</th>
                    <th style={{ minWidth: '95px' }}>Điểm số</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={7 + questions.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>
                        Không tìm thấy đội thi nào phù hợp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((entry) => (
                      <tr
                        key={entry.teamId}
                        className={highlightedTeamId === entry.teamId ? 'cp-row-highlight-success' : undefined}
                      >
                        <td
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 900,
                            fontSize: '13px',
                            color: entry.rank <= 3 ? 'var(--color-primary)' : 'var(--color-ink)',
                          }}
                        >
                          #{entry.rank}
                        </td>
                        <td>
                          <strong>{entry.teamName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{entry.email}</div>
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
                              title={`Lần cuối giải đúng lúc ${new Date(entry.progress.lastAcceptedAt).toLocaleString()}`}
                            >
                              ⏱ {new Date(entry.progress.lastAcceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                            </div>
                          )}
                        </td>

                        {/* DYNAMIC QUESTION STATUS CELLS */}
                        {questions.map((q) => {
                          const qs = entry.questionStatuses?.find((item) => item.questionNumber === q.question_number);
                          const isDone = qs?.status === 'DONE';
                          const isFailed = qs?.status === 'FAILED';
                          const attempts = qs?.attemptsUsed ?? 0;
                          const solvedTime = isDone && qs?.completedAt ? new Date(qs.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : null;

                          return (
                            <td
                              key={q.question_number}
                              style={{
                                textAlign: 'center',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '11px',
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <span
                                  className={[
                                    'cp-sticker-badge',
                                    isDone ? 'cp-sticker-badge-success' : isFailed ? 'cp-sticker-badge-error' : '',
                                  ].join(' ')}
                                  style={{ padding: '2px 5px', fontSize: '10px' }}
                                  title={`Q${q.question_number}: ${qs?.status || 'NOT_DONE'} (${attempts}/6 lần)${isDone ? ` | +${qs?.earnedGrossPoints} điểm` : ''}${solvedTime ? ` lúc ${solvedTime}` : ''}`}
                                >
                                  {isDone ? `✓ +${qs?.earnedGrossPoints}` : isFailed ? '✕' : '·'}
                                  {qs?.riskMoveActive ? ' ★' : ''}
                                  {attempts > 1 ? ` (${attempts})` : ''}
                                </span>
                                {solvedTime && (
                                  <span style={{ fontSize: '9px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                                    {solvedTime}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Time Column */}
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: entry.totalTimeSpentFormatted && entry.totalTimeSpentFormatted !== '—' ? 'var(--color-primary)' : 'var(--color-muted)',
                          }}
                        >
                          {entry.totalTimeSpentFormatted && entry.totalTimeSpentFormatted !== '—' ? (
                            <span>⏱ {entry.totalTimeSpentFormatted}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>

                        {/* Penalty Column */}
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--badge-error-text)',
                            fontWeight: 700,
                          }}
                        >
                          -{entry.totalPenalty}
                        </td>

                        {/* Held Score Column */}
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <span
                            className="cp-sticker-badge cp-sticker-badge-score"
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 6px',
                            }}
                          >
                            {entry.score ?? entry.finalScore} PTS
                          </span>
                        </td>

                        {/* Adjust Trigger */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="cp-btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 600 }}
                            onClick={() => setAdjustTeam(entry)}
                            title={`Mở bảng điều chỉnh điểm cho đội ${entry.teamName}`}
                          >
                            ± ĐIỀU CHỈNH
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Centered Modal: Ergonomic Score Adjustment */}
            {adjustTeam && (
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
                onClick={() => setAdjustTeam(null)}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--border-strong)',
                    boxShadow: '6px 6px 0px var(--color-frame-ink)',
                    maxWidth: '560px',
                    width: '100%',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div
                    className="cp-ribbon-header"
                    style={{
                      borderBottom: '1px solid var(--border-strong)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <strong className="cp-ribbon-title" style={{ fontSize: '13px' }}>
                      ± ĐIỀU CHỈNH ĐIỂM THỦ CÔNG: {adjustTeam.teamName}
                    </strong>
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      style={{ padding: '1px 6px', fontSize: '11px' }}
                      onClick={() => setAdjustTeam(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAdjustScoreSubmit} style={{ padding: '16px' }}>
                    {/* Current Team Status Banner */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-sunken)',
                        border: '1px solid var(--border-soft)',
                        padding: '10px 12px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>ĐỘI THI ĐƯỢC CHỌN</div>
                        <strong>{adjustTeam.teamName}</strong> ({adjustTeam.email})
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        <div>Điểm hiện tại: <strong style={{ color: 'var(--color-primary)' }}>{adjustTeam.score ?? adjustTeam.finalScore} pts</strong></div>
                        <div style={{ color: 'var(--badge-error-text)', fontSize: '11px' }}>Tổng phạt: -{adjustTeam.totalPenalty} pts</div>
                      </div>
                    </div>

                    {/* Adjustment Type */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                        LOẠI ĐIỀU CHỈNH
                      </label>
                      <select
                        className="cp-input"
                        value={adjType}
                        onChange={(e) => setAdjType(e.target.value as any)}
                        style={{ width: '100%' }}
                      >
                        <option value="DIRECT_BONUS">CỘNG ĐIỂM THỦ CÔNG (+)</option>
                        <option value="DIRECT_PENALTY">TRỪ ĐIỂM THỦ CÔNG (-)</option>
                        <option value="UNDERGROUND_DEAL">THƯƠNG VỤ NGẦM / MUA MANH MỐI (-)</option>
                        <option value="CHEAT_PENALTY">PHẠT GIAN LẬN QUY CHẾ (-)</option>
                        <option value="RISK_MOVE_PENALTY">PHẠT THUA NƯỚC CỜ MẠO HIỂM (-)</option>
                      </select>
                    </div>

                    {/* Quick Points Preset Buttons */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                        SỐ ĐIỂM ÁP DỤNG
                      </label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {[5, 10, 15, 20, 25, 50, 100].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            className={adjPoints === pts ? 'cp-btn-primary' : 'cp-btn-secondary'}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setAdjPoints(pts)}
                          >
                            {adjType === 'DIRECT_BONUS' ? `+${pts}` : `-${pts}`}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        className="cp-input"
                        value={adjPoints}
                        onChange={(e) => setAdjPoints(Number(e.target.value))}
                        required
                        style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>

                    {/* Reason / Audit Log Note */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                        LÝ DO / GHI CHÚ NHẬT KÝ KIỂM TOÁN
                      </label>
                      <input
                        type="text"
                        className="cp-input"
                        placeholder="Ví dụ: Thưởng giải mật mã phụ, mua manh mối đặc biệt..."
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        className="cp-btn-secondary"
                        onClick={() => setAdjustTeam(null)}
                        disabled={adjSubmitting}
                      >
                        HỦY BỎ
                      </button>
                      <button
                        type="submit"
                        className="cp-btn-primary"
                        disabled={adjSubmitting}
                        style={{ padding: '6px 16px', fontWeight: 700 }}
                      >
                        {adjSubmitting ? 'ĐANG ÁP DỤNG...' : 'XÁC NHẬN ĐIỀU CHỈNH'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: SUBMISSIONS LOG (AUTO-GRADED SQL ATTEMPTS)                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'SUBMISSIONS' && (
          <section className="cp-dossier-card">
            <header
              className="cp-dossier-header"
              style={{
                flexDirection: 'column',
                gap: '12px',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h2 className="cp-ribbon-title" style={{ fontSize: '14px', margin: 0 }}>
                    NHẬT KÝ NỘP BÀI TRUY VẤN SQL (INSTANT AUTO-CHECKED)
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Hệ thống tự động so khớp tức thời với bộ đáp án chuẩn trong database ngay khi thí sinh bấm gửi.
                  </div>
                </div>

                {/* Submissions KPI Mini Bar */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="cp-sticker-badge cp-sticker-badge-score">
                    TỔNG: {subStats.total}
                  </span>
                  <span className="cp-sticker-badge cp-sticker-badge-success">
                    ✓ ĐÚNG: {subStats.accepted}
                  </span>
                  <span className="cp-sticker-badge cp-sticker-badge-error">
                    ✕ SAI: {subStats.rejected}
                  </span>
                  <span className="cp-sticker-badge" style={{ fontFamily: 'var(--font-mono)' }}>
                    TỈ LỆ ĐÚNG: {subStats.acceptRate}%
                  </span>
                </div>
              </div>

              {/* Filter Toolbar: Dynamic Question Selector | Status | Team Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  backgroundColor: 'var(--color-surface-sunken)',
                  padding: '8px 10px',
                  border: '1px solid var(--border-soft)',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* DYNAMIC Question Filter dropdown */}
                  <select
                    className="cp-input"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    value={subQuestionFilter}
                    onChange={(e) => setSubQuestionFilter(e.target.value)}
                    aria-label="Lọc theo câu hỏi"
                  >
                    <option value="">Tất cả câu hỏi ({questions.length} câu)</option>
                    {questions.map((q) => (
                      <option key={q.question_number} value={q.question_number}>
                        Câu {q.question_number}: {q.title}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    className="cp-input"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    value={subStatusFilter}
                    onChange={(e) => setSubStatusFilter(e.target.value)}
                    aria-label="Lọc theo kết quả"
                  >
                    <option value="">Tất cả kết quả</option>
                    <option value="ACCEPTED">✓ ACCEPTED (Chấp nhận)</option>
                    <option value="REJECTED">✕ REJECTED (Từ chối)</option>
                  </select>
                </div>

                {/* Team Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    className="cp-input"
                    style={{ fontSize: '11px', padding: '4px 8px', width: '220px' }}
                    placeholder="🔍 Lọc theo tên đội thi..."
                    value={subTeamQuery}
                    onChange={(e) => setSubTeamQuery(e.target.value)}
                  />
                  {subTeamQuery && (
                    <button
                      type="button"
                      className="cp-btn-secondary"
                      style={{ padding: '3px 6px', fontSize: '10px' }}
                      onClick={() => setSubTeamQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table className="cp-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Mã #</th>
                    <th>Đội thi</th>
                    <th>Câu hỏi</th>
                    <th style={{ textAlign: 'center' }}>Lần thử</th>
                    <th>Nội dung đáp án đã gửi</th>
                    <th style={{ textAlign: 'center' }}>Mạo hiểm</th>
                    <th style={{ textAlign: 'center' }}>Kết quả tự động</th>
                    <th>Thời điểm nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-muted)' }}>
                        Không có lượt nộp bài nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const isAccepted = sub.status === 'ACCEPTED';

                      return (
                        <tr
                          key={sub.id}
                          className={
                            highlightedSubId === sub.id
                              ? isAccepted
                                ? 'cp-row-highlight-success'
                                : 'cp-row-highlight-warning'
                              : undefined
                          }
                        >
                          <td style={{ fontFamily: 'var(--font-mono)' }}>#{sub.id}</td>
                          <td>
                            <strong>{sub.team_name}</strong>
                          </td>
                          <td>
                            Câu {sub.question_number} ({sub.base_points}đ)
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                            {sub.attempt_number}/6
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              wordBreak: 'break-all',
                            }}
                          >
                            {sub.answer_content}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {sub.risk_move_used ? (
                              <span className="cp-key-badge cp-key-pk" title="Đội thi kích hoạt Nước cờ mạo hiểm (2X)">
                                ★ 2X RISK
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={[
                                'cp-sticker-badge',
                                isAccepted ? 'cp-sticker-badge-success' : 'cp-sticker-badge-error',
                              ].join(' ')}
                            >
                              {isAccepted ? '✓ ACCEPTED' : '✕ REJECTED'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: DATABASE ANSWER KEYS CONFIGURATION                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ANSWERS' && (
          <section className="cp-dossier-card">
            <header className="cp-dossier-header" style={{ padding: '12px 16px' }}>
              <div>
                <h2 className="cp-ribbon-title" style={{ fontSize: '14px', margin: 0 }}>
                  BỘ ĐÁP ÁN CHUẨN TRONG CƠ SỞ DỮ LIỆU (QUESTIONS.ACCEPTED_ANSWERS)
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  Các câu hỏi trong đấu trường <strong>{currentContest?.title || contestId.toUpperCase()}</strong>. Thí sinh được so khớp trực tiếp với danh sách này.
                </div>
              </div>
            </header>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions.map((q) => {
                const isEditing = editingQ === q.question_number;

                return (
                  <div
                    key={q.question_number}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: '2px 2px 0px var(--color-frame-ink)',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--border-soft)',
                        paddingBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="cp-sticker-badge cp-sticker-badge-score">
                          MẢNH GHÉP SỐ {String(q.question_number).padStart(2, '0')}
                        </span>
                        <strong style={{ fontSize: '14px' }}>{q.title}</strong>
                        {q.target_database && (
                          <span className="cp-sticker-badge" style={{ fontSize: '10px' }}>
                            🗄️ {q.target_database}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                          ({q.base_points} điểm | Tối đa 6 lần nộp)
                        </span>
                      </div>

                      <div>
                        {!isEditing && (
                          <button
                            type="button"
                            className="cp-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600 }}
                            onClick={() => {
                              setEditingQ(q.question_number);
                              setEditingAnswersText((q.accepted_answers || []).join('\n'));
                              const invMap: Record<string, string> = {};
                              if (Array.isArray(q.investigations)) {
                                q.investigations.forEach((inv, idx) => {
                                  const key = String(inv.key ?? (idx === 0 ? 'A' : 'B'));
                                  invMap[key] = (inv.acceptedAnswers || []).join('\n');
                                });
                              }
                              setEditingInvAnswersText(invMap);
                            }}
                          >
                            ✎ CHỈNH SỬA ĐÁP ÁN
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Story & Database Note */}
                    {(q.story || q.content) && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-surface-sunken)',
                          border: '1px solid var(--border-soft)',
                          borderLeft: '3px solid var(--color-primary)',
                          padding: '10px 12px',
                          marginBottom: '12px',
                          fontSize: '12px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '4px', color: 'var(--color-primary)' }}>
                          📜 DẪN TRUYỆN:
                        </div>
                        <div>{q.story || q.content}</div>
                        {Array.isArray(q.case_dossier?.related_tables) && q.case_dossier.related_tables.length > 0 && (
                          <div style={{ marginTop: '8px', fontStyle: 'italic', fontWeight: 700 }}>
                            {q.question_number === 1 ? 'Bảng hiện có: ' : 'Bảng mở thêm: '}
                            <span style={{ fontFamily: 'var(--font-mono)' }}>
                              {q.case_dossier.related_tables.join(', ')}.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-Investigation Details (Manh mối A & B) */}
                    {Array.isArray(q.investigations) && q.investigations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                        {q.investigations.map((inv, invIdx) => {
                          const invKey = String(inv.key ?? (invIdx === 0 ? 'A' : 'B'));
                          return (
                            <div
                              key={invKey}
                              style={{
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--color-canvas)',
                                padding: '10px 12px',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                  MANH MỐI {invKey} ({inv.basePoints ?? 50} PTS)
                                </strong>
                                {inv.submissionFormat && (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)' }}>
                                    Định dạng: <strong>{inv.submissionFormat}</strong>
                                  </span>
                                )}
                              </div>
                              {inv.clue && (
                                <div style={{ whiteSpace: 'pre-wrap', marginBottom: '6px', lineHeight: 1.5 }}>
                                  {inv.clue}
                                </div>
                              )}
                              {inv.image && (
                                <div style={{ marginBottom: '8px' }}>
                                  <img
                                    src={inv.image}
                                    alt={`Manh mối ${invKey}`}
                                    style={{
                                      maxHeight: '180px',
                                      maxWidth: '100%',
                                      objectFit: 'contain',
                                      border: '1px solid var(--border-color)',
                                    }}
                                  />
                                </div>
                              )}
                              {inv.taskDescription && (
                                <div style={{ marginBottom: '6px' }}>
                                  <strong>Nhiệm vụ:</strong> {inv.taskDescription}
                                </div>
                              )}

                              {isEditing ? (
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                                    ĐÁP ÁN CHẤP NHẬN CHO MANH MỐI {invKey} (mỗi dòng 1 biến thể):
                                  </div>
                                  <textarea
                                    className="cp-input"
                                    rows={Math.max(3, (inv.acceptedAnswers || []).length)}
                                    style={{
                                      width: '100%',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '12px',
                                      lineHeight: '1.5',
                                    }}
                                    value={editingInvAnswersText[invKey] ?? ''}
                                    onChange={(e) =>
                                      setEditingInvAnswersText((prev) => ({
                                        ...prev,
                                        [invKey]: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)' }}>
                                    Đáp án (BTC):
                                  </span>
                                  {(inv.acceptedAnswers || []).map((ans: string, aIdx: number) => (
                                    <span
                                      key={aIdx}
                                      className="cp-q-hint-trigger"
                                      style={{
                                        fontFamily: 'var(--font-mono)',
                                        cursor: 'default',
                                        fontSize: '11px',
                                        padding: '2px 7px',
                                      }}
                                    >
                                      {ans}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isEditing ? (
                      <div>
                        {(!Array.isArray(q.investigations) || q.investigations.length === 0) && (
                          <>
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>
                              ℹ Nhập mỗi đáp án hợp lệ trên một dòng riêng. Hệ thống tự động bỏ qua khoảng trắng thừa và không phân biệt hoa thường khi so khớp:
                            </div>
                            <textarea
                              className="cp-input"
                              rows={Math.max(4, (q.accepted_answers || []).length + 1)}
                              style={{
                                width: '100%',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                lineHeight: '1.6',
                                marginBottom: '10px',
                              }}
                              value={editingAnswersText}
                              onChange={(e) => setEditingAnswersText(e.target.value)}
                              placeholder="Nhập mỗi đáp án chấp nhận trên 1 dòng..."
                            />
                          </>
                        )}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="cp-btn-secondary"
                            onClick={() => setEditingQ(null)}
                            disabled={answersSubmitting}
                          >
                            HỦY
                          </button>
                          <button
                            type="button"
                            className="cp-btn-primary"
                            onClick={() => handleSaveAnswerKeys(q.question_number)}
                            disabled={answersSubmitting}
                            style={{ fontWeight: 700 }}
                          >
                            {answersSubmitting ? 'ĐANG LƯU...' : 'LƯU BỘ ĐÁP ÁN'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>
                          ĐÁP ÁN CHUẨN TỔNG HỢP ({(q.accepted_answers || []).length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(q.accepted_answers || []).map((ans: string, idx: number) => (
                            <span
                              key={idx}
                              className="cp-q-hint-trigger"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                cursor: 'default',
                                fontSize: '11px',
                                padding: '3px 8px',
                              }}
                            >
                              {ans}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ─── 4. CONFIRMATION MODAL: STOP & RESET CONTEST ─── */}
      {confirmStopThisContest && (
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
          onClick={() => setConfirmStopThisContest(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--border-strong)',
              boxShadow: '6px 6px 0px var(--color-frame-ink)',
              maxWidth: '520px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
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
                  ⚠️ XÁC NHẬN DỪNG &amp; ĐẶT LẠI TIẾN ĐỘ ĐẤU TRƯỜNG
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
                Bạn có chắc chắn muốn <strong>DỪNG VÀ XÓA SẠCH TIẾN ĐỘ</strong> của đấu trường{' '}
                <strong>{currentContest?.title || contestId.toUpperCase()}</strong>?
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
                  onClick={() => setConfirmStopThisContest(false)}
                  disabled={actionLoading}
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  className="cp-btn-danger"
                  onClick={handleExecuteStopThisContest}
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

      {/* Toast Notification Container */}
      {toastMsg && (
        <div
          className="cp-toast"
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '460px',
            padding: '10px 14px',
            zIndex: 9999,
          }}
        >
          <div style={{ flex: 1, lineHeight: 1.4 }}>{toastMsg}</div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: '12px',
              padding: '2px 4px',
              lineHeight: 1,
            }}
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
};
