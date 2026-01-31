from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str = Field(..., examples=["INVALID_ARGUMENT"])
    message: str = Field(..., examples=["参数错误"])
    detail: str | None = None
    trace_id: str

