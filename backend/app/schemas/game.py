from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from typing import Literal


class FormSchemaField(BaseModel):
    key: str
    label: str
    type: str = "text"
    placeholder: Optional[str] = None
    required: bool = True


class StageResponse(BaseModel):
    id: int
    stage_number: int
    title: str
    story_description: Optional[str] = None
    clues_guide: Optional[str] = None
    form_schema: List[Dict[str, Any]]
    is_completed: bool = False
    chapter_number: int = 1
    question_number: int
    total_questions: int
    case_description: str

    class Config:
        from_attributes = True


class QuestionOutline(BaseModel):
    question_number: int
    title: str
    status: Literal["completed", "current", "locked"]


class ChapterOutline(BaseModel):
    chapter_number: int
    title: str
    total_questions: int
    completed_questions: int
    current_question: Optional[int] = None
    is_completed: bool
    questions: List[QuestionOutline]


class SubmitRequest(BaseModel):
    question_number: Optional[int] = Field(None, ge=1)
    answers: Dict[str, str] = Field(
        ...,
        description="Dictionary mapping field keys to team answers, e.g. {'suspect': 'NULL', 'crime_time': '23:45'}"
    )


class SubmitResponse(BaseModel):
    is_correct: bool
    message: str
    next_stage: Optional[int] = None
    failed_fields: Optional[List[str]] = None
    chapter_completed: bool = False


class QueryRequest(BaseModel):
    sql: str = Field(..., min_length=3, max_length=1500, description="SQL query to execute in sandbox")


class QueryResult(BaseModel):
    success: bool
    columns: List[str] = []
    rows: List[List[Any]] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    error: Optional[str] = None


class LeaderboardItem(BaseModel):
    rank: int
    team_id: int
    team_name: str
    username: str
    current_stage: int
    completed_stages_count: int
    stage_1_completed_at: Optional[str] = None
    stage_2_completed_at: Optional[str] = None
    stage_3_completed_at: Optional[str] = None
    is_finished: bool = False
    last_completed_at: Optional[str] = None


class LeaderboardResponse(BaseModel):
    total_stages: int = 3
    total_questions: int = 3
    total_chapters: int = 1
    leaderboard: List[LeaderboardItem]
