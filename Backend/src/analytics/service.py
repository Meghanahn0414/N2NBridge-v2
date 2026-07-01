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
    def get_grievance_stats(since: "datetime | None" = None) -> dict:
        """
        Get grievance statistics.

        `since`, when provided, scopes total/byStatus/byPriority/byCategory to
        grievances created on/after that timestamp — this is what makes the
        Executive Dashboard's date-range picker (Last 30 Days / 90 Days / etc.)
        actually affect the "Grievances by Category" and overview breakdowns,
        instead of them always showing all-time totals regardless of filter.
        """
        db = MongoDatabase.get_db()

        base_match = {"isDeleted": False}
        if since is not None:
            base_match = {**base_match, "createdAt": {"$gte": since}}

        total = db.grievances.count_documents(base_match)

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
            {"$match": base_match},
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
                {"$match": base_match},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ])),
            "byPriority": _agg_dict(db.grievances.aggregate([
                {"$match": base_match},
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
    def get_event_stats(since: "datetime | None" = None) -> dict:
        """
        Get event statistics.

        `since`, when provided, scopes totalEvents/publishedEvents/eventCampaignsCount
        to items created on/after that timestamp, so this responds to the dashboard's
        date-range picker instead of always showing an all-time total.

        "Organized" events combine two sources, per rep confirmation:
         1. The dedicated Events feature (db.events) — anything out of DRAFT status.
         2. Communication Center campaigns whose type is "Event" and that have
            actually been published (ACTIVE/COMPLETED), e.g. "B Camp" — since
            reps commonly organize events as campaign broadcasts, not via the
            separate Events feature.
        """
        db = MongoDatabase.get_db()

        events_match = {} if since is None else {"createdAt": {"$gte": since}}
        total_events    = db.events.count_documents(events_match)
        events_feature_count = db.events.count_documents({**events_match, "status": {"$ne": "DRAFT"}})
        event_campaigns_filter = {
            "isDeleted": {"$ne": True},
            "type":      "Event",
            "status":    {"$in": ["ACTIVE", "COMPLETED"]},
        }
        if since is not None:
            event_campaigns_filter = {**event_campaigns_filter, "createdAt": {"$gte": since}}
        event_campaigns_count = db.campaigns.count_documents(event_campaigns_filter)
        published_events = events_feature_count + event_campaigns_count

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

        current_count = (
            db.events.count_documents({"createdAt": {"$gte": thirty_days_ago}})
            + db.campaigns.count_documents({**event_campaigns_filter, "createdAt": {"$gte": thirty_days_ago}})
        )
        previous_count = (
            db.events.count_documents({"createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}})
            + db.campaigns.count_documents({**event_campaigns_filter, "createdAt": {"$gte": sixty_days_ago, "$lt": thirty_days_ago}})
        )
        trend = AnalyticsService.calculate_trend(current_count, previous_count)

        return {
            "totalEvents":               total_events,
            "publishedEvents":           published_events,
            "eventsFeatureCount":        events_feature_count,
            "eventCampaignsCount":       event_campaigns_count,
            "totalRegistrations":        total_registrations,
            "avgRegistrationsPerEvent":  total_registrations / total_events if total_events > 0 else 0,
            "trend":                     trend,
        }

    @staticmethod
    def get_resolution_time_stats(since: "datetime | None" = None) -> dict:
        """
        Get average, min, max resolution time for resolved/closed complaints.
        `since`, when provided, scopes this to grievances resolved (updatedAt)
        on/after that timestamp, so it responds to the dashboard's date-range picker.
        """
        db = MongoDatabase.get_db()

        match = {"status": {"$in": ["RESOLVED", "CLOSED"]}, "isDeleted": False}
        if since is not None:
            match = {**match, "updatedAt": {"$gte": since}}

        resolved = list(db.grievances.aggregate([
            {"$match": match},
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
    def get_grievance_monthly_trend(months: int = 6) -> dict:
        """
        Received vs resolved grievance counts per calendar month (IST), for the
        last N months including the current month. Powers the "Grievance Trend"
        chart on the Executive Dashboard.
        """
        db  = MongoDatabase.get_db()
        IST = timedelta(hours=5, minutes=30)
        now_ist = datetime.utcnow() + IST

        buckets = []
        year, month = now_ist.year, now_ist.month
        for i in range(months - 1, -1, -1):
            y, m = year, month - i
            while m <= 0:
                m += 12
                y -= 1
            buckets.append((y, m))

        month_labels, received, resolved = [], [], []
        for (y, m) in buckets:
            start_ist = datetime(y, m, 1)
            end_ist   = datetime(y + 1, 1, 1) if m == 12 else datetime(y, m + 1, 1)
            start_utc = start_ist - IST
            end_utc   = end_ist - IST

            received_count = db.grievances.count_documents({
                "isDeleted": False,
                "createdAt": {"$gte": start_utc, "$lt": end_utc},
            })
            resolved_count = db.grievances.count_documents({
                "isDeleted": False,
                "status":    {"$in": ["RESOLVED", "CLOSED"]},
                "updatedAt": {"$gte": start_utc, "$lt": end_utc},
            })

            month_labels.append(start_ist.strftime("%b %Y"))
            received.append(received_count)
            resolved.append(resolved_count)

        return {"months": month_labels, "received": received, "resolved": resolved}

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

        # Scope total/byStatus/byPriority/byCategory to the selected date range so
        # the dashboard's date-range picker actually changes what these cards show.
        base_stats = AnalyticsService.get_grievance_stats(since=since)
        base_stats["byStatus"]["RESOLVED"] = resolved_in_period
        base_stats["trend"] = trend
        base_stats["trendSeries"] = AnalyticsService.get_grievance_monthly_trend(6)

        return {
            "grievances":           base_stats,
            "alerts":               AnalyticsService.get_alert_stats(),
            # Registered Citizens intentionally stays an all-time cumulative total
            # (you don't "lose" registered citizens by picking a shorter range).
            "users":                AnalyticsService.get_user_stats(),
            "events":               AnalyticsService.get_event_stats(since=since),
            "resolutionTime":       AnalyticsService.get_resolution_time_stats(since=since),
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
