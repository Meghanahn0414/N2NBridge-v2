#!/usr/bin/env python
"""Test photo upload directly via API"""
import requests
import json
from pathlib import Path
import time

BASE_URL = "http://localhost:8000/api"

# Test user data with unique timestamp
timestamp = int(time.time())
test_user = {
    "fullName": f"Test Photo {timestamp}",
    "email": f"testphoto{timestamp}@test.com",
    "mobile": f"+{9876543200 + (timestamp % 1000)}",
    "password": "TestPhoto@123",
    "role": "REPRESENTATIVE"
}

print("=" * 60)
print("TESTING PHOTO UPLOAD")
print("=" * 60)

# Step 1: Register user
print("\n1. Registering test user...")
response = requests.post(f"{BASE_URL}/auth/register", json=test_user)

if response.status_code != 200:
    print(f"❌ Registration failed: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()
user_id = data.get('user', {}).get('id')
print(f"✅ User registered with ID: {user_id}")

# Step 2: Upload photo
print(f"\n2. Uploading photo for user {user_id}...")

# Create test image
test_image_path = "D:/test_upload.png"
from PIL import Image
img = Image.new('RGB', (200, 200), color='blue')
img.save(test_image_path)

with open(test_image_path, 'rb') as f:
    files = {'file': f}
    response = requests.post(
        f"{BASE_URL}/users/{user_id}/upload-profile-photo",
        files=files
    )

if response.status_code != 200:
    print(f"❌ Photo upload failed: {response.status_code}")
    print(response.text)
    exit(1)

photo_data = response.json()
print(f"✅ Photo uploaded successfully")
print(f"   Response: {json.dumps(photo_data, indent=2)}")

profile_image_path = photo_data.get('data', {}).get('profileImage')
print(f"   Database path: {profile_image_path}")

# Step 3: Verify file exists
print(f"\n3. Verifying file exists on disk...")
if profile_image_path:
    # Extract filename from path
    filename = Path(profile_image_path).name
    disk_path = f"D:/CRM-01/uploads/{filename}"
    
    if Path(disk_path).exists():
        size = Path(disk_path).stat().st_size
        print(f"✅ File exists on disk: {disk_path}")
        print(f"   Size: {size} bytes")
    else:
        print(f"❌ File NOT found on disk: {disk_path}")
else:
    print("❌ No profile image path in response")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
