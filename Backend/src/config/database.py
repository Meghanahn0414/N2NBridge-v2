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
        """Initialize MongoDB connection with production-grade pool settings."""
        try:
            import os
            is_production = os.getenv("ENV", "development") == "production"
            cls._client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=30000,
                maxPoolSize=50 if is_production else 10,
                minPoolSize=2,
                maxIdleTimeMS=60000,
                waitQueueTimeoutMS=5000,
                retryWrites=True,
                retryReads=True,
            )
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
        """Get database instance."""
        if cls._db is None:
            logger.warning("Database not initialized. Attempting automatic connection.")
            from config.settings import settings
            cls.connect(settings.MONGODB_URL, settings.MONGODB_DB)
        return cls._db

    @classmethod
    def close(cls):
        """Close database connection."""
        if cls._client:
            cls._client.close()
            logger.info("MongoDB connection closed")

    @classmethod
    def _create_collections(cls):
        """Create collections if they don't exist."""
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
            'audit_logs',
        ]

        existing = set(cls._db.list_collection_names())
        for name in collections:
            if name not in existing:
                cls._db.create_collection(name)
                logger.info(f"Created collection: {name}")

    @classmethod
    def _create_indexes(cls):
        """Create all indexes — single-field, compound, geospatial, and TTL."""

        # ── Users ──────────────────────────────────────────────────────────────
        cls._db.users.create_index([("mobile", ASCENDING)], unique=True, sparse=True)
        cls._db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        cls._db.users.create_index([("role", ASCENDING)])
        cls._db.users.create_index([("constituencyId", ASCENDING)])
        cls._db.users.create_index([("wardId", ASCENDING)])
        cls._db.users.create_index([("isDeleted", ASCENDING)])
        # Compound: list citizens per ward (used by notify_ward_citizens)
        cls._db.users.create_index([
            ("wardId", ASCENDING), ("role", ASCENDING), ("isDeleted", ASCENDING)
        ])

        # ── Constituencies ─────────────────────────────────────────────────────
        cls._db.constituencies.create_index([("constituencyCode", ASCENDING)], unique=True)
        cls._db.constituencies.create_index([("name", ASCENDING)])
        cls._db.constituencies.create_index([("district", ASCENDING)])

        # ── Wards ──────────────────────────────────────────────────────────────
        cls._db.wards.create_index([("constituencyId", ASCENDING)])
        cls._db.wards.create_index([("wardNumber", ASCENDING)])

        # ── Grievances ─────────────────────────────────────────────────────────
        cls._db.grievances.create_index([("complaintNumber", ASCENDING)], unique=True)
        cls._db.grievances.create_index([("citizenId", ASCENDING)])
        cls._db.grievances.create_index([("status", ASCENDING)])
        cls._db.grievances.create_index([("categoryId", ASCENDING)])
        cls._db.grievances.create_index([("assignedOfficerId", ASCENDING)])
        cls._db.grievances.create_index([("constituencyId", ASCENDING)])
        cls._db.grievances.create_index([("gpsLocation", GEOSPHERE)])
        cls._db.grievances.create_index([("isDeleted", ASCENDING)])
        # Compound: admin list view (filter by status + constituency, newest first)
        cls._db.grievances.create_index([
            ("isDeleted", ASCENDING), ("status", ASCENDING),
            ("constituencyId", ASCENDING), ("createdAt", DESCENDING)
        ])
        # Compound: officer workload view
        cls._db.grievances.create_index([
            ("assignedOfficerId", ASCENDING), ("status", ASCENDING), ("createdAt", DESCENDING)
        ])
        # Compound: citizen's own complaints
        cls._db.grievances.create_index([
            ("citizenId", ASCENDING), ("isDeleted", ASCENDING), ("createdAt", DESCENDING)
        ])
        # Compound: priority queue for escalation
        cls._db.grievances.create_index([
            ("isDeleted", ASCENDING), ("priority", ASCENDING), ("status", ASCENDING)
        ])

        # ── Alerts ─────────────────────────────────────────────────────────────
        cls._db.alerts.create_index([("alertNumber", ASCENDING)], unique=True)
        cls._db.alerts.create_index([("priority", ASCENDING)])
        cls._db.alerts.create_index([("citizenId", ASCENDING)])
        cls._db.alerts.create_index([("location", GEOSPHERE)])
        cls._db.alerts.create_index([
            ("priority", ASCENDING), ("createdAt", DESCENDING)
        ])

        # ── Events ─────────────────────────────────────────────────────────────
        cls._db.events.create_index([("eventDate", ASCENDING)])
        cls._db.events.create_index([("organizerId", ASCENDING)])
        cls._db.events.create_index([
            ("eventDate", ASCENDING), ("wardId", ASCENDING)
        ])

        # ── Event Registrations ────────────────────────────────────────────────
        cls._db.event_registrations.create_index(
            [("eventId", ASCENDING), ("citizenId", ASCENDING)], unique=True
        )
        cls._db.event_registrations.create_index([("eventId", ASCENDING)])
        cls._db.event_registrations.create_index([("citizenId", ASCENDING)])

        # ── Campaigns ──────────────────────────────────────────────────────────
        cls._db.campaigns.create_index([("status", ASCENDING)])
        cls._db.campaigns.create_index([
            ("status", ASCENDING), ("createdAt", DESCENDING)
        ])
        cls._db.campaigns.create_index([
            ("wardId", ASCENDING), ("status", ASCENDING)
        ])

        # ── Tasks ──────────────────────────────────────────────────────────────
        cls._db.tasks.create_index([("grievanceId", ASCENDING)])
        cls._db.tasks.create_index([("assignedTo", ASCENDING)])
        cls._db.tasks.create_index([("status", ASCENDING)])
        cls._db.tasks.create_index([("dueDate", ASCENDING)])
        cls._db.tasks.create_index([
            ("assignedTo", ASCENDING), ("status", ASCENDING), ("dueDate", ASCENDING)
        ])

        # ── Field Reports ──────────────────────────────────────────────────────
        cls._db.field_reports.create_index([("taskId", ASCENDING)])
        cls._db.field_reports.create_index([("officerId", ASCENDING)])
        cls._db.field_reports.create_index([("gpsLocation", GEOSPHERE)])

        # ── Survey Responses ───────────────────────────────────────────────────
        cls._db.survey_responses.create_index(
            [("surveyId", ASCENDING), ("citizenId", ASCENDING)], unique=True
        )

        # ── Notifications ──────────────────────────────────────────────────────
        # Compound: user inbox sorted by newest (most common query)
        cls._db.notifications.create_index([
            ("userId", ASCENDING), ("createdAt", DESCENDING)
        ])
        # Compound: unread badge count
        cls._db.notifications.create_index([
            ("userId", ASCENDING), ("isRead", ASCENDING)
        ])
        # TTL: auto-delete notifications older than 90 days
        cls._db.notifications.create_index(
            [("createdAt", ASCENDING)], expireAfterSeconds=7_776_000
        )

        # ── Audit Logs ─────────────────────────────────────────────────────────
        cls._db.audit_logs.create_index([("userId", ASCENDING)])
        cls._db.audit_logs.create_index([("createdAt", DESCENDING)])
        cls._db.audit_logs.create_index([("module", ASCENDING)])
        # Compound: per-module audit trail
        cls._db.audit_logs.create_index([
            ("module", ASCENDING), ("createdAt", DESCENDING)
        ])
        # TTL: auto-delete audit logs older than 1 year
        cls._db.audit_logs.create_index(
            [("createdAt", ASCENDING)], expireAfterSeconds=31_536_000
        )

        logger.info("All indexes created successfully")


@contextmanager
def get_database():
    """Context manager for database operations."""
    db = MongoDatabase.get_db()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise
