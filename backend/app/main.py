from __future__ import annotations

import json
import math
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_router
from app.core.errors import unhandled_exception_handler
from app.core.logging import configure_logging
from app.core.settings import settings
from app.db.init_db import init_db
from app.services.storage.paths import ensure_data_dirs


def _sanitize_nan(obj: Any) -> Any:
    """Replace NaN/Inf floats with None recursively."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize_nan(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize_nan(v) for v in obj]
    return obj


class NaNSafeJSONResponse(JSONResponse):
    """JSONResponse that converts NaN/Infinity to null instead of raising."""

    def render(self, content: Any) -> bytes:
        return json.dumps(
            _sanitize_nan(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")


def create_app() -> FastAPI:
    configure_logging()
    init_db()
    ensure_data_dirs()

    app = FastAPI(
        title="Hypothesis Testing Service",
        version="2.0",
        default_response_class=NaNSafeJSONResponse,
    )
    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()

