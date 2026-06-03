"""
Sample Data Initialization Script
Populates MongoDB with test data for development and testing

Usage:
    python initialize_data.py
"""
import os
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from bson import ObjectId
from config.database import MongoDatabase
from config.settings import settings
from config.security import SecurityManager, UserRole


def initialize_database():
    """Initialize MongoDB with test data"""
    
    print("🚀 Initializing CRM Database with Test Data...")
    
    # Connect to database
    try:
        db = MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        return
    
    # Clear existing data (optional - comment out to keep existing data)
    # print("🧹 Clearing existing collections...")
    # db.users.delete_many({})
    # db.constituencies.delete_many({})
    # db.wards.delete_many({})
    # db.grievance_categories.delete_many({})
    # db.grievances.delete_many({})
    # db.alerts.delete_many({})
    
    # Create admin user
    print("\n📝 Creating users...")
    admin_user = {
        "fullName": "System Administrator",
        "mobile": "9999999999",
        "email": "admin@crm.com",
        "passwordHash": SecurityManager.hash_password("admin@123"),
        "role": UserRole.ADMIN,
        "status": "ACTIVE",
        "lastLoginAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": "SYSTEM",
        "updatedBy": "SYSTEM",
        "isDeleted": False
    }
    result = db.users.insert_one(admin_user)
    admin_id = str(result.inserted_id)
    print(f"✓ Admin user created: {admin_id}")
    
    # Create manager user
    manager_user = {
        "fullName": "Manager User",
        "mobile": "9999999998",
        "email": "manager@crm.com",
        "passwordHash": SecurityManager.hash_password("manager@123"),
        "role": UserRole.MANAGER,
        "status": "ACTIVE",
        "lastLoginAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": admin_id,
        "updatedBy": admin_id,
        "isDeleted": False
    }
    result = db.users.insert_one(manager_user)
    manager_id = str(result.inserted_id)
    print(f"✓ Manager user created: {manager_id}")
    
    # Create field officer
    officer_user = {
        "fullName": "Field Officer",
        "mobile": "9999999997",
        "email": "officer@crm.com",
        "passwordHash": SecurityManager.hash_password("officer@123"),
        "role": UserRole.FIELD_OFFICER,
        "status": "ACTIVE",
        "lastLoginAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": admin_id,
        "updatedBy": admin_id,
        "isDeleted": False
    }
    result = db.users.insert_one(officer_user)
    officer_id = str(result.inserted_id)
    print(f"✓ Field officer created: {officer_id}")
    
    # Create citizen
    citizen_user = {
        "fullName": "Citizen User",
        "mobile": "9999999996",
        "email": "citizen@crm.com",
        "passwordHash": SecurityManager.hash_password("citizen@123"),
        "role": UserRole.CITIZEN,
        "status": "ACTIVE",
        "lastLoginAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": admin_id,
        "updatedBy": admin_id,
        "isDeleted": False
    }
    result = db.users.insert_one(citizen_user)
    citizen_id = str(result.inserted_id)
    print(f"✓ Citizen user created: {citizen_id}")
    
    # Create constituencies
    print("\n🏛️  Creating constituencies...")
    constituencies_data = [
        {
            "constituencyCode": "BNG001",
            "name": "Bangalore South",
            "district": "Bangalore",
            "state": "Karnataka",
            "representativeId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "constituencyCode": "BNG002",
            "name": "Bangalore Central",
            "district": "Bangalore",
            "state": "Karnataka",
            "representativeId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "constituencyCode": "BNG003",
            "name": "Bangalore North",
            "district": "Bangalore",
            "state": "Karnataka",
            "representativeId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]
    result = db.constituencies.insert_many(constituencies_data)
    constituency_ids = [str(id) for id in result.inserted_ids]
    print(f"✓ {len(constituency_ids)} constituencies created")
    
    # Create wards
    print("\n🗺️  Creating wards...")
    wards_data = [
        {
            "wardNumber": "1",
            "wardName": "Ward 1",
            "constituencyId": constituency_ids[0],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "wardNumber": "2",
            "wardName": "Ward 2",
            "constituencyId": constituency_ids[0],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "wardNumber": "3",
            "wardName": "Ward 3",
            "constituencyId": constituency_ids[1],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]
    result = db.wards.insert_many(wards_data)
    ward_ids = [str(id) for id in result.inserted_ids]
    print(f"✓ {len(ward_ids)} wards created")
    
    # Create grievance categories
    print("\n📂 Creating grievance categories...")
    categories_data = [
        {
            "categoryName": "Pothole",
            "description": "Road potholes and surface damage",
            "isActive": True
        },
        {
            "categoryName": "Water Supply",
            "description": "Issues with water supply",
            "isActive": True
        },
        {
            "categoryName": "Street Light",
            "description": "Non-functional street lights",
            "isActive": True
        },
        {
            "categoryName": "Garbage Collection",
            "description": "Issues with waste collection",
            "isActive": True
        },
        {
            "categoryName": "Traffic",
            "description": "Traffic-related issues",
            "isActive": True
        }
    ]
    result = db.grievance_categories.insert_many(categories_data)
    category_ids = [str(id) for id in result.inserted_ids]
    print(f"✓ {len(category_ids)} categories created")
    
    # Create sample grievances
    print("\n📋 Creating sample grievances...")
    grievances_data = [
        {
            "complaintNumber": "GRV202400001",
            "citizenId": citizen_id,
            "categoryId": category_ids[0],
            "description": "Deep pothole on Main Street causing accidents",
            "address": "Main Street, Bangalore South",
            "wardId": ward_ids[0],
            "constituencyId": constituency_ids[0],
            "gpsLocation": {
                "type": "Point",
                "coordinates": [77.5963, 12.9716]
            },
            "priority": "HIGH",
            "status": "NEW",
            "escalationLevel": 0,
            "assignedOfficerId": None,
            "attachments": [],
            "history": [],
            "feedback": None,
            "aiAnalysis": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "createdBy": citizen_id,
            "updatedBy": citizen_id,
            "isDeleted": False
        },
        {
            "complaintNumber": "GRV202400002",
            "citizenId": citizen_id,
            "categoryId": category_ids[1],
            "description": "No water supply for 3 days",
            "address": "Park Street, Bangalore South",
            "wardId": ward_ids[0],
            "constituencyId": constituency_ids[0],
            "gpsLocation": {
                "type": "Point",
                "coordinates": [77.6000, 12.9750]
            },
            "priority": "CRITICAL",
            "status": "ASSIGNED",
            "escalationLevel": 0,
            "assignedOfficerId": officer_id,
            "attachments": [],
            "history": [
                {
                    "oldStatus": "NEW",
                    "newStatus": "ASSIGNED",
                    "remarks": "Assigned to Field Officer",
                    "updatedBy": manager_id,
                    "createdAt": datetime.utcnow() - timedelta(hours=1)
                }
            ],
            "feedback": None,
            "aiAnalysis": None,
            "createdAt": datetime.utcnow() - timedelta(days=1),
            "updatedAt": datetime.utcnow() - timedelta(hours=1),
            "createdBy": citizen_id,
            "updatedBy": manager_id,
            "isDeleted": False
        }
    ]
    result = db.grievances.insert_many(grievances_data)
    grievance_ids = [str(id) for id in result.inserted_ids]
    print(f"✓ {len(grievance_ids)} grievances created")
    
    # Create sample alerts
    print("\n🚨 Creating sample alerts...")
    alerts_data = [
        {
            "alertNumber": "ALT202400001",
            "citizenId": citizen_id,
            "alertType": "EMERGENCY",
            "priority": "CRITICAL",
            "description": "Fire reported in building",
            "location": {
                "type": "Point",
                "coordinates": [77.5900, 12.9700]
            },
            "mediaAttachments": [],
            "assignedTo": officer_id,
            "status": "IN_PROGRESS",
            "createdAt": datetime.utcnow() - timedelta(hours=2),
            "updatedAt": datetime.utcnow() - timedelta(minutes=30)
        }
    ]
    result = db.alerts.insert_many(alerts_data)
    print(f"✓ {len(alerts_data)} alerts created")
    
    # Create sample event
    print("\n🎉 Creating sample event...")
    event_data = {
        "eventName": "Community Town Hall",
        "description": "Monthly community engagement meeting",
        "eventType": "Meeting",
        "venue": "City Community Center",
        "eventDate": datetime.utcnow() + timedelta(days=7),
        "organizerId": manager_id,
        "capacity": 200,
        "qrEnabled": True,
        "registrationCount": 0,
        "status": "PUBLISHED",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": manager_id,
        "updatedBy": manager_id,
        "isDeleted": False
    }
    result = db.events.insert_one(event_data)
    event_id = str(result.inserted_id)
    print(f"✓ Event created: {event_id}")
    
    # Create task
    print("\n✅ Creating sample task...")
    task_data = {
        "grievanceId": grievance_ids[1],
        "assignedBy": manager_id,
        "assignedTo": officer_id,
        "priority": "HIGH",
        "dueDate": datetime.utcnow() + timedelta(days=2),
        "status": "IN_PROGRESS",
        "remarks": "Check water supply in Ward 1",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "createdBy": manager_id,
        "updatedBy": manager_id,
        "isDeleted": False
    }
    result = db.tasks.insert_one(task_data)
    print(f"✓ Task created: {str(result.inserted_id)}")
    
    # Create notification
    print("\n🔔 Creating sample notification...")
    notification_data = {
        "userId": citizen_id,
        "title": "Grievance Update",
        "body": "Your grievance has been assigned to a field officer",
        "type": "GRIEVANCE",
        "isRead": False,
        "createdAt": datetime.utcnow()
    }
    result = db.notifications.insert_one(notification_data)
    print(f"✓ Notification created: {str(result.inserted_id)}")
    
    print("\n" + "="*50)
    print("✅ Database initialization completed successfully!")
    print("="*50)
    print("\n📋 Test Credentials:")
    print(f"  Admin:        admin@crm.com / admin@123")
    print(f"  Manager:      manager@crm.com / manager@123")
    print(f"  Field Officer: officer@crm.com / officer@123")
    print(f"  Citizen:      citizen@crm.com / citizen@123")
    print("\n🔗 Access the API at: http://localhost:8000/api/docs")
    print("="*50)
    
    MongoDatabase.close()


if __name__ == "__main__":
    initialize_database()
