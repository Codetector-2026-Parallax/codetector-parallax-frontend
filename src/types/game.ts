export interface TeamProfile {
  id: number
  team_name: string
  username: string
  current_stage: number
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  team_id: number
  team_name: string
  username: string
  current_stage: number
}

export interface FormSchemaField {
  key: string
  label: string
  type: string
  placeholder?: string
  required?: boolean
}

export interface StageData {
  id: number
  stage_number: number
  title: string
  story_description?: string
  clues_guide?: string
  form_schema: FormSchemaField[]
  is_completed: boolean
  chapter_number: number
  question_number: number
  total_questions: number
  case_description: string
}

export interface ChapterOutline {
  chapter_number: number
  title: string
  total_questions: number
  completed_questions: number
  current_question: number | null
  is_completed: boolean
  questions: {
    question_number: number
    title: string
    status: "completed" | "current" | "locked"
  }[]
}

export interface SubmitResponse {
  is_correct: boolean
  message: string
  next_stage?: number
  failed_fields?: string[]
  chapter_completed?: boolean
}

export interface QueryResult {
  success: boolean
  columns: string[]
  rows: (string | number | boolean | null)[][]
  row_count: number
  execution_time_ms: number
  error?: string
}

export interface WsStageClearedEvent {
  event: "STAGE_CLEARED"
  completed_stage: number
  next_stage: number
  next_title: string
  message: string
  chapter_completed?: boolean
}

export interface WsSyncStateEvent {
  event: "SYNC_STATE"
  team_id: number
  team_name: string
  current_stage: number
  message: string
}

export interface LeaderboardItem {
  rank: number
  team_id: number
  team_name: string
  username: string
  current_stage: number
  completed_stages_count: number
  stage_1_completed_at?: string | null
  stage_2_completed_at?: string | null
  stage_3_completed_at?: string | null
  is_finished: boolean
  last_completed_at?: string | null
}

export interface LeaderboardResponse {
  total_stages: number
  total_questions: number
  total_chapters: number
  leaderboard: LeaderboardItem[]
}

export interface WsLeaderboardUpdatedEvent {
  event: "LEADERBOARD_UPDATED"
  team_id: number
  team_name: string
  stage_number: number
  question_number?: number
}

