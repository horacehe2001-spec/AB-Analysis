from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.api import ExportRequest, ExportResponse
from app.services.config_store import get_model_config
from app.services.exporter import build_docx_report, build_markdown_report
from app.services.sessions import get_session_or_404
from app.services.storage.files import resolve_export_path, save_export_bytes

router = APIRouter()


def _now_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


@router.post("/export", response_model=ExportResponse)
def export_report(req: ExportRequest, request: Request, db: Session = Depends(get_db)) -> ExportResponse:
    try:
        s = get_session_or_404(db, req.session_id)
        llm_config = get_model_config(db)
        if not s.report_conclusion:
            raise HTTPException(status_code=400, detail="请先生成分析报告结论后再导出")

        if req.format == "md":
            md_text, chart_images = build_markdown_report(s, include_charts=req.include_charts, llm_config=llm_config)
            if chart_images:
                # Pack MD + PNG images into a zip
                buf = io.BytesIO()
                with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                    zf.writestr("report.md", md_text.encode("utf-8"))
                    for img_name, img_bytes in chart_images:
                        zf.writestr(img_name, img_bytes)
                content = buf.getvalue()
                file_name = f"report-{_now_tag()}.zip"
            else:
                content = md_text.encode("utf-8")
                file_name = f"report-{_now_tag()}.md"
        elif req.format == "docx":
            content = build_docx_report(s, include_charts=req.include_charts, llm_config=llm_config)
            file_name = f"report-{_now_tag()}.docx"
        else:
            raise ValueError("Unsupported export format")

        saved_name, _ = save_export_bytes(req.session_id, file_name, content)
        download_url = str(request.base_url).rstrip("/") + f"/api/v2/download/{req.session_id}/{saved_name}"
        return ExportResponse(download_url=download_url, file_name=saved_name)
    except KeyError:
        raise HTTPException(status_code=404, detail="会话不存在")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/download/{session_id}/{file_name}")
def download(session_id: str, file_name: str, db: Session = Depends(get_db)) -> FileResponse:
    try:
        _ = get_session_or_404(db, session_id)
        path = resolve_export_path(session_id, file_name)
        if not path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")
        return FileResponse(path=str(path), filename=path.name)
    except KeyError:
        raise HTTPException(status_code=404, detail="会话不存在")
