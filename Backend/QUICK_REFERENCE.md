# CRM API - Quick Reference Guide

## Getting Started

### 1. Start the API

**Option A: Using Run Script (Windows)**
```bash
cd Backend
run.bat
```

**Option B: Using Run Script (macOS/Linux)**
```bash
cd Backend
chmod +x run.sh
./run.sh
```

**Option C: Manual (All Platforms)**
```bash
cd Backend/src
python main.py
```

API will be available at: `http://localhost:8000`

### 2. Initialize Test Data (Optional)
```bash
cd Backend/src
python initialize_data.py
```

Test Credentials:
- Admin: admin@crm.com / admin@123
- Manager: manager@crm.com / manager@123
- Officer: officer@crm.com / officer@123
- Citizen: citizen@crm.com / citizen@123

## Authentication

### Get Access Token
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.com",
    "password": "admin@123"
  }'

# Response includes accessToken - use in Authorization header
```

### Using Token in Requests
```bash
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <your-token>"
```

## Common API Operations

### Create Grievance
```bash
POST /api/grievances/
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": "category-id",
  "description": "Potholes on Main Street",
  "address": "Main Street, Bangalore",
  "priority": "HIGH"
}
```

### Get Grievances
```bash
# All grievances
GET /api/grievances/?page=1&per_page=10

# Filter by status
GET /api/grievances/?page=1&status=NEW

# Filter by priority
GET /api/grievances/?page=1&priority=HIGH

# Filter by status and priority
GET /api/grievances/?page=1&status=NEW&priority=CRITICAL
```

### Update Grievance Status
```bash
PUT /api/grievances/{grievance-id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ASSIGNED"
}
```

### Assign Grievance to Officer
```bash
POST /api/grievances/{grievance-id}/assign/{officer-id}
Authorization: Bearer <token>
```

### Add Grievance Feedback
```bash
POST /api/grievances/{grievance-id}/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comments": "Issue was resolved promptly"
}
```

### Get Grievance Details
```bash
GET /api/grievances/{grievance-id}
Authorization: Bearer <token>
```

## Alert Management

### Create Alert
```bash
POST /api/alerts/
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertType": "EMERGENCY",
  "priority": "CRITICAL",
  "description": "Fire in building",
  "location": {
    "coordinates": [77.59, 12.97]
  }
}
```

### Get Alerts
```bash
GET /api/alerts/?page=1&priority=CRITICAL
Authorization: Bearer <token>
```

### Assign Alert
```bash
POST /api/alerts/{alert-id}/assign/{officer-id}
Authorization: Bearer <token>
```

## Event Management

### Create Event
```bash
POST /api/events/
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventName": "Town Hall Meeting",
  "description": "Monthly citizen engagement",
  "eventType": "Meeting",
  "venue": "City Hall",
  "eventDate": "2024-07-15T10:00:00Z",
  "capacity": 100,
  "qrEnabled": true
}
```

### Publish Event
```bash
POST /api/events/{event-id}/publish
Authorization: Bearer <token>
```

### Register for Event
```bash
POST /api/events/{event-id}/register
Authorization: Bearer <token>
```

### Get Event Registrations
```bash
GET /api/events/{event-id}/registrations
Authorization: Bearer <token>
```

## Task Management

### Create Task
```bash
POST /api/tasks/
Authorization: Bearer <token>
Content-Type: application/json

{
  "grievanceId": "grievance-id",
  "assignedTo": "officer-id",
  "priority": "HIGH",
  "dueDate": "2024-07-20T17:00:00Z"
}
```

### Get Officer's Tasks
```bash
GET /api/tasks/officer/{officer-id}
Authorization: Bearer <token>
```

### Create Field Report
```bash
POST /api/tasks/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "task-id",
  "reportText": "Issue inspected and documented",
  "gpsLocation": {
    "coordinates": [77.59, 12.97]
  }
}
```

## Notifications

### Get User Notifications
```bash
GET /api/notifications/?page=1
Authorization: Bearer <token>
```

### Get Unread Notifications
```bash
GET /api/notifications/unread
Authorization: Bearer <token>
```

### Mark as Read
```bash
PUT /api/notifications/{notification-id}/read
Authorization: Bearer <token>
```

### Mark All as Read
```bash
POST /api/notifications/mark-all-read
Authorization: Bearer <token>
```

## Analytics

### Get Grievance Statistics
```bash
GET /api/analytics/grievances
Authorization: Bearer <token>

# Returns: count by status, count by priority
```

### Get Alert Statistics
```bash
GET /api/analytics/alerts
Authorization: Bearer <token>
```

### Get User Statistics
```bash
GET /api/analytics/users
Authorization: Bearer <token>

# Returns: count by role
```

### Get Resolution Time Stats
```bash
GET /api/analytics/resolution-time
Authorization: Bearer <token>

# Returns: average, min, max resolution times
```

### Get All Dashboard Metrics
```bash
GET /api/analytics/dashboard
Authorization: Bearer <token>

