from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.api import TestConnectionRequest, TestConnectionResponse
from app.schemas.config import ModelConfig, PromptTemplates
from app.services.config_store import get_model_config, get_prompt_templates, set_config

router = APIRouter(prefix="/config")


@router.get("/model", response_model=ModelConfig)
def get_model(db: Session = Depends(get_db)) -> ModelConfig:
    return ModelConfig(**get_model_config(db))


@router.put("/model")
def save_model(config: ModelConfig, db: Session = Depends(get_db)) -> None:
    set_config(db, "model_config", config.model_dump())


@router.post("/model/test", response_model=TestConnectionResponse)
def test_model(req: TestConnectionRequest) -> TestConnectionResponse:
    provider = req.provider.lower().strip()
    base_url = (req.base_url or "").rstrip("/")
    if not base_url:
        if provider == "openai":
            base_url = "https://api.openai.com"
        elif provider == "claude":
            base_url = "https://api.anthropic.com"
        elif provider == "zhipu":
            base_url = "https://open.bigmodel.cn"
        elif provider == "qwen":
            base_url = "https://dashscope.aliyuncs.com"
        else:
            return TestConnectionResponse(success=False, message="base_url 为空且 provider 未知")

    try:
        timeout = httpx.Timeout(10.0, connect=10.0)
        if provider == "openai":
            headers = {"Authorization": f"Bearer {req.api_key}"}
            url = f"{base_url}/v1/models"
            r = httpx.get(url, headers=headers, timeout=timeout)
            if r.status_code == 200:
                return TestConnectionResponse(success=True, message="连接成功（/v1/models）")
            return TestConnectionResponse(success=False, message=f"连接失败：HTTP {r.status_code} {r.text[:200]}")

        if provider == "claude":
            # Anthropic Messages API auth probe (minimal token)
            url = f"{base_url}/v1/messages"
            headers = {
                "x-api-key": req.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            payload = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 8,
                "messages": [{"role": "user", "content": "ping"}],
            }
            r = httpx.post(url, headers=headers, json=payload, timeout=timeout)
            if r.status_code == 200:
                return TestConnectionResponse(success=True, message="连接成功（/v1/messages）")
            if r.status_code in {401, 403}:
                return TestConnectionResponse(success=False, message=f"鉴权失败：HTTP {r.status_code}")
            return TestConnectionResponse(success=False, message=f"连接失败：HTTP {r.status_code} {r.text[:200]}")

        # Generic probe (provider-specific APIs may not allow this)
        r = httpx.get(base_url, timeout=timeout)
        if r.status_code < 500:
            return TestConnectionResponse(success=True, message=f"基础连通性 OK：HTTP {r.status_code}")
        return TestConnectionResponse(success=False, message=f"基础连通性失败：HTTP {r.status_code}")
    except Exception as e:
        return TestConnectionResponse(success=False, message=str(e))


@router.get("/prompts", response_model=PromptTemplates)
def get_prompts(db: Session = Depends(get_db)) -> PromptTemplates:
    return PromptTemplates(**get_prompt_templates(db))


@router.put("/prompts")
def save_prompts(templates: PromptTemplates, db: Session = Depends(get_db)) -> None:
    set_config(db, "prompt_templates", templates.model_dump())
