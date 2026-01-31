from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.db.models import MessageModel, SessionModel


def _to_iso(dt: datetime) -> str:
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def create_session(db: Session, *, industry: str | None = None) -> SessionModel:
    s = SessionModel(industry=industry)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_session_or_404(db: Session, session_id: str) -> SessionModel:
    s = db.get(SessionModel, session_id)
    if not s or s.deleted_at is not None:
        raise KeyError("session_not_found")
    return s


def touch_session(db: Session, s: SessionModel) -> None:
    s.updated_at = datetime.now(timezone.utc)
    db.add(s)
    db.commit()


def add_message(
    db: Session,
    *,
    session_id: str,
    role: str,
    content: str,
    analysis: dict[str, Any] | None = None,
) -> MessageModel:
    msg = MessageModel(session_id=session_id, role=role, content=content, analysis=analysis)
    db.add(msg)
    s = db.get(SessionModel, session_id)
    if s:
        s.message_count = (s.message_count or 0) + 1
        if role == "user" and not s.first_query:
            s.first_query = content
    db.commit()
    db.refresh(msg)
    return msg


def list_sessions(
    db: Session,
    *,
    page: int,
    size: int,
    keyword: str | None,
    industry: str | None,
    method: str | None,
    start_date: str | None,
    end_date: str | None,
) -> tuple[int, list[SessionModel]]:
    stmt = select(SessionModel).where(SessionModel.deleted_at.is_(None))

    if keyword:
        like = f"%{keyword}%"
        stmt = stmt.where(or_(SessionModel.first_query.like(like), SessionModel.file_name.like(like)))
    if industry:
        stmt = stmt.where(SessionModel.industry == industry)
    if method:
        # Portable filtering across SQLite/Postgres: match on JSON text
        stmt = stmt.where(cast(SessionModel.methods_used, String).like(f"%{method}%"))

    def parse_date(s: str | None) -> datetime | None:
        if not s:
            return None
        try:
            # accept yyyy-mm-dd or ISO
            if len(s) == 10:
                return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None

    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if start_dt:
        stmt = stmt.where(SessionModel.created_at >= start_dt)
    if end_dt:
        stmt = stmt.where(SessionModel.created_at <= end_dt)

    count = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    stmt = stmt.order_by(SessionModel.updated_at.desc()).offset((page - 1) * size).limit(size)
    items = db.execute(stmt).scalars().all()
    return int(count), items


def serialize_session(s: SessionModel) -> dict[str, Any]:
    return {
        "session_id": s.session_id,
        "created_at": _to_iso(s.created_at),
        "updated_at": _to_iso(s.updated_at),
        "file_name": s.file_name,
        "industry": s.industry,
        "first_query": s.first_query,
        "methods_used": s.methods_used or [],
        "message_count": s.message_count or 0,
    }


def serialize_message(m: MessageModel) -> dict[str, Any]:
    return {
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "timestamp": _to_iso(m.timestamp),
        "analysis": m.analysis,
    }


def serialize_session_detail(s: SessionModel) -> dict[str, Any]:
    return {
        **serialize_session(s),
        "messages": [serialize_message(m) for m in s.messages],
        "data_summary": s.data_summary,
        "report_conclusion": s.report_conclusion,
    }


def soft_delete_session(db: Session, session_id: str) -> None:
    s = get_session_or_404(db, session_id)
    s.deleted_at = datetime.now(timezone.utc)
    db.add(s)
    db.commit()
