import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  activateQuestionRiskMove,
  fetchCurrentUser,
  fetchErdMetadata,
  fetchQuestionDetail,
  fetchQuestionsList,
  fetchUnlockedDatabases,
  getApiUrl,
  getStoredToken,
  logoutSession,
  requestQuestionHint,
  submitQuestionAnswer,
} from './api';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthLogin } from './components/AuthLogin';
import { CaseRecordView } from './components/CaseRecordView';
import { ErdCanvas } from './components/ErdCanvas';
import { QuestionSidebar } from './components/QuestionSidebar';
import { TopBanner } from './components/TopBanner';
import { applyTheme, getInitialTheme, type ThemeMode } from './theme/theme';
import type {
  AuthUser,
  ContestErdMetadata,
  QuestionDetailData,
  QuestionSummaryItem,
  TeamProgressInfo,
  TeamScoreSummary,
} from './types';

const DEFAULT_SIDEBAR_WIDTH = 285;
const DEFAULT_DOSSIER_WIDTH = 460;

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Questions List Sidebar Hide/Unhide State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Resizable Border Widths (Sidebar <-> Dossiers <-> ERD)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cp_sidebar_width'));
    return saved >= 220 && saved <= 450 ? saved : DEFAULT_SIDEBAR_WIDTH;
  });
  const [dossierWidth, setDossierWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cp_dossier_width'));
    return saved >= 300 && saved <= 900 ? saved : DEFAULT_DOSSIER_WIDTH;
  });
  const [activeResizer, setActiveResizer] = useState<'sidebar' | 'dossier' | null>(null);
  const workstationRef = useRef<HTMLElement | null>(null);

  // Contestant State
  const [questions, setQuestions] = useState<QuestionSummaryItem[]>([]);
  const [progress, setProgress] = useState<TeamProgressInfo | null>(null);
  const [scoreSummary, setScoreSummary] = useState<TeamScoreSummary | null>(null);
  const [selectedQ, setSelectedQ] = useState<number>(1);
  const selectedQRef = useRef<number>(1);
  selectedQRef.current = selectedQ;

  const [questionDetail, setQuestionDetail] = useState<QuestionDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [requestingHintKey, setRequestingHintKey] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // ERD State
  const [erd, setErd] = useState<ContestErdMetadata | null>(null);
  const [erdLoading, setErdLoading] = useState(false);
  const [highlightedTable, setHighlightedTable] = useState<string | null>(null);
  const [unlockedDatabases, setUnlockedDatabases] = useState<string[]>(['parallax_c1']);
  const [activeDatabase, setActiveDatabase] = useState<string>('parallax_c1');

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(
        next === 'dark'
          ? '🌙 DISPLAY MODE: DARK EDITION'
          : '☀️ DISPLAY MODE: LIGHT EDITION'
      );
      return next;
    });
  }, [showToast]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('cp_sidebar_width', String(sidebarWidth));
    } catch {
      // ignore storage errors
    }
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      localStorage.setItem('cp_dossier_width', String(dossierWidth));
    } catch {
      // ignore storage errors
    }
  }, [dossierWidth]);

  // Drag border between Questions List and Dossiers
  const handleSidebarBorderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = workstationRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setActiveResizer('sidebar');

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.round(moveEvent.clientX - rect.left);
      const clamped = Math.min(440, Math.max(220, nextWidth));
      setSidebarWidth(clamped);
    };

    const onUp = () => {
      setActiveResizer(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Drag border between Dossiers and ERD
  const handleDossierErdBorderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = workstationRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const leftOffset = isSidebarOpen ? sidebarWidth + 6 : 0;
    setActiveResizer('dossier');

    const onMove = (moveEvent: MouseEvent) => {
      const rawWidth = Math.round(moveEvent.clientX - rect.left - leftOffset);
      const maxAllowed = Math.max(360, rect.width - leftOffset - 320);
      const clamped = Math.min(maxAllowed, Math.max(300, rawWidth));
      setDossierWidth(clamped);
    };

    const onUp = () => {
      setActiveResizer(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Check existing session on load
  useEffect(() => {
    fetchCurrentUser()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
        }
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []);

  const loadErdForDb = useCallback(async (dbName: string) => {
    setErdLoading(true);
    try {
      const erdData = await fetchErdMetadata(dbName);
      setErd(erdData);
    } catch {
      // ignore
    } finally {
      setErdLoading(false);
    }
  }, []);

  const loadContestantOverview = useCallback(
    async (autoSelectCurrent: boolean = false, silent: boolean = false) => {
      try {
        const [data, unlockData] = await Promise.all([
          fetchQuestionsList(),
          fetchUnlockedDatabases().catch(() => null),
        ]);
        setQuestions(data.questions);
        setProgress(data.progress);
        setScoreSummary(data.scoreSummary);
        if (unlockData && unlockData.unlockedDatabases) {
          setUnlockedDatabases(unlockData.unlockedDatabases);
          setActiveDatabase((prev) =>
            unlockData.unlockedDatabases.includes(prev) ? prev : unlockData.activeDatabase || 'parallax_c1'
          );
        }
        if (autoSelectCurrent && data.progress?.currentQuestionNumber) {
          const targetQ = Math.min(8, Math.max(1, data.progress.currentQuestionNumber));
          setSelectedQ(targetQ);
        }
      } catch (err: any) {
        if (!silent) {
          showToast(err?.message || 'Failed to load contest progression');
        }
      }
    },
    [showToast]
  );

  const loadSelectedQuestionDetail = useCallback(
    async (qNum: number, silent: boolean = false) => {
      if (!silent) {
        setDetailLoading(true);
        setDetailError(null);
      }
      try {
        const d = await fetchQuestionDetail(qNum);
        setQuestionDetail(d);
        setDetailError(null);
        if (d?.question?.targetDatabase) {
          const tDb = d.question.targetDatabase;
          setUnlockedDatabases((prevUnlocked) => {
            if (prevUnlocked.includes(tDb)) {
              setActiveDatabase(tDb);
            }
            return prevUnlocked;
          });
        }
      } catch (err: any) {
        if (!silent) {
          setDetailError(err?.message || 'Unable to load question dossier');
        }
      } finally {
        if (!silent) {
          setDetailLoading(false);
        }
      }
    },
    []
  );

  // Sync ERD schema when activeDatabase changes
  useEffect(() => {
    if (!user || user.role !== 'USER') return;
    loadErdForDb(activeDatabase);
  }, [user, activeDatabase, loadErdForDb]);

  // Load Contestant workspace data & subscribe to real-time SSE + silent fallback sync
  useEffect(() => {
    if (!user || user.role !== 'USER') return;
    loadContestantOverview(true, false);

    const refreshRealtimeState = () => {
      loadContestantOverview(false, true);
      loadSelectedQuestionDetail(selectedQRef.current, true);
    };

    // Fast silent polling fallback (every 3.5s)
    const timer = setInterval(refreshRealtimeState, 3500);

    // Real-time Server-Sent Events (SSE) stream for immediate status & points updates
    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      const token = getStoredToken();
      const sseUrl = getApiUrl(token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events');
      es = new EventSource(sseUrl);
      es.onopen = () => setIsLiveConnected(true);
      es.onerror = () => setIsLiveConnected(false);
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.type && payload.type !== 'CONNECTED') {
            refreshRealtimeState();
          }
        } catch {
          // ignore heartbeat
        }
      };
    }

    const handleWindowFocus = () => refreshRealtimeState();
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(timer);
      es?.close();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, loadContestantOverview, loadSelectedQuestionDetail]);

  useEffect(() => {
    if (!user || user.role !== 'USER') return;
    loadSelectedQuestionDetail(selectedQ, false);
  }, [user, selectedQ, loadSelectedQuestionDetail]);

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    setQuestions([]);
    setQuestionDetail(null);
  };

  const handleRequestHint = async (questionNumber: number, hintType: 'LOW' | 'HIGH') => {
    const key = `${questionNumber}-${hintType}`;
    setRequestingHintKey(key);
    try {
      const res = await requestQuestionHint(questionNumber, hintType);
      showToast(
        res.alreadyRequested
          ? `Hint (${hintType}) for Question ${questionNumber} already requested.`
          : `Hint activated (${hintType}: -${res.hint.suggestedPenalty} pts directly decreased). BTC will deliver the hint in real life.`
      );
      await loadContestantOverview(false, true);
      if (selectedQ === questionNumber) {
        await loadSelectedQuestionDetail(questionNumber, true);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to request hint');
    } finally {
      setRequestingHintKey(null);
    }
  };

  const handleSubmitAnswer = async (
    questionNumber: number,
    answerContent: string,
    useRiskMove: boolean
  ) => {
    try {
      const res = await submitQuestionAnswer(questionNumber, answerContent, useRiskMove);
      showToast(
        res.isCorrect
          ? `✓ Correct! Question ${questionNumber} ACCEPTED!`
          : `✕ Incorrect (${res.remainingAttempts} attempts remaining).`
      );
      await loadContestantOverview(false, true);
      await loadSelectedQuestionDetail(questionNumber, true);
      return {
        isCorrect: res.isCorrect,
        feedbackMessage: res.feedbackMessage,
        nextQuestionUnlocked: res.nextQuestionUnlocked,
      };
    } catch (err: any) {
      showToast(err?.message || 'Submission failed');
      return null;
    }
  };

  const handleActivateRiskMove = async (questionNumber: number) => {
    try {
      await activateQuestionRiskMove(questionNumber);
      showToast(
        `★ Activated Nước cờ mạo hiểm on Question ${questionNumber} (calculated on correct answer or 6/6 failed attempts)!`
      );
      await loadContestantOverview(false, true);
      if (selectedQRef.current === questionNumber) {
        await loadSelectedQuestionDetail(questionNumber, true);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not activate Nước cờ mạo hiểm');
    }
  };

  if (bootstrapping) {
    return (
      <div className="cp-page-frame">
        <div
          className="cp-frame-inner"
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="cp-empty-card">
            <div className="cp-ribbon-header">
              <strong className="cp-ribbon-title">
                INITIALIZING CODETECTOR PARALLAX...
              </strong>
            </div>
            <div
              className="cp-empty-card-body"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
              }}
            >
              Establishing secure connection to JSClub Case Record Server...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLogin
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="cp-page-frame">
      <div className="cp-frame-inner">
        <TopBanner
          user={user}
          progress={progress}
          scoreSummary={scoreSummary}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {user.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : (
          <main
            ref={workstationRef}
            className={`cp-user-workstation ${activeResizer ? 'cp-is-resizing-col' : ''}`}
          >
            {/* 1. Questions List Sidebar */}
            {isSidebarOpen && (
              <>
                <QuestionSidebar
                  style={{ width: `${sidebarWidth}px`, minWidth: '220px', maxWidth: 'none' }}
                  questions={questions}
                  progress={progress}
                  scoreSummary={scoreSummary}
                  selectedQuestionNumber={selectedQ}
                  onSelectQuestion={(qNum) => setSelectedQ(qNum)}
                  onRequestHint={handleRequestHint}
                  requestingHintKey={requestingHintKey}
                  onActivateRiskMove={handleActivateRiskMove}
                />

                {/* Vertical Border Resizer: Questions List <-> Dossier */}
                <div
                  className={`cp-v-splitter ${
                    activeResizer === 'sidebar' ? 'cp-v-splitter-active' : ''
                  }`}
                  onMouseDown={handleSidebarBorderMouseDown}
                  onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
                  role="separator"
                  aria-orientation="vertical"
                  title="Drag border to resize Questions List & Dossier (Double-click to reset)"
                >
                  <div className="cp-v-splitter-grip" />
                </div>
              </>
            )}

            {/* 2. Combined Question Case Dossier & Submit Column */}
            <CaseRecordView
              style={{ width: `${dossierWidth}px`, minWidth: '300px', maxWidth: 'none' }}
              detail={questionDetail}
              loading={detailLoading}
              error={detailError}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              isLiveConnected={isLiveConnected}
              onSubmitAnswer={handleSubmitAnswer}
              onSelectRelatedTable={(tbl) => setHighlightedTable(tbl)}
              onNavigateQuestion={(qNum) => setSelectedQ(qNum)}
            />

            {/* Vertical Border Resizer: Dossiers <-> ERD */}
            <div
              className={`cp-v-splitter ${
                activeResizer === 'dossier' ? 'cp-v-splitter-active' : ''
              }`}
              onMouseDown={handleDossierErdBorderMouseDown}
              onDoubleClick={() => setDossierWidth(DEFAULT_DOSSIER_WIDTH)}
              role="separator"
              aria-orientation="vertical"
              title="Drag border to resize Dossier & ERD panels (Double-click to reset)"
            >
              <div className="cp-v-splitter-grip" />
            </div>

            {/* 3. Optimized Interactive Parallax Chapter ERD Canvas Column */}
            <ErdCanvas
              erd={erd}
              loading={erdLoading}
              highlightedTable={highlightedTable}
              onSelectTable={(tbl) => setHighlightedTable(tbl)}
              activeQuestionNumber={selectedQ}
              unlockedDatabases={unlockedDatabases}
              activeDatabase={activeDatabase}
              onSelectDatabase={(db) => {
                setActiveDatabase(db);
                loadErdForDb(db);
              }}
            />
          </main>
        )}

        {toastMsg && (
          <div className="cp-toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

