export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  userId: number;
  username: string;
  email: string;
  teamName: string;
  role: UserRole;
  allowedContests?: string[] | null;
}

export interface QuestionBreakdown {
  questionNumber: number;
  basePoints: number;
  status: 'NOT_DONE' | 'FAILED' | 'DONE';
  attemptsUsed: number;
  riskMoveActive: boolean;
  earnedGrossPoints: number;
  submissionPenalty: number;
  hintPenalty: number;
  netQuestionPoints: number;
  unlockedAt?: string | null;
  completedAt?: string | null;
}

export interface TeamScoreSummary {
  score?: number;
  totalEarnedPoints: number;
  submissionPenaltyTotal: number;
  hintPenaltyTotal: number;
  undergroundDealPenalty: number;
  cheatPenalty: number;
  riskMovePenalty: number;
  totalPenalty: number;
  directAdjustmentsNet: number;
  finalScore: number;
  questionsCompleted: number;
  questionsFailed: number;
  questionBreakdowns: QuestionBreakdown[];
}

export interface HintRequestItem {
  id: number;
  question_number: number;
  hint_type: 'LOW' | 'HIGH' | 'CUSTOM';
  status: 'REQUESTED' | 'DELIVERED' | 'UNDELIVERED' | 'DEDUCTION_APPLIED' | 'WAIVED';
  suggested_penalty: number;
  deducted_points: number;
  requested_at: string;
  decided_at: string | null;
}

export interface QuestionInvestigationItem {
  index: number;
  key: string; // 'A' | 'B'
  title: string;
  isUnlocked: boolean;
  status: 'NOT_DONE' | 'FAILED' | 'DONE';
  attemptsUsed: number;
  maxAttempts: number;
  remainingAttempts: number;
  basePoints: number;
  earnedPoints: number;
  taskTitle: string;
  taskDescription?: string | null;
  submissionPrompt?: string | null;
  submissionFormat?: string | null;
  clue?: string | null;
  image?: string | null;
  revealedAnswer?: string | null;
  allAcceptedAnswers?: string[];
  completedAt?: string | null;
}

export interface QuestionSummaryItem {
  questionNumber: number;
  title: string;
  story?: string;
  content?: string;
  basePoints: number;
  targetDatabase?: string;
  revealedAnswer?: string | null;
  allAcceptedAnswers?: string[];
  status: 'NOT_DONE' | 'FAILED' | 'DONE';
  isUnlocked: boolean;
  currentInvestigationIndex?: number;
  investigations?: QuestionInvestigationItem[];
  attemptsUsed: number;
  maxAttempts: number;
  hasRiskMove: boolean;
  riskMoveActive?: boolean;
  canActivateRiskMove?: boolean;
  gainedPoints: number;
  submissionPenalty: number;
  hintPenaltyPoints: number;
  unlockedAt?: string | null;
  completedAt?: string | null;
  hintRequests: HintRequestItem[];
}

export interface TeamProgressInfo {
  completedCount: number;
  totalQuestions: number;
  progressText: string;
  currentQuestionNumber: number;
  isCompleted: boolean;
  riskMoveUnlocked: boolean;
  riskMoveUsedOnQuestion: number | null;
}

