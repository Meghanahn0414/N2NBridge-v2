# CRM System - Quick Start & Complete API Guide

## 📚 Documentation Files Created

### 1. **API_TESTING_GUIDE.md** (You Are Here)
Complete API documentation with sample data for every endpoint

### 2. **test_api_workflow.py** 
Python script that demonstrates the complete workflow end-to-end

### 3. **CRM_API_Collection.json**
Postman collection for easy API testing in Postman

---

## 🚀 How to Use

### Option 1: Run Python Test Script

```bash
# Make sure backend is running
cd d:\CRM-01\Backend

# Install requests library if needed
pip install requests

# Run the test script
python test_api_workflow.py
```

**Output:** Complete workflow with all API calls and responses

---

### Option 2: Use Postman

1. **Import Collection**
   - Open Postman
   - Click `Import` → Select `CRM_API_Collection.json`

2. **Set Variables**
   - Click on collection → Variables tab
   - Update `base_url` = `http://localhost:8000`

3. **Test Each Endpoint**
   - Each request has sample data pre-filled
   - Fill in {{variable}} placeholders after creating users

---

### Option 3: Manual Testing with cURL

```bash
# 1. Register Citizen
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Rajesh Kumar",
    "mobile": "9876543210",
    "email": "rajesh@example.com",
    "password": "CitizenPass123@",
    "role": "CITIZEN"
  }'

# Copy the accessToken from response

# 2. Create Grievance
curl -X POST http://localhost:8000/api/grievances/ \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "USER_ID",
    "categoryId": "CATEGORY_ID",
    "description": "Large pothole on Main Street",
    "address": "123 Main Street, City",
    "priority": "HIGH"
  }'
```

---

## 📋 Complete Workflow Explained

### **Stage 1: Setup** (First Time)

```
1. Register Admin/Manager
   ↓
2. Create Constituency
   ↓
3. Create Grievance Categories
   ↓
4. Register Citizen Users
   ↓
5. Register Field Officers
   ↓
✅ System Ready
```

### **Stage 2: Grievance Lifecycle** (Citizen Submits Issue)

```
Step 1: CITIZEN CREATES GRIEVANCE
  POST /api/grievances/
  - Status: NEW
  - Example: Pothole on Main Street

       ↓

Step 2: CITIZEN UPLOADS DOCUMENT/PHOTO
  POST /api/grievances/{grievance_id}/upload
  - File: Photo or PDF document

       ↓

Step 3: MANAGER REVIEWS & ASSIGNS
  POST /api/grievances/{grievance_id}/assign/{officer_id}
  - Grievance assigned to Field Officer

       ↓

Step 4: OFFICER STARTS WORK
  PUT /api/grievances/{grievance_id}
  - Status: IN_PROGRESS
  - Remarks: "Repair work started"

       ↓

Step 5: OFFICER COMPLETES WORK
  PUT /api/grievances/{grievance_id}
  - Status: RESOLVED
  - Remarks: "Work completed successfully"

       ↓

Step 6: CITIZEN PROVIDES FEEDBACK
  POST /api/grievances/{grievance_id}/feedback
  - Rating: 1-5 stars
  - Comments: Satisfaction feedback

       ↓

✅ CASE CLOSED
   Status: CLOSED
   All history & feedback saved
```

---

### **Stage 3: Alert Management** (Emergency)

```
Step 1: CITIZEN CREATES ALERT
  POST /api/alerts/
  - Type: EMERGENCY, HEALTH, etc.
  - Priority: CRITICAL, HIGH, etc.

       ↓

Step 2: UPLOAD EVIDENCE/MEDIA
  POST /api/alerts/{alert_id}/upload-media
  - Image/Video of incident

       ↓

Step 3: MANAGER ASSIGNS TO OFFICER
  POST /api/alerts/{alert_id}/assign/{officer_id}

       ↓

Step 4: OFFICER RESPONDS
  PUT /api/alerts/{alert_id}
  - Status: ACKNOWLEDGED → IN_PROGRESS → RESOLVED

       ↓

✅ ALERT RESOLVED
```

---

### **Stage 4: Events** (Representative)

```
Step 1: REPRESENTATIVE CREATES EVENT
  POST /api/events/
  - Title, Date, Location
  - Expected Attendees

       ↓

Step 2: CITIZENS REGISTER
  POST /api/events/{event_id}/register
  - Number of tickets needed

       ↓

Step 3: AUTO-GENERATE QR CODE
  - QR code for attendance tracking

       ↓

✅ EVENT MANAGEMENT COMPLETE
```

---

## 🔐 Authorization

### Role-Based Access

| Role | Can Do |
|------|--------|
| **CITIZEN** | Create grievances, Create alerts, Register events, Provide feedback |
| **FIELD_OFFICER** | Update grievance status, Create field reports, Respond to alerts |
| **MANAGER** | Assign grievances, Create tasks, View analytics, Approve actions |
| **REPRESENTATIVE** | Create events, Manage campaigns, Organize programs |
| **ADMIN** | Full system access, Manage users, System configuration |

