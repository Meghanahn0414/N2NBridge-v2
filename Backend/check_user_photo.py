#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.database import MongoDB

db = MongoDB()

# Get the most recent user
users_collection = db.db['users']
recent_user = users_collection.find_one(sort=[('_id', -1)])

if recent_user:
    print('Most recent user:')
    print(f"  ID: {recent_user.get('_id')}")
    print(f"  Name: {recent_user.get('fullName')}")
    print(f"  Email: {recent_user.get('email')}")
    print(f"  Profile Image: {recent_user.get('profileImage')}")
    print(f"  Role: {recent_user.get('role')}")
else:
    print('No users found')
