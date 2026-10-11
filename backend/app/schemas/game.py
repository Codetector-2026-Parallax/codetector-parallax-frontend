from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


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

    class Config:
        from_attributes = True


class SubmitRequest(BaseModel):
    answers: Dict[str, str] = Field(
        ...,
        description="Dictionary mapping field keys to team answers, e.g. {'suspect': 'NULL', 'crime_time': '23:45'}"
    )


class SubmitResponse(BaseModel):
    is_correct: bool
    message: str
    next_stage: Optional[int] = None
    failed_fields: Optional[List[str]] = None


class QueryRequest(BaseModel):
    sql: str = Field(..., min_length=3, max_length=1500, description="SQL query to execute in sandbox")


class QueryResult(BaseModel):
    success: bool
    columns: List[str] = []
    rows: List[List[Any]] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    error: Optional[str] = None
