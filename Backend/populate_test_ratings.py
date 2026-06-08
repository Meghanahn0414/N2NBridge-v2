"""
Populate test data with satisfaction ratings to verify team performance rating calculations
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from config.database import MongoDatabase
from config.settings import Settings
from datetime import datetime, timedelta
import random

def populate_test_ratings():
    """Add satisfaction ratings to grievances for team performance testing"""
    
    # Initialize database connection
    try:
        settings = Settings()
        MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
        print(f"Connected to MongoDB: {settings.MONGODB_DB}")
    except Exception as e:
        print(f"Connection error: {e}")
        return
    
    db = MongoDatabase.get_db()
    
    # Get all officers
    officers = list(db.users.find(
        {"role": {"$in": ["FIELD_OFFICER", "OFFICER", "MANAGER"]}, "isDeleted": False}
    ))
    
    if not officers:
        print("No officers found in database")
        return
    
    print(f"Found {len(officers)} officers. Adding satisfaction ratings to existing grievances...")
    
    # Get all grievances (not just resolved)
    grievances = list(db.grievances.find(
        {"assignedOfficerId": {"$exists": True}}
    ))
    
    if not grievances:
        print("No grievances found in database. No ratings to update.")
        return
    
    print(f"Found {len(grievances)} grievances. Updating with satisfaction ratings...")
    
    updated_count = 0
    # Update grievances with satisfaction ratings if they don't have them
    for grievance in grievances[:20]:  # Limit to first 20 for testing
        grievance_id = str(grievance.get('_id'))
        if "satisfactionRating" not in grievance or grievance.get("satisfactionRating") is None:
            satisfaction_rating = random.choice([2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0])
            db.grievances.update_one(
                {"_id": grievance["_id"]},
                {"$set": {"satisfactionRating": satisfaction_rating}}
            )
            updated_count += 1
            print(f"  ✓ Updated grievance {grievance_id[:6]}... with rating {satisfaction_rating}")
        else:
            print(f"  - Grievance {grievance_id[:6]}... already has rating {grievance.get('satisfactionRating')}")
    
    print(f"\n✅ Updated {updated_count} grievances with satisfaction ratings!")
    print("Ratings will now calculate based on satisfaction ratings in the database")
    print("\nTo see the updated ratings:")
    print("1. Refresh the dashboard in your browser")
    print("2. Team Performance ratings should now show varied values (2.0-5.0) based on satisfaction ratings")

if __name__ == "__main__":
    populate_test_ratings()
