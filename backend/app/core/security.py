from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.settings import settings


def require_bearer_token(authorization: str | None = Header(default=None)) -> None:
    if settings.auth_disabled:
        return
    if not settings.auth_token:
        raise HTTPException(status_code=500, detail="AUTH_TOKEN not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.auth_token:
        raise HTTPException(status_code=401, detail="Invalid token")

