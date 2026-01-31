from __future__ import annotations

from pydantic import BaseModel, Field


class ModelConfig(BaseModel):
    provider: str = Field(..., examples=["openai"])
    api_key: str
    base_url: str | None = None
    model: str
    temperature: float = 0.2
    max_tokens: int = 2048
    top_p: float = 1.0


class PromptTemplates(BaseModel):
    intent: str
    planning: str
    interpret: str

