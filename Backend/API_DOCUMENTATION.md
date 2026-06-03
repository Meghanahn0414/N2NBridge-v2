# CRM Grievance Management System - API Documentation

## Overview
This is a comprehensive Government CRM system for managing grievances, alerts, events, and citizen engagement using FastAPI and MongoDB.

## Technology Stack
- **Backend**: FastAPI (Python 3.9+)
- **Database**: MongoDB
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: bcrypt
- **Validation**: Pydantic

## Project Structure

```
Backend/
├── src/
│   ├── main.py                 # FastAPI application entry point
│   ├── config/                 # Configuration files
│   │   ├── database.py        # MongoDB configuration
│   │   ├── settings.py        # Application settings
│   │   └── security.py        # Security & JWT configuration
│   ├── auth/                   # Authentication
│   │   ├── routes.py          # Auth endpoints
│   │   ├── service.py         # Auth business logic
│   │   └── model.py           # Auth schemas
│   ├── users/                  # User management
│   │   ├── routes.py          # User endpoints
│   │   ├── service.py         # User business logic
│   │   └── model.py           # User schemas
│   ├── grievances/             # Grievance management
│   │   ├── routes.py          # Grievance endpoints
│   │   ├── service.py         # Grievance business logic
│   │   └── model.py           # Grievance schemas
│   ├── alerts/                 # Alert management
│   │   ├── routes.py          # Alert endpoints
│   │   ├── service.py         # Alert business logic
│   │   └── model.py           # Alert schemas
│   ├── events/                 # Event management
│   │   ├── routes.py          # Event endpoints
│   │   ├── service.py         # Event business logic
│   │   └── model.py           # Event schemas
│   ├── tasks/                  # Task management
│   │   ├── routes.py          # Task endpoints
│   │   ├── service.py         # Task business logic
│   │   └── model.py           # Task schemas
│   ├── notifications/          # Notification system
│   │   ├── routes.py          # Notification endpoints
│   │   ├── service.py         # Notification business logic
│   │   └── model.py           # Notification schemas
│   ├── analytics/              # Analytics module
│   │   ├── routes.py          # Analytics endpoints
│   │   └── service.py         # Analytics business logic
│   ├── dashboard/              # Dashboard module
│   │   ├── routes.py          # Dashboard endpoints
│   │   └── service.py         # Dashboard business logic
│   └── utils/                  # Utility functions
│       ├── response.py        # Response formatting
│       ├── jwt.py             # JWT utilities
│       └── helper.py          # Helper functions
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── .env.example               # Environment template

```

## Installation

1. **Clone the repository**
```bash
cd Backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection and JWT secret
```

5. **Run the application**
```bash
cd src
python main.py
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/api/docs`

## Database Collections

### 1. Users
- Stores user information with roles
- Indexes: mobile (unique), email (unique), role, constituencyId, wardId

### 2. Constituencies
- Geographic divisions for administration
- Indexes: constituencyCode (unique), name, district

### 3. Wards
- Sub-divisions within constituencies
- Indexes: constituencyId, wardNumber

### 4. Grievance Categories
- Classification of grievances

### 5. Grievances
- Main grievance/complaint records
- Embedded: history, attachments, feedback, aiAnalysis
- Indexes: complaintNumber (unique), citizenId, status, categoryId, gpsLocation (geospatial)

### 6. Alerts
- Emergency and incident alerts
- Indexes: alertNumber (unique), priority, location (geospatial)

### 7. Events
- Public events and activities

### 8. Event Registrations
- Citizens registered for events
- Unique Index: (eventId, citizenId)

### 9. Tasks
- Work assignments for officers
- Related to grievances

### 10. Field Reports
- Reports submitted by field officers
- Includes GPS location and photos

### 11. Notifications
- User notifications
- Indexes: userId, createdAt

