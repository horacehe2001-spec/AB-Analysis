from __future__ import annotations

import base64
from pathlib import Path

from app.services.storage.paths import safe_filename, session_export_dir, session_upload_dir


def save_upload_bytes(session_id: str, original_name: str, content: bytes) -> tuple[str, str]:
    upload_dir = session_upload_dir(session_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_name = safe_filename(original_name)
    file_path = upload_dir / file_name
    file_path.write_bytes(content)
    return file_name, str(file_path)


def save_upload_base64(session_id: str, original_name: str, b64: str) -> tuple[str, str]:
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raw = base64.b64decode(b64)
    return save_upload_bytes(session_id, original_name, raw)


def save_export_bytes(session_id: str, file_name: str, content: bytes) -> tuple[str, str]:
    export_dir = session_export_dir(session_id)
    export_dir.mkdir(parents=True, exist_ok=True)
    safe_name = safe_filename(file_name)
    path = export_dir / safe_name
    path.write_bytes(content)
    return safe_name, str(path)


def resolve_export_path(session_id: str, file_name: str) -> Path:
    return session_export_dir(session_id) / safe_filename(file_name)

