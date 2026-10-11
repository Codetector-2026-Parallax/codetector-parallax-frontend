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
}

export interface SubmitResponse {
  is_correct: boolean
  message: string
  next_stage?: number
  failed_fields?: string[]
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
}

export interface WsSyncStateEvent {
  event: "SYNC_STATE"
  team_id: number
  team_name: string
  current_stage: number
  message: string
}
