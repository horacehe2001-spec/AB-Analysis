from __future__ import annotations

import json
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class LLMModelConfig:
    provider: str
    api_key: str
    base_url: str | None
    model: str
    temperature: float = 0.2
    max_tokens: int = 2048
    top_p: float = 1.0


class LLMError(RuntimeError):
    pass


def _strip_trailing_slash(url: str) -> str:
    return url.rstrip("/")


def call_llm_json(
    *,
    config: LLMModelConfig,
    system_prompt: str,
    user_prompt: str,
) -> str:
    provider = (config.provider or "").lower().strip()
    if not config.api_key:
        raise LLMError("Missing api_key")
    api_key = config.api_key.strip()
    base_url = _strip_trailing_slash(config.base_url or "")

    # Default: OpenAI-compatible chat.completions
    if provider in {"openai", "custom", "zhipu", "qwen"}:
        if not base_url:
            if provider == "zhipu":
                base_url = "https://open.bigmodel.cn/api/paas/v4"
            elif provider == "qwen":
                base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
            else:
                base_url = "https://api.openai.com/v1"
        url = f"{base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": config.model,
            "temperature": float(config.temperature),
            "top_p": float(config.top_p),
            "max_tokens": int(config.max_tokens),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        with httpx.Client(timeout=httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0)) as client:
            r = client.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            raise LLMError(f"LLM HTTP {r.status_code}: {r.text[:200]}")
        data = r.json()
        try:
            return str(data["choices"][0]["message"]["content"])
        except Exception:
            raise LLMError(f"Unexpected LLM response: {json.dumps(data)[:200]}")

    # Anthropic Messages API (Claude)
    if provider == "claude":
        if not base_url:
            base_url = "https://api.anthropic.com"
        url = f"{base_url}/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": config.model,
            "max_tokens": int(config.max_tokens),
            "temperature": float(config.temperature),
            "top_p": float(config.top_p),
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        with httpx.Client(timeout=httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0)) as client:
            r = client.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            raise LLMError(f"LLM HTTP {r.status_code}: {r.text[:200]}")
        data = r.json()
        try:
            parts = data.get("content") or []
            texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
            return "\n".join([t for t in texts if t]).strip()
        except Exception:
            raise LLMError(f"Unexpected Claude response: {json.dumps(data)[:200]}")

    raise LLMError(f"Unsupported provider: {provider}")

