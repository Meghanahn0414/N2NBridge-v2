#!/usr/bin/env python3
"""
Script to generate and add managerId to existing managers that don't have one
Run this once to fix missing manager IDs
"""
import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from config.database import MongoDatabase
from utils.id_generator import IDGenerator

def add_manager_ids():
    """Generate and add managerId to managers without one"""
    try:
        db = MongoDatabase.get_db()
        
        # Find all managers without managerId
        managers_without_id = list(db.users.find({
            "role": "CONSTITUENCY_MANAGER",
            "$or": [
                {"managerId": {"$exists": False}},
                {"managerId": None},
                {"managerId": ""}
            ]
        }))
        
        print(f"Found {len(managers_without_id)} managers without managerId")
        
        if len(managers_without_id) == 0:
            print("✓ All managers already have IDs - nothing to do!")
            return
        
        # Generate and add managerId for each
        updated_count = 0
        for manager in managers_without_id:
            manager_id = IDGenerator.generate_manager_id()
            result = db.users.update_one(
                {"_id": manager["_id"]},
                {"$set": {"managerId": manager_id}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"✓ Added managerId '{manager_id}' to {manager.get('fullName')} ({manager.get('email')})")
            else:
                print(f"❌ Failed to update {manager.get('fullName')}")
        
        print(f"\n✓ Successfully added managerId to {updated_count} managers")
        
        # Verify
        all_managers = list(db.users.find({"role": "CONSTITUENCY_MANAGER"}))
        print(f"\nVerification - All managers with IDs:")
        for mgr in all_managers:
            print(f"  - {mgr.get('fullName')} ({mgr.get('email')}): {mgr.get('managerId', 'MISSING')}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Manager ID Generation Script")
    print("=" * 60)
    add_manager_ids()
    print("=" * 60)
    print("Migration complete!")
