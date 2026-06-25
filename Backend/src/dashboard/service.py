"""
Dashboard Service
"""
from analytics.service import AnalyticsService
from config.database import MongoDatabase
from grievances.service import GrievanceService
from utils.helper import Helper
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Dashboard business logic"""
    
    @staticmethod
    def get_recent_activity(limit: int = 10) -> list:
        """Get recent system activity"""
        db = MongoDatabase.get_db()
        activities = []
        
        # Get recent grievances
        recent_grievances = list(db.grievances.find(
            {"isDeleted": False}
        ).sort("createdAt", -1).limit(limit))
        
        for g in recent_grievances:
            grievance = GrievanceService._populate_citizen_name(g)
            citizen_name = grievance.get("citizenName")

            activities.append({
                "time": grievance.get("createdAt"),
                "type": "COMPLAINT",
                "message": f"Complaint #{str(grievance.get('_id', ''))[:8]} created by {citizen_name or 'Unknown'}",
                "icon": "FaClipboardList"
            })
        
        # Get recent alerts
        recent_alerts = list(db.alerts.find({}).sort("createdAt", -1).limit(limit // 2))
        
        for a in recent_alerts:
            activities.append({
                "time": a.get("createdAt"),
                "type": "ALERT",
                "message": f"{a.get('alertType', 'Alert')} Alert submitted in {a.get('location', 'Unknown')}",
                "icon": "FaExclamationTriangle"
            })
        
        # Get recent events
        recent_events = list(db.events.find({}).sort("createdAt", -1).limit(limit // 3))
        
        for e in recent_events:
            activities.append({
                "time": e.get("createdAt"),
                "type": "EVENT",
                "message": f'Event "{e.get("eventName", "Unknown")}" created',
                "icon": "FaCalendarAlt"
            })
        
        # Sort by time — normalize to datetime so str vs datetime comparisons don't crash
        def _to_dt(activity):
            t = activity.get("time")
            if isinstance(t, datetime):
                return t
            if t is None:
                return datetime(1970, 1, 1)
            try:
                return datetime.fromisoformat(str(t))
            except Exception:
                return datetime(1970, 1, 1)

        activities.sort(key=_to_dt, reverse=True)

        # Format time safely
        for activity in activities:
            t = activity.get("time")
            if isinstance(t, datetime):
                activity["time"] = t.strftime("%I:%M %p")
            elif isinstance(t, str) and t:
                try:
                    activity["time"] = datetime.fromisoformat(t).strftime("%I:%M %p")
                except Exception:
                    activity["time"] = "—"
            else:
                activity["time"] = "—"

        return activities[:limit]
    
    @staticmethod
    def get_team_performance() -> list:
        """Get team performance data"""
        db = MongoDatabase.get_db()

        officers = list(db.users.find(
            {"role": {"$in": ["FIELD_OFFICER", "OFFICER", "MANAGER"]}, "isDeleted": False}
        ))

        team_data = []
        for officer in officers:
            officer_id = str(officer.get("_id"))

            assigned_tasks  = db.tasks.count_documents({"assignedTo": officer_id})
            completed_tasks = db.tasks.count_documents({"assignedTo": officer_id, "status": "COMPLETED"})

            assigned_grievances = db.grievances.count_documents({"assignedOfficerId": officer_id})
            resolved_grievances = db.grievances.count_documents(
                {"assignedOfficerId": officer_id, "status": "RESOLVED"}
            )

            resolved = list(db.grievances.aggregate([
                {"$match": {
                    "assignedOfficerId": officer_id, "status": "RESOLVED",
                    "updatedAt": {"$exists": True}, "createdAt": {"$exists": True}
                }},
                {"$project": {"resolutionTime": {"$subtract": ["$updatedAt", "$createdAt"]}}},
                {"$group": {"_id": None, "avgTime": {"$avg": "$resolutionTime"}}}
            ]))
            avg_time_ms   = resolved[0]["avgTime"] if resolved else 0
            avg_time_days = round(avg_time_ms / (1000 * 60 * 60 * 24), 1) if avg_time_ms > 0 else 0

            # Build rating only from components that have real data
            # FIX: officers with no assignments get None (unrated), not 0
            rating_components = []

            if assigned_tasks > 0:
                # Task completion rate → scaled to 0–5
                rating_components.append((completed_tasks / assigned_tasks) * 5)

            if assigned_grievances > 0:
                # Grievance resolution rate → scaled to 0–5
                rating_components.append((resolved_grievances / assigned_grievances) * 5)

            satisfaction = list(db.grievances.aggregate([
                {"$match": {"assignedOfficerId": officer_id,
                            "satisfactionRating": {"$exists": True, "$ne": None}}},
                {"$group": {"_id": None, "avgRating": {"$avg": "$satisfactionRating"}}}
            ]))
            if satisfaction and satisfaction[0].get("avgRating"):
                rating_components.append(satisfaction[0]["avgRating"])

            if rating_components:
                rating = str(round(min(5.0, max(0.0, sum(rating_components) / len(rating_components))), 1))
            else:
                rating = "N/A"  # no data yet — never show 0 for unassigned officers

            team_data.append({
                "name":      officer.get("fullName", officer.get("username", "Unknown")),
                "role":      officer.get("role", "Officer"),
                "assigned":  assigned_grievances,
                "completed": resolved_grievances,
                "time":      f"{avg_time_days} Days",
                "rating":    rating,
            })

        return team_data
    
    @staticmethod
    def get_grievance_trends(days: int = 7) -> dict:
        """
        Get complaint count per day for the last N days.
        FIX: Use IST (UTC+5:30) day boundaries so the chart shows
        Indian calendar days, not UTC days (which are offset by 5h30m).
        """
        db  = MongoDatabase.get_db()
        IST = timedelta(hours=5, minutes=30)

        # Current time in IST
        now_ist = datetime.utcnow() + IST

        trend_list = []
        for i in range(days - 1, -1, -1):
            day_ist = (now_ist - timedelta(days=i)).date()

            # IST midnight → converted to UTC for MongoDB query
            start_utc = datetime(day_ist.year, day_ist.month, day_ist.day, 0,  0,  0)  - IST
            end_utc   = datetime(day_ist.year, day_ist.month, day_ist.day, 23, 59, 59) - IST

            count = db.grievances.count_documents({
                "createdAt": {"$gte": start_utc, "$lte": end_utc},
                "isDeleted": False,
            })
            trend_list.append((day_ist.strftime("%d %b"), count))

        return dict(trend_list)
    
    @staticmethod
    def get_category_complaints() -> dict:
        """Real complaint counts per category broken down by status."""
        db = MongoDatabase.get_db()
        _NORMALIZE = {
            "Water": "Water Supply", "Roads": "Road Issue", "Road": "Road Issue",
            "Waste": "Garbage", "Electricity": "Power Outage",
            "WATER_SUPPLY": "Water Supply", "ROAD_ISSUE": "Road Issue",
            "GARBAGE": "Garbage", "POWER_OUTAGE": "Power Outage",
            "STREET_LIGHT": "Street Light", "DRAINAGE": "Drainage",
            "SANITATION": "Sanitation", "PARKS": "Parks & Recreation",
        }
        rows = list(db.grievances.aggregate([
            {"$match": {"isDeleted": False}},
            {"$group": {
                "_id": {
                    "category": {"$ifNull": ["$category", "$categoryId"]},
                    "status": "$status"
                },
                "count": {"$sum": 1}
            }}
        ]))
        result = {}
        for row in rows:
            raw_cat = str(row["_id"].get("category") or "Unknown").strip()
            cat = _NORMALIZE.get(raw_cat, raw_cat.replace("_", " ").title())
            if not cat or cat == "None":
                continue
            status = str(row["_id"].get("status") or "OPEN").upper()
            count = row["count"]
            if cat not in result:
                result[cat] = {"total": 0, "open": 0, "resolved": 0, "inProgress": 0, "escalated": 0}
            result[cat]["total"] += count
            if status in ("OPEN", "NEW", "PENDING"):
                result[cat]["open"] += count
            elif status == "RESOLVED":
                result[cat]["resolved"] += count
            elif status in ("IN_PROGRESS", "ASSIGNED"):
                result[cat]["inProgress"] += count
            elif status == "ESCALATED":
                result[cat]["escalated"] += count
            else:
                result[cat]["open"] += count
        return result

    @staticmethod
    def get_system_health() -> str:
        """
        Health score formula:
          resolution_rate   = resolved / total × 100       (0–100)
          critical_rate     = unresolved_critical / total  (0–1)
          score = resolution_rate − (critical_rate × 50)

        This way the penalty scales with how many critical complaints
        are open as a proportion of all complaints, not an arbitrary cap.
        Example: 80% resolved, 10% critical open → 80 − 5 = 75%
        """
        db = MongoDatabase.get_db()
        try:
            total = db.grievances.count_documents({"isDeleted": False})
            if total == 0:
                return "N/A"
            resolved      = db.grievances.count_documents({"isDeleted": False, "status": "RESOLVED"})
            critical_open = db.grievances.count_documents({
                "isDeleted": False,
                "priority": {"$in": ["CRITICAL", "HIGH"]},
                "status":   {"$nin": ["RESOLVED", "CLOSED"]},
            })
            resolution_rate  = (resolved / total) * 100
            critical_rate    = critical_open / total          # proportion 0–1
            critical_penalty = critical_rate * 50             # max penalty = 50 points
            score = max(0, round(resolution_rate - critical_penalty, 1))
            return f"{score}%"
        except Exception as e:
            logger.error(f"Error calculating system health: {str(e)}")
            return "N/A"
    
    @staticmethod
    def get_admin_dashboard() -> dict:
        """Get admin dashboard data — every sub-call is safe-wrapped so a single
        failure (e.g. mixed datetime/str sort, DB timeout) returns partial data
        instead of a 500 for the whole dashboard."""
        sc = DashboardService._safe_call

        metrics = sc(AnalyticsService.get_performance_metrics, default={}, label="performance_metrics")
        active_users_data = metrics.get("activeUsers", {"active": 0, "trend": 0})

        return {
            "metrics": metrics,
            "overview": {
                "grievances": sc(AnalyticsService.get_grievance_stats, default={}, label="overview_grievances"),
                "alerts":     sc(AnalyticsService.get_alert_stats,    default={}, label="overview_alerts"),
                "users":      sc(AnalyticsService.get_user_stats,     default={}, label="overview_users"),
                "events":     sc(AnalyticsService.get_event_stats,    default={}, label="overview_events"),
            },
            "recentActivity":  sc(DashboardService.get_recent_activity, 10, default=[], label="recent_activity"),
            "teamPerformance": sc(DashboardService.get_team_performance,    default=[], label="team_performance"),
            "grievanceTrends": sc(DashboardService.get_grievance_trends, 7, default={}, label="grievance_trends"),
            "activeUsers":     active_users_data.get("active", 0) if isinstance(active_users_data, dict) else active_users_data,
            "systemHealth":    sc(DashboardService.get_system_health,       default="N/A", label="system_health"),
            "categoryComplaints": sc(DashboardService.get_category_complaints, default={}, label="category_complaints"),
        }
    
    @staticmethod
    def _safe_call(fn, *args, default=None, label=""):
        """Call fn safely, returning default on any exception."""
        try:
            return fn(*args)
        except Exception as exc:
            logger.error(f"DashboardService sub-call failed [{label}]: {exc}", exc_info=True)
            return default

    # ------------------------------------------------------------------
    # AI Insights helpers — previously computed in the frontend
    # ------------------------------------------------------------------

    @staticmethod
    def get_ai_recommendations(metrics: dict, summary: dict) -> list:
        """
        Generate recommendation cards from live metrics.
        Previously lived in AIInsights.jsx (getRecommendations).
        Moved here so the logic is server-side and testable.
        """
        alerts_trend     = (metrics.get("alerts")     or {}).get("trend", 0) or 0
        grievances_trend = (metrics.get("grievances") or {}).get("trend", 0) or 0
        total_events     = (metrics.get("events")     or {}).get("totalEvents", 0) or 0

        items = []

        if metrics.get("alerts") is not None:
            direction = "Up" if alerts_trend >= 0 else "Down"
            items.append({
                "id":          "alerts",
                "title":       f"Alert Volume {direction} {abs(alerts_trend)}%",
                "description": "Prioritize response in high-alert wards",
                "action":      "Coordinate with response teams",
                "priority":    "high" if alerts_trend >= 10 else "medium",
            })

        if metrics.get("grievances") is not None:
            items.append({
                "id":          "grievances",
                "title":       f"Complaint Trend: {grievances_trend}%",
                "description": "Review service delivery in affected areas",
                "action":      "Initiate citizen outreach campaigns",
                "priority":    "medium" if abs(grievances_trend) > 5 else "low",
            })

        if metrics.get("events") is not None:
            items.append({
                "id":          "events",
                "title":       f"Managing {total_events} Active Events" if total_events > 0 else "No Active Events Data",
                "description": "Use event participation to boost engagement",
                "action":      "Review event performance metrics",
                "priority":    "low" if total_events > 0 else "medium",
            })

        if not items:
            items.append({
                "id":          "none",
                "title":       "No Insights Yet",
                "description": "Dashboard data is loading or unavailable",
                "action":      "Check back after data sync",
                "priority":    "low",
            })

        return items

    @staticmethod
    def get_risk_scores(summary: dict) -> list:
        """
        Compute constituency risk gauge scores from summary KPIs.
        Previously computed inline in AIInsights.jsx (riskScores array).
        Moved here so the scoring formula is server-side.
        """
        health_str = str(summary.get("healthScore", "0")).replace("%", "")
        try:
            health_score = float(health_str)
        except (ValueError, TypeError):
            health_score = 0.0

        return [
            {
                "category": "Alert Analytics",
                "score":    min(100, (summary.get("criticalAlerts", 0) or 0) * 5),
                "color":    "#ef4444",
            },
            {
                "category": "Complaint Analytics",
                "score":    min(100, (summary.get("openComplaints", 0) or 0) * 2),
                "color":    "#f59e0b",
            },
            {
                "category": "Citizen Satisfaction",
                "score":    min(100, (summary.get("citizenSatisfaction", 0) or 0) * 20),
                "color":    "#10b981",
            },
            {
                "category": "Health Score",
                "score":    health_score,
                "color":    "#3b82f6",
            },
        ]

    @staticmethod
    def get_team_summary(team_performance: list) -> dict:
        """
        Aggregate team-level KPIs from the team performance list.
        averageRating was previously computed in TeamPerformanceDashboard.jsx.
        """
        if not team_performance:
            return {"averageRating": "0.0", "totalOfficers": 0}

        ratings = []
        for m in team_performance:
            try:
                r = float(m.get("rating", 0) or 0)
                ratings.append(r)
            except (TypeError, ValueError):
                pass

        avg = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
        return {
            "averageRating": str(avg),
            "totalOfficers": len(team_performance),
        }

    @staticmethod
    def get_mla_dashboard() -> dict:
        """Get MLA dashboard data"""
        db = MongoDatabase.get_db()
        metrics = DashboardService._safe_call(
            AnalyticsService.get_performance_metrics, default={}, label="performance_metrics"
        )

        status_counts = metrics.get("grievances", {}).get("byStatus", {})
        alert_priorities = metrics.get("alerts", {}).get("byPriority", {})
        user_roles = metrics.get("users", {}).get("byRole", {})

        total_complaints = metrics.get("grievances", {}).get("total", 0)
        open_complaints = (
            status_counts.get("NEW", 0)
            + status_counts.get("ASSIGNED", 0)
            + status_counts.get("IN_PROGRESS", 0)
        )
        resolved_complaints = status_counts.get("RESOLVED", 0)
        critical_alerts = alert_priorities.get("CRITICAL", 0)
        registered_citizens = user_roles.get("CITIZEN", 0)
        active_officers = user_roles.get("FIELD_OFFICER", 0) + user_roles.get("OFFICER", 0)
        health_score = DashboardService._safe_call(
            DashboardService.get_system_health, default="N/A", label="system_health"
        )
        avg_satisfaction = 0

        try:
            satisfaction_agg = list(db.grievances.aggregate([
                {"$match": {"feedback.rating": {"$exists": True, "$ne": None}}},
                {"$group": {"_id": None, "avgRating": {"$avg": "$feedback.rating"}}}
            ]))
            if satisfaction_agg:
                avg_satisfaction = round(satisfaction_agg[0].get("avgRating", 0), 1)
        except Exception as exc:
            logger.error(f"avg_satisfaction agg failed: {exc}", exc_info=True)

        # Aggregate all complaints by ward with priority breakdown
        def _highest_priority(priorities):
            if "CRITICAL" in priorities:
                return "CRITICAL"
            if "HIGH" in priorities:
                return "HIGH"
            if "MEDIUM" in priorities:
                return "MEDIUM"
            return "LOW"

        ward_stats_raw = list(db.grievances.aggregate([
            {"$match": {"isDeleted": False, "wardId": {"$exists": True, "$nin": [None, ""]}}},
            {"$group": {
                "_id": "$wardId",
                "count": {"$sum": 1},
                "priorities": {"$push": "$priority"}
            }}
        ]))
        ward_stats = sorted(
            [{"name": str(item["_id"]), "wardId": str(item["_id"]),
              "count": item["count"],
              "highestPriority": _highest_priority(item.get("priorities", []))}
             for item in ward_stats_raw if item["_id"]],
            key=lambda x: (["LOW","MEDIUM","HIGH","CRITICAL"].index(x["highestPriority"]), x["count"]),
            reverse=True
        )

        recent_alerts = [Helper.convert_mongo_doc(alert) for alert in db.alerts.find({}).sort("createdAt", -1).limit(5)]
        recent_complaints = []
        for complaint in db.grievances.find({"isDeleted": False}).sort("createdAt", -1).limit(50):
            complaint = GrievanceService._populate_citizen_name(complaint)
            # Resolve category name from categoryId if not already human-readable
            if complaint.get("categoryId") and not complaint.get("categoryName"):
                try:
                    from bson import ObjectId
                    cat_doc = db.grievance_categories.find_one({"_id": ObjectId(str(complaint["categoryId"]))})
                    if cat_doc:
                        complaint["categoryName"] = cat_doc.get("categoryName") or cat_doc.get("name")
                except Exception:
                    pass
            # Humanise the enum category field as fallback
            if not complaint.get("categoryName") and complaint.get("category"):
                complaint["categoryName"] = str(complaint["category"]).replace("_", " ").title()
            recent_complaints.append(Helper.convert_mongo_doc(complaint))

        recent_activity = DashboardService._safe_call(
            DashboardService.get_recent_activity, 10, default=[], label="recent_activity"
        )

        summary = {
            "totalComplaints":     total_complaints,
            "openComplaints":      open_complaints,
            "resolvedThisMonth":   resolved_complaints,
            "criticalAlerts":      critical_alerts,
            "upcomingEvents":      metrics.get("events", {}).get("totalEvents", 0),
            "citizenSatisfaction": avg_satisfaction,
            "healthScore":         health_score,
            "activeOfficers":      active_officers,
            "registeredCitizens":  registered_citizens,
        }

        sc = DashboardService._safe_call
        team_performance = sc(DashboardService.get_team_performance, default=[], label="team_performance")

        return {
            "summary": summary,
            "metrics": metrics,
            "overview": {
                "grievances": sc(AnalyticsService.get_grievance_stats, default={}, label="overview_grievances"),
                "alerts":     sc(AnalyticsService.get_alert_stats,    default={}, label="overview_alerts"),
                "users":      sc(AnalyticsService.get_user_stats,     default={}, label="overview_users"),
                "events":     sc(AnalyticsService.get_event_stats,    default={}, label="overview_events"),
            },
            "wardStats":        ward_stats,
            "recentAlerts":     recent_alerts,
            "recentComplaints": recent_complaints,
            "teamPerformance":  team_performance,
            # teamSummary — aggregates previously computed in TeamPerformanceDashboard.jsx
            "teamSummary":      sc(DashboardService.get_team_summary, team_performance, default={"averageRating": "0.0", "totalOfficers": 0}, label="team_summary"),
            "grievanceTrends":  sc(DashboardService.get_grievance_trends, 7, default={}, label="grievance_trends"),
            "recentActivity":   recent_activity,
            "systemHealth":     health_score,
            "categoryComplaints": sc(DashboardService.get_category_complaints, default={}, label="category_complaints"),
            # recommendations & riskScores — previously computed in AIInsights.jsx frontend
            "recommendations":  sc(DashboardService.get_ai_recommendations, metrics, summary, default=[], label="recommendations"),
            "riskScores":       sc(DashboardService.get_risk_scores, summary, default=[], label="risk_scores"),
        }
    
    @staticmethod
    def get_officer_dashboard(officer_id: str) -> dict:
        """Get officer dashboard data"""
        db = MongoDatabase.get_db()
        
        # Get assigned tasks
        tasks = [Helper.convert_mongo_doc(task) for task in db.tasks.find({
            "assignedTo": officer_id,
            "status": {"$ne": "COMPLETED"}
        }).limit(10)]
        
        # Get assigned grievances
        grievances = [Helper.convert_mongo_doc(grievance) for grievance in db.grievances.find({
            "assignedOfficerId": officer_id,
            "status": {"$ne": "RESOLVED"}
        }).limit(10)]
        
        # Get pending alerts
        alerts = [Helper.convert_mongo_doc(alert) for alert in db.alerts.find({
            "assignedTo": officer_id,
            "status": {"$ne": "RESOLVED"}
        }).limit(10)]
        
        return {
            "pendingTasks": len(tasks),
            "pendingGrievances": len(grievances),
            "pendingAlerts": len(alerts),
            "tasks": tasks,
            "grievances": grievances,
            "alerts": alerts
        }
    
    @staticmethod
    def get_citizen_dashboard(citizen_id: str) -> dict:
        """Get citizen dashboard data"""
        db = MongoDatabase.get_db()
        
        # Get citizen's grievances
        grievances = [Helper.convert_mongo_doc(grievance) for grievance in db.grievances.find({
            "citizenId": citizen_id,
            "isDeleted": False
        })]
        
        # Get grievance summary
        grievance_summary = {
            "total": len(grievances),
            "resolved": len([g for g in grievances if g["status"] == "RESOLVED"]),
            "pending": len([g for g in grievances if g["status"] not in ["RESOLVED", "CLOSED", "REJECTED"]])
        }
        
        # Get recent notifications
        notifications = [Helper.convert_mongo_doc(notification) for notification in db.notifications.find({
            "userId": citizen_id
        }).sort("createdAt", -1).limit(5)]
        
        # Get registered events
        events = [Helper.convert_mongo_doc(event) for event in db.event_registrations.find({
            "citizenId": citizen_id
        }).limit(5)]
        
        return {
            "grievanceSummary": grievance_summary,
            "recentGrievances": grievances[:5],
            "recentNotifications": notifications,
            "registeredEvents": events
        }
