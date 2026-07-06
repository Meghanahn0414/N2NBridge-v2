"""
Lookup Service MongoDB connection.

This is a SEPARATE database from every representative's own server/DB.
It holds nothing but the routing registry: which representative
(rep_type + constituency identifier) maps to which server_url.
"""
import logging
from typing import Optional

import certifi
from pymongo import ASCENDING, MongoClient
from pymongo.errors import ServerSelectionTimeoutError

logger = logging.getLogger(__name__)


class LookupDatabase:
    _client: Optional[MongoClient] = None
    _db = None

    @classmethod
    def connect(cls, connection_string: str, db_name: str):
        try:
            cls._client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=30000,
                retryWrites=True,
                retryReads=True,
                # Same fix as Backend/src/config/database.py — avoids
                # "SSL: TLSV1_ALERT_INTERNAL_ERROR" against Atlas on Windows.
                tlsCAFile=certifi.where(),
            )
            cls._client.admin.command("ping")
            cls._db = cls._client[db_name]
            logger.info(f"Lookup Service connected to MongoDB: {db_name}")
            cls._create_indexes()
            return cls._db
        except ServerSelectionTimeoutError as e:
            logger.error(f"Lookup Service failed to connect to MongoDB: {e}")
            raise

    @classmethod
    def get_db(cls):
        if cls._db is None:
            raise RuntimeError("Lookup database not initialized — call connect() first")
        return cls._db

    @classmethod
    def _create_indexes(cls):
        reps = cls._db.representatives
        reps.create_index([("rep_code", ASCENDING)], unique=True)
        reps.create_index([("slug", ASCENDING)], unique=True)
        reps.create_index([("rep_type", ASCENDING)])
        reps.create_index([("assembly_name", ASCENDING)])
        reps.create_index([("parliamentary_name", ASCENDING)])
        reps.create_index([("ward_id", ASCENDING)])
        logger.info("Lookup Service indexes created")

    @classmethod
    def close(cls):
        if cls._client:
            cls._client.close()
            logger.info("Lookup Service MongoDB connection closed")
