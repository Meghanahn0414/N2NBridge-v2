# File Handler Utility
import os
import shutil
from pathlib import Path
from fastapi import UploadFile
from config.settings import settings
import uuid

def ensure_upload_dir():
    """Create upload directory if it doesn't exist"""
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file"""
    if not file.filename:
        return False, "❌ No filename provided"
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [f".{ext}" for ext in settings.ALLOWED_EXTENSIONS]
    if file_ext not in allowed_exts:
        return False, f"❌ Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
    
    return True, "✅ File valid"

async def upload_profile_image(file: UploadFile) -> str:
    """Upload and save profile image"""
    try:
        # Validate file
        is_valid, message = validate_file(file)
        if not is_valid:
            raise ValueError(message)
        
        # Check file size
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise ValueError(f"❌ File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB")
        
        # Create upload directory
        ensure_upload_dir()
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return relative path for database storage
        return f"{settings.UPLOAD_DIR}/{unique_filename}"
    
    except Exception as e:
        raise ValueError(f"❌ File upload failed: {str(e)}")

def delete_profile_image(file_path: str) -> bool:
    """Delete profile image"""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"❌ Error deleting file: {str(e)}")
    return False
