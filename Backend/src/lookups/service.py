from utils.common import (
    UserRole,
    UserStatus,
    PriorityLevel,
    AlertType,
    AlertStatus,
    GrievanceStatus,
    EventStatus,
)
from grievances.model import GrievancePriority

COUNTRY_LIST = [
    {"label": "India", "dialCode": "+91", "flag": "🇮🇳"},
    {"label": "United States", "dialCode": "+1", "flag": "🇺🇸"},
    {"label": "United Kingdom", "dialCode": "+44", "flag": "🇬🇧"},
    {"label": "Australia", "dialCode": "+61", "flag": "🇦🇺"},
    {"label": "Canada", "dialCode": "+1", "flag": "🇨🇦"},
    {"label": "United Arab Emirates", "dialCode": "+971", "flag": "🇦🇪"},
]

EVENT_TYPES = [
    {"value": "AWARENESS_CAMPAIGN", "label": "Awareness Campaign"},
    {"value": "COMMUNITY_MEETING", "label": "Community Meeting"},
    {"value": "TRAINING_PROGRAM", "label": "Training Program"},
    {"value": "HEALTH_CAMP", "label": "Health Camp"},
    {"value": "OTHER", "label": "Other"},
]

ROLE_LABELS = {
    UserRole.CONSTITUENCY_MANAGER.value: "Constituency Manager",
    UserRole.FIELD_OFFICER.value: "Field Officer",
    UserRole.REPRESENTATIVE.value: "Representative",
    UserRole.VOLUNTEER.value: "Volunteer",
    UserRole.CITIZEN.value: "Citizen",
}

# Roles excluded from the staff registration dropdown
_EXCLUDED_ROLES = {UserRole.ADMIN.value}

STATUS_LABELS = {
    UserStatus.ACTIVE.value: "Active",
    UserStatus.INACTIVE.value: "Inactive",
    UserStatus.SUSPENDED.value: "Suspended",
}

PRIORITY_LABELS = {
    PriorityLevel.LOW.value: "Low",
    PriorityLevel.MEDIUM.value: "Medium",
    PriorityLevel.HIGH.value: "High",
    PriorityLevel.CRITICAL.value: "Critical",
}

ALERT_TYPE_LABELS = {
    AlertType.EMERGENCY.value: "Emergency",
    AlertType.SECURITY.value: "Security",
    AlertType.HEALTH.value: "Health",
    AlertType.INFRASTRUCTURE.value: "Infrastructure",
    AlertType.POLLUTION.value: "Pollution",
    AlertType.OTHER.value: "Other",
}

ALERT_STATUS_LABELS = {
    AlertStatus.OPEN.value: "Open",
    AlertStatus.ACKNOWLEDGED.value: "Acknowledged",
    AlertStatus.IN_PROGRESS.value: "In Progress",
    AlertStatus.RESOLVED.value: "Resolved",
    AlertStatus.CLOSED.value: "Closed",
}

EVENT_STATUS_LABELS = {
    EventStatus.DRAFT.value: "Draft",
    EventStatus.PUBLISHED.value: "Published",
    EventStatus.ONGOING.value: "Ongoing",
    EventStatus.COMPLETED.value: "Completed",
    EventStatus.CANCELLED.value: "Cancelled",
}

COMMUNICATION_CHANNELS = [
    {"value": "WHATSAPP", "label": "WhatsApp", "icon": "💬"},
    {"value": "SMS", "label": "SMS", "icon": "📱"},
    {"value": "EMAIL", "label": "Email", "icon": "📧"},
    {"value": "PUSH", "label": "Push Notification", "icon": "🔔"},
]

AUDIENCE_SEGMENTS = [
    {"value": "ALL_CITIZENS", "label": "All Citizens"},
    {"value": "WARD_WISE", "label": "Ward Wise"},
    {"value": "AGE_GROUP", "label": "Age Group"},
    {"value": "WOMEN", "label": "Women"},
    {"value": "YOUTH", "label": "Youth"},
    {"value": "FARMERS", "label": "Farmers"},
    {"value": "SENIOR_CITIZENS", "label": "Senior Citizens"},
]


def enum_to_options(enum_class, label_map=None):
    label_map = label_map or {}
    return [
        {"value": item.value, "label": label_map.get(item.value, item.value.replace("_", " ").title())}
        for item in enum_class
    ]


def get_countries():
    return COUNTRY_LIST


def get_user_roles():
    return [
        opt for opt in enum_to_options(UserRole, ROLE_LABELS)
        if opt["value"] not in _EXCLUDED_ROLES
    ]


def get_user_statuses():
    return enum_to_options(UserStatus, STATUS_LABELS)


def get_grievance_statuses():
    return enum_to_options(GrievanceStatus)


def get_grievance_priorities():
    return enum_to_options(GrievancePriority, PRIORITY_LABELS)


def get_alert_priorities():
    return enum_to_options(PriorityLevel, PRIORITY_LABELS)


def get_alert_statuses():
    return enum_to_options(AlertStatus, ALERT_STATUS_LABELS)


def get_alert_types():
    return enum_to_options(AlertType, ALERT_TYPE_LABELS)


def get_event_statuses():
    return enum_to_options(EventStatus, EVENT_STATUS_LABELS)


def get_event_types():
    return EVENT_TYPES


def get_communication_channels():
    return COMMUNICATION_CHANNELS


def get_audience_segments():
    return AUDIENCE_SEGMENTS
