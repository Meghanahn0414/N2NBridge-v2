# MongoDB Database Configuration
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "crm_db")

def get_mongo_client():
    """Create MongoDB connection"""
    try:
        client = MongoClient(MONGODB_URL)
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB at {MONGODB_URL}")
        return client
    except ConnectionFailure:
        print(f"❌ Failed to connect to MongoDB at {MONGODB_URL}")
        raise

def get_database():
    """Get database instance"""
    try:
        client = get_mongo_client()
        db = client[DB_NAME]
        return db
    except Exception as e:
        print(f"⚠️  Warning: Could not connect to database: {str(e)}")
        # Create a mock database object for testing
        # In production, this should fail
        raise

def init_database():
    """Initialize database and create collections with indexes"""
    db = get_database()
    
    # Create collections
    collections = [
        "voters",
        "roles",
        "otp_verification"
    ]
    
    for collection in collections:
        if collection not in db.list_collection_names():
            db.create_collection(collection)
            print(f"✅ Created collection: {collection}")
        else:
            print(f"⚠️  Collection already exists: {collection}")
    