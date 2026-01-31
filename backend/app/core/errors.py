from __future__ import annotations

import uuid
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    detail: str | None = None,
    trace_id: str | None = None,
    extra: dict[str, Any] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"code": code, "message": message, "trace_id": trace_id or str(uuid.uuid4())}
    if detail:
        body["detail"] = detail
    if extra:
        body.update(extra)
    return JSONResponse(status_code=status_code, content=body)


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return error_response(status_code=500, code="INTERNAL", message="Internal server error", detail=str(exc))

