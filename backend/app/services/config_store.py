from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.settings import settings
from app.db.models import AppConfigModel


def get_config(db: Session, key: str) -> dict | None:
    row = db.get(AppConfigModel, key)
    return row.value if row else None


def set_config(db: Session, key: str, value: dict) -> None:
    row = db.get(AppConfigModel, key)
    if row:
        row.value = value
    else:
        row = AppConfigModel(key=key, value=value)
        db.add(row)
    db.commit()


def get_model_config(db: Session) -> dict:
    stored = get_config(db, "model_config")
    if stored:
        return stored
    return {
        "provider": settings.default_model_provider,
        "api_key": "",
        "base_url": settings.default_model_base_url,
        "model": settings.default_model_name,
        "temperature": 0.2,
        "max_tokens": 2048,
        "top_p": 1.0,
    }


def get_prompt_templates(db: Session) -> dict:
    stored = get_config(db, "prompt_templates")
    if stored:
        return stored
    return {
        "intent": "你是一个统计分析助手。根据用户问题，提取自变量(X)、因变量(Y)、任务类型与特殊要求，并以 JSON 输出。",
        "planning": "根据 intent 与 data_summary 输出分析计划 JSON（method 与 params）。",
        "interpret": "根据 analysis_result 输出业务化解释、建议与图表。",
    }

