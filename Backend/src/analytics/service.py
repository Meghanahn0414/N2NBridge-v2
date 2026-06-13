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
    def calculate_trend(current_count: int, period_days: int = 30) -> float:
        """Calculate percentage change for a metric over the last N days"""
        if current_count == 0:
            return 0
        
        # Simple trend: compare average in last 30 days vs before that
        half_period = period_days // 2
        daily_rate = current_count / period_days
        expected_count = daily_rate * period_days
        
        if expected_count == 0:
            return 0
        
        trend_percent = ((current_count - expected_count) / expected_count * 100)
        return round(trend_percent, 1)
    
    @staticmethod
    def get_grievance_stats() -> dict:
        """Get grievance statistics"""
        db = MongoDatabase.get_db()
        
        total = db.grievances.count_documents({"isDeleted": False})
        
        # Get grievances from last 30 days for trend
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        last_30_count = db.grievances.count_documents({
            "isDeleted": False,
            "createdAt": {"$gte": thirty_days_ago}
        })
        
        trend = AnalyticsService.calculate_trend(last_30_count)
        
        by_status = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ])
        
        by_priority = db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
        ])
        
        # Get grievances by category — use `category` enum field first, fall back to categoryId
        from bson import ObjectId as _ObjId
        by_category_raw = list(db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {
                "_id": {"$ifNull": ["$category", "$categoryId"]},
                "count": {"$sum": 1}
            }}
        ]))

        by_category = {}
        for item in by_category_raw:
            cat_key = item["_id"]
            count = item["count"]
            if not cat_key:
                continue
            # Try ObjectId lookup in categories collection
            category_name = None
            try:
                cat_doc = db.grievance_categories.find_one({"_id": _ObjId(str(cat_key))})
                if cat_doc:
                    category_name = cat_doc.get("categoryName") or cat_doc.get("name")
            except Exception:
                pass
            if not category_name:
                # Humanise the enum value e.g. "ROAD_ISSUE" → "Road Issue"
                category_name = str(cat_key).replace("_", " ").title()
            # Normalise aliases so the same category isn't split across bars
            _NORMALIZE = {
                "Water": "Water Supply",
                "Roads": "Road Issue",
                "Waste": "Garbage",
                "Noise": "Noise Pollution",
                "Electricity Supply": "Electricity",
                "Other": "Other",
            }
            category_name = _NORMALIZE.get(category_name, category_name)
            by_category[category_name] = by_category.get(category_name, 0) + count
        
        return {
            "total": total,
            "trend": trend,
            "byStatus": {item["_id"]: item["count"] for item in db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])},
            "byPriority": {item["_id"]: item["count"] for item in db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ])},
            "byCategory": by_category
        }
    
    @staticmethod
    def get_alert_stats() -> dict:
        """Get alert statistics"""
        db = MongoDatabase.get_db()
        
        total = db.alerts.count_documents({})
        
        # Get alerts from last 30 days for trend
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        last_30_count = db.alerts.count_documents({
            "createdAt": {"$gte": thirty_days_ago}
        })
        
        trend = AnalyticsService.calculate_trend(last_30_count)
        
        return {
            "total": total,
            "trend": trend,
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
        
        # Get users created in last 30 days for trend
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        last_30_count = db.users.count_documents({
            "isDeleted": False,
            "createdAt": {"$gte": thirty_days_ago}
        })
        
        trend = AnalyticsService.calculate_trend(last_30_count)
        
        by_role = {item["_id"]: item["count"] for item in db.users.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ])}
        
        return {
            "total": total,
            "trend": trend,
            "byRole": by_role
        }
    
    @staticmethod
    def get_event_stats() -> dict:
        """Get event statistics"""
        db = MongoDatabase.get_db()
        
        total_events = db.events.count_documents({})
        total_registrations = db.event_registrations.count_documents({})
        
        # Get events from last 30 days for trend
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        last_30_events = db.events.count_documents({
            "createdAt": {"$gte": thirty_days_ago}
        })
        
        trend = AnalyticsService.calculate_trend(last_30_events)
        
        return {
            "totalEvents": total_events,
            "totalRegistrations": total_registrations,
            "avgRegistrationsPerEvent": total_registrations / total_events if total_events > 0 else 0,
            "trend": trend
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
    def get_sentiment_distribution() -> dict:
        """Get citizen sentiment distribution from satisfaction ratings"""
        db = MongoDatabase.get_db()
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "total": 0}
        pipeline = [
            {"$match": {"isDeleted": False, "satisfactionRating": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$satisfactionRating", "count": {"$sum": 1}}}
        ]
        for item in db.grievances.aggregate(pipeline):
            rating = item.get("_id")
            count = item.get("count", 0)
            try:
                rating_value = int(rating)
            except (TypeError, ValueError):
                continue
            if rating_value >= 4:
                sentiment_counts["positive"] += count
            elif rating_value == 3:
                sentiment_counts["neutral"] += count
            else:
                sentiment_counts["negative"] += count
            sentiment_counts["total"] += count

        total = sentiment_counts["total"]
        if total > 0:
            sentiment_counts["positivePct"] = round(sentiment_counts["positive"] / total * 100, 1)
            sentiment_counts["neutralPct"] = round(sentiment_counts["neutral"] / total * 100, 1)
            sentiment_counts["negativePct"] = round(sentiment_counts["negative"] / total * 100, 1)
        else:
            sentiment_counts["positivePct"] = 0
            sentiment_counts["neutralPct"] = 0
            sentiment_counts["negativePct"] = 0

        return sentiment_counts

    @staticmethod
    def get_performance_metrics() -> dict:
        """Get performance metrics"""
        stats = {
            "grievances": AnalyticsService.get_grievance_stats(),
            "alerts": AnalyticsService.get_alert_stats(),
            "users": AnalyticsService.get_user_stats(),
            "events": AnalyticsService.get_event_stats(),
            "resolutionTime": AnalyticsService.get_resolution_time_stats(),
            "activeUsers": AnalyticsService.get_active_users(),
            "sentimentDistribution": AnalyticsService.get_sentiment_distribution(),
        }

        return stats

    @staticmethod
    def get_active_users() -> dict:
        """Get count of active users today"""
        db = MongoDatabase.get_db()
        today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
        today_end = datetime.combine(datetime.utcnow().date(), datetime.max.time())

        # Count users who have logged in today or have recent activity
        active_today = db.users.count_documents({
            "$or": [
                {"lastLoginAt": {"$gte": today_start, "$lte": today_end}},
                {"updatedAt": {"$gte": today_start, "$lte": today_end}}
            ],
            "isDeleted": False
        })

        # Get active users count for yesterday to calculate trend
        yesterday_start = today_start - timedelta(days=1)
        yesterday_end = today_end - timedelta(days=1)

        active_yesterday = db.users.count_documents({
            "$or": [
                {"lastLoginAt": {"$gte": yesterday_start, "$lte": yesterday_end}},
                {"updatedAt": {"$gte": yesterday_start, "$lte": yesterday_end}}
            ],
            "isDeleted": False
        })

        # Calculate trend
        trend = 0
        if active_yesterday > 0:
            trend = round(((active_today - active_yesterday) / active_yesterday * 100), 1)

        return {
            "active": active_today,
            "trend": trend
        }
