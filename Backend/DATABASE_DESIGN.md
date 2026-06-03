# MongoDB Database Design Documentation

## Overview
This document outlines the MongoDB database schema for the CRM Grievance Management System.

## Design Principles

1. **Embedded Documents**: Related data is embedded to reduce joins
2. **Soft Deletes**: Records are never physically deleted (government records)
3. **Audit Fields**: All documents have creation/update tracking
4. **Indexes**: Strategic indexes for performance
5. **Geospatial**: Support for location-based queries

## Collections

### 1. users
**Purpose**: Store user information with role-based access

```json
{
  "_id": ObjectId,
  "fullName": String,
  "mobile": String,
  "email": String,
  "passwordHash": String,
  "role": String,  // CITIZEN, REPRESENTATIVE, MANAGER, FIELD_OFFICER, VOLUNTEER, ADMIN
  "constituencyId": ObjectId,
  "wardId": ObjectId,
  "boothNumber": String,
  "address": String,
  "profileImage": String,
  "status": String,  // ACTIVE, INACTIVE, SUSPENDED
  "lastLoginAt": Date,
  "createdAt": Date,
  "updatedAt": Date,
  "createdBy": ObjectId,
  "updatedBy": ObjectId,
  "isDeleted": Boolean,
  "deletedAt": Date
}
```

**Indexes**:
- `mobile` (unique, sparse)
- `email` (unique, sparse)
- `role`
- `constituencyId`
- `wardId`
- `isDeleted`

---

### 2. constituencies
**Purpose**: Geographic administrative divisions

