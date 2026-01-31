from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.session import SessionDetail, SessionsResponse
from app.services.sessions import (
    get_session_or_404,
    list_sessions,
    serialize_session_detail,
    serialize_session,
    soft_delete_session,
)

router = APIRouter()


@router.get("/sessions", response_model=SessionsResponse)
def get_sessions(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    industry: str | None = None,
    method: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
) -> SessionsResponse:
    total, items = list_sessions(
        db,
        page=page,
        size=size,
        keyword=keyword,
        industry=industry,
        method=method,
        start_date=start_date,
        end_date=end_date,
    )
    return SessionsResponse(total=total, page=page, items=[serialize_session(s) for s in items])  # type: ignore[arg-type]


@router.get("/session/{session_id}", response_model=SessionDetail)
def get_session_detail(session_id: str, db: Session = Depends(get_db)) -> SessionDetail:
    try:
        s = get_session_or_404(db, session_id)
        return SessionDetail(**serialize_session_detail(s))  # type: ignore[arg-type]
    except KeyError:
        raise HTTPException(status_code=404, detail="会话不存在")


@router.delete("/session/{session_id}", response_class=Response, status_code=204)
def delete_session(session_id: str, db: Session = Depends(get_db)) -> Response:
    try:
        soft_delete_session(db, session_id)
        return Response(status_code=204)
    except KeyError:
        raise HTTPException(status_code=404, detail="会话不存在")
