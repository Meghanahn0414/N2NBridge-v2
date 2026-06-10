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
from config.security import SecurityManager, UserRole
from config.settings import settings


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
    
    # Create multiple citizens
    citizen_ids = []
    citizens_data = [
        {"fullName": "Rajesh Kumar", "mobile": "9999999996", "email": "rajesh@crm.com"},
        {"fullName": "Priya Singh", "mobile": "9999999991", "email": "priya@crm.com"},
        {"fullName": "Amit Patel", "mobile": "9999999992", "email": "amit@crm.com"},
        {"fullName": "Neha Verma", "mobile": "9999999993", "email": "neha@crm.com"},
        {"fullName": "Vikram Desai", "mobile": "9999999994", "email": "vikram@crm.com"},
        {"fullName": "Anjali Sharma", "mobile": "9988888881", "email": "anjali@crm.com"},
        {"fullName": "Rohan Gupta", "mobile": "9988888882", "email": "rohan@crm.com"},
        {"fullName": "Maya Nair", "mobile": "9988888883", "email": "maya@crm.com"},
    ]
    for idx, citizen_data in enumerate(citizens_data):
        user = {
            "fullName": citizen_data["fullName"],
            "mobile": citizen_data["mobile"],
            "email": citizen_data["email"],
            "passwordHash": SecurityManager.hash_password("citizen@123"),
            "role": UserRole.CITIZEN,
            "status": "ACTIVE",
            "lastLoginAt": None,
            "createdAt": datetime.utcnow() - timedelta(days=10-idx),
            "updatedAt": datetime.utcnow(),
            "createdBy": admin_id,
            "updatedBy": admin_id,
            "isDeleted": False
        }
        result = db.users.insert_one(user)
        citizen_ids.append(str(result.inserted_id))
    print(f"✓ {len(citizen_ids)} citizen users created")
    citizen_id = citizen_ids[0]  # Use first citizen for other references
    
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
    
    # Create sample grievances (15+ complaints with varied statuses)
    print("\n📋 Creating sample grievances...")
    grievance_templates = [
        # Pothole complaints (different citizens)
        {"catIdx": 0, "description": "Deep pothole on Main Street causing accidents", "address": "Main Street, Bangalore South", "wardIdx": 0, "priority": "HIGH", "status": "NEW"},
        {"catIdx": 0, "description": "Multiple potholes on Indiranagar Road", "address": "Indiranagar Road", "wardIdx": 1, "priority": "MEDIUM", "status": "ASSIGNED"},
        {"catIdx": 0, "description": "Severe road damage near shopping mall", "address": "Commercial Complex Road", "wardIdx": 0, "priority": "HIGH", "status": "IN_PROGRESS"},
        {"catIdx": 0, "description": "Pothole in residential area causing property damage", "address": "Lavelle Road", "wardIdx": 2, "priority": "MEDIUM", "status": "RESOLVED"},
        
        # Water supply complaints
        {"catIdx": 1, "description": "No water supply for 3 days", "address": "Park Street, Bangalore South", "wardIdx": 0, "priority": "CRITICAL", "status": "ASSIGNED"},
        {"catIdx": 1, "description": "Low water pressure in entire ward", "address": "Whitefield Area", "wardIdx": 1, "priority": "HIGH", "status": "IN_PROGRESS"},
        {"catIdx": 1, "description": "Contaminated water from tap", "address": "Jayanagar", "wardIdx": 2, "priority": "CRITICAL", "status": "NEW"},
        
        # Street light complaints
        {"catIdx": 2, "description": "20 street lights not working on Main Road", "address": "Main Road, Bangalore", "wardIdx": 0, "priority": "HIGH", "status": "NEW"},
        {"catIdx": 2, "description": "Street light causing flickering issue", "address": "MG Road", "wardIdx": 1, "priority": "MEDIUM", "status": "RESOLVED"},
        
        # Garbage complaints
        {"catIdx": 3, "description": "Garbage not collected for 5 days", "address": "Residential Area A", "wardIdx": 0, "priority": "HIGH", "status": "ASSIGNED"},
        {"catIdx": 3, "description": "Overflowing garbage bins near market", "address": "Market Area", "wardIdx": 1, "priority": "MEDIUM", "status": "IN_PROGRESS"},
        {"catIdx": 3, "description": "Illegal dumping site in residential zone", "address": "Zone B", "wardIdx": 2, "priority": "HIGH", "status": "NEW"},
        
        # Traffic complaints
        {"catIdx": 4, "description": "Traffic signal not working at intersection", "address": "Main Intersection", "wardIdx": 0, "priority": "CRITICAL", "status": "IN_PROGRESS"},
        {"catIdx": 4, "description": "Dangerous driving near school", "address": "School Street", "wardIdx": 1, "priority": "HIGH", "status": "NEW"},
        {"catIdx": 4, "description": "Inadequate parking affecting traffic", "address": "Commercial Hub", "wardIdx": 2, "priority": "MEDIUM", "status": "ASSIGNED"},
        
        # Mixed complaints
        {"catIdx": 1, "description": "Broken water pipe in main road", "address": "Central Road", "wardIdx": 0, "priority": "HIGH", "status": "RESOLVED"},
    ]
    
    grievance_ids = []
    coords_list = [
        [77.5963, 12.9716], [77.6100, 12.9800], [77.5800, 12.9600],
        [77.6200, 12.9500], [77.5900, 12.9750], [77.6300, 12.9650],
        [77.5700, 12.9700], [77.6000, 12.9550], [77.6100, 12.9900],
        [77.5850, 12.9800], [77.6150, 12.9700], [77.5950, 12.9600],
        [77.6050, 12.9750], [77.5850, 12.9650], [77.6200, 12.9850],
        [77.5900, 12.9700]
    ]
    
    statuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"]
    
    for idx, template in enumerate(grievance_templates):
        citizen_idx = idx % len(citizen_ids)
        complaint_num = f"GRV{datetime.utcnow().year}{(idx+1):06d}"
        
        grievance = {
            "complaintNumber": complaint_num,
            "citizenId": citizen_ids[citizen_idx],
            "categoryId": category_ids[template["catIdx"]],
            "description": template["description"],
            "address": template["address"],
            "wardId": ward_ids[template["wardIdx"]],
            "constituencyId": constituency_ids[template["wardIdx"]],
            "gpsLocation": {
                "type": "Point",
                "coordinates": coords_list[idx % len(coords_list)]
            },
            "priority": template["priority"],
            "status": template["status"],
            "escalationLevel": 0,
            "assignedOfficerId": officer_id if template["status"] in ["ASSIGNED", "IN_PROGRESS", "RESOLVED"] else None,
            "attachments": [],
            "history": [
                {
                    "oldStatus": "NEW",
                    "newStatus": template["status"],
                    "remarks": f"Status updated to {template['status']}",
                    "updatedBy": manager_id if template["status"] != "NEW" else citizen_ids[citizen_idx],
                    "createdAt": datetime.utcnow() - timedelta(hours=idx)
                }
            ] if template["status"] != "NEW" else [],
            "feedback": None,
            "aiAnalysis": None,
            "createdAt": datetime.utcnow() - timedelta(days=max(0, 5-idx//3)),
            "updatedAt": datetime.utcnow() - timedelta(hours=idx),
            "createdBy": citizen_ids[citizen_idx],
            "updatedBy": manager_id if template["status"] != "NEW" else citizen_ids[citizen_idx],
            "isDeleted": False
        }
        result = db.grievances.insert_one(grievance)
        grievance_ids.append(str(result.inserted_id))
    
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