export interface SubmissionRecord {
  id: number;
  attempt_number: number;
  investigation_index?: number;
  answer_content: string;
  risk_move_used: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  admin_feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface QuestionDetailData {
  question: {
    questionNumber: number;
    title: string;
    story?: string;
    content?: string;
    caseDossier: {
      clues?: string[];
      related_tables?: string[];
      risk_move_milestone?: boolean;
      answer_format?: string;
    };
    investigations?: QuestionInvestigationItem[];
    currentInvestigationIndex?: number;
    targetDatabase?: string;
    revealedAnswer?: string | null;
    allAcceptedAnswers?: string[];
    basePoints: number;
    status: 'NOT_DONE' | 'FAILED' | 'DONE';
    gainedPoints: number;
    attemptsUsed: number;
    maxAttempts: number;
    remainingAttempts: number;
    hasRiskMove: boolean;
    riskMoveActive?: boolean;
    canActivateRiskMove: boolean;
    submissionPenalty?: number;
    hintPenaltyPoints?: number;
    unlockedAt?: string | null;
    completedAt?: string | null;
  };
  latestSubmissionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  submissions: SubmissionRecord[];
  unlockedHints: Array<{
    id: number;
    hint_type: 'LOW' | 'HIGH' | 'CUSTOM';
    status: 'REQUESTED' | 'DELIVERED' | 'UNDELIVERED' | 'DEDUCTION_APPLIED' | 'WAIVED';
    suggested_penalty: number;
    deducted_points?: number;
    admin_note?: string | null;
    requested_at?: string;
    decided_at?: string | null;
    hint_title?: string | null;
  }>;
}

export interface ErdColumnMetadata {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique?: boolean;
  references?: {
    foreignTable: string;
    foreignColumn: string;
  };
  description?: string;
}

export interface ErdTableMetadata {
  tableName: string;
  columns: ErdColumnMetadata[];
}

export type ErdRelationshipType = 'SQL_FK' | 'LOGICAL';
export type ErdCardinality = '1:N' | '1:0..1' | '0..1:N' | '0..1:0..1' | 'M:N';

export interface ErdRelationship {
  constraintName: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  relationshipType?: ErdRelationshipType;
  cardinality?: ErdCardinality;
  label?: string;
  description?: string;
}

export interface ContestErdMetadata {
  databaseName: string;
  activeDatabase?: string;
  unlockedDatabases?: string[];
  numberOfTables: number;
  typesOfKeys: string[];
  tableCount?: number;
  keyCount?: number;
  tables: ErdTableMetadata[];
  relationships: ErdRelationship[];
  dataDictionary: Array<{
    tableName: string;
    columnName: string;
    dataType?: string;
    description?: string;
    vietnameseDescription?: string;
  }>;
}

export interface ChapterDatabaseInfo {
  id: string;
  name: string;
  title: string;
  chapter: number;
  description: string;
  isUnlocked: boolean;
  targetQuestions: number[];
}

export interface ChapterDatabaseOption extends ChapterDatabaseInfo {}

export interface UnlockedDatabasesResponse {
  unlockedDatabases: string[];
  activeDatabase: string;
  allDatabases: ChapterDatabaseInfo[];
}

export interface LeaderboardEntry {
  rank: number;
  teamId: number;
  username: string;
  teamName: string;
  email: string;
  progress: {
    completedCount: number;
    failedCount: number;
    totalQuestions: number;
    progressText: string;
    currentQuestionNumber: number;
    isCompleted: boolean;
    riskMoveUnlocked: boolean;
    riskMoveUsedOnQuestion: number | null;
    lastAcceptedAt: string | null;
    completedAt: string | null;
  };
  totalTimeSpentSeconds?: number;
  totalTimeSpentFormatted?: string;
  score?: number;
  finalScore: number;
  totalEarnedPoints: number;
  totalPenalty: number;
  scoreBreakdown: TeamScoreSummary;
  questionStatuses: Array<{
    questionNumber: number;
    status: 'NOT_DONE' | 'FAILED' | 'DONE';
    attemptsUsed: number;
    riskMoveActive: boolean;
    earnedGrossPoints: number;
    submissionPenalty: number;
    hintPenalty: number;
    netQuestionPoints: number;
    unlockedAt?: string | null;
    completedAt?: string | null;
    timeSpentSeconds?: number;
    timeSpentFormatted?: string;
  }>;
}

export interface AdminHintRequestRecord {
  id: number;
  team_id: number;
  username: string;
  team_name: string;
  question_number: number;
  question_title: string;
  hint_type: 'LOW' | 'HIGH' | 'CUSTOM';
  status: 'REQUESTED' | 'DELIVERED' | 'UNDELIVERED' | 'DEDUCTION_APPLIED' | 'WAIVED';
  suggested_penalty: number;
  deducted_points: number;
  admin_note: string | null;
  decided_by: number | null;
  requested_at: string;
  decided_at: string | null;
}

export interface AdminSubmissionRecord {
  id: number;
  team_id: number;
  username: string;
  team_name: string;
  question_id: number;
  question_number: number;
  question_title: string;
  base_points: number;
  attempt_number: number;
  answer_content: string;
  risk_move_used: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  admin_feedback: string | null;
  reviewed_by: number | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface AdminQuestionConfig {
  id: number;
  contest_id?: string;
  question_number: number;
  title: string;
  story?: string;
  content: string;
  target_database?: string;
  case_dossier?: Record<string, any>;
  investigations?: Array<{
    index: number;
    key: string;
    title: string;
    clue: string;
    image?: string | null;
    taskTitle: string;
    taskDescription: string;
    submissionPrompt: string;
    submissionFormat: string;
    acceptedAnswers: string[];
    basePoints: number;
  }>;
  base_points: number;
  accepted_answers: string[];
}

export interface ContestInfo {
  id: string; // 'training' | 'official'
  name: string;
  title: string;
  description: string;
  target_database: string;
  is_active: boolean;
  is_accessible?: boolean;
  questionCount?: number;
  activeTeamCount?: number;
  created_at?: string;
}

export interface AdminRealtimeEvent {
  id: string;
  type:
    | 'CONNECTED'
    | 'SUBMISSION_CREATED'
    | 'RISK_MOVE_ACTIVATED'
    | 'HINT_REQUESTED'
    | 'HINT_DELIVERED'
    | 'HINT_REFUNDED'
    | 'HINT_SOLVED'
    | 'SCORE_ADJUSTED'
    | 'SUBMISSION_REVIEWED'
    | 'ANSWER_KEYS_UPDATED'
    | 'CONTEST_STATUS_CHANGED'
    | 'ANNOUNCEMENT'
    | 'LEADERBOARD_FROZEN'
    | 'LEADERBOARD_UNFROZEN';
  teamId?: number;
  teamName?: string;
  questionNumber?: number;
  contestId?: string;
  action?: string;
  isActive?: boolean;
  message?: string;
  level?: string;
  isFrozen?: boolean;
  timestamp: string;
  status?: string;
  isCorrect?: boolean;
  attemptNumber?: number;
  hintType?: string;
  penalty?: number;
}
