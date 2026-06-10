"""
MongoDB Database Configuration and Connection
"""
from pymongo import MongoClient, ASCENDING, DESCENDING, GEOSPHERE
from pymongo.errors import ServerSelectionTimeoutError
from typing import Optional
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)


class MongoDatabase:
    _client: Optional[MongoClient] = None
    _db = None

    @classmethod
    def connect(cls, connection_string: str, db_name: str):
        """Initialize MongoDB connection"""
        try:
            cls._client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            cls._client.admin.command('ping')
            cls._db = cls._client[db_name]
            logger.info(f"Connected to MongoDB database: {db_name}")
            cls._create_collections()
            cls._create_indexes()
            return cls._db
        except ServerSelectionTimeoutError as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            logger.warning("Database not initialized. Attempting automatic connection.")
            from config.settings import settings
            cls.connect(settings.MONGODB_URL, settings.MONGODB_DB)
        return cls._db

    @classmethod
    def close(cls):
        """Close database connection"""
        if cls._client:
            cls._client.close()
            logger.info("MongoDB connection closed")

    @classmethod
    def _create_collections(cls):
        """Create collections if they don't exist"""
        collections = [
            'users',
            'constituencies',
            'wards',
            'grievance_categories',
            'grievances',
            'alerts',
            'events',
            'event_registrations',
            'campaigns',
            'communications',
            'tasks',
            'field_reports',
            'surveys',
            'survey_responses',
            'notifications',
            'audit_logs'
        ]
        
        for collection_name in collections:
            if collection_name not in cls._db.list_collection_names():
                cls._db.create_collection(collection_name)
                logger.info(f"Created collection: {collection_name}")

    @classmethod
    def _create_indexes(cls):
        """Create all required indexes"""
        
        # Users indexes
        cls._db.users.create_index([("mobile", ASCENDING)], unique=True, sparse=True)
        cls._db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        cls._db.users.create_index([("role", ASCENDING)])
        cls._db.users.create_index([("constituencyId", ASCENDING)])
        cls._db.users.create_index([("wardId", ASCENDING)])
        cls._db.users.create_index([("isDeleted", ASCENDING)])
        
        # Constituencies indexes
        cls._db.constituencies.create_index([("constituencyCode", ASCENDING)], unique=True)
        cls._db.constituencies.create_index([("name", ASCENDING)])
        cls._db.constituencies.create_index([("district", ASCENDING)])
        
        # Wards indexes
        cls._db.wards.create_index([("constituencyId", ASCENDING)])
        cls._db.wards.create_index([("wardNumber", ASCENDING)])
        
        # Grievances indexes
        cls._db.grievances.create_index([("complaintNumber", ASCENDING)], unique=True)
        cls._db.grievances.create_index([("citizenId", ASCENDING)])
        cls._db.grievances.create_index([("status", ASCENDING)])
        cls._db.grievances.create_index([("categoryId", ASCENDING)])
        cls._db.grievances.create_index([("assignedOfficerId", ASCENDING)])
        cls._db.grievances.create_index([("constituencyId", ASCENDING)])
        cls._db.grievances.create_index([("gpsLocation", GEOSPHERE)])
        cls._db.grievances.create_index([("isDeleted", ASCENDING)])
        
        # Alerts indexes
        cls._db.alerts.create_index([("alertNumber", ASCENDING)], unique=True)
        cls._db.alerts.create_index([("priority", ASCENDING)])
        cls._db.alerts.create_index([("citizenId", ASCENDING)])
        cls._db.alerts.create_index([("location", GEOSPHERE)])
        
        # Events indexes
        cls._db.events.create_index([("eventDate", ASCENDING)])
        cls._db.events.create_index([("organizerId", ASCENDING)])
        
        # Event registrations indexes
        cls._db.event_registrations.create_index([("eventId", ASCENDING), ("citizenId", ASCENDING)], unique=True)
        cls._db.event_registrations.create_index([("eventId", ASCENDING)])
        cls._db.event_registrations.create_index([("citizenId", ASCENDING)])
        
        # Tasks indexes
        cls._db.tasks.create_index([("grievanceId", ASCENDING)])
        cls._db.tasks.create_index([("assignedTo", ASCENDING)])
        cls._db.tasks.create_index([("status", ASCENDING)])
        cls._db.tasks.create_index([("dueDate", ASCENDING)])
        
        # Field reports indexes
        cls._db.field_reports.create_index([("taskId", ASCENDING)])
        cls._db.field_reports.create_index([("officerId", ASCENDING)])
        cls._db.field_reports.create_index([("gpsLocation", GEOSPHERE)])
        
        # Survey responses indexes
        cls._db.survey_responses.create_index([("surveyId", ASCENDING), ("citizenId", ASCENDING)], unique=True)
        
        # Notifications indexes
        cls._db.notifications.create_index([("userId", ASCENDING)])
        cls._db.notifications.create_index([("createdAt", DESCENDING)])
        
        # Audit logs indexes
        cls._db.audit_logs.create_index([("userId", ASCENDING)])
        cls._db.audit_logs.create_index([("createdAt", DESCENDING)])
        cls._db.audit_logs.create_index([("module", ASCENDING)])
        
        logger.info("All indexes created successfully")


@contextmanager
def get_database():
    """Context manager for database operations"""
    db = MongoDatabase.get_db()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise