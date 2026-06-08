#!/usr/bin/env python
from config.database import MongoDatabase
from config.settings import settings

MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
db = MongoDatabase.get_db()
users = list(db['users'].find({'role': 'ADMIN'}).limit(3))

print("Available ADMIN users:")
for user in users:
    print(f'  Email: {user.get("email")} | Name: {user.get("fullName")}')

if not users:
    print("No ADMIN users found. Creating test admin...")
    # Will be implemented if needed