### Authentication Header

All requests (except login/register) need:
```
Authorization: Bearer <your_access_token>
```

---

## 📊 Data Models

### User
```json
{
  "fullName": "String",
  "mobile": "String (10-15 digits)",
  "email": "String (unique)",
  "role": "CITIZEN|MANAGER|FIELD_OFFICER|REPRESENTATIVE|ADMIN",
  "constituencyId": "String (optional)",
  "wardId": "String (optional)",
  "profileImage": "String (URL to uploaded image)"
}
```

### Grievance
```json
{
  "citizenId": "String",
  "categoryId": "String",
  "description": "String",
  "address": "String",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "status": "NEW|ASSIGNED|IN_PROGRESS|RESOLVED|CLOSED",
  "attachments": [{"fileName": "String", "fileUrl": "String"}],
  "history": [{"oldStatus": "String", "newStatus": "String", "updatedBy": "String"}],
  "feedback": {"rating": "1-5", "comments": "String"}
}
```

### Alert
```json
{
  "citizenId": "String",
  "alertType": "EMERGENCY|SECURITY|HEALTH|INFRASTRUCTURE",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "description": "String",
  "location": {"type": "Point", "coordinates": [lat, lon]},
  "mediaAttachments": ["String (URLs)"],
  "status": "OPEN|ACKNOWLEDGED|IN_PROGRESS|RESOLVED"
}
```

### Event
```json
{
  "organizerId": "String",
  "title": "String",
  "description": "String",
  "eventDate": "ISO 8601 DateTime",
  "location": "String",
  "eventType": "AWARENESS|TRAINING|CAMPAIGN",
  "expectedAttendees": "Number"
}
```

---

## 🔍 Query Examples

### List with Filters

```bash
# Get open grievances with HIGH priority
GET /api/grievances?page=1&per_page=10&status=NEW&priority=HIGH

# Get critical alerts
GET /api/alerts?page=1&per_page=10&priority=CRITICAL

# Get events within date range
GET /api/events?page=1&per_page=10&from_date=2026-06-01&to_date=2026-06-30
```

---

## 📁 File Upload

### Allowed Types
- **Documents**: pdf, doc, docx
- **Images**: jpg, jpeg, png
- **Maximum Size**: 10 MB

### Upload Examples

```bash
# Upload Grievance Document
curl -X POST http://localhost:8000/api/grievances/{id}/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/document.pdf"

# Upload User Profile Photo
curl -X POST http://localhost:8000/api/users/{id}/upload-profile-photo \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/photo.jpg"

# Upload Alert Media
curl -X POST http://localhost:8000/api/alerts/{id}/upload-media \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/image.png"
```

### Access Uploaded Files
```
http://localhost:8000/uploads/{filename}
```

---

## 📊 Dashboard & Analytics

### Get System Stats
```bash
GET /api/dashboard/stats
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

---

## 🐛 Error Handling

### Common Errors

| Code | Error | Solution |
|------|-------|----------|
| 401 | Unauthorized | Check Authorization header and token |
| 400 | Bad Request | Validate JSON payload and field values |
| 404 | Not Found | Check resource ID exists |
| 422 | Validation Error | Check field types and required fields |
| 500 | Server Error | Check backend logs |

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## ✅ Testing Checklist

- [ ] Backend running on http://localhost:8000
- [ ] MongoDB connected to crm_database
- [ ] Register test users (Citizen, Manager, Officer, Representative)
- [ ] Create constituency and category
- [ ] Create grievance from citizen
- [ ] Upload document to grievance
- [ ] Assign grievance to officer
- [ ] Update grievance status through workflow
- [ ] Add feedback
- [ ] Create alert
- [ ] Create event
- [ ] Check dashboard stats
- [ ] Verify uploaded files accessible at /uploads

---

## 🔗 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/users/{id} | Get user profile |
| POST | /api/grievances/ | Create grievance |
| POST | /api/grievances/{id}/upload | Upload grievance doc |
| POST | /api/grievances/{id}/assign/{officer} | Assign grievance |
| PUT | /api/grievances/{id} | Update grievance status |
| POST | /api/grievances/{id}/feedback | Add feedback |
| POST | /api/alerts/ | Create alert |
| POST | /api/alerts/{id}/upload-media | Upload alert media |
| POST | /api/events/ | Create event |
| POST | /api/events/{id}/register | Register for event |
| GET | /api/dashboard/stats | Get system stats |

---

## 📞 Support

### Logs Location
```
Backend Logs: Console output
Uploaded Files: Backend/uploads/
Database: MongoDB (localhost:27017)
```

### API Documentation
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/docs

---

## 🎯 Next Steps

1. ✅ Backend running
2. ✅ File uploads configured
3. 👉 **Test APIs** (Use one of 3 methods above)
4. 👉 **Set up Frontend** (React/Vue)
5. 👉 **Deploy to Production**

Happy testing! 🚀
