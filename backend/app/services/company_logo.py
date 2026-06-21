from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads" / "company_logos"
ALLOWED_CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_BYTES = 2 * 1024 * 1024


def ensure_upload_dir() -> None:
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def delete_company_logo_files(company_id: str) -> None:
    ensure_upload_dir()
    for path in UPLOAD_ROOT.glob(f"{company_id}.*"):
        path.unlink(missing_ok=True)


def logo_public_url(company_id: str, ext: str) -> str:
    return f"/api/uploads/company_logos/{company_id}{ext}"


async def save_company_logo(company_id: str, file: UploadFile) -> str:
    content_type = (file.content_type or "").lower()
    ext = ALLOWED_CONTENT_TYPES.get(content_type)
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use PNG, JPG, WEBP, or GIF.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Logo must be 2MB or smaller.")

    ensure_upload_dir()
    delete_company_logo_files(company_id)
    dest = UPLOAD_ROOT / f"{company_id}{ext}"
    dest.write_bytes(content)
    return logo_public_url(company_id, ext)
