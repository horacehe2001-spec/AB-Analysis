from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.chat import router as chat_router
from app.api.config import router as config_router
from app.api.export import router as export_router
from app.api.report import router as report_router
from app.api.sessions import router as sessions_router
from app.api.upload import router as upload_router
from app.core.security import require_bearer_token


api_router = APIRouter(prefix="/api/v2", dependencies=[Depends(require_bearer_token)])

api_router.include_router(chat_router)
api_router.include_router(upload_router)
api_router.include_router(sessions_router)
api_router.include_router(export_router)
api_router.include_router(report_router)
api_router.include_router(config_router)

