from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.settings import settings
from app.db.models import AppConfigModel

logger = logging.getLogger(__name__)


def get_config(db: Session, key: str) -> dict | None:
    row = db.get(AppConfigModel, key)
    return row.value if row else None


def set_config(db: Session, key: str, value: dict) -> None:
    # Delete-then-insert to avoid SQLAlchemy JSON column change-detection issues
    row = db.get(AppConfigModel, key)
    if row:
        db.delete(row)
        db.flush()
    new_row = AppConfigModel(key=key, value=value)
    db.add(new_row)
    db.commit()
    # Verify write
    saved = db.get(AppConfigModel, key)
    if saved:
        logger.info("set_config OK: key=%s, api_key present=%s", key, bool(saved.value.get("api_key")))
    else:
        logger.error("set_config FAILED: key=%s not found after commit", key)


def get_model_config(db: Session) -> dict:
    defaults = {
        "provider": settings.default_model_provider,
        "api_key": settings.default_model_api_key,
        "base_url": settings.default_model_base_url,
        "model": settings.default_model_name,
        "temperature": 0.2,
        "max_tokens": 2048,
        "top_p": 1.0,
    }
    stored = get_config(db, "model_config")
    if not stored:
        return defaults
    # DB record's api_key may be empty from a failed save; fall back to .env
    if not stored.get("api_key") and settings.default_model_api_key:
        stored["api_key"] = settings.default_model_api_key
    return stored


def get_prompt_templates(db: Session) -> dict:
    stored = get_config(db, "prompt_templates")
    if stored:
        return stored
    return {
        "intent": "你是一个统计分析助手。根据用户问题，提取自变量(X)、因变量(Y)、任务类型与特殊要求，并以 JSON 输出。",
        "planning": "根据 intent 与 data_summary 输出分析计划 JSON（method 与 params）。",
        "interpret": "根据 analysis_result 输出业务化解释、建议与图表。",
    }

