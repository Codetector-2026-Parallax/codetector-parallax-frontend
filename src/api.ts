import type {
  AdminHintRequestRecord,
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Codetector-Client': 'parallax-web',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: 'include',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const errMsg = json?.error?.message || json?.message || `HTTP Error ${res.status}`;
    throw new Error(errMsg);
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

export async function fetchCurrentUser(): Promise<{
  user: AuthUser;
  progress?: any;
  scoreSummary?: TeamScoreSummary;
} | null> {
  try {
    return await apiFetch('/api/auth/me');
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  } finally {
    setStoredToken(null);
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

export async function fetchAdminLeaderboard(): Promise<{
  updatedAt: string;
  leaderboard: LeaderboardEntry[];
}> {
  return apiFetch('/api/admin/leaderboard');
}

export async function fetchAdminHints(status?: string): Promise<{
  total: number;
  hintRequests: AdminHintRequestRecord[];
}> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
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
}): Promise<{
  total: number;
  submissions: AdminSubmissionRecord[];
}> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.teamId) search.set('teamId', String(params.teamId));
  if (params?.questionNumber) search.set('questionNumber', String(params.questionNumber));
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
  }
): Promise<{
  scoreSummary: TeamScoreSummary;
}> {
  return apiFetch(`/api/admin/users/${teamId}/adjust-score`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminQuestions(): Promise<{
  questions: AdminQuestionConfig[];
}> {
  return apiFetch('/api/admin/questions');
}

export async function updateAdminQuestionAnswers(
  questionNumber: number,
  acceptedAnswers: string[]
): Promise<{
  question: AdminQuestionConfig;
}> {
  return apiFetch(`/api/admin/questions/${questionNumber}/answers`, {
    method: 'PUT',
    body: JSON.stringify({ acceptedAnswers }),
  });
}
