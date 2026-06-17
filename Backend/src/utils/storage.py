"""
File Storage Utility — S3 (production) with local-disk fallback (dev).

When S3_BUCKET_NAME is set in the environment, all uploads go to S3 and
a public URL is returned.  Without it the file is saved locally under
UPLOAD_DIR and a relative path is returned (same behaviour as before).
"""
import logging
import os
import uuid
from pathlib import Path

import aiofiles
from config.settings import settings
from fastapi import UploadFile

logger = logging.getLogger(__name__)


# ── Validation ─────────────────────────────────────────────────────────────────

def _validate(file: UploadFile, content: bytes) -> None:
    """Raise ValueError for invalid filename, extension, or oversized files."""
    if not file.filename:
        raise ValueError("No filename provided")

    ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Invalid file type '.{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    if len(content) > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE / 1024 / 1024
        raise ValueError(f"File too large. Maximum size is {max_mb:.0f} MB")


def _unique_name(original: str) -> str:
    ext = os.path.splitext(original)[1].lower()
    return f"{uuid.uuid4()}{ext}"


# ── S3 upload ──────────────────────────────────────────────────────────────────

def _upload_to_s3(content: bytes, key: str, content_type: str) -> str:
    """Upload bytes to S3 and return the public URL."""
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        logger.info(f"Uploaded to S3: {url}")
        return url
    except (BotoCoreError, ClientError) as exc:
        logger.error(f"S3 upload failed: {exc}")
        raise ValueError(f"S3 upload failed: {exc}") from exc


# ── Local upload ───────────────────────────────────────────────────────────────

async def _save_locally(content: bytes, filename: str) -> str:
    """Save bytes to local UPLOAD_DIR and return the db-storable relative path."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / filename
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    logger.info(f"Saved locally: {file_path}")
    return f"uploads/{filename}"


# ── Public API ─────────────────────────────────────────────────────────────────

async def upload_file(file: UploadFile, folder: str = "uploads") -> str:
    """
    Validate and store an uploaded file.

    Returns:
        S3 URL (if S3 configured) or relative path like "uploads/<uuid>.ext".
    """
    content = await file.read()
    _validate(file, content)

    filename = _unique_name(file.filename)

    if settings.USE_S3_STORAGE and settings.S3_BUCKET_NAME:
        key = f"{folder}/{filename}"
        content_type = file.content_type or "application/octet-stream"
        return _upload_to_s3(content, key, content_type)

    return await _save_locally(content, filename)


async def delete_file(path_or_url: str) -> bool:
    """
    Delete a file from S3 or local disk.
    path_or_url is whatever was stored in the database.
    """
    if not path_or_url:
        return False

    # S3 URL
    if path_or_url.startswith("https://") and settings.S3_BUCKET_NAME:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            # Extract key from URL: https://<bucket>.s3.<region>.amazonaws.com/<key>
            key = path_or_url.split(".amazonaws.com/", 1)[-1]
            s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            logger.info(f"Deleted from S3: {key}")
            return True
        except Exception as exc:
            logger.error(f"S3 delete failed: {exc}")
            return False

    # Local file
    local_path = path_or_url
    if path_or_url.startswith("uploads/"):
        local_path = os.path.join(settings.UPLOAD_DIR, path_or_url[len("uploads/"):])
    try:
        if os.path.exists(local_path):
            os.remove(local_path)
            logger.info(f"Deleted local file: {local_path}")
            return True
    except Exception as exc:
        logger.error(f"Local delete failed: {exc}")
    return False
