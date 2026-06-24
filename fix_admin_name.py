"""
Fix admin user name from Devanagari (विशाला) to English (Vishala) in MongoDB.
Run from the CRM-01 folder:
  python fix_admin_name.py
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("Backend/.env")

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB  = os.getenv("MONGODB_DB", "crm_database")

client = MongoClient(MONGODB_URL)
db     = client[MONGODB_DB]

# Find admins whose fullName contains Devanagari characters
import re
devanagari = re.compile(r'[ऀ-ॿ]')

users = list(db.users.find({"role": "ADMIN"}))
print(f"Found {len(users)} admin user(s):\n")

for u in users:
    name = u.get("fullName") or u.get("full_name") or u.get("name") or ""
    print(f"  _id: {u['_id']}  |  fullName: '{name}'")

print()
name_input = input("Enter the _id of the admin to fix (or press Enter to skip): ").strip()
if not name_input:
    print("Skipped.")
    client.close()
    exit()

new_name = input("Enter the correct English name (e.g. Vishala): ").strip()
if not new_name:
    print("No name entered. Skipped.")
    client.close()
    exit()

from bson import ObjectId
result = db.users.update_one(
    {"_id": ObjectId(name_input)},
    {"$set": {"fullName": new_name}}
)
print(f"\n✅ Updated {result.modified_count} document(s). Name is now '{new_name}'.")
print("Log out and log back in to see the change in the header.")
client.close()
