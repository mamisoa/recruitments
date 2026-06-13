"""Filesystem storage for uploaded CV files (PDF/TXT)."""

from __future__ import annotations

import os
import uuid

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
}


def _ensure_upload_dir() -> str:
    path = os.path.abspath(settings.upload_dir)
    os.makedirs(path, exist_ok=True)
    return path


async def save_upload(file: UploadFile) -> tuple[str, int]:
    """Validate and persist an upload. Returns (stored_path, size_bytes)."""
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Only PDF and TXT allowed.",
        )

    ext = ALLOWED_CONTENT_TYPES[content_type]
    upload_dir = _ensure_upload_dir()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(upload_dir, stored_name)

    max_bytes = settings.max_upload_mb * 1024 * 1024
    size = 0
    with open(stored_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                os.remove(stored_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds the {settings.max_upload_mb} MB limit.",
                )
            out.write(chunk)

    return stored_path, size


def delete_file(stored_path: str) -> None:
    try:
        os.remove(stored_path)
    except FileNotFoundError:
        pass


def read_bytes(stored_path: str) -> bytes:
    with open(stored_path, "rb") as f:
        return f.read()
