"""
Base Service Class
Common functionality for all service classes
"""
from config.database import MongoDatabase
from typing import Optional, List
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class BaseService:
    """Base service class with common database operations"""
    
    @staticmethod
    def get_db():
        """Get database instance"""
        return MongoDatabase.get_db()
    
    @staticmethod
    def get_by_id(collection_name: str, obj_id: str, filter_deleted: bool = True) -> Optional[dict]:
        """Get document by ID"""
        try:
            db = MongoDatabase.get_db()
            query = {"_id": ObjectId(obj_id)}
            
            if filter_deleted:
                query["isDeleted"] = False
            
            return db[collection_name].find_one(query)
        except Exception as e:
            logger.error(f"Error getting document from {collection_name}: {e}")
            return None
    
    @staticmethod
    def get_list(collection_name: str, filters: dict = None, skip: int = 0, limit: int = 10) -> List[dict]:
        """Get list of documents with pagination"""
        try:
            db = MongoDatabase.get_db()
            query = filters or {}
            
            # Always filter soft-deleted unless explicitly disabled
            if "isDeleted" not in query:
                query["isDeleted"] = False
            
            return list(db[collection_name].find(query).skip(skip).limit(limit))
        except Exception as e:
            logger.error(f"Error getting list from {collection_name}: {e}")
            return []
    
    @staticmethod
    def count_documents(collection_name: str, filters: dict = None) -> int:
        """Count documents"""
        try:
            db = MongoDatabase.get_db()
            query = filters or {}
            
            if "isDeleted" not in query:
                query["isDeleted"] = False
            
            return db[collection_name].count_documents(query)
        except Exception as e:
            logger.error(f"Error counting documents in {collection_name}: {e}")
            return 0
    
    @staticmethod
    def insert_one(collection_name: str, data: dict) -> Optional[str]:
        """Insert one document"""
        try:
            db = MongoDatabase.get_db()
            result = db[collection_name].insert_one(data)
            logger.info(f"Document inserted in {collection_name}: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error inserting document in {collection_name}: {e}")
            return None
    
    @staticmethod
    def update_one(collection_name: str, obj_id: str, update_data: dict) -> bool:
        """Update one document"""
        try:
            db = MongoDatabase.get_db()
            result = db[collection_name].update_one(
                {"_id": ObjectId(obj_id)},
                {"$set": update_data}
            )
            logger.info(f"Document updated in {collection_name}: {obj_id}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating document in {collection_name}: {e}")
            return False
    
    @staticmethod
    def delete_one(collection_name: str, obj_id: str, soft_delete: bool = True) -> bool:
        """Delete one document (soft or hard)"""
        try:
            db = MongoDatabase.get_db()
            
            if soft_delete:
                from datetime import datetime
                result = db[collection_name].update_one(
                    {"_id": ObjectId(obj_id)},
                    {"$set": {"isDeleted": True, "deletedAt": datetime.utcnow()}}
                )
            else:
                result = db[collection_name].delete_one({"_id": ObjectId(obj_id)})
            
            logger.info(f"Document deleted from {collection_name}: {obj_id}")
            return result.deleted_count > 0 or result.modified_count > 0
        except Exception as e:
            logger.error(f"Error deleting document from {collection_name}: {e}")
            return False
    
    @staticmethod
    def aggregate(collection_name: str, pipeline: list) -> List[dict]:
        """Run aggregation pipeline"""
        try:
            db = MongoDatabase.get_db()
            return list(db[collection_name].aggregate(pipeline))
        except Exception as e:
            logger.error(f"Error running aggregation on {collection_name}: {e}")
            return []
