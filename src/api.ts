import type {
  AdminHintRequestRecord,
  ContestInfo,
  AdminQuestionConfig,
  AdminSubmissionRecord,
  AuthUser,
  ContestErdMetadata,
  LeaderboardEntry,
  QuestionDetailData,
  QuestionSummaryItem,
  SubmissionRecord,
  TeamProgressInfo,
  TeamScoreSummary,
  UnlockedDatabasesResponse,
} from './types';

const TOKEN_STORAGE_KEY = 'codetector_jwt';
const METABASE_SESSION_STORAGE_KEY = 'metabase_session_id';
export const AUTH_SYNC_EVENT_KEY = 'cp_auth_sync_event';
const CONTEST_STORAGE_KEY = 'active_contest_id';

export function getActiveContestId(): string {
  try {
    return localStorage.getItem(CONTEST_STORAGE_KEY) || 'official';
  } catch {
    return 'official';
  }
}

export function setActiveContestId(contestId: string): void {
  try {
    localStorage.setItem(CONTEST_STORAGE_KEY, contestId);
  } catch {
    // ignore storage errors
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export function getSqlEditorUrl(): string {
  const envUrl = (import.meta.env.VITE_SQL_EDITOR_URL || '').trim();
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('leintdo.id.vn')) {
      return 'https://codetector-sql.leintdo.id.vn';
    }
  }
  return 'http://localhost:3000';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getStoredMetabaseSession(): string | null {
  try {
    return localStorage.getItem(METABASE_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredMetabaseSession(sessionId: string | null): void {
  try {
    if (sessionId) {
      localStorage.setItem(METABASE_SESSION_STORAGE_KEY, sessionId);
    } else {
      localStorage.removeItem(METABASE_SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function broadcastAuthSync(action: 'LOGIN' | 'LOGOUT'): void {
  try {
    localStorage.setItem(AUTH_SYNC_EVENT_KEY, JSON.stringify({ action, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const mbSession = getStoredMetabaseSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Codetector-Client': 'parallax-web',
    'X-Contest-Id': getActiveContestId(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (mbSession) {
    headers['X-Metabase-Session'] = mbSession;
  }

  const res = await fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const errMsg = json?.error?.message || json?.message || `HTTP Error ${res.status}`;
    const err: any = new Error(errMsg);
    err.code = json?.error?.code;
    err.status = res.status;
    throw err;
  }

  return json.data as T;
}

export async function loginWithCredentials(
  usernameOrEmail: string,
  password: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Codetector-Client': 'parallax-web',
      },
      credentials: 'include',
      body: JSON.stringify({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return {
        ok: false,
        message: json?.error?.message || 'Invalid team email/username or password.',
      };
    }

    setStoredToken(json.data.token);
    if (json.data.metabaseSessionId) {
      setStoredMetabaseSession(json.data.metabaseSessionId);
    }
    broadcastAuthSync('LOGIN');
    return {
      ok: true,
      user: json.data.user as AuthUser,
    };
  } catch {
    return {
      ok: false,
      message: 'Network error connecting to Codetector Parallax server.',
    };
  }
}

export async function syncSessionFromMetabase(
  sessionId?: string
): Promise<{ token: string; user: AuthUser; metabaseSessionId?: string } | null> {
  try {
    const effectiveSessionId = sessionId || getStoredMetabaseSession() || undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Codetector-Client': 'parallax-web',
    };
    if (effectiveSessionId) {
      headers['X-Metabase-Session'] = effectiveSessionId;
    }

    const res = await fetch(getApiUrl('/api/auth/sync-session'), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(effectiveSessionId ? { sessionId: effectiveSessionId } : {}),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !json?.data?.token) {
      return null;
    }

    setStoredToken(json.data.token);
    if (json.data.metabaseSessionId) {
      setStoredMetabaseSession(json.data.metabaseSessionId);
    }
    return {
      token: json.data.token,
      user: json.data.user,
      metabaseSessionId: json.data.metabaseSessionId,
    };
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<{
  user: AuthUser;
  progress?: any;
  scoreSummary?: TeamScoreSummary;
} | null> {
  try {
    return await apiFetch('/api/auth/me?minimal=true');
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  const mbSession = getStoredMetabaseSession();
  try {
    await fetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(mbSession ? { 'X-Metabase-Session': mbSession } : {}),
      },
      credentials: 'include',
    });
  } catch {
    // ignore
  } finally {
    setStoredToken(null);
    setStoredMetabaseSession(null);
    broadcastAuthSync('LOGOUT');
  }
}

export async function fetchQuestionsList(): Promise<{
  progress: TeamProgressInfo;
  scoreSummary: TeamScoreSummary;
  questions: QuestionSummaryItem[];
}> {
  return apiFetch('/api/questions');
}

export async function fetchQuestionDetail(questionNumber: number): Promise<QuestionDetailData> {
  return apiFetch(`/api/questions/${questionNumber}`);
}

export async function submitQuestionAnswer(
  questionNumber: number,
  answerContent: string,
  investigationIndex?: number,
  useRiskMove: boolean = false
): Promise<{
  submission: SubmissionRecord;
  isCorrect: boolean;
  investigationIndex?: number;
  investigationStatus?: 'NOT_DONE' | 'FAILED' | 'DONE';
  currentInvestigationIndex?: number;
  questionStatus: 'NOT_DONE' | 'FAILED' | 'DONE';
  nextQuestionUnlocked: number | null;
  attemptsUsed: number;
  remainingAttempts: number;
  feedbackMessage: string;
  scoreSummary: TeamScoreSummary;
}> {
  return apiFetch(`/api/questions/${questionNumber}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answerContent, investigationIndex, useRiskMove }),
  });
}

export async function activateQuestionRiskMove(questionNumber: number): Promise<{
  questionNumber: number;
  riskMoveActive: boolean;
}> {
  return apiFetch(`/api/questions/${questionNumber}/risk-move`, {
    method: 'POST',
  });
}

export async function requestQuestionHint(
  questionNumber: number,
  hintType: 'LOW' | 'HIGH'
): Promise<{
  hintRequest: {
    id: number;
    status: string;
    suggested_penalty: number;
    deducted_points: number;
    requested_at: string;
  };
  hint: {
    title: string;
    hintType: 'LOW' | 'HIGH';
    suggestedPenalty: number;
  };
  alreadyRequested: boolean;
  scoreSummary?: TeamScoreSummary;
}> {
  return apiFetch(`/api/questions/${questionNumber}/hints`, {
    method: 'POST',
    body: JSON.stringify({ hintType }),
  });
}

export async function fetchErdMetadata(db?: string): Promise<ContestErdMetadata> {
  const qs = db ? `?db=${encodeURIComponent(db)}` : '';
  return apiFetch(`/api/erd${qs}`);
}

export async function fetchUnlockedDatabases(): Promise<UnlockedDatabasesResponse> {
  return apiFetch('/api/unlocked-databases');
}

/* ─── Admin Endpoints ─── */

export async function fetchAdminLeaderboard(contestId?: string): Promise<{
  updatedAt: string;
  leaderboard: LeaderboardEntry[];
}> {
  const qs = contestId ? `?contest_id=${encodeURIComponent(contestId)}` : '';
  return apiFetch(`/api/admin/leaderboard${qs}`);
}

export async function fetchAdminHints(status?: string, contestId?: string): Promise<{
  total: number;
  hintRequests: AdminHintRequestRecord[];
}> {
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (contestId) search.set('contest_id', contestId);
  const qs = search.toString() ? `?${search.toString()}` : '';
  return apiFetch(`/api/admin/hints${qs}`);
}

export async function confirmAdminHintDelivery(
  hintRequestId: number,
  delivered: boolean = true,
  adminNote?: string
): Promise<{
  hintRequest: AdminHintRequestRecord;
  scoreSummary: TeamScoreSummary;
}> {
  return apiFetch(`/api/admin/hints/${hintRequestId}/confirm-delivery`, {
    method: 'POST',
    body: JSON.stringify({ delivered, adminNote }),
  });
}

export async function solveAdminHintRequest(
  hintRequestId: number,
  action: 'APPLY' | 'WAIVE' = 'APPLY',
  deductedPoints?: number,
  adminNote?: string
): Promise<{
  hintRequest: AdminHintRequestRecord;
  scoreSummary: TeamScoreSummary;
}> {
  return apiFetch(`/api/admin/hints/${hintRequestId}/solve`, {
    method: 'POST',
    body: JSON.stringify({ action, deductedPoints, adminNote }),
  });
}

export async function fetchAdminSubmissions(params?: {
  status?: string;
  teamId?: number;
  questionNumber?: number;
  contestId?: string;
}): Promise<{
  total: number;
  submissions: AdminSubmissionRecord[];
}> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.teamId) search.set('teamId', String(params.teamId));
  if (params?.questionNumber) search.set('questionNumber', String(params.questionNumber));
  if (params?.contestId) search.set('contest_id', params.contestId);
  const qs = search.toString() ? `?${search.toString()}` : '';
  return apiFetch(`/api/admin/submissions${qs}`);
}

export async function adjustTeamScore(
  teamId: number,
  payload: {
    adjustmentType:
      | 'DIRECT_BONUS'
      | 'DIRECT_PENALTY'
      | 'UNDERGROUND_DEAL'
      | 'CHEAT_PENALTY'
      | 'RISK_MOVE_PENALTY';
    points: number;
    questionNumber?: number | null;
    reason: string;
    contestId?: string;
  }
): Promise<{
  scoreSummary: TeamScoreSummary;
}> {
  return apiFetch(`/api/admin/users/${teamId}/adjust-score`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminQuestions(contestId?: string): Promise<{
  questions: AdminQuestionConfig[];
}> {
  const qs = contestId ? `?contest_id=${encodeURIComponent(contestId)}` : '';
  return apiFetch(`/api/admin/questions${qs}`);
}

export async function updateAdminQuestionAnswers(
  questionNumber: number,
  acceptedAnswers: string[],
  contestId?: string,
  investigationAnswers?: Record<string, string[]>
): Promise<{
  question: AdminQuestionConfig;
}> {
  const qs = contestId ? `?contest_id=${encodeURIComponent(contestId)}` : '';
  return apiFetch(`/api/admin/questions/${questionNumber}/answers${qs}`, {
    method: 'PUT',
    body: JSON.stringify({ acceptedAnswers, contestId, investigationAnswers }),
  });
}

export async function fetchContests(): Promise<ContestInfo[]> {
  const data = await apiFetch<{ contests: ContestInfo[] }>('/api/contests');
  return data.contests;
}

export async function fetchAdminContests(): Promise<ContestInfo[]> {
  const data = await apiFetch<{ contests: ContestInfo[] }>('/api/admin/contests');
  return data.contests;
}

export async function toggleAdminContest(id: string, isActive?: boolean): Promise<ContestInfo> {
  const data = await apiFetch<{ contest: ContestInfo }>(`/api/admin/contests/${id}/toggle`, {
    method: 'POST',
    body: JSON.stringify(typeof isActive === 'boolean' ? { isActive } : {}),
  });
  return data.contest;
}

export async function stopAdminContest(id: string): Promise<ContestInfo> {
  const data = await apiFetch<{ contest: ContestInfo }>(`/api/admin/contests/${id}/stop`, {
    method: 'POST',
  });
  return data.contest;
}
