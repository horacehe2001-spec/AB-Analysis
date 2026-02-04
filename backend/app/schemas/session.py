from __future__ import annotations

from pydantic import BaseModel, Field


class ColumnStats(BaseModel):
    mean: float
    std: float
    min: float
    max: float


class DataSummary(BaseModel):
    rows: int
    columns: int
    column_names: list[str]
    column_types: dict[str, str]
    column_stats: dict[str, ColumnStats] = Field(default_factory=dict)


class Session(BaseModel):
    session_id: str
    created_at: str
    updated_at: str
    file_name: str | None = None
    industry: str | None = None
    first_query: str | None = None
    methods_used: list[str] = Field(default_factory=list)
    message_count: int = 0


class SessionsResponse(BaseModel):
    total: int
    page: int
    items: list[Session]


class SessionsQuery(BaseModel):
    page: int | None = 1
    size: int | None = 10
    keyword: str | None = None
    industry: str | None = None
    method: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class Message(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    analysis: dict | None = None


class SessionDetail(Session):
    messages: list[Message]
    data_summary: DataSummary | None = None
    report_conclusion: str | None = None
