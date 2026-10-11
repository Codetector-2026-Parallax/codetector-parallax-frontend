import { apiClient } from "./apiClient"
import type { QueryResult, StageData, SubmitResponse } from "../types/game"

export async function getCurrentStage(): Promise<StageData> {
  return await apiClient.get<StageData>("/api/v1/stages/current")
}

export async function runSandboxQuery(sql: string): Promise<QueryResult> {
  return await apiClient.post<QueryResult>("/api/v1/sandbox/query", { sql })
}

export async function submitStageAnswers(
  answers: Record<string, string>
): Promise<SubmitResponse> {
  return await apiClient.post<SubmitResponse>("/api/v1/submissions/submit", {
    answers,
  })
}
