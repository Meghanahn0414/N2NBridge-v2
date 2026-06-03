"""
Dashboard Service
"""
from analytics.service import AnalyticsService
from config.database import MongoDatabase


class DashboardService:
    """Dashboard business logic"""
    
    @staticmethod
    def get_admin_dashboard() -> dict:
        """Get admin dashboard data"""
        return {
            "metrics": AnalyticsService.get_performance_metrics(),
            "overview": {
                "grievances": AnalyticsService.get_grievance_stats(),
                "alerts": AnalyticsService.get_alert_stats(),
                "users": AnalyticsService.get_user_stats(),
                "events": AnalyticsService.get_event_stats()
            }
        }
    
    @staticmethod
    def get_officer_dashboard(officer_id: str) -> dict:
        """Get officer dashboard data"""
        db = MongoDatabase.get_db()
        
        # Get assigned tasks
        tasks = list(db.tasks.find({
            "assignedTo": officer_id,
            "status": {"$ne": "COMPLETED"}
        }).limit(10))
        
        # Get assigned grievances
        grievances = list(db.grievances.find({
            "assignedOfficerId": officer_id,
            "status": {"$ne": "RESOLVED"}
        }).limit(10))
        
        # Get pending alerts
        alerts = list(db.alerts.find({
            "assignedTo": officer_id,
            "status": {"$ne": "RESOLVED"}
        }).limit(10))
        
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
        grievances = list(db.grievances.find({
            "citizenId": citizen_id,
            "isDeleted": False
        }))
        
        # Get grievance summary
        grievance_summary = {
            "total": len(grievances),
            "resolved": len([g for g in grievances if g["status"] == "RESOLVED"]),
            "pending": len([g for g in grievances if g["status"] not in ["RESOLVED", "CLOSED", "REJECTED"]])
        }
        
        # Get recent notifications
        notifications = list(db.notifications.find({
            "userId": citizen_id
        }).sort("createdAt", -1).limit(5))
        
        # Get registered events
        events = list(db.event_registrations.find({
            "citizenId": citizen_id
        }).limit(5))
        
        return {
            "grievanceSummary": grievance_summary,
            "recentGrievances": grievances[:5],
            "recentNotifications": notifications,
            "registeredEvents": events
        }
