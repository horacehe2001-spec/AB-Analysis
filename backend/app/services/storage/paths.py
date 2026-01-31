from __future__ import annotations

import os
from pathlib import Path

from app.core.settings import settings


def ensure_data_dirs() -> None:
    base = Path(settings.data_dir)
    (base / "uploads").mkdir(parents=True, exist_ok=True)
    (base / "exports").mkdir(parents=True, exist_ok=True)


def session_upload_dir(session_id: str) -> Path:
    ensure_data_dirs()
    return Path(settings.data_dir) / "uploads" / session_id


def session_export_dir(session_id: str) -> Path:
    ensure_data_dirs()
    return Path(settings.data_dir) / "exports" / session_id


def safe_filename(name: str) -> str:
    name = os.path.basename(name).strip().replace("\x00", "")
    return name or "file"

