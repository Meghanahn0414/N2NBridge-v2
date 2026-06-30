"""
Common Constants and Shared Utilities
Centralized definitions used across all modules
"""
from enum import Enum

# ===================
# User Roles
# ===================
class UserRole(str, Enum):
    """User roles in the system"""
    ADMIN = "ADMIN"
    CONSTITUENCY_MANAGER = "CONSTITUENCY_MANAGER"
    FIELD_OFFICER = "FIELD_OFFICER"
    REPRESENTATIVE = "REPRESENTATIVE"
    VOLUNTEER = "VOLUNTEER"
    CITIZEN = "CITIZEN"


# ===================
# Grievance Status
# ===================
class GrievanceStatus(str, Enum):
    """Grievance workflow statuses"""
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"


# ===================
# Priority Levels
# ===================
class PriorityLevel(str, Enum):
    """Priority levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ===================
# Alert Types
# ===================
class AlertType(str, Enum):
    """Types of alerts"""
    EMERGENCY = "EMERGENCY"
    SECURITY = "SECURITY"
    HEALTH = "HEALTH"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    POLLUTION = "POLLUTION"
    OTHER = "OTHER"


# ===================
# Alert Status
# ===================
class AlertStatus(str, Enum):
    """Alert statuses"""
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# ===================
# Notification Types
# ===================
class NotificationType(str, Enum):
    """Types of notifications"""
    GRIEVANCE = "GRIEVANCE"
    ALERT = "ALERT"
    TASK = "TASK"
    EVENT = "EVENT"
    SYSTEM = "SYSTEM"


# ===================
# Task Status
# ===================
class TaskStatus(str, Enum):
    """Task statuses"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ===================
# Event Status
# ===================
class EventStatus(str, Enum):
    """Event statuses"""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ===================
# User Status
# ===================
class UserStatus(str, Enum):
    """User account statuses"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


# ===================
# Collection Names
# ===================
COLLECTION_NAMES = {
    "users": "users",
    "constituencies": "constituencies",
    "wards": "wards",
    "grievance_categories": "grievance_categories",
    "grievances": "grievances",
    "alerts": "alerts",
    "events": "events",
    "event_registrations": "event_registrations",
    "campaigns": "campaigns",
    "communications": "communications",
    "tasks": "tasks",
    "field_reports": "field_reports",
    "surveys": "surveys",
    "survey_responses": "survey_responses",
    "notifications": "notifications",
    "audit_logs": "audit_logs"
}

# ===================
# Common Constants
# ===================
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100
DEFAULT_SKIP = 0

# Pagination
PAGINATION_DEFAULTS = {
    "page": 1,
    "per_page": 10,
    "max_per_page": 100
}

# Response Messages
RESPONSE_MESSAGES = {
    "success": "Operation successful",
    "created": "Resource created successfully",
    "updated": "Resource updated successfully",
    "deleted": "Resource deleted successfully",
    "not_found": "Resource not found",
    "invalid_input": "Invalid input provided",
    "unauthorized": "Unauthorized access",
    "forbidden": "Access forbidden",
    "conflict": "Resource already exists",
    "error": "An error occurred"
}

# HTTP Status Codes
HTTP_STATUS = {
    "ok": 200,
    "created": 201,
    "bad_request": 400,
    "unauthorized": 401,
    "forbidden": 403,
    "not_found": 404,
    "conflict": 409,
    "server_error": 500
}
