#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import MongoDatabase
from config.settings import settings

# Initialize database connection
MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)

# Get the database
db = MongoDatabase.get_db()

# Get the most recent 3 users
users_collection = db['users']
recent_users = list(users_collection.find().sort([('_id', -1)]).limit(3))

if recent_users:
    print('Most recent 3 users:')
    for user in recent_users:
        print(f"\n  Name: {user.get('fullName')}")
        print(f"  Email: {user.get('email')}")
        print(f"  Profile Image: {user.get('profileImage')}")
        print(f"  Role: {user.get('role')}")
else:
    print('No users found')
