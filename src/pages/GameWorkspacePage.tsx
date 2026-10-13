import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "../context/useAuth"
import { getChapterOutline, getQuestion, runSandboxQuery, submitStageAnswers } from "../services/gameService"
import { wsService } from "../services/wsService"
import type { ChapterOutline, StageData, QueryResult, SubmitResponse, WsStageClearedEvent } from "../types/game"

import { GameHeader } from "../components/game/GameHeader"
import { ProblemDossierPanel } from "../components/game/ProblemDossierPanel"
import { ResizableSplit } from "../components/game/ResizableSplit"
import { ErdDialog } from "../components/game/ErdDialog"
import { SqlEditorPanel } from "../components/game/SqlEditorPanel"
import { QueryOutputPanel } from "../components/game/QueryOutputPanel"
import { StageClearModal } from "../components/game/StageClearModal"
import { PaneControls } from "../components/game/PaneControls"
import { QuestionSidebar } from "../components/game/QuestionSidebar"

type PaneId = "dossier" | "editor" | "output"

export default function GameWorkspacePage() {
  const { isAuthenticated, isLoading: isAuthLoading, team, refreshTeam } = useAuth()
  const navigate = useNavigate()

  // Game data state
  const [stage, setStage] = useState<StageData | null>(null)
  const [outline, setOutline] = useState<ChapterOutline | null>(null)
  const [stageError, setStageError] = useState<string | null>(null)
  const loadRequestRef = useRef(0)
  const [isStageLoading, setIsStageLoading] = useState(true)
  const [sql, setSql] = useState<string>("SELECT * FROM theft_report WHERE id_report = 1;")
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isQueryRunning, setIsQueryRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maximizedPane, setMaximizedPane] = useState<PaneId | null>(null)
  const [isErdOpen, setIsErdOpen] = useState(false)
  const [collapsedPanes, setCollapsedPanes] = useState<Set<PaneId>>(() => new Set())

  // Stage clear modal state
  const [clearModal, setClearModal] = useState<{
    isOpen: boolean
    completedStageNumber: number
    nextStageNumber: number
    nextTitle: string
    chapterCompleted: boolean
  }>({
    isOpen: false,
    completedStageNumber: 1,
    nextStageNumber: 2,
    nextTitle: "",
    chapterCompleted: false,
  })

  // Load stage data
  const loadStage = useCallback(async (questionNumber?: number) => {
    const requestId = ++loadRequestRef.current
    setIsStageLoading(true)
    setStageError(null)
    try {
      const chapter = await getChapterOutline()
      const selected = questionNumber ?? chapter.current_question ?? chapter.total_questions
      const data = await getQuestion(selected)
      if (loadRequestRef.current !== requestId) return
      setOutline(chapter)
      setStage(data)
    } catch (err) {
      if (loadRequestRef.current === requestId) setStageError(err instanceof Error ? err.message : "Không thể tải câu hỏi.")
    } finally {
      if (loadRequestRef.current === requestId) setIsStageLoading(false)
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

    const initialLoad = setTimeout(() => { void loadStage() }, 0)
    wsService.connect()

    const unsubscribe = wsService.subscribe((event) => {
      if ("event" in event && event.event === "STAGE_CLEARED") {
        const clearedEvent = event as WsStageClearedEvent
        setClearModal({
          isOpen: true,
          completedStageNumber: clearedEvent.completed_stage,
          nextStageNumber: clearedEvent.next_stage,
          nextTitle: clearedEvent.next_title,
          chapterCompleted: clearedEvent.chapter_completed ?? false,
        })
        refreshTeam()
        loadStage()
      }
    })

    return () => {
      clearTimeout(initialLoad)
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
    if (!stage || stage.is_completed || stage.stage_number !== outline?.current_question) {
      return { is_correct: false, message: "Chỉ được trả lời câu hỏi đang mở." }
    }
    setIsSubmitting(true)
    try {
      const res = await submitStageAnswers(answers, stage.stage_number)
      if (res.is_correct && res.next_stage) {
        setClearModal({
          isOpen: true,
          completedStageNumber: stage?.stage_number || 1,
          nextStageNumber: res.next_stage,
          nextTitle: outline.questions.find((question) => question.question_number === res.next_stage)?.title ?? "Hoàn thành Chặng 1",
          chapterCompleted: res.chapter_completed ?? false,
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

  const togglePaneCollapse = (pane: PaneId) => {
    setMaximizedPane(null)
    setCollapsedPanes((current) => {
      const next = new Set(current)
      if (next.has(pane)) next.delete(pane)
      else next.add(pane)
      return next
    })
  }

  const togglePaneMaximize = (pane: PaneId) => {
    setCollapsedPanes((current) => {
      if (!current.has(pane)) return current
      const next = new Set(current)
      next.delete(pane)
      return next
    })
    setMaximizedPane((current) => current === pane ? null : pane)
  }

  const pane = (id: PaneId, label: string, direction: "up" | "down", content: ReactNode) => (
    <PaneControls
      label={label}
      collapsed={collapsedPanes.has(id)}
      collapseDirection={direction}
      maximized={maximizedPane === id}
      onToggleCollapse={id === "dossier" ? undefined : () => togglePaneCollapse(id)}
      onToggleMaximize={() => togglePaneMaximize(id)}
    >
      {content}
    </PaneControls>
  )

  const dossierPane = pane("dossier", "Đề bài", "up", (
    <ProblemDossierPanel
      stage={stage}
      isLoading={isStageLoading}
      onSubmitAnswers={handleSubmitAnswers}
      isSubmitting={isSubmitting}
    />
  ))
  const editorPane = pane("editor", "SQL editor", "up", (
    <SqlEditorPanel
      sql={sql}
      onChangeSql={setSql}
      onRunQuery={handleRunQuery}
      isRunning={isQueryRunning}
    />
  ))
  const outputPane = pane("output", "Kết quả truy vấn", "down", (
    <QueryOutputPanel result={queryResult} isRunning={isQueryRunning} />
  ))

  const maximizedContent = maximizedPane === "dossier" ? dossierPane
    : maximizedPane === "editor" ? editorPane
        : maximizedPane === "output" ? outputPane
          : null

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
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <GameHeader
        currentStageNumber={stage?.stage_number || team?.current_stage || 1}
        totalQuestions={outline?.total_questions}
        onOpenErd={() => setIsErdOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <QuestionSidebar
        outline={outline}
        selectedQuestion={stage?.stage_number}
        isLoading={isStageLoading}
        onSelect={(questionNumber) => { void loadStage(questionNumber) }}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-2 md:overflow-hidden md:p-3">
        {stageError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-300">{stageError} <button type="button" onClick={() => { void loadStage() }} className="ml-2 underline">Thử lại</button></div>}
        {outline?.is_completed && <div className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Hoàn thành Chặng 1! Bạn đã giải đúng cả 3 câu hỏi. Chọn từng câu trong mục lục để xem lại hồ sơ.</div>}
        <div className="min-h-0 flex-1">
        {maximizedContent ?? <ResizableSplit
          direction="horizontal"
          label="Điều chỉnh độ rộng vùng điều tra và vùng SQL"
          storageKey="codetector.workspace.columns"
          initialSize={45}
          minFirst={280}
          minSecond={320}
          stackOnMobile
          className="h-[1200px] min-h-full md:h-full"
        >
          {dossierPane}
          <ResizableSplit
            direction="vertical"
            label="Điều chỉnh chiều cao SQL editor và kết quả"
            storageKey="codetector.workspace.editor"
            initialSize={60}
            className="h-full"
            firstCollapsed={collapsedPanes.has("editor")}
            secondCollapsed={collapsedPanes.has("output")}
          >
            {editorPane}
            {outputPane}
          </ResizableSplit>
        </ResizableSplit>}
        </div>
      </main>
      </div>

      <ErdDialog isOpen={isErdOpen} onClose={() => setIsErdOpen(false)} onInsertToEditor={handleInsertToEditor} />

      {/* Stage Clear Celebration Modal */}
      <StageClearModal
        isOpen={clearModal.isOpen}
        completedStageNumber={clearModal.completedStageNumber}
        nextStageNumber={clearModal.nextStageNumber}
        nextTitle={clearModal.nextTitle}
        chapterCompleted={clearModal.chapterCompleted}
        onClose={() => setClearModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
