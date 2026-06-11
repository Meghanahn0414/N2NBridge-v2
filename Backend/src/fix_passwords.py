"""
Fix user passwords that are stored in an unrecognised hash format.
Resets every affected user's password to the default for their role.

Usage:
    cd Backend/src
    python fix_passwords.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from passlib.exc import UnknownHashError
from config.database import MongoDatabase
from config.security import SecurityManager
from config.settings import settings

DEFAULT_PASSWORDS = {
    "ADMIN":        "admin@123",
    "MANAGER":      "manager@123",
    "FIELD_OFFICER": "officer@123",
    "REPRESENTATIVE": "rep@123",
    "CITIZEN":      "citizen@123",
}
FALLBACK_PASSWORD = "Welcome@123"


def is_valid_hash(h: str) -> bool:
    try:
        SecurityManager.verify_password("test", h)
        return True
    except Exception:
        return False


def fix_passwords():
    db = MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
    print("Connected to MongoDB\n")

    users = list(db.users.find({}))
    fixed = 0

    for user in users:
        ph = user.get("passwordHash", "")
        if is_valid_hash(ph):
            continue

        role = user.get("role", "")
        new_password = DEFAULT_PASSWORDS.get(role, FALLBACK_PASSWORD)
        new_hash = SecurityManager.hash_password(new_password)

        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"passwordHash": new_hash}}
        )
        print(f"Fixed: {user.get('email')} ({role}) → password reset to '{new_password}'")
        fixed += 1

    print(f"\nDone. {fixed} user(s) updated.")
    MongoDatabase.close()


if __name__ == "__main__":
    fix_passwords()
