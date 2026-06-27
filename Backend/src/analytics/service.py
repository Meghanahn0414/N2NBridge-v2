"""
Analytics Service
"""
from config.database import MongoDatabase
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# India Standard Time offset from UTC
_IST = timedelta(hours=5, minutes=30)


class AnalyticsService:
    """Analytics business logic"""

    @staticmethod
    def calculate_trend(current_count: int, previous_count: int) -> float:
        """
        Calculate percentage change between two periods.
        Formula: ((current - previous) / previous) × 100
        Returns 0 if previous period had no data.
        """
        if previous_count == 0:
            return 0.0
        return round(((current_count - previous_count) / previous_count) * 100, 1)

    @staticmethod
    def get_grievance_stats() -> dict:
        """Get grievance statistics"""
        db = MongoDatabase.get_db()

        total = db.grievances.count_documents({"isDeleted": False})

        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago  = now - timedelta(days=60)

        # Current period: last 30 days
        current_count = db.grievances.count_documents({
            "isDeleted": False,
            "createdAt": {"$gte": thirty_days_ago}
        })

        # Previous period: 30–60 days ago (for comparison)
        previous_count = db.grievances.count_documents({
            "isDeleted": False,
            "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}
        })

        trend = AnalyticsService.calculate_trend(current_count, previous_count)

        # Get grievances by category
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
            count   = item["count"]
            if not cat_key:
                continue
            category_name = None
            try:
                cat_doc = db.grievance_categories.find_one({"_id": _ObjId(str(cat_key))})
                if cat_doc:
                    category_name = cat_doc.get("categoryName") or cat_doc.get("name")
            except Exception:
                pass
            if not category_name:
                category_name = str(cat_key).replace("_", " ").title()
            _NORMALIZE = {
                "Water": "Water Supply", "Roads": "Road Issue",
                "Waste": "Garbage", "Noise": "Noise Pollution",
                "Electricity Supply": "Electricity", "Other": "Other",
            }
            category_name = _NORMALIZE.get(category_name, category_name)
            by_category[category_name] = by_category.get(category_name, 0) + count

        def _agg_dict(cursor):
            return {str(item["_id"]): item["count"] for item in cursor if item["_id"] is not None}

        return {
            "total":      total,
            "trend":      trend,
            "byStatus":   _agg_dict(db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])),
            "byPriority": _agg_dict(db.grievances.aggregate([
                {"$match": {"isDeleted": False}},
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ])),
            "byCategory": by_category,
        }

    @staticmethod
    def get_alert_stats() -> dict:
        """Get alert statistics"""
        db = MongoDatabase.get_db()

        total = db.alerts.count_documents({})

        now            = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago  = now - timedelta(days=60)

        current_count  = db.alerts.count_documents({"createdAt": {"$gte": thirty_days_ago}})
        previous_count = db.alerts.count_documents({
            "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}
        })
        trend = AnalyticsService.calculate_trend(current_count, previous_count)

        return {
            "total":      total,
            "trend":      trend,
            "byStatus":   {str(item["_id"]): item["count"] for item in db.alerts.aggregate([
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ]) if item["_id"] is not None},
            "byPriority": {str(item["_id"]): item["count"] for item in db.alerts.aggregate([
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ]) if item["_id"] is not None},
        }

    @staticmethod
    def get_user_stats() -> dict:
        """Get user statistics"""
        db = MongoDatabase.get_db()

        citizen_filter = {"isDeleted": False, "role": "CITIZEN"}

        total = db.users.count_documents(citizen_filter)

        now            = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago  = now - timedelta(days=60)

        current_count  = db.users.count_documents({
            **citizen_filter,
            "createdAt": {"$gte": thirty_days_ago}
        })
        previous_count = db.users.count_documents({
            **citizen_filter,
            "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}
        })
        trend = AnalyticsService.calculate_trend(current_count, previous_count)

        by_role = {str(item["_id"]): item["count"] for item in db.users.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ]) if item["_id"] is not None}

        return {"total": total, "trend": trend, "byRole": by_role}

    @staticmethod
    def get_event_stats() -> dict:
        """Get event statistics"""
        db = MongoDatabase.get_db()

        total_events        = db.events.count_documents({})
        total_registrations = db.event_registrations.count_documents({})

        # Also count citizens who joined campaigns (reach field is incremented on each join)
        campaign_reach_result = list(db.campaigns.aggregate([
            {"$match": {"isDeleted": {"$ne": True}}},
            {"$group": {"_id": None, "total": {"$sum": "$reach"}}},
        ]))
        campaign_registrations = campaign_reach_result[0]["total"] if campaign_reach_result else 0
        total_registrations += campaign_registrations

        now            = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago  = now - timedelta(days=60)

        current_count  = db.events.count_documents({"createdAt": {"$gte": thirty_days_ago}})
        previous_count = db.events.count_documents({
            "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}
        })
        trend = AnalyticsService.calculate_trend(current_count, previous_count)

        return {
            "totalEvents":               total_events,
            "totalRegistrations":        total_registrations,
            "avgRegistrationsPerEvent":  total_registrations / total_events if total_events > 0 else 0,
            "trend":                     trend,
        }

    @staticmethod
    def get_resolution_time_stats() -> dict:
        """Get average, min, max resolution time for resolved complaints"""
        db = MongoDatabase.get_db()

        resolved = list(db.grievances.aggregate([
            {"$match": {"status": "RESOLVED", "isDeleted": False}},
            {"$project": {"resolutionTime": {"$subtract": ["$updatedAt", "$createdAt"]}}},
            {"$group": {
                "_id":     None,
                "avgTime": {"$avg": "$resolutionTime"},
                "minTime": {"$min": "$resolutionTime"},
                "maxTime": {"$max": "$resolutionTime"},
            }}
        ]))

        if resolved:
            return {
                "avgResolutionTime": resolved[0].get("avgTime", 0),
                "minResolutionTime": resolved[0].get("minTime", 0),
                "maxResolutionTime": resolved[0].get("maxTime", 0),
            }
        return {"avgResolutionTime": 0, "minResolutionTime": 0, "maxResolutionTime": 0}

    @staticmethod
    def get_sentiment_distribution() -> dict:
        """Get citizen sentiment distribution from satisfaction ratings"""
        db = MongoDatabase.get_db()
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "total": 0}
        for item in db.grievances.aggregate([
            {"$match": {"isDeleted": False, "satisfactionRating": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$satisfactionRating", "count": {"$sum": 1}}}
        ]):
            rating = item.get("_id")
            count  = item.get("count", 0)
            try:
                r = int(rating)
            except (TypeError, ValueError):
                continue
            if r >= 4:
                sentiment_counts["positive"] += count
            elif r == 3:
                sentiment_counts["neutral"]  += count
            else:
                sentiment_counts["negative"] += count
            sentiment_counts["total"] += count

        total = sentiment_counts["total"]
        sentiment_counts["positivePct"] = round(sentiment_counts["positive"] / total * 100, 1) if total else 0
        sentiment_counts["neutralPct"]  = round(sentiment_counts["neutral"]  / total * 100, 1) if total else 0
        sentiment_counts["negativePct"] = round(sentiment_counts["negative"] / total * 100, 1) if total else 0
        return sentiment_counts

    @staticmethod
    def get_performance_metrics(days: int = 365) -> dict:
        """Get performance metrics filtered by time window"""
        db    = MongoDatabase.get_db()
        now   = datetime.utcnow()
        since = now - timedelta(days=days)

        resolved_in_period = db.grievances.count_documents({
            "isDeleted": False,
            "status":    {"$in": ["RESOLVED", "CLOSED"]},
            "updatedAt": {"$gte": since},
        })

        prev_since   = since - timedelta(days=days)
        resolved_prev = db.grievances.count_documents({
            "isDeleted": False,
            "status":    {"$in": ["RESOLVED", "CLOSED"]},
            "updatedAt": {"$gte": prev_since, "$lt": since},
        })
        trend = AnalyticsService.calculate_trend(resolved_in_period, resolved_prev)

        base_stats = AnalyticsService.get_grievance_stats()
        base_stats["byStatus"]["RESOLVED"] = resolved_in_period
        base_stats["trend"] = trend

        return {
            "grievances":           base_stats,
            "alerts":               AnalyticsService.get_alert_stats(),
            "users":                AnalyticsService.get_user_stats(),
            "events":               AnalyticsService.get_event_stats(),
            "resolutionTime":       AnalyticsService.get_resolution_time_stats(),
            "activeUsers":          AnalyticsService.get_active_users(),
            "sentimentDistribution": AnalyticsService.get_sentiment_distribution(),
        }

    @staticmethod
    def get_active_users() -> dict:
        """Count users active today vs yesterday (IST dates)"""
        db      = MongoDatabase.get_db()
        now_ist = datetime.utcnow() + _IST

        # Today in IST → convert boundaries back to UTC for MongoDB query
        today_ist   = now_ist.date()
        t_start_utc = datetime(today_ist.year, today_ist.month, today_ist.day, 0, 0, 0) - _IST
        t_end_utc   = datetime(today_ist.year, today_ist.month, today_ist.day, 23, 59, 59) - _IST

        yesterday_ist = (now_ist - timedelta(days=1)).date()
        y_start_utc   = datetime(yesterday_ist.year, yesterday_ist.month, yesterday_ist.day, 0, 0, 0) - _IST
        y_end_utc     = datetime(yesterday_ist.year, yesterday_ist.month, yesterday_ist.day, 23, 59, 59) - _IST

        def _active(start, end):
            return db.users.count_documents({
                "$or": [
                    {"lastLoginAt": {"$gte": start, "$lte": end}},
                    {"updatedAt":   {"$gte": start, "$lte": end}},
                ],
                "isDeleted": False,
            })

        active_today     = _active(t_start_utc, t_end_utc)
        active_yesterday = _active(y_start_utc, y_end_utc)
        trend = AnalyticsService.calculate_trend(active_today, active_yesterday)

        return {"active": active_today, "trend": trend}