# Returns: all statistics and metrics
```

## Dashboards

### Get Admin Dashboard
```bash
GET /api/dashboard/admin
Authorization: Bearer <token>

# Returns: all system metrics and overview
```

### Get Officer Dashboard
```bash
GET /api/dashboard/officer
Authorization: Bearer <token>

# Returns: pending tasks, assigned grievances, alerts
```

### Get Citizen Dashboard
```bash
GET /api/dashboard/citizen
Authorization: Bearer <token>

# Returns: grievance summary, notifications, registered events
```

## User Management

### Get User Details
```bash
GET /api/users/{user-id}
Authorization: Bearer <token>
```

### Update User
```bash
PUT /api/users/{user-id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "status": "ACTIVE"
}
```

### List Users (Paginated)
```bash
GET /api/users/?page=1&per_page=10&role=CITIZEN
Authorization: Bearer <token>
```

### Delete User
```bash
DELETE /api/users/{user-id}
Authorization: Bearer <token>
```

## Constituencies & Wards

### Create Constituency
```bash
POST /api/users/constituencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "constituencyCode": "BNG001",
  "name": "Bangalore South",
  "district": "Bangalore",
  "state": "Karnataka"
}
```

### Get Constituencies
```bash
GET /api/users/constituencies
Authorization: Bearer <token>
```

### Search Constituencies
```bash
GET /api/users/constituencies/search/{query}
Authorization: Bearer <token>
```

### Create Ward
```bash
POST /api/users/wards
Authorization: Bearer <token>
Content-Type: application/json

{
  "wardNumber": "1",
  "wardName": "Ward 1",
  "constituencyId": "constituency-id"
}
```

### Get Wards
```bash
GET /api/users/constituencies/{constituency-id}/wards
Authorization: Bearer <token>
```

## Grievance Categories

### Create Category
```bash
POST /api/grievances/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryName": "Pothole",
  "description": "Road potholes and damage"
}
```

### Get All Categories
```bash
GET /api/grievances/categories
Authorization: Bearer <token>
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 500 | Server Error |

## Error Response Format

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

## Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "...",
    "field": "value"
  },
  "statusCode": 200
}
```

## Pagination

All list endpoints support pagination:

```bash
GET /api/grievances/?page=1&per_page=20

# Parameters:
# - page: Page number (default: 1)
# - per_page: Items per page (default: 10, max: 100)
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "page": 1,
    "per_page": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Filtering

Many list endpoints support filtering:

```bash
# By status
GET /api/grievances/?status=NEW

# By priority
GET /api/grievances/?priority=HIGH

# By date range
GET /api/grievances/?startDate=2024-01-01&endDate=2024-12-31

# Multiple filters
GET /api/grievances/?status=NEW&priority=HIGH&page=1
```

## Using Swagger UI

**Recommended**: Use Swagger UI for interactive API testing

```
http://localhost:8000/api/docs
```

Features:
- Try out any endpoint
- Auto-fill required fields
- View response format
- See error codes
- Download curl command

## Tips & Tricks

### 1. Get Token from Login Response
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "tokenType": "bearer",
  "user": {...}
}
```

Copy `accessToken` and use in Authorization header

### 2. Export Token to Environment Variable
```bash
TOKEN="your-token-here"

# Use in requests
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create Scripts for Common Operations
Save as `test.sh`:
```bash
#!/bin/bash
TOKEN="your-token"

# Get all grievances
curl http://localhost:8000/api/grievances/ \
  -H "Authorization: Bearer $TOKEN"
```

### 4. View MongoDB Collections
```bash
# Connect to MongoDB
mongosh

# In MongoDB shell
use crm_database
db.grievances.find().limit(5)
db.users.find()
db.alerts.find()
```

## Troubleshooting

### 401 Unauthorized
- Missing Authorization header
- Invalid or expired token
- Token format incorrect (should be: Bearer {token})

### 403 Forbidden
- User role doesn't have permission
- Check role-based access requirements

### 404 Not Found
- Resource doesn't exist
- Check the ID parameter

### 409 Conflict
- Duplicate entry (e.g., duplicate email)
- Resource already exists

### 500 Server Error
- Check application logs
- Verify MongoDB connection
- Restart application

## Performance Tips

1. **Use Pagination**: Always paginate large datasets
2. **Filter Data**: Use filters to reduce data returned
3. **Use Indexes**: Queries use indexed fields
4. **Limit Fields**: Only request needed fields
5. **Cache Results**: Cache frequently accessed data

## Security Reminders

1. Never share access tokens
2. Use HTTPS in production
3. Change JWT_SECRET_KEY in .env
4. Don't expose MongoDB credentials
5. Use strong passwords
6. Regular security audits

## API Documentation

For complete API documentation:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/docs
- File: API_DOCUMENTATION.md
- Database Schema: DATABASE_DESIGN.md

## Support

- Check logs for errors
- Review documentation files
- Test endpoints in Swagger UI
- Monitor MongoDB operations
