"""
MongoDB Database Configuration — Multi-Tenant Architecture

Master DB (crm_master):
  - representatives collection: slug → db_name registry
  - user_registry collection: email/mobile → db_name (for login resolution)

Tenant DBs (e.g. mandya_mla_db, mysore_mp_db):
  - One per representative, created at registration time
  - All have identical collections: users, citizens, grievances, etc.
"""
from contextlib import contextmanager
from typing import Optional
import logging

from pymongo import ASCENDING, DESCENDING, GEOSPHERE, MongoClient
from pymongo.errors import ServerSelectionTimeoutError

logger = logging.getLogger(__name__)


class MongoDatabase:
    _client: Optional[MongoClient] = None
    _master_db = None   # crm_master

    # ── Connection ─────────────────────────────────────────────────────────────

    @classmethod
    def connect(cls, connection_string: str, master_db_name: str):
        """
        Open a single MongoClient (shared connection pool).
        _master_db points to the master registry database.
        Tenant databases are accessed via get_tenant_db(db_name).
        """
        try:
            import os
            is_production = os.getenv("ENV", "development") == "production"
            # Was maxPoolSize=10 in development. The dashboard now fires several
            # MongoDB-querying requests concurrently on a single page load
            # (parallel /api/mla/insights sub-queries + analytics + notification
            # polling all landing around the same time), which was exceeding 10
            # connections and causing OTHER, unrelated requests to queue for up
            # to waitQueueTimeoutMS and fail with 500s while waiting for a free
            # connection. Raised to comfortably cover that concurrency; still far
            # below what a single local MongoDB instance can handle.
            cls._client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=30000,
                maxPoolSize=50 if is_production else 30,
                minPoolSize=2,
                maxIdleTimeMS=60000,
                waitQueueTimeoutMS=5000,
                retryWrites=True,
                retryReads=True,
            )
            cls._client.admin.command("ping")
            cls._master_db = cls._client[master_db_name]
            logger.info(f"Connected to MongoDB. Master DB: {master_db_name}")
            cls._create_master_collections()
            cls._create_master_indexes()
            return cls._master_db
        except ServerSelectionTimeoutError as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    def get_db(cls):
        """Return the master database (crm_master)."""
        if cls._master_db is None:
            logger.warning("Database not initialized. Attempting automatic connection.")
            from config.settings import settings
            cls.connect(settings.MONGODB_URL, settings.MONGODB_MASTER_DB)
        return cls._master_db

    @classmethod
    def get_tenant_db(cls, db_name: str):
        """
        Return a tenant's database by name using the shared connection pool.
        No new connection is created — MongoDB allows switching databases on
        the same MongoClient.
        """
        if cls._client is None:
            from config.settings import settings
            cls.connect(settings.MONGODB_URL, settings.MONGODB_MASTER_DB)
        return cls._client[db_name]

    @classmethod
    def drop_tenant_db(cls, db_name: str):
        """
        Remove a tenant database if registration fails after it was created.
        This helps avoid orphaned tenant databases from partially completed
        representative registration attempts.
        """
        if cls._client is None:
            from config.settings import settings
            cls.connect(settings.MONGODB_URL, settings.MONGODB_MASTER_DB)
        try:
            cls._client.drop_database(db_name)
            logger.info(f"Dropped orphaned tenant DB: {db_name}")
        except Exception as e:
            logger.warning(f"Failed to drop orphaned tenant DB {db_name}: {e}")

    @classmethod
    def close(cls):
        """Close the shared client."""
        if cls._client:
            cls._client.close()
            logger.info("MongoDB connection closed")

    # ── Master DB setup ────────────────────────────────────────────────────────

    @classmethod
    def _create_master_collections(cls):
        existing = set(cls._master_db.list_collection_names())
        for name in ["representatives", "user_registry"]:
            if name not in existing:
                cls._master_db.create_collection(name)
                logger.info(f"Master: created collection '{name}'")

    @classmethod
    def _create_master_indexes(cls):
        # representatives: look up by slug, rep_code, email, mobile
        cls._master_db.representatives.create_index(
            [("slug", ASCENDING)], unique=True
        )
        cls._master_db.representatives.create_index(
            [("rep_code", ASCENDING)], unique=True
        )
        cls._master_db.representatives.create_index([("email", ASCENDING)])
        cls._master_db.representatives.create_index([("mobile", ASCENDING)])
        cls._master_db.representatives.create_index([("db_name", ASCENDING)])

        # user_registry: fast email / mobile → db_name lookup for login
        cls._master_db.user_registry.create_index([("email", ASCENDING)])
        cls._master_db.user_registry.create_index([("mobile", ASCENDING)])
        cls._master_db.user_registry.create_index([("db_name", ASCENDING)])

        logger.info("Master DB indexes created")

    # ── Tenant DB setup ────────────────────────────────────────────────────────

    @classmethod
    def _create_tenant_collections(cls, db):
        collections = [
            "users",            # representative + staff
            "citizens",         # registered citizens
            "grievances",
            "grievance_history",
            "grievance_categories",
            "campaigns",
            "events",
            "event_registrations",
            "notifications",
            "feedback",
            "attachments",
            "tasks",
            "field_reports",
            "surveys",
            "survey_responses",
            "alerts",
            "communications",
            "audit_logs",
            "settings",
        ]
        existing = set(db.list_collection_names())
        for name in collections:
            if name not in existing:
                db.create_collection(name)

    @classmethod
    def _create_tenant_indexes(cls, db):
        # ── users (representative + staff) ─────────────────────────────────────
        db.users.create_index([("mobile", ASCENDING)], unique=True, sparse=True)
        db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        db.users.create_index([("role", ASCENDING)])
        db.users.create_index([("isDeleted", ASCENDING)])

        # ── citizens ───────────────────────────────────────────────────────────
        db.citizens.create_index([("mobile", ASCENDING)], unique=True, sparse=True)
        db.citizens.create_index([("citizen_id", ASCENDING)], unique=True, sparse=True)
        db.citizens.create_index([("isDeleted", ASCENDING)])

        # ── grievances ─────────────────────────────────────────────────────────
        db.grievances.create_index([("grievance_no", ASCENDING)], unique=True, sparse=True)
        db.grievances.create_index([("citizen_id", ASCENDING)])
        db.grievances.create_index([("status", ASCENDING)])
        db.grievances.create_index([("category", ASCENDING)])
        db.grievances.create_index([("assigned_to", ASCENDING)])
        db.grievances.create_index([("isDeleted", ASCENDING)])
        db.grievances.create_index([
            ("isDeleted", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)
        ])
        db.grievances.create_index([
            ("citizen_id", ASCENDING), ("isDeleted", ASCENDING), ("created_at", DESCENDING)
        ])
        # AI sentiment score (used by dashboard analytics)
        db.grievances.create_index([("aiAnalysis.sentimentScore", ASCENDING)])

        # ── grievance_history ──────────────────────────────────────────────────
        db.grievance_history.create_index([("grievance_id", ASCENDING)])
        db.grievance_history.create_index([("created_at", DESCENDING)])

        # ── campaigns ──────────────────────────────────────────────────────────
        db.campaigns.create_index([("status", ASCENDING)])
        db.campaigns.create_index([("status", ASCENDING), ("created_at", DESCENDING)])

        # ── events ─────────────────────────────────────────────────────────────
        db.events.create_index([("date", ASCENDING)])
        db.event_registrations.create_index(
            [("event_id", ASCENDING), ("citizen_id", ASCENDING)], unique=True
        )

        # ── notifications ──────────────────────────────────────────────────────
        db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        db.notifications.create_index([("user_id", ASCENDING), ("is_read", ASCENDING)])
        # TTL: auto-delete after 90 days
        db.notifications.create_index(
            [("created_at", ASCENDING)], expireAfterSeconds=7_776_000
        )

        # ── feedback ───────────────────────────────────────────────────────────
        db.feedback.create_index([("grievance_id", ASCENDING)])
        db.feedback.create_index([("citizen_id", ASCENDING)])

        # ── tasks ──────────────────────────────────────────────────────────────
        db.tasks.create_index([("grievance_id", ASCENDING)])
        db.tasks.create_index([("assigned_to", ASCENDING)])
        db.tasks.create_index([("status", ASCENDING)])
        db.tasks.create_index([
            ("assigned_to", ASCENDING), ("status", ASCENDING), ("due_date", ASCENDING)
        ])

        # ── alerts ─────────────────────────────────────────────────────────────
        db.alerts.create_index([("priority", ASCENDING)])
        db.alerts.create_index([("citizen_id", ASCENDING)])

        # ── audit_logs ─────────────────────────────────────────────────────────
        db.audit_logs.create_index([("created_at", DESCENDING)])
        db.audit_logs.create_index([("module", ASCENDING), ("created_at", DESCENDING)])
        # TTL: auto-delete after 1 year
        db.audit_logs.create_index(
            [("created_at", ASCENDING)], expireAfterSeconds=31_536_000
        )

        logger.info(f"Tenant indexes created for DB: {db.name}")


@contextmanager
def get_database():
    """Context manager for master database operations."""
    db = MongoDatabase.get_db()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise
