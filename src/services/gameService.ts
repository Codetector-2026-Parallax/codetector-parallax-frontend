import { apiClient } from "./apiClient"
import type { ChapterOutline, LeaderboardResponse, QueryResult, StageData, SubmitResponse } from "../types/game"

export function getChapterOutline(): Promise<ChapterOutline> {
  return apiClient.get<ChapterOutline>("/api/v1/stages/outline")
}

export function getQuestion(questionNumber: number): Promise<StageData> {
  return apiClient.get<StageData>(`/api/v1/stages/${questionNumber}`)
}

export async function getCurrentStage(): Promise<StageData> {
  return await apiClient.get<StageData>("/api/v1/stages/current")
}

export async function runSandboxQuery(sql: string): Promise<QueryResult> {
  return await apiClient.post<QueryResult>("/api/v1/sandbox/query", { sql })
}

export async function submitStageAnswers(
  answers: Record<string, string>,
  questionNumber: number,
): Promise<SubmitResponse> {
  return await apiClient.post<SubmitResponse>("/api/v1/submissions/submit", {
    answers,
    question_number: questionNumber,
  })
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  return await apiClient.get<LeaderboardResponse>("/api/v1/leaderboard")
}