### 12. Audit Logs
- System audit trail
- Indexes: userId, createdAt, module

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/{user_id}` - Get user
- `GET /api/users/` - List users (paginated)
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### Constituencies & Wards
- `POST /api/users/constituencies` - Create constituency
- `GET /api/users/constituencies` - List constituencies
- `GET /api/users/constituencies/search/{query}` - Search constituencies
- `POST /api/users/wards` - Create ward
- `GET /api/users/constituencies/{constituency_id}/wards` - Get wards

### Grievances
- `POST /api/grievances/` - Create grievance
- `GET /api/grievances/{grievance_id}` - Get grievance
- `GET /api/grievances/` - List grievances (paginated)
- `PUT /api/grievances/{grievance_id}` - Update grievance
- `POST /api/grievances/{grievance_id}/assign/{officer_id}` - Assign to officer
- `POST /api/grievances/{grievance_id}/feedback` - Add feedback
- `GET /api/grievances/citizen/{citizen_id}` - Get citizen's grievances
- `POST /api/grievances/categories` - Create category
- `GET /api/grievances/categories` - List categories

### Alerts
- `POST /api/alerts/` - Create alert
- `GET /api/alerts/{alert_id}` - Get alert
- `GET /api/alerts/` - List alerts (paginated)
- `PUT /api/alerts/{alert_id}` - Update alert
- `POST /api/alerts/{alert_id}/assign/{officer_id}` - Assign to officer

### Events
- `POST /api/events/` - Create event
- `GET /api/events/{event_id}` - Get event
- `GET /api/events/` - List events (paginated)
- `PUT /api/events/{event_id}` - Update event
- `POST /api/events/{event_id}/publish` - Publish event
- `POST /api/events/{event_id}/register` - Register for event
- `GET /api/events/{event_id}/registrations` - Get registrations

### Tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{task_id}` - Get task
- `GET /api/tasks/` - List tasks (paginated)
- `PUT /api/tasks/{task_id}` - Update task
- `GET /api/tasks/officer/{officer_id}` - Get officer's tasks
- `POST /api/tasks/reports` - Create field report

### Notifications
- `GET /api/notifications/{notification_id}` - Get notification
- `GET /api/notifications/` - List notifications (paginated)
- `GET /api/notifications/unread` - Get unread notifications
- `PUT /api/notifications/{notification_id}/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{notification_id}` - Delete notification

### Analytics
- `GET /api/analytics/grievances` - Grievance statistics
- `GET /api/analytics/alerts` - Alert statistics
- `GET /api/analytics/users` - User statistics
- `GET /api/analytics/events` - Event statistics
- `GET /api/analytics/resolution-time` - Resolution time stats
- `GET /api/analytics/dashboard` - All dashboard metrics

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/officer` - Officer dashboard
- `GET /api/dashboard/citizen` - Citizen dashboard

### Health & Status
- `GET /` - API information
- `GET /api/health` - Health check

## Authentication

All endpoints (except login) require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

## User Roles

1. **ADMIN** - Full system access
2. **MANAGER** - Grievance and alert management
3. **FIELD_OFFICER** - Field operations and reports
4. **REPRESENTATIVE** - Read-only access to grievances
5. **VOLUNTEER** - Limited grievance viewing
6. **CITIZEN** - Create grievances, view own records

## Key Features

### Soft Delete
All major records support soft delete with `isDeleted` flag and `deletedAt` timestamp.

### Audit Trail
All operations tracked with:
- `createdBy` / `updatedBy` - User who performed action
- `createdAt` / `updatedAt` - Timestamps
- `audit_logs` collection - Detailed audit history

### Grievance Workflow
1. Citizen creates grievance → Status: NEW
2. Manager assigns to officer → Status: ASSIGNED
3. Officer works on grievance → Status: IN_PROGRESS
4. Officer completes work → Status: RESOLVED
5. Citizen provides feedback → Feedback stored
6. Record closed → Status: CLOSED

### Geospatial Queries
- Grievances support GPS locations
- Alerts support location-based queries
- 2dsphere indexes for geographic searches

## Error Handling

All errors follow standard format:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "details": "Additional error information"
  },
  "statusCode": 400
}
```

## Pagination

List endpoints support pagination:
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10, max: 100)

## Rate Limiting

Currently no rate limiting (add as needed with middleware)

## Security Considerations

1. Change JWT secret in production
2. Use HTTPS in production
3. Implement rate limiting
4. Add request validation
5. Regular security audits
6. Protect MongoDB credentials
7. Enable MongoDB authentication
8. Use environment variables for secrets

## Future Enhancements

1. SMS integration for notifications
2. Email notifications
3. File upload handling
4. Advanced search with Elasticsearch
5. Real-time notifications (WebSockets)
6. Mobile app integration
7. Advanced analytics
8. ML-based grievance categorization
9. OCR for document processing
10. Integration with government systems

## Support

For issues or questions, please contact the development team.
