# CRM API Testing Guide - Complete Workflow with Sample Data

## Base URL
```
http://localhost:8000
```

---

## 1. AUTHENTICATION - Get Access Token

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Citizen",
  "mobile": "9876543210",
  "email": "citizen@example.com",
  "password": "SecurePass123@",
  "role": "CITIZEN",
  "address": "123 Main Street, City"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Citizen",
    "mobile": "9876543210",
    "email": "citizen@example.com",
    "role": "CITIZEN",
    "status": "ACTIVE",
    "createdAt": "2026-06-04T10:00:00"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "citizen@example.com",
  "password": "SecurePass123@"
}
```

**Use this token in all requests:**
```
Authorization: Bearer <your_access_token>
```

---

## 2. USERS - Create and Manage Users

### Create Different User Types

**Create Manager**
```bash
POST /api/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Rajesh Manager",
  "mobile": "9876543211",
  "email": "manager@example.com",
  "password": "ManagerPass123@",
  "role": "MANAGER",
  "constituencyId": "507f1f77bcf86cd799439012",
  "address": "Manager Office, City"
}
```

**Create Field Officer**
```bash
POST /api/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Priya Field Officer",
  "mobile": "9876543212",
  "email": "officer@example.com",
  "password": "OfficerPass123@",
  "role": "FIELD_OFFICER",
  "constituencyId": "507f1f77bcf86cd799439012",
  "wardId": "507f1f77bcf86cd799439013",
  "address": "Field Office, City"
}
```

**Create Representative**
```bash
POST /api/users/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Amit Representative",
  "mobile": "9876543213",
  "email": "representative@example.com",
  "password": "RepPass123@",
  "role": "REPRESENTATIVE",
  "constituencyId": "507f1f77bcf86cd799439012",
  "address": "Assembly Office, City"
}
```

### Get User Profile
```bash
GET /api/users/{user_id}
Authorization: Bearer <token>
```

### Update User Profile
```bash
PUT /api/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Updated Name",
  "address": "456 New Street, City",
  "mobile": "9876543220"
}
```

### Upload Profile Photo
```bash
POST /api/users/{user_id}/upload-profile-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <select photo.jpg>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "data": {
    "profileImage": "uploads/a1b2c3d4-e5f6-g7h8-i9j0.jpg"
  }
}
```

---

## 3. CONSTITUENCIES & WARDS

### Create Constituency
```bash
POST /api/users/constituencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "constituencyCode": "CONS-001",
  "name": "Central District",
  "district": "Metropolitan",
  "state": "State Name",
  "representativeId": "507f1f77bcf86cd799439014"
}
```

### Get All Constituencies
```bash
GET /api/users/constituencies
Authorization: Bearer <token>
```

### Create Ward
```bash
POST /api/users/wards
Authorization: Bearer <token>
Content-Type: application/json

{
  "constituencyId": "507f1f77bcf86cd799439012",
  "wardNumber": "101",
  "name": "Ward 101 - Downtown",
  "address": "Downtown Area"
}
```

### Get Wards by Constituency
```bash
GET /api/users/constituencies/{constituency_id}/wards
Authorization: Bearer <token>
```

---

## 4. GRIEVANCES - Complete Workflow

### Create Grievance Category
```bash
POST /api/grievances/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Road Infrastructure",
  "description": "Issues related to roads, potholes, and street maintenance",
  "icon": "🛣️"
}
```

### List Categories
```bash
GET /api/grievances/categories
Authorization: Bearer <token>
```

### Create Grievance
```bash
POST /api/grievances/
Authorization: Bearer <token>
Content-Type: application/json

