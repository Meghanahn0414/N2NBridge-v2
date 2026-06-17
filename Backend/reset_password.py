import sys
sys.path.insert(0, "src")

import bcrypt
from config.database import MongoDatabase

db = MongoDatabase.get_db()

# Reset password for all admin accounts
emails = ["admin@mail.com", "mla@gmail.com"]
for email in emails:
    h = bcrypt.hashpw(b"Admin123", bcrypt.gensalt()).decode()
    r = db.users.update_one({"email": email}, {"$set": {"passwordHash": h}})
    print(f"{email}: Updated {r.modified_count}")
