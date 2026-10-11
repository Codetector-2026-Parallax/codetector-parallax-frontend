import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "../context/useAuth"
import { getCurrentStage, runSandboxQuery, submitStageAnswers } from "../services/gameService"
import { wsService } from "../services/wsService"
import type { StageData, QueryResult, SubmitResponse, WsStageClearedEvent } from "../types/game"

import { GameHeader } from "../components/game/GameHeader"
import { ProblemDossierPanel } from "../components/game/ProblemDossierPanel"
import { TimerPanel } from "../components/game/TimerPanel"
import { ErdVisualizerPanel } from "../components/game/ErdVisualizerPanel"
import { SqlEditorPanel } from "../components/game/SqlEditorPanel"
import { QueryOutputPanel } from "../components/game/QueryOutputPanel"
import { StageClearModal } from "../components/game/StageClearModal"

export default function GameWorkspacePage() {
  const { isAuthenticated, isLoading: isAuthLoading, team, refreshTeam } = useAuth()
  const navigate = useNavigate()

  // Game data state
  const [stage, setStage] = useState<StageData | null>(null)
  const [isStageLoading, setIsStageLoading] = useState(true)
  const [sql, setSql] = useState<string>("SELECT * FROM artifacts;")
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isQueryRunning, setIsQueryRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWsConnected, setIsWsConnected] = useState(false)

  // Stage clear modal state
  const [clearModal, setClearModal] = useState<{
    isOpen: boolean
    completedStageNumber: number
    nextStageNumber: number
    nextTitle: string
  }>({
    isOpen: false,
    completedStageNumber: 1,
    nextStageNumber: 2,
    nextTitle: "",
  })

  // Load stage data
  const loadStage = useCallback(async () => {
    setIsStageLoading(true)
    try {
      const data = await getCurrentStage()
      setStage(data)
    } catch (err) {
      console.error("Failed to load stage:", err)
    } finally {
      setIsStageLoading(false)
    }
  }, [])

  // 1. Guard route: redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate({ to: "/login" })
    }
  }, [isAuthLoading, isAuthenticated, navigate])

  // 2. Initial load and WebSocket setup
  useEffect(() => {
    if (!isAuthenticated) return

    loadStage()
    wsService.connect()

    const checkWsInterval = setInterval(() => {
      setIsWsConnected(wsService.isConnected())
    }, 1500)

    const unsubscribe = wsService.subscribe((event) => {
      if ("event" in event && event.event === "STAGE_CLEARED") {
        const clearedEvent = event as WsStageClearedEvent
        setClearModal({
          isOpen: true,
          completedStageNumber: clearedEvent.completed_stage,
          nextStageNumber: clearedEvent.next_stage,
          nextTitle: clearedEvent.next_title,
        })
        refreshTeam()
        loadStage()
      }
    })

    return () => {
      clearInterval(checkWsInterval)
      unsubscribe()
      wsService.disconnect()
    }
  }, [isAuthenticated, loadStage, refreshTeam])

  // Run SQL Query
  const handleRunQuery = async () => {
    if (!sql.trim() || isQueryRunning) return
    setIsQueryRunning(true)
    try {
      const result = await runSandboxQuery(sql)
      setQueryResult(result)
    } catch (err) {
      setQueryResult({
        success: false,
        columns: [],
        rows: [],
        row_count: 0,
        execution_time_ms: 0,
        error: err instanceof Error ? err.message : "Lỗi không xác định khi thực thi truy vấn",
      })
    } finally {
      setIsQueryRunning(false)
    }
  }

  // Submit answers
  const handleSubmitAnswers = async (answers: Record<string, string>): Promise<SubmitResponse | void> => {
    setIsSubmitting(true)
    try {
      const res = await submitStageAnswers(answers)
      if (res.is_correct && res.next_stage) {
        setClearModal({
          isOpen: true,
          completedStageNumber: stage?.stage_number || 1,
          nextStageNumber: res.next_stage,
          nextTitle: "Chuyên án tiếp theo",
        })
        refreshTeam()
        loadStage()
      }
      return res
    } catch (err) {
      return {
        is_correct: false,
        message: err instanceof Error ? err.message : "Lỗi khi nộp hồ sơ phá án.",
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Insert column/table name into SQL editor
  const handleInsertToEditor = (text: string) => {
    setSql((prev) => `${prev.trim()} ${text}`)
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="font-mono text-xs text-muted-foreground animate-pulse">
          ĐANG TẢI PHÒNG ĐIỀU TRA...
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <GameHeader
        currentStageNumber={stage?.stage_number || team?.current_stage || 1}
        isWsConnected={isWsConnected}
      />

      {/* Main Workspace Layout (Matching Wireframe) */}
      <main className="flex-1 overflow-hidden p-3 sm:p-4">
        <div className="grid h-full grid-cols-1 gap-3.5 lg:grid-cols-12 overflow-hidden">
          {/* ================= LEFT COLUMN ================= */}
          <div className="flex h-full flex-col gap-3.5 lg:col-span-6 overflow-hidden">
            {/* Top row: ĐỀ BÀI + TIMER */}
            <div className="grid h-[52%] grid-cols-1 sm:grid-cols-[1fr_210px] gap-3.5 overflow-hidden">
              <div className="h-full overflow-hidden">
                <ProblemDossierPanel
                  stage={stage}
                  isLoading={isStageLoading}
                  onSubmitAnswers={handleSubmitAnswers}
                  isSubmitting={isSubmitting}
                />
              </div>

              <div className="h-full overflow-hidden">
                <TimerPanel />
              </div>
            </div>

            {/* Bottom row: ERD */}
            <div className="h-[48%] overflow-hidden">
              <ErdVisualizerPanel onInsertToEditor={handleInsertToEditor} />
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex h-full flex-col gap-3.5 lg:col-span-6 overflow-hidden">
            {/* Top row: IDE */}
            <div className="h-[52%] overflow-hidden">
              <SqlEditorPanel
                sql={sql}
                onChangeSql={setSql}
                onRunQuery={handleRunQuery}
                isRunning={isQueryRunning}
              />
            </div>

            {/* Bottom row: OUTPUT */}
            <div className="h-[48%] overflow-hidden">
              <QueryOutputPanel result={queryResult} isRunning={isQueryRunning} />
            </div>
          </div>
        </div>
      </main>

      {/* Stage Clear Celebration Modal */}
      <StageClearModal
        isOpen={clearModal.isOpen}
        completedStageNumber={clearModal.completedStageNumber}
        nextStageNumber={clearModal.nextStageNumber}
        nextTitle={clearModal.nextTitle}
        onClose={() => setClearModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