{
  "citizenId": "507f1f77bcf86cd799439011",
  "categoryId": "507f1f77bcf86cd799439015",
  "description": "Large pothole on Main Street affecting traffic",
  "address": "123 Main Street, Downtown Area",
  "wardId": "507f1f77bcf86cd799439013",
  "constituencyId": "507f1f77bcf86cd799439012",
  "priority": "HIGH",
  "gpsLocation": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  }
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439016",
  "complaintNumber": "GRV-2026-000001",
  "citizenId": "507f1f77bcf86cd799439011",
  "categoryId": "507f1f77bcf86cd799439015",
  "description": "Large pothole on Main Street affecting traffic",
  "address": "123 Main Street, Downtown Area",
  "status": "NEW",
  "priority": "HIGH",
  "escalationLevel": 0,
  "attachments": [],
  "history": [],
  "createdAt": "2026-06-04T10:30:00"
}
```

### Upload Document to Grievance
```bash
POST /api/grievances/{grievance_id}/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <select document.pdf or photo.jpg>
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "damage_photo.jpg",
    "fileUrl": "uploads/a1b2c3d4-e5f6-g7h8-i9j0.jpg"
  }
}
```

### Get Single Grievance
```bash
GET /api/grievances/{grievance_id}
Authorization: Bearer <token>
```

### List Grievances (with filters)
```bash
GET /api/grievances?page=1&per_page=10&status=NEW&priority=HIGH
Authorization: Bearer <token>
```

### Assign Grievance to Officer
```bash
POST /api/grievances/{grievance_id}/assign/{officer_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Grievance assigned successfully"
}
```

### Update Grievance Status
```bash
PUT /api/grievances/{grievance_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "remarks": "Started fixing the pothole"
}
```

### Add Feedback to Grievance
```bash
POST /api/grievances/{grievance_id}/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comments": "Work done satisfactorily, but took longer than expected"
}
```

### Get Citizen Grievances
```bash
GET /api/grievances/citizen/{citizen_id}?page=1
Authorization: Bearer <token>
```

---

## 5. ALERTS - Emergency Management

### Create Alert
```bash
POST /api/alerts/
Authorization: Bearer <token>
Content-Type: application/json

