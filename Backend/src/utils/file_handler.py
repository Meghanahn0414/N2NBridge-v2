# File Handler Utility
import os
import shutil
from pathlib import Path
from fastapi import UploadFile
from config.settings import settings
import uuid
import logging

logger = logging.getLogger(__name__)

def ensure_upload_dir():
    """Create upload directory if it doesn't exist"""
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    logger.info(f"[FILE] Upload directory ensured: {settings.UPLOAD_DIR}")

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file"""
    if not file.filename:
        return False, "❌ No filename provided"
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [f".{ext}" for ext in settings.ALLOWED_EXTENSIONS]
    if file_ext not in allowed_exts:
        return False, f"❌ Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
    
    logger.info(f"[FILE] File validation passed: {file.filename}, ext: {file_ext}")
    return True, "✅ File valid"

async def upload_profile_image(file: UploadFile) -> str:
    """Upload and save profile image"""
    try:
        logger.info(f"[FILE] Starting file upload: {file.filename}")
        
        # Validate file
        is_valid, message = validate_file(file)
        if not is_valid:
            logger.error(f"[FILE] Validation failed: {message}")
            raise ValueError(message)
        
        # Check file size
        content = await file.read()
        file_size_mb = len(content) / 1024 / 1024
        logger.info(f"[FILE] File read, size: {len(content)} bytes ({file_size_mb:.2f}MB)")
        
        if len(content) > settings.MAX_UPLOAD_SIZE:
            max_size_mb = settings.MAX_UPLOAD_SIZE / 1024 / 1024
            logger.error(f"[FILE] File too large: {file_size_mb:.2f}MB > {max_size_mb:.2f}MB limit")
            raise ValueError(f"❌ File too large. Max size: {max_size_mb}MB")
        
        # Create upload directory
        ensure_upload_dir()
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        logger.info(f"[FILE] Saving file to: {file_path}")
        
        # Save file
        with open(file_path, "wb") as f:
            bytes_written = f.write(content)
            logger.info(f"[FILE] File saved: {bytes_written} bytes written to {file_path}")
        
        # Verify file was saved AND is readable
        if not os.path.exists(file_path):
            logger.error(f"[FILE] File not found after write: {file_path}")
            raise ValueError("File was not saved properly")
        
        saved_size = os.path.getsize(file_path)
        logger.info(f"[FILE] File verified: {saved_size} bytes on disk")
        
        # Double-check file size matches original content
        if saved_size != len(content):
            logger.error(f"[FILE] File size mismatch! Expected {len(content)}, got {saved_size}")
            try:
                os.remove(file_path)
                logger.error(f"[FILE] Corrupted file removed: {file_path}")
            except Exception as e:
                logger.error(f"[FILE] Failed to remove corrupted file: {e}")
            raise ValueError("File size mismatch - upload corrupted")
        
        # Return relative path for database storage (use forward slashes for URL consistency)
        # Extract just the filename portion for the relative path
        relative_path = unique_filename
        db_path = f"uploads/{relative_path}"
        logger.info(f"[FILE] ✅ Upload complete: {db_path}")
        return db_path
    
    except Exception as e:
        logger.error(f"[FILE] ❌ File upload failed: {str(e)}", exc_info=True)
        raise ValueError(f"❌ File upload failed: {str(e)}")

def delete_profile_image(file_path: str) -> bool:
    """Delete profile image"""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"[FILE] File deleted: {file_path}")
            return True
    except Exception as e:
        logger.error(f"[FILE] Error deleting file: {str(e)}")
    return False
