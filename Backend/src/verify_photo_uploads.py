#!/usr/bin/env python
"""Test script to verify photo upload is working correctly"""
import sys
import os
import json
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import MongoDatabase
from config.settings import settings

# Initialize database
MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
db = MongoDatabase.get_db()

# Check all users with photos
print("=" * 60)
print("PHOTO UPLOAD VERIFICATION REPORT")
print("=" * 60)

users_collection = db['users']
users_with_photos = list(users_collection.find({"profileImage": {"$ne": None}}).limit(10))

print(f"\nTotal users with profile images: {len(users_with_photos)}")
print("\nVerifying files exist on disk:")
print("-" * 60)

missing_files = []
valid_files = []

for user in users_with_photos:
    name = user.get('fullName', 'Unknown')
    db_path = user.get('profileImage')
    
    # Convert db path to file path
    file_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(db_path))
    exists = os.path.exists(file_path)
    
    status = "✅ EXISTS" if exists else "❌ MISSING"
    print(f"{status} | {name:30} | {db_path}")
    
    if exists:
        size = os.path.getsize(file_path)
        valid_files.append((name, db_path, size))
    else:
        missing_files.append((name, db_path))

print("-" * 60)
print(f"\n✅ Valid files: {len(valid_files)}")
print(f"❌ Missing files: {len(missing_files)}")

if missing_files:
    print("\n⚠️  ISSUE: Files recorded in database but missing from disk:")
    for name, path in missing_files:
        print(f"   - {name}: {path}")

if not missing_files:
    print("\n✅ ALL PHOTO UPLOADS ARE VALID!")
