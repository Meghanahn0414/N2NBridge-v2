"""
Dashboard Service
"""
from analytics.service import AnalyticsService
from bson import ObjectId
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
        
        # Sort by time and return
        activities.sort(key=lambda x: x.get("time", datetime.utcnow()), reverse=True)
        
        # Format time
        for activity in activities:
            if activity.get("time"):
                activity["time"] = activity["time"].strftime("%I:%M %p")
        
        return activities[:limit]
    
    @staticmethod
    def get_team_performance() -> list:
        """Get team performance data"""
        db = MongoDatabase.get_db()
        
        # Get officers/staff with their performance metrics
        officers = list(db.users.find(
            {"role": {"$in": ["FIELD_OFFICER", "OFFICER", "MANAGER"]}, "isDeleted": False}
        ))
        
        team_data = []
        for officer in officers:
            officer_id = str(officer.get("_id"))
            
            # Get assigned tasks
            assigned_tasks = db.tasks.count_documents({"assignedTo": officer_id})
            completed_tasks = db.tasks.count_documents({
                "assignedTo": officer_id,
                "status": "COMPLETED"
            })
            
            # Get assigned grievances
            assigned_grievances = db.grievances.count_documents(
                {"assignedOfficerId": officer_id}
            )
            resolved_grievances = db.grievances.count_documents({
                "assignedOfficerId": officer_id,
                "status": "RESOLVED"
            })
            
            # Calculate average resolution time
            resolved = list(db.grievances.aggregate([
                {
                    "$match": {
                        "assignedOfficerId": officer_id,
                        "status": "RESOLVED",
                        "updatedAt": {"$exists": True},
                        "createdAt": {"$exists": True}
                    }
                },
                {
                    "$project": {
                        "resolutionTime": {
                            "$subtract": ["$updatedAt", "$createdAt"]
                        }
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "avgTime": {"$avg": "$resolutionTime"}
                    }
                }
            ]))
            
            avg_time_ms = resolved[0]["avgTime"] if resolved else 0
            avg_time_days = round(avg_time_ms / (1000 * 60 * 60 * 24), 1) if avg_time_ms > 0 else 0
            
            # Calculate rating based on multiple factors
            rating_components = []
            
            # Task completion rate (if any tasks exist)
            if assigned_tasks > 0:
                task_completion_rate = (completed_tasks / assigned_tasks * 100)
                rating_components.append(task_completion_rate / 100 * 5)
            
            # Grievance resolution rate (if any grievances assigned)
            if assigned_grievances > 0:
                grievance_resolution_rate = (resolved_grievances / assigned_grievances * 100)
                rating_components.append(grievance_resolution_rate / 100 * 5)
            else:
                # If no grievances, give baseline rating for being available
                rating_components.append(3.0)
            
            # Average customer satisfaction (if available)
            satisfaction_ratings = list(db.grievances.aggregate([
                {
                    "$match": {
                        "assignedOfficerId": officer_id,
                        "satisfactionRating": {"$exists": True, "$ne": None}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "avgRating": {"$avg": "$satisfactionRating"}
                    }
                }
            ]))
            
            if satisfaction_ratings and satisfaction_ratings[0].get("avgRating"):
                rating_components.append(satisfaction_ratings[0]["avgRating"])
            
            # Calculate final rating as average of components
            rating = round(sum(rating_components) / len(rating_components), 1) if rating_components else 3.0
            rating = min(5, max(0, rating))  # Clamp between 0 and 5
            
            team_data.append({
                "name": officer.get("fullName", officer.get("username", "Unknown")),
                "role": officer.get("role", "Officer"),
                "assigned": assigned_tasks,
                "completed": completed_tasks,
                "time": f"{avg_time_days} Days",
                "rating": str(rating)
            })
        
        return team_data
    
    @staticmethod
    def get_grievance_trends(days: int = 7) -> dict:
        """Get grievance trends for the last N days"""
        db = MongoDatabase.get_db()
        trends = {}
        
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).date()
            start = datetime.combine(date, datetime.min.time())
            end = datetime.combine(date, datetime.max.time())
            
            count = db.grievances.count_documents({
                "createdAt": {"$gte": start, "$lte": end},
                "isDeleted": False
            })
            
            date_key = date.strftime("%d %b")
            trends[date_key] = count
        
        # Reverse to get chronological order - sort by date object, not by string
        trend_list = []
        for i in range(days - 1, -1, -1):
            date = (datetime.utcnow() - timedelta(days=i)).date()
            date_key = date.strftime("%d %b")
            if date_key in trends:
                trend_list.append((date_key, trends[date_key]))
        
        return dict(trend_list)
    
    @staticmethod
    def get_system_health() -> str:
        """Calculate system health based on database status and active services"""
        db = MongoDatabase.get_db()
        
        try:
            # Check MongoDB connection by attempting a simple query
            db.users.count_documents({})
            
            # Count active users
            active_count = db.users.count_documents({"isDeleted": False})
            
            # Count grievances in last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            grievance_count = db.grievances.count_documents({
                "createdAt": {"$gte": week_ago},
                "isDeleted": False
            })
            
            # Calculate health score (0-100%)
            # Base 80% for being online + activity-based bonus
            base_health = 80
            activity_bonus = min(20, (active_count / 10) + (grievance_count / 50))
            health_score = base_health + activity_bonus
            
            return f"{min(100, round(health_score, 1))}%"
        except Exception as e:
            logger.error(f"Error calculating system health: {str(e)}")
            return "Unknown"
    
    @staticmethod
    def get_admin_dashboard() -> dict:
        """Get admin dashboard data"""
        metrics = AnalyticsService.get_performance_metrics()
        
        # Extract active users from the metrics
        active_users_data = metrics.get("activeUsers", {"active": 0, "trend": 0})
        
        return {
            "metrics": metrics,
            "overview": {
                "grievances": AnalyticsService.get_grievance_stats(),
                "alerts": AnalyticsService.get_alert_stats(),
                "users": AnalyticsService.get_user_stats(),
                "events": AnalyticsService.get_event_stats()
            },
            "recentActivity": DashboardService.get_recent_activity(10),
            "teamPerformance": DashboardService.get_team_performance(),
            "grievanceTrends": DashboardService.get_grievance_trends(7),
            "activeUsers": active_users_data.get("active", 0) if isinstance(active_users_data, dict) else active_users_data,
            "systemHealth": DashboardService.get_system_health()
        }
    
    @staticmethod
    def get_mla_dashboard() -> dict:
        """Get MLA dashboard data"""
        db = MongoDatabase.get_db()
        metrics = AnalyticsService.get_performance_metrics()

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
        registered_citizens = metrics.get("users", {}).get("total", 0)
        active_officers = user_roles.get("FIELD_OFFICER", 0) + user_roles.get("OFFICER", 0)
        health_score = DashboardService.get_system_health()
        avg_satisfaction = 0

        satisfaction_agg = list(db.grievances.aggregate([
            {"$match": {"satisfactionRating": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": None, "avgRating": {"$avg": "$satisfactionRating"}}}
        ]))
        if satisfaction_agg:
            avg_satisfaction = round(satisfaction_agg[0].get("avgRating", 0), 1)

        recent_alerts = [Helper.convert_mongo_doc(alert) for alert in db.alerts.find({}).sort("createdAt", -1).limit(5)]
        recent_complaints = []
        for complaint in db.grievances.find({"isDeleted": False}).sort("createdAt", -1).limit(5):
            complaint = GrievanceService._populate_citizen_name(complaint)
            recent_complaints.append(Helper.convert_mongo_doc(complaint))

        recent_activity = DashboardService.get_recent_activity(10)

        return {
            "summary": {
                "totalComplaints": total_complaints,
                "openComplaints": open_complaints,
                "resolvedThisMonth": resolved_complaints,
                "criticalAlerts": critical_alerts,
                "upcomingEvents": metrics.get("events", {}).get("totalEvents", 0),
                "citizenSatisfaction": avg_satisfaction,
                "healthScore": health_score,
                "activeOfficers": active_officers,
                "registeredCitizens": registered_citizens,
            },
            "metrics": metrics,
            "overview": {
                "grievances": AnalyticsService.get_grievance_stats(),
                "alerts": AnalyticsService.get_alert_stats(),
                "users": AnalyticsService.get_user_stats(),
                "events": AnalyticsService.get_event_stats()
            },
            "recentAlerts": recent_alerts,
            "recentComplaints": recent_complaints,
            "teamPerformance": DashboardService.get_team_performance(),
            "grievanceTrends": DashboardService.get_grievance_trends(7),
            "recentActivity": recent_activity,
            "systemHealth": health_score
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
