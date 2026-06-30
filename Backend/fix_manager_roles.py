#!/usr/bin/env python3
"""
Script to migrate existing MANAGER role to CONSTITUENCY_MANAGER
Run this once to fix the role naming inconsistency
"""
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from config.database import MongoDatabase
from pymongo import errors

def migrate_manager_roles():
    """Migrate all MANAGER roles to CONSTITUENCY_MANAGER"""
    try:
        db = MongoDatabase.get_db()
        
        # Find all users with role="MANAGER"
        managers = list(db.users.find({"role": "MANAGER"}))
        print(f"Found {len(managers)} users with role='MANAGER'")
        
        if len(managers) == 0:
            print("✓ No managers to migrate - already up to date!")
            return
        
        # Update them to CONSTITUENCY_MANAGER
        result = db.users.update_many(
            {"role": "MANAGER"},
            {"$set": {"role": "CONSTITUENCY_MANAGER"}}
        )
        
        print(f"✓ Updated {result.modified_count} users")
        print(f"  Matched: {result.matched_count}")
        print(f"  Modified: {result.modified_count}")
        
        # Verify
        updated = list(db.users.find({"role": "CONSTITUENCY_MANAGER"}))
        print(f"\n✓ Verification: {len(updated)} users now have role='CONSTITUENCY_MANAGER'")
        
        for user in updated:
            print(f"  - {user.get('fullName')} ({user.get('email')})")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Manager Role Migration Script")
    print("=" * 60)
    migrate_manager_roles()
    print("=" * 60)
    print("Migration complete!")
