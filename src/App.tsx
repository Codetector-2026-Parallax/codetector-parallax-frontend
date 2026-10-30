import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  AUTH_SYNC_EVENT_KEY,
  activateQuestionRiskMove,
  fetchCurrentUser,
  fetchErdMetadata,
  fetchQuestionDetail,
  fetchQuestionsList,
  fetchUnlockedDatabases,
  getActiveContestId,
  getApiUrl,
  getStoredMetabaseSession,
  getStoredToken,
  logoutSession,
  requestQuestionHint,
  setActiveContestId,
  setStoredMetabaseSession,
  submitQuestionAnswer,
  syncSessionFromMetabase,
} from './api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopBanner } from './components/TopBanner';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AuthLogin = lazy(() =>
  import('./components/AuthLogin').then((m) => ({ default: m.AuthLogin }))
);
const ContestSelectPage = lazy(() =>
  import('./components/ContestSelectPage').then((m) => ({ default: m.ContestSelectPage }))
);
const CaseRecordView = lazy(() =>
  import('./components/CaseRecordView').then((m) => ({ default: m.CaseRecordView }))
);
const ErdCanvas = lazy(() =>
  import('./components/ErdCanvas').then((m) => ({ default: m.ErdCanvas }))
);
const QuestionSidebar = lazy(() =>
  import('./components/QuestionSidebar').then((m) => ({ default: m.QuestionSidebar }))
);
import { applyTheme, getInitialTheme, initThemeSync, type ThemeMode } from './theme/theme';
import type {
  AuthUser,
  ContestErdMetadata,
  QuestionDetailData,
  QuestionSummaryItem,
  TeamProgressInfo,
  TeamScoreSummary,
} from './types';

// Bounded pane dimension limits to guarantee components never override, eclipse, or squash each other
const MIN_SIDEBAR_WIDTH = 330;
const MAX_SIDEBAR_WIDTH = 550;
const DEFAULT_SIDEBAR_WIDTH = 350;

const MIN_DOSSIER_WIDTH = 460;
const MAX_DOSSIER_WIDTH = 1400;
const DEFAULT_DOSSIER_WIDTH = 520;

