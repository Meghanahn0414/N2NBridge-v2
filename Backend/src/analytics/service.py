"""
Analytics Service
"""
from config.database import MongoDatabase
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics business logic"""
    
    @staticmethod
    def get_grievance_stats() -> dict:
        """Get grievance statistics"""
        db = MongoDatabase.get_db()
        
        total = db.grievances.count_documents({"isDeleted": False})
        by_status = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
        
        by_priority = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
        ])
        
        return {
            "total": total,
            "byStatus": {item["_id"]: item["count"] for item in db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])},
            "byPriority": {item["_id"]: item["count"] for item in db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ])}
        }
    
    @staticmethod
    def get_alert_stats() -> dict:
        """Get alert statistics"""
        db = MongoDatabase.get_db()
        
        total = db.alerts.count_documents({})
        
        return {
            "total": total,
            "byStatus": {item["_id"]: item["count"] for item in db.alerts.aggregate([
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])},
            "byPriority": {item["_id"]: item["count"] for item in db.alerts.aggregate([
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ])}
        }
    
    @staticmethod
    def get_user_stats() -> dict:
        """Get user statistics"""
        db = MongoDatabase.get_db()
        
        total = db.users.count_documents({"isDeleted": False})
        
        by_role = {item["_id"]: item["count"] for item in db.users.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ])}
        
        return {
            "total": total,
            "byRole": by_role
        }
    
    @staticmethod
    def get_event_stats() -> dict:
        """Get event statistics"""
        db = MongoDatabase.get_db()
        
        total_events = db.events.count_documents({})
        total_registrations = db.event_registrations.count_documents({})
        
        return {
            "totalEvents": total_events,
            "totalRegistrations": total_registrations,
            "avgRegistrationsPerEvent": total_registrations / total_events if total_events > 0 else 0
        }
    
    @staticmethod
    def get_resolution_time_stats() -> dict:
        """Get average resolution time"""
        db = MongoDatabase.get_db()
        
        resolved = list(db.grievances.aggregate([
            {"$match": {"status": "RESOLVED", "isDeleted": False}},
            {"$project": {
                "resolutionTime": {
                    "$subtract": ["$updatedAt", "$createdAt"]
                }
            }},
            {"$group": {
                "_id": None,
                "avgTime": {"$avg": "$resolutionTime"},
                "minTime": {"$min": "$resolutionTime"},
                "maxTime": {"$max": "$resolutionTime"}
            }}
        ]))
        
        if resolved:
            return {
                "avgResolutionTime": resolved[0].get("avgTime", 0),
                "minResolutionTime": resolved[0].get("minTime", 0),
                "maxResolutionTime": resolved[0].get("maxTime", 0)
            }
        
        return {"avgResolutionTime": 0, "minResolutionTime": 0, "maxResolutionTime": 0}
    
    @staticmethod
    def get_performance_metrics() -> dict:
        """Get performance metrics"""
        stats = {
            "grievances": AnalyticsService.get_grievance_stats(),
            "alerts": AnalyticsService.get_alert_stats(),
            "users": AnalyticsService.get_user_stats(),
            "events": AnalyticsService.get_event_stats(),
            "resolutionTime": AnalyticsService.get_resolution_time_stats()
        }
        
        return stats