```json
{
  "_id": ObjectId,
  "constituencyCode": String,
  "name": String,
  "district": String,
  "state": String,
  "representativeId": ObjectId,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes**:
- `constituencyCode` (unique)
- `name`
- `district`

---

### 3. wards
**Purpose**: Sub-divisions within constituencies

```json
{
  "_id": ObjectId,
  "wardNumber": String,
  "wardName": String,
  "constituencyId": ObjectId,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes**:
- `constituencyId`
- `wardNumber`

---

### 4. grievance_categories
**Purpose**: Grievance classification

```json
{
  "_id": ObjectId,
  "categoryName": String,
  "description": String,
  "isActive": Boolean
}
```

---

### 5. grievances
**Purpose**: Core grievance/complaint records

```json
{
  "_id": ObjectId,
  "complaintNumber": String,  // Unique identifier
  "citizenId": ObjectId,
  "categoryId": ObjectId,
  "description": String,
  "address": String,
  "wardId": ObjectId,
  "constituencyId": ObjectId,
  "gpsLocation": {
    "type": "Point",
    "coordinates": [longitude, latitude]  // GeoJSON format
  },
  "priority": String,  // LOW, MEDIUM, HIGH, CRITICAL
  "status": String,    // NEW, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED, REJECTED
  "escalationLevel": Integer,
  "assignedOfficerId": ObjectId,
  "attachments": [
    {
      "fileName": String,
      "fileUrl": String,
      "uploadedAt": Date
    }
  ],
  "history": [
    {
      "oldStatus": String,
      "newStatus": String,
      "remarks": String,
      "updatedBy": ObjectId,
      "createdAt": Date
    }
  ],
  "feedback": {
    "rating": Number,      // 1-5
    "comments": String,
    "submittedAt": Date
  },
  "aiAnalysis": {
    "predictedCategory": String,
    "urgencyScore": Float,  // 0-1
    "sentimentScore": Float,  // -1 to 1
    "analyzedAt": Date
  },
  "createdAt": Date,
  "updatedAt": Date,
  "createdBy": ObjectId,
  "updatedBy": ObjectId,
  "isDeleted": Boolean,
  "deletedAt": Date
}
```

**Indexes**:
- `complaintNumber` (unique)
- `citizenId`
- `status`
- `categoryId`
- `assignedOfficerId`
- `constituencyId`
- `gpsLocation` (2dsphere)
- `isDeleted`

**Design Notes**:
- History is embedded for better query performance
- Feedback is embedded (one per grievance)
- Supports embedded AI analysis data

---

### 6. alerts
**Purpose**: Emergency and incident alerts

```json
{
  "_id": ObjectId,
  "alertNumber": String,
  "citizenId": ObjectId,
  "alertType": String,  // EMERGENCY, SECURITY, HEALTH, INFRASTRUCTURE, POLLUTION, OTHER
  "priority": String,   // LOW, MEDIUM, HIGH, CRITICAL
  "description": String,
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "mediaAttachments": [String],  // URLs
  "assignedTo": ObjectId,
  "status": String,     // OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes**:
- `alertNumber` (unique)
- `priority`
- `citizenId`
- `location` (2dsphere)

---

### 7. events
**Purpose**: Public events and activities

```json
{
  "_id": ObjectId,
  "eventName": String,
  "description": String,
  "eventType": String,
  "venue": String,
  "eventDate": Date,
  "organizerId": ObjectId,
  "capacity": Number,
  "qrEnabled": Boolean,
  "registrationCount": Number,
  "status": String,    // DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes**:
- `eventDate`
- `organizerId`

---

### 8. event_registrations
**Purpose**: Citizen registrations for events

```json
{
  "_id": ObjectId,
  "eventId": ObjectId,
  "citizenId": ObjectId,
  "qrCode": String,
  "attendanceStatus": String,  // REGISTERED, ATTENDED, NO_SHOW
  "registeredAt": Date
}
```

**Indexes**:
- `eventId` + `citizenId` (unique)
- `eventId`
- `citizenId`

---

### 9. campaigns
**Purpose**: Communication campaigns

```json
{
  "_id": ObjectId,
  "campaignName": String,
  "description": String,
  "audienceFilter": Object,   // Query criteria for audience
  "scheduledDate": Date,
  "createdBy": ObjectId,
  "status": String,   // DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED
  "createdAt": Date
}
```

---

### 10. communications
**Purpose**: Individual communication records

```json
{
  "_id": ObjectId,
  "campaignId": ObjectId,
  "citizenId": ObjectId,
  "channel": String,   // SMS, EMAIL, PUSH, etc.
  "message": String,
  "deliveryStatus": String,  // PENDING, SENT, DELIVERED, FAILED
  "deliveredAt": Date,
  "readAt": Date,
  "clickedAt": Date,
  "createdAt": Date
}
```

---

### 11. tasks
**Purpose**: Work assignments for officers

```json
{
  "_id": ObjectId,
  "grievanceId": ObjectId,
  "assignedBy": ObjectId,
  "assignedTo": ObjectId,
  "priority": String,  // LOW, MEDIUM, HIGH, CRITICAL
  "dueDate": Date,
  "status": String,    // PENDING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
  "remarks": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Indexes**:
- `grievanceId`
- `assignedTo`
- `status`
- `dueDate`

---

### 12. field_reports
**Purpose**: Reports submitted by field officers

```json
{
  "_id": ObjectId,
  "taskId": ObjectId,
  "officerId": ObjectId,
  "reportText": String,
  "photos": [String],  // URLs
  "gpsLocation": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "submittedAt": Date
}
```

**Indexes**:
- `taskId`
- `officerId`
- `gpsLocation` (2dsphere)

---

### 13. surveys
**Purpose**: Public surveys

```json
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "questions": [Object],  // Array of question objects
  "createdBy": ObjectId,
  "status": String,    // DRAFT, PUBLISHED, CLOSED
  "createdAt": Date
}
```

---

### 14. survey_responses
**Purpose**: Survey responses from citizens

```json
{
  "_id": ObjectId,
  "surveyId": ObjectId,
  "citizenId": ObjectId,
  "answers": [Object],  // Array of answer objects
  "submittedAt": Date
}
```

**Indexes**:
- `surveyId` + `citizenId` (unique)

---

### 15. notifications
**Purpose**: User notifications

```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "title": String,
  "body": String,
  "type": String,      // GRIEVANCE, ALERT, TASK, EVENT, SYSTEM
  "isRead": Boolean,
  "createdAt": Date
}
```

**Indexes**:
- `userId`
- `createdAt` (descending)

---

### 16. audit_logs
**Purpose**: System audit trail

```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "module": String,    // GRIEVANCE, USER, ALERT, etc.
  "action": String,    // CREATE, UPDATE, DELETE, etc.
  "oldData": Object,
  "newData": Object,
  "ipAddress": String,
  "createdAt": Date
}
```

**Indexes**:
- `userId`
- `createdAt` (descending)
- `module`

---

## Data Modeling Decisions

### Embedded vs Referenced

1. **Embedded** (Better for reads):
   - Grievance history
   - Grievance feedback
   - AI analysis data
   - Event attachments

2. **Referenced** (Better for updates):
   - Officer assignments
   - Citizen references
   - Category references

### Soft Delete Implementation

Every major collection has:
```javascript
{
  "isDeleted": false,
  "deletedAt": null  // Populated on deletion
}
```

### Audit Trail

Every document has:
```javascript
{
  "createdBy": ObjectId,
  "updatedBy": ObjectId,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Geospatial Queries

Two locations support geospatial queries:

1. **Grievances**: `gpsLocation` - Grievance location
2. **Alerts**: `location` - Alert location
3. **Field Reports**: `gpsLocation` - Officer's field location

GeoJSON format:
```javascript
{
  "type": "Point",
  "coordinates": [longitude, latitude]  // [77.59, 12.97] for Bangalore
}
```

## Indexing Strategy

**High-value indexes**:
- Foreign key references
- Filter criteria (status, priority)
- Search fields (email, mobile)
- Soft delete flag
- Geospatial indexes
- Sort fields (createdAt, updatedAt)

## Query Patterns

### Find grievances by status
```javascript
db.grievances.find({ status: "NEW", isDeleted: false })
```

### Find nearby grievances
```javascript
db.grievances.find({
  gpsLocation: {
    $near: {
      $geometry: { type: "Point", coordinates: [77.59, 12.97] },
      $maxDistance: 5000  // 5km
    }
  }
})
```

### Get grievance workflow history
```javascript
db.grievances.findOne({ _id: ObjectId(...) }, { history: 1 })
```

### Aggregation for statistics
```javascript
db.grievances.aggregate([
  { $match: { isDeleted: false } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Performance Considerations

1. **Document Size**: Max 16MB (well within limits)
2. **Array Limits**: History arrays may grow - consider archival strategy
3. **Index Size**: Indexes take memory - monitor index usage
4. **Query Optimization**: Use indexes for filters and sorts
5. **Sharding**: Can be added later if needed

## Backup Strategy

1. Regular MongoDB backups
2. Point-in-time recovery
3. Test restore procedures
4. Off-site backup storage

## Security

1. MongoDB authentication required
2. Role-based access control (RBAC)
3. Encryption at rest
4. Encryption in transit (TLS)
5. Audit logging for all operations
6. Regular security updates