const MIN_ERD_WIDTH = 550;
const MAX_ERD_WIDTH = 1600;
const SPLITTER_WIDTH = 6;

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeContestId, setActiveContestIdState] = useState<string>(() => getActiveContestId());
  const [showContestSelectPage, setShowContestSelectPage] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('cp_arena_chosen') !== 'true';
    } catch {
      return true;
    }
  });
  const [adminContestId, setAdminContestId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('cp_admin_contest');
    } catch {
      return null;
    }
  });

  // Hide / Unhide Pieces List state (persisted to localStorage)
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cp_sidebar_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cp_sidebar_hidden', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Resizable Border Widths (Sidebar <-> Dossiers <-> ERD)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cp_sidebar_width'));
    return saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH ? saved : DEFAULT_SIDEBAR_WIDTH;
  });
  const [dossierWidth, setDossierWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem('cp_dossier_width'));
    return saved >= MIN_DOSSIER_WIDTH && saved <= MAX_DOSSIER_WIDTH ? saved : DEFAULT_DOSSIER_WIDTH;
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

  // ERD State (lazy-initialized only after active contest unlocks are fetched)
  const [erd, setErd] = useState<ContestErdMetadata | null>(null);
  const [erdLoading, setErdLoading] = useState(false);
  const [highlightedTable, setHighlightedTable] = useState<string | null>(null);
  const [unlockedDatabases, setUnlockedDatabases] = useState<string[]>([]);
  const [activeDatabase, setActiveDatabase] = useState<string>('');
  const erdCacheRef = useRef<Record<string, ContestErdMetadata>>({});
  const lastRealtimeSyncRef = useRef<number>(0);

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
          ? '🌙 THEME: MIDNIGHT INVESTIGATION'
          : '☀️ THEME: VINTAGE INVESTIGATION ARCHIVE'
      );
      return next;
    });
  }, [showToast]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Synchronize theme changes across tabs/windows (e.g. SQL Editor <-> Case Record Portal)
  useEffect(() => {
    return initThemeSync((syncedTheme) => {
      setTheme(syncedTheme);
    });
  }, []);

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

  // Dynamically clamp sidebar & dossier widths on window resize so neither overrides the other or squeezes out ERD
  useEffect(() => {
    const handleResize = () => {
      const container = workstationRef.current;
      if (!container) return;
      const totalW = container.clientWidth;
      if (totalW > 0) {
        const curSidebar = isSidebarHidden ? 0 : sidebarWidth;
        const splitters = isSidebarHidden ? SPLITTER_WIDTH : SPLITTER_WIDTH * 2;

        // Ensure dossier does not push ERD below MIN_ERD_WIDTH
        const maxDossierAllowed = Math.max(
          MIN_DOSSIER_WIDTH,
          Math.min(MAX_DOSSIER_WIDTH, totalW - curSidebar - splitters - MIN_ERD_WIDTH)
        );
        if (dossierWidth > maxDossierAllowed) {
          setDossierWidth(maxDossierAllowed);
        }

        // Ensure sidebar does not push dossier + ERD below their minimums
        if (!isSidebarHidden) {
          const maxSidebarAllowed = Math.max(
            MIN_SIDEBAR_WIDTH,
            Math.min(MAX_SIDEBAR_WIDTH, totalW - MIN_DOSSIER_WIDTH - MIN_ERD_WIDTH - splitters)
          );
          if (sidebarWidth > maxSidebarAllowed) {
            setSidebarWidth(maxSidebarAllowed);
          }
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth, dossierWidth, isSidebarHidden]);

  // Drag border between Questions List and Dossiers
  const handleSidebarBorderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = workstationRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const splitters = SPLITTER_WIDTH * 2;
    setActiveResizer('sidebar');

    const onMove = (moveEvent: MouseEvent) => {
      const rawWidth = Math.round(moveEvent.clientX - rect.left);
      const maxAllowedByContainer = rect.width - MIN_DOSSIER_WIDTH - MIN_ERD_WIDTH - splitters;
      const maxAllowed = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, maxAllowedByContainer));
      const clampedSidebar = Math.min(maxAllowed, Math.max(MIN_SIDEBAR_WIDTH, rawWidth));
      setSidebarWidth(clampedSidebar);

      // Dynamically adjust dossier down if needed to safeguard ERD minimum
      const maxDossierWithNewSidebar = rect.width - clampedSidebar - splitters - MIN_ERD_WIDTH;
      setDossierWidth((prev) => {
        if (prev > maxDossierWithNewSidebar) {
          return Math.max(MIN_DOSSIER_WIDTH, maxDossierWithNewSidebar);
        }
        return prev;
      });
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
    const effectiveSidebar = isSidebarHidden ? 0 : sidebarWidth;
    const leftOffset = effectiveSidebar + (isSidebarHidden ? 0 : SPLITTER_WIDTH);
    setActiveResizer('dossier');

    const onMove = (moveEvent: MouseEvent) => {
      const rawWidth = Math.round(moveEvent.clientX - rect.left - leftOffset);
      const maxAllowedByErdMin = rect.width - leftOffset - SPLITTER_WIDTH - MIN_ERD_WIDTH;
      const minAllowedByErdMax = rect.width - leftOffset - SPLITTER_WIDTH - MAX_ERD_WIDTH;
      const minDossier = Math.max(MIN_DOSSIER_WIDTH, minAllowedByErdMax);
      const maxDossier = Math.max(minDossier, Math.min(MAX_DOSSIER_WIDTH, maxAllowedByErdMin));
      const clampedDossier = Math.min(maxDossier, Math.max(minDossier, rawWidth));
      setDossierWidth(clampedDossier);
    };

    const onUp = () => {
      setActiveResizer(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Check existing session on load (supporting Metabase session parameters and cookie SSO)
  useEffect(() => {
    let sessionFromUrl: string | null = null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      sessionFromUrl = urlParams.get('session');
      if (sessionFromUrl) {
        setStoredMetabaseSession(sessionFromUrl);
        urlParams.delete('session');
        const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const cleanUrl = `${window.location.pathname}${cleanQuery}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {
      // ignore URL parsing errors
    }

    const checkAndInitUser = async () => {
      let res = await fetchCurrentUser();
      if (!res?.user) {
        // Try sync from Metabase session (from URL, cookie, or localStorage)
        const syncRes = await syncSessionFromMetabase(sessionFromUrl || undefined);
        if (syncRes?.user) {
          res = await fetchCurrentUser();
        }
      }

      if (res?.user) {
        setUser(res.user);
        if (res.user.role === 'USER') {
          const arenaChosen = sessionStorage.getItem('cp_arena_chosen');
          setShowContestSelectPage(arenaChosen !== 'true');
        } else if (res.user.role === 'ADMIN') {
          const savedAdminContest = sessionStorage.getItem('cp_admin_contest');
          setShowContestSelectPage(!savedAdminContest);
        }
      }
    };

    checkAndInitUser().finally(() => {
      setBootstrapping(false);
    });
  }, []);

  // Synchronize login/logout across browser tabs instantly
  useEffect(() => {
    const handleStorageEvent = (evt: StorageEvent) => {
      if (evt.key === AUTH_SYNC_EVENT_KEY && evt.newValue) {
        try {
          const eventData = JSON.parse(evt.newValue);
          if (eventData.action === 'LOGOUT') {
            setUser(null);
            setAdminContestId(null);
            setShowContestSelectPage(false);
            setQuestions([]);
            setQuestionDetail(null);
            try {
              sessionStorage.removeItem('cp_arena_chosen');
              sessionStorage.removeItem('cp_admin_contest');
            } catch {
              // ignore
            }
          } else if (eventData.action === 'LOGIN') {
            fetchCurrentUser().then((res) => {
              if (res?.user) {
                setUser(res.user);
              }
            });
          }
        } catch {
          // ignore parsing errors
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const loadErdForDb = useCallback(async (dbName: string, force: boolean = false) => {
    if (!force && erdCacheRef.current[dbName]) {
      setErd(erdCacheRef.current[dbName]);
      return;
    }
    setErdLoading(true);
    try {
      const erdData = await fetchErdMetadata(dbName);
      erdCacheRef.current[dbName] = erdData;
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
          const highestUnlockedDb =
            unlockData.activeDatabase ||
            unlockData.unlockedDatabases[unlockData.unlockedDatabases.length - 1] ||
            '';
          setActiveDatabase((prevActive) => {
            const nextActive = highestUnlockedDb || prevActive;
            try {
              localStorage.setItem('cp_active_database', nextActive);
              localStorage.setItem('cp_unlocked_dbs', JSON.stringify(unlockData.unlockedDatabases));
              localStorage.setItem('cp_db_sync_timestamp', String(Date.now()));
            } catch {
              // ignore storage quota
            }
            return nextActive;
          });
        }
        if (autoSelectCurrent && data.progress?.currentQuestionNumber) {
          const targetQ = Math.max(1, data.progress.currentQuestionNumber);
          setSelectedQ(targetQ);
        }
      } catch (err: any) {
        if (err?.code === 'CONTEST_INACTIVE' || err?.message?.includes('tạm dừng') || err?.message?.includes('chưa mở cửa')) {
          try {
            sessionStorage.removeItem('cp_arena_chosen');
          } catch {
            // ignore
          }
          setShowContestSelectPage(true);
        }
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
          setActiveDatabase((prevActive) => prevActive || tDb);
        }
      } catch (err: any) {
        if (err?.code === 'CONTEST_INACTIVE' || err?.message?.includes('tạm dừng') || err?.message?.includes('chưa mở cửa')) {
          try {
            sessionStorage.removeItem('cp_arena_chosen');
          } catch {
            // ignore
          }
          setShowContestSelectPage(true);
        }
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

  // Sync ERD schema lazily ONLY when inside the Contestant Workstation and activeDatabase is resolved
  useEffect(() => {
    if (!user || user.role !== 'USER' || showContestSelectPage || !activeDatabase) return;
    loadErdForDb(activeDatabase);
  }, [user, showContestSelectPage, activeDatabase, loadErdForDb]);

  // Load Contestant workspace data lazily ONLY when inside the Workstation & subscribe to real-time SSE
  useEffect(() => {
    if (!user || user.role !== 'USER' || showContestSelectPage) return;
    lastRealtimeSyncRef.current = Date.now();
    loadContestantOverview(true, false);

    const refreshRealtimeState = () => {
      lastRealtimeSyncRef.current = Date.now();
      loadContestantOverview(false, false);
      loadSelectedQuestionDetail(selectedQRef.current, true);
    };

    // Low-frequency fallback sync (every 180s when tab is visible); primary updates arrive via SSE
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshRealtimeState();
      }
    }, 180000);

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
          if (payload.type === 'CONTEST_STATUS_CHANGED') {
            if (
              payload.contestId === activeContestId &&
              (!payload.isActive || payload.action === 'PAUSE' || payload.action === 'STOP')
            ) {
              try {
                sessionStorage.removeItem('cp_arena_chosen');
              } catch {
                // ignore
              }
              setQuestions([]);
              setQuestionDetail(null);
              setErd(null);
              setUnlockedDatabases([]);
              setActiveDatabase('');
              setShowContestSelectPage(true);
              showToast(
                `Đấu trường "${
                  payload.contestId === 'training' ? 'Huấn Luyện SQL' : 'Đại Án Parallax'
                }" đã bị ${
                  payload.action === 'STOP' ? 'DỪNG & ĐẶT LẠI TIẾN ĐỘ' : 'TẠM DỪNG'
                } bởi Ban tổ chức.`
              );
              return;
            }
          }
          if (payload.type && payload.type !== 'CONNECTED') {
            refreshRealtimeState();
          }
        } catch {
          // ignore heartbeat
        }
      };
    }

    const handleWindowFocus = () => {
      if (Date.now() - lastRealtimeSyncRef.current > 60000) {
        refreshRealtimeState();
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(timer);
      es?.close();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user, showContestSelectPage, activeContestId, loadContestantOverview, loadSelectedQuestionDetail]);

  // Lazy-load the selected question's full dossier only after overview confirms the question is unlocked
  useEffect(() => {
    if (!user || user.role !== 'USER' || showContestSelectPage) return;
    if (questions.length === 0) return;
    const selectedItem = questions.find((q) => q.questionNumber === selectedQ);
    if (selectedItem && !selectedItem.isUnlocked) return;
    loadSelectedQuestionDetail(selectedQ, false);
  }, [user, showContestSelectPage, activeContestId, selectedQ, questions, loadSelectedQuestionDetail]);

  const handleSelectContest = useCallback(
    (contestId: string) => {
      if (user?.role === 'ADMIN') {
        setAdminContestId(contestId);
        try {
          sessionStorage.setItem('cp_admin_contest', contestId);
        } catch {
          // ignore
        }
        setShowContestSelectPage(false);
        showToast(
          `Đang chuyển sang quản trị ${
            contestId === 'training'
              ? 'Đấu Trường Huấn Luyện SQL'
              : 'Đại Án Parallax (Chính Thức)'
          }`
        );
        return;
      }

      try {
        sessionStorage.setItem('cp_arena_chosen', 'true');
      } catch {
        // ignore storage errors
      }
      setQuestions([]);
      setQuestionDetail(null);
      setErd(null);
      setUnlockedDatabases([]);
      setActiveDatabase('');
      setActiveContestId(contestId);
      setActiveContestIdState(contestId);
      setSelectedQ(1);
      setShowContestSelectPage(false);
      showToast(
        `Đã vào ${
          contestId === 'training'
            ? 'Đấu Trường Huấn Luyện SQL'
            : 'Đại Án Parallax (Chính Thức)'
        }`
      );
    },
    [user, showToast]
  );

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('cp_arena_chosen');
      sessionStorage.removeItem('cp_admin_contest');
    } catch {
      // ignore
    }
    await logoutSession();
    setUser(null);
    setAdminContestId(null);
    setShowContestSelectPage(false);
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
      await loadContestantOverview(false, false);
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
    investigationIndex?: number,
    useRiskMove: boolean = false
  ) => {
    try {
      const res: any = await submitQuestionAnswer(questionNumber, answerContent, investigationIndex, useRiskMove);
      if (Array.isArray(res?.unlockedDatabases) && res.unlockedDatabases.length > 0) {
        setUnlockedDatabases(res.unlockedDatabases);
      }
      if (res?.activeDatabase) {
        setActiveDatabase(res.activeDatabase);
      }
      showToast(res.feedbackMessage);
      await loadContestantOverview(false, false);
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
        `Activated Nước cờ mạo hiểm on Question ${questionNumber}!`
      );
      await loadContestantOverview(false, false);
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
      <Suspense fallback={null}>
        <AuthLogin
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            if (loggedInUser.role === 'USER') {
              try {
                sessionStorage.removeItem('cp_arena_chosen');
              } catch {
                // ignore
              }
              setShowContestSelectPage(true);
            } else if (loggedInUser.role === 'ADMIN') {
              setAdminContestId(null);
              try {
                sessionStorage.removeItem('cp_admin_contest');
              } catch {
                // ignore
              }
              setShowContestSelectPage(true);
            }
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  if (showContestSelectPage || (user.role === 'ADMIN' && !adminContestId)) {
    return (
      <Suspense fallback={null}>
        <ContestSelectPage
          user={user}
          currentContestId={user.role === 'ADMIN' ? (adminContestId || 'official') : activeContestId}
          onSelectContest={handleSelectContest}
          onBackToWorkstation={
            user.role === 'ADMIN' && adminContestId
              ? () => setShowContestSelectPage(false)
              : user.role === 'USER' && sessionStorage.getItem('cp_arena_chosen') === 'true'
              ? () => setShowContestSelectPage(false)
              : undefined
          }
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  return (
    <div className="cp-page-frame">
      <div className="cp-frame-inner">
        <TopBanner
          user={user}
          progress={progress}
          scoreSummary={scoreSummary}
          activeContestId={user.role === 'ADMIN' ? (adminContestId || 'official') : activeContestId}
          onOpenContestSelect={() => {
            if (user.role === 'ADMIN') {
              setAdminContestId(null);
              try {
                sessionStorage.removeItem('cp_admin_contest');
              } catch {
                // ignore
              }
            }
            setShowContestSelectPage(true);
          }}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {user.role === 'ADMIN' ? (
          <ErrorBoundary panelName="Admin Dashboard">
            <Suspense fallback={<div style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>Đang tải bảng điều khiển quản trị...</div>}>
              <AdminDashboard
                contestId={adminContestId || 'official'}
                onSwitchContest={() => {
                  setAdminContestId(null);
                  try {
                    sessionStorage.removeItem('cp_admin_contest');
                  } catch {
                    // ignore
                  }
                  setShowContestSelectPage(true);
                }}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Suspense fallback={<div style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>Đang tải không gian điều tra...</div>}>
            <main
              ref={workstationRef}
              className={`cp-user-workstation ${activeResizer ? 'cp-is-resizing-col' : ''}`}
            >
              {/* 1. Questions List Sidebar (Hideable) */}
              {!isSidebarHidden && (
                <>
                  <ErrorBoundary panelName="Question Sidebar">
                    <QuestionSidebar
                      style={{
                        width: `${sidebarWidth}px`,
                        minWidth: `${MIN_SIDEBAR_WIDTH}px`,
                        maxWidth: `${MAX_SIDEBAR_WIDTH}px`,
                        flexShrink: 0,
                      }}
                      questions={questions}
                      progress={progress}
                      scoreSummary={scoreSummary}
                      selectedQuestionNumber={selectedQ}
                      onSelectQuestion={(qNum) => setSelectedQ(qNum)}
                      onActivateRiskMove={handleActivateRiskMove}
                      onToggleHide={toggleSidebar}
                    />
                  </ErrorBoundary>

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
              <ErrorBoundary panelName="Case Record Dossier">
                <CaseRecordView
                  style={{
                    width: `${dossierWidth}px`,
                    minWidth: `${MIN_DOSSIER_WIDTH}px`,
                    maxWidth: `${MAX_DOSSIER_WIDTH}px`,
                    height: '100%',
                    maxHeight: '100%',
                    minHeight: 0,
                    flexShrink: 0,
                  }}
                  detail={questionDetail}
                  loading={detailLoading}
                  error={detailError}
                  isLiveConnected={isLiveConnected}
                  onSubmitAnswer={handleSubmitAnswer}
                  onRequestHint={handleRequestHint}
                  onActivateRiskMove={handleActivateRiskMove}
                  requestingHintKey={requestingHintKey}
                  onSelectRelatedTable={(tbl) => setHighlightedTable(tbl)}
                  onNavigateQuestion={(qNum) => setSelectedQ(qNum)}
                  isSidebarHidden={isSidebarHidden}
                  onToggleSidebar={toggleSidebar}
                />
              </ErrorBoundary>

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
              <ErrorBoundary panelName="ERD Canvas">
                <ErdCanvas
                  style={{
                    minWidth: `${MIN_ERD_WIDTH}px`,
                    maxWidth: `${MAX_ERD_WIDTH}px`,
                    flex: 1,
                    flexShrink: 0,
                  }}
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
              </ErrorBoundary>
            </main>
          </Suspense>
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

