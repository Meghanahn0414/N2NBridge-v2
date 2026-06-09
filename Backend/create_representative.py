"""Create representative user"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from datetime import datetime

from config.database import MongoDatabase
from config.security import SecurityManager, UserRole
from config.settings import settings

# Connect to database
db = MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)

# Create representative user
rep_user = {
    'fullName': 'Representative User',
    'mobile': '9999999995',
    'email': 'representative@crm.com',
    'passwordHash': SecurityManager.hash_password('representative@123'),
    'role': UserRole.REPRESENTATIVE,
    'status': 'ACTIVE',
    'lastLoginAt': None,
    'createdAt': datetime.utcnow(),
    'updatedAt': datetime.utcnow(),
    'createdBy': 'SYSTEM',
    'updatedBy': 'SYSTEM',
    'isDeleted': False
}

try:
    result = db.users.insert_one(rep_user)
    print(f'✓ Representative user created successfully!')
    print(f'  Email: representative@crm.com')
    print(f'  Password: representative@123')
except Exception as e:
    print(f'✗ Error: {e}')
