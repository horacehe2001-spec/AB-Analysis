from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.session import DataSummary


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str
    file: str | None = None
    industry: str | None = None


class EffectSize(BaseModel):
    type: str
    value: float
    level: str


class ChartConfig(BaseModel):
    type: str
    title: str
    data: dict
    xLabel: str | None = None
    yLabel: str | None = None


class AnalysisResult(BaseModel):
    method: str
    method_name: str
    p_value: float | None
    effect_size: EffectSize
    significant: bool
    interpretation: str
    suggestions: list[str] = Field(default_factory=list)
    visualizations: list[ChartConfig] = Field(default_factory=list)


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    analysis: AnalysisResult | None = None
    suggestions: list[str] = Field(default_factory=list)
    visualizations: list[ChartConfig] = Field(default_factory=list)


class UploadResponse(BaseModel):
    session_id: str
    file_name: str
    data_summary: DataSummary


class ExportRequest(BaseModel):
    session_id: str
    format: str = Field(..., pattern="^(md|docx)$")
    include_charts: bool = True


class ExportResponse(BaseModel):
    download_url: str
    file_name: str


class TestConnectionRequest(BaseModel):
    provider: str
    api_key: str
    base_url: str | None = None


class TestConnectionResponse(BaseModel):
    success: bool
    message: str