{
  "citizenId": "507f1f77bcf86cd799439011",
  "alertType": "EMERGENCY",
  "priority": "CRITICAL",
  "description": "Accident near Main Street intersection",
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  },
  "mediaAttachments": []
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439017",
  "alertNumber": "ALT-2026-000001",
  "citizenId": "507f1f77bcf86cd799439011",
  "alertType": "EMERGENCY",
  "priority": "CRITICAL",
  "description": "Accident near Main Street intersection",
  "status": "OPEN",
  "mediaAttachments": [],
  "createdAt": "2026-06-04T11:00:00"
}
```

### Upload Media to Alert
```bash
POST /api/alerts/{alert_id}/upload-media
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <select image.png or video.mp4>
```

### Get Alert
```bash
GET /api/alerts/{alert_id}
Authorization: Bearer <token>
```

### List Alerts
```bash
GET /api/alerts?page=1&per_page=10&status=OPEN&priority=CRITICAL
Authorization: Bearer <token>
```

### Update Alert Status
```bash
PUT /api/alerts/{alert_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

### Assign Alert to Officer
```bash
POST /api/alerts/{alert_id}/assign/{officer_id}
Authorization: Bearer <token>
```

---

## 6. EVENTS - Event Management

### Create Event
```bash
POST /api/events/
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizerId": "507f1f77bcf86cd799439014",
  "title": "Citizens Awareness Program",
  "description": "Program to raise awareness on grievance filing",
  "eventDate": "2026-06-15T10:00:00",
  "location": "Community Center, Downtown",
  "eventType": "AWARENESS",
  "expectedAttendees": 100,
  "gpsLocation": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  }
}
```

### Register for Event
```bash
POST /api/events/{event_id}/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "citizenId": "507f1f77bcf86cd799439011",
  "numberOfTickets": 2
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439018",
  "eventId": "507f1f77bcf86cd799439019",
  "citizenId": "507f1f77bcf86cd799439011",
  "qrCode": "https://api.example.com/qr/507f1f77bcf86cd799439018",
  "status": "REGISTERED",
  "registrationDate": "2026-06-04T11:30:00"
}
```

### Get Event Details
```bash
GET /api/events/{event_id}
Authorization: Bearer <token>
```

### List Events
```bash
GET /api/events?page=1&per_page=10
Authorization: Bearer <token>
```

### Update Event
```bash
PUT /api/events/{event_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Citizens Awareness Program - Updated",
  "expectedAttendees": 150
}
```

---

## 7. TASKS - Task Management

### Create Task
```bash
POST /api/tasks/
Authorization: Bearer <token>
Content-Type: application/json

{
  "grievanceId": "507f1f77bcf86cd799439016",
  "title": "Repair Main Street Pothole",
  "description": "Fill pothole with asphalt and compact",
  "assignedTo": "507f1f77bcf86cd799439012",
  "priority": "HIGH",
  "dueDate": "2026-06-10T17:00:00"
}
```

### Get Task Details
```bash
GET /api/tasks/{task_id}
Authorization: Bearer <token>
```

### List Tasks
```bash
GET /api/tasks?page=1&assigned_to={officer_id}&status=PENDING
Authorization: Bearer <token>
```

### Update Task
```bash
PUT /api/tasks/{task_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED",
  "completionNotes": "Pothole repaired successfully"
}
```

---

## 8. NOTIFICATIONS

### Get User Notifications
```bash
GET /api/notifications/?page=1&per_page=10
Authorization: Bearer <token>
```

### Mark Notification as Read
```bash
PUT /api/notifications/{notification_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "isRead": true
}
```

---

## 9. DASHBOARD & ANALYTICS

### Get Dashboard Stats
```bash
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalGrievances": 45,
  "totalAlerts": 12,
  "totalEvents": 5,
  "grievancesByStatus": {
    "NEW": 8,
    "IN_PROGRESS": 15,
    "RESOLVED": 20,
    "CLOSED": 2
  },
  "alertsByPriority": {
    "CRITICAL": 3,
    "HIGH": 5,
    "MEDIUM": 4
  }
}
```

### Get Analytics
```bash
GET /api/analytics/grievances?from_date=2026-06-01&to_date=2026-06-30
Authorization: Bearer <token>
```

---

## Complete Workflow Example

### Step 1: Create Admin User
```bash
POST /api/auth/register
{
  "fullName": "Admin User",
  "mobile": "9000000000",
  "email": "admin@example.com",
  "password": "AdminPass123@",
  "role": "ADMIN"
}
```

### Step 2: Create Constituency
```bash
POST /api/users/constituencies
{
  "constituencyCode": "CONS-001",
  "name": "Central District",
  "district": "Metropolitan",
  "state": "State Name"
}
```

### Step 3: Create Citizen & Staff Users
```bash
# Citizen
POST /api/auth/register
{
  "fullName": "Rajesh Kumar",
  "mobile": "9876543210",
  "email": "rajesh@example.com",
  "password": "Pass123@",
  "role": "CITIZEN"
}

# Manager
POST /api/auth/register
{
  "fullName": "Manager Singh",
  "mobile": "9876543211",
  "email": "manager@example.com",
  "password": "Pass123@",
  "role": "MANAGER",
  "constituencyId": "CONS-001-ID"
}

# Field Officer
POST /api/auth/register
{
  "fullName": "Officer Priya",
  "mobile": "9876543212",
  "email": "officer@example.com",
  "password": "Pass123@",
  "role": "FIELD_OFFICER",
  "constituencyId": "CONS-001-ID"
}
```

### Step 4: Citizen Creates Grievance
```bash
POST /api/grievances/
Authorization: Bearer <citizen_token>
{
  "citizenId": "CITIZEN-ID",
  "categoryId": "CATEGORY-ID",
  "description": "Damaged road",
  "address": "Main Street",
  "priority": "HIGH"
}
```

### Step 5: Upload Grievance Document
```bash
POST /api/grievances/{grievance_id}/upload
Authorization: Bearer <citizen_token>
file: photo.jpg
```

### Step 6: Manager Assigns to Officer
```bash
POST /api/grievances/{grievance_id}/assign/{officer_id}
Authorization: Bearer <manager_token>
```

### Step 7: Officer Updates Status with Field Report
```bash
PUT /api/grievances/{grievance_id}
Authorization: Bearer <officer_token>
{
  "status": "IN_PROGRESS",
  "remarks": "Repair work started"
}
```

### Step 8: Citizen Provides Feedback
```bash
POST /api/grievances/{grievance_id}/feedback
Authorization: Bearer <citizen_token>
{
  "rating": 4,
  "comments": "Work completed satisfactorily"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 400 Bad Request
```json
{
  "detail": "Field validation error or business logic error"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Testing with cURL

```bash
# Get Token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@example.com",
    "password": "SecurePass123@"
  }'

# Create Grievance
curl -X POST http://localhost:8000/api/grievances/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "USER-ID",
    "categoryId": "CAT-ID",
    "description": "Issue description",
    "address": "Location",
    "priority": "HIGH"
  }'

# Upload File
curl -X POST http://localhost:8000/api/grievances/GRIEVANCE-ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

---

## Files Available at
- API Docs: http://localhost:8000/api/docs
- Uploaded Files: http://localhost:8000/uploads/
- ReDoc: http://localhost:8000/docs
