from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.api import UploadResponse
from app.services.data_loader import load_dataframe
from app.services.engine.data_summary import build_data_summary
from app.services.sessions import create_session, get_session_or_404
from app.services.storage.files import save_upload_bytes

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...), industry: str | None = Form(default=None), db: Session = Depends(get_db)) -> UploadResponse:
    try:
        session = create_session(db, industry=industry)
        content = await file.read()
        file_name, file_path = save_upload_bytes(session.session_id, file.filename or "data.csv", content)
        session.file_name = file_name
        session.file_uri = file_path

        loaded = load_dataframe(file_path)
        summary = build_data_summary(loaded.df)
        session.data_summary = summary
        db.add(session)
        db.commit()

        return UploadResponse(session_id=session.session_id, file_name=file_name, data_summary=summary)  # type: ignore[arg-type]
    except Exception as e:
        logger.exception("upload_failed")
        raise HTTPException(status_code=400, detail=str(e))

