# 📚 Complete CRM API Testing Documentation Package

## What Has Been Created

### ✅ 1. API_TESTING_GUIDE.md
**Location**: `d:\CRM-01\Backend\API_TESTING_GUIDE.md`

Complete documentation covering:
- All 50+ API endpoints
- Sample data for every request
- Expected response formats
- Complete workflow examples
- Error codes and solutions
- cURL examples
- File upload instructions

**Use This For**: Reference, understanding endpoints, sample data

---

### ✅ 2. test_api_workflow.py
**Location**: `d:\CRM-01\Backend\test_api_workflow.py`

Automated Python script that:
- Registers 4 different user types automatically
- Creates constituency and categories
- Creates grievance from citizen perspective
- Updates through entire workflow
- Creates alerts and events
- Shows real-time responses
- Demonstrates complete system usage

**Use This For**: Quick testing, seeing everything work end-to-end

---

### ✅ 3. CRM_API_Collection.json
**Location**: `d:\CRM-01\Backend\CRM_API_Collection.json`

Postman collection with:
- 30+ pre-configured API requests
- Sample data in each request
- Variable placeholders for IDs
- Organized by feature (Auth, Users, Grievances, etc.)
- Ready-to-use without any configuration

**Use This For**: Manual testing in Postman, exploring endpoints

---

### ✅ 4. QUICK_START.md
**Location**: `d:\CRM-01\Backend\QUICK_START.md`

Quick reference guide with:
- How to use each testing method
- Complete workflow diagrams
- Role-based access control
- Data models
- Query examples
- Testing checklist

**Use This For**: Understanding the system, reference

---

## 🎯 Three Ways to Test

### Method 1: Python Script (EASIEST - No Configuration Needed)

```bash
cd d:\CRM-01\Backend
python test_api_workflow.py
```

**What It Does:**
```
✅ Registers Citizen, Manager, Officer, Representative
✅ Creates Constituency
✅ Creates Grievance Category
✅ Citizen creates grievance
✅ Gets grievance details
✅ Lists grievances
✅ Manager assigns to officer
✅ Officer updates status to IN_PROGRESS
✅ Officer marks RESOLVED
✅ Citizen adds feedback
✅ Creates emergency alert
✅ Gets alert, lists alerts
✅ Assigns alert to officer
✅ Updates alert status
✅ Creates event
✅ Gets event, lists events
✅ Registers for event
✅ Creates task
✅ Gets dashboard stats
```

**Output:** Console output showing all API responses with proper formatting

---

### Method 2: Postman (VISUAL - Easiest for Understanding)

**Steps:**
1. Open Postman
2. Click `Import` → Select `CRM_API_Collection.json`
3. In collection, set variables:
   - `base_url`: `http://localhost:8000`
4. Run any request
5. See response in Postman

**Advantages:**
- Visual interface
- Click to send requests
- See responses formatted
- Save requests
- Easy to modify data and test

---

### Method 3: cURL (COMMAND LINE - For Scripts/Automation)

**Example:**
```bash
# Register User
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Rajesh Kumar",
    "mobile": "9876543210",
    "email": "rajesh@example.com",
    "password": "Pass123@",
    "role": "CITIZEN"
  }'

# Use token in response for next requests
```

See `API_TESTING_GUIDE.md` for all cURL examples

---

## 📊 System Workflow Visualization

```
┌─────────────────────────────────────────────┐
│         CITIZEN → CREATES GRIEVANCE         │
├─────────────────────────────────────────────┤
│ POST /api/grievances/                       │
│ Data: description, address, category, etc.  │
│ Response: grievance_id, complaint_number    │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│    CITIZEN → UPLOADS DOCUMENT/PHOTO         │
├─────────────────────────────────────────────┤
│ POST /api/grievances/{id}/upload            │
│ File: document.pdf or photo.jpg             │
│ Response: file_url (accessible at /uploads) │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│    MANAGER → REVIEWS & ASSIGNS              │
├─────────────────────────────────────────────┤
│ POST /api/grievances/{id}/assign/{officer}  │
│ Response: success message                   │
│ Status: NEW → ASSIGNED                      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│   OFFICER → UPDATES STATUS (3 steps)        │
├─────────────────────────────────────────────┤
│ 1. PUT /api/grievances/{id}                 │
│    Status: IN_PROGRESS                      │
│    Remarks: "Repair work started"           │
├─────────────────────────────────────────────┤
│ 2. PUT /api/grievances/{id}                 │
│    Status: RESOLVED                         │
│    Remarks: "Work completed"                │
├─────────────────────────────────────────────┤
│ History saved for each update               │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│   CITIZEN → PROVIDES FEEDBACK               │
├─────────────────────────────────────────────┤
│ POST /api/grievances/{id}/feedback          │
│ Data: rating (1-5), comments                │
│ Status: CLOSED                              │
└─────────────────────────────────────────────┘
```

---

## 🔑 Key Features Demonstrated

### 1. User Management
- Register users with different roles
- Login and get authentication tokens
- Update profile information
- Upload profile photos

### 2. Grievance Management
- Create grievances with categories
- Upload documents/evidence
- Assign to field officers
- Track status changes (NEW → ASSIGNED → IN_PROGRESS → RESOLVED)
- Maintain complete history
- Collect citizen feedback
- Auto-generate complaint numbers

### 3. Alert Management
- Create emergency alerts
- Upload media evidence
- Assign to officers
- Track status
- Priority-based routing

### 4. Event Management
- Create public events
- Register citizens
- Auto-generate QR codes
- Track attendance

### 5. Organization
- Create constituencies
- Create wards
- Category management
- Hierarchical structure

### 6. Analytics
- Dashboard statistics
- Status breakdown
- Priority distribution
- Trend analysis

---

## 📁 Data Flow

```
┌──────────────────────────────────────────────┐
│         CLIENT (Web/Mobile)                  │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│      API GATEWAY (FastAPI)                   │
│   - JWT Authentication                       │
│   - Request Validation                       │
│   - Rate Limiting                            │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│    BUSINESS LOGIC (Services)                 │
│   - GrievanceService                         │
│   - AlertService                             │
│   - EventService                             │
│   - UserService                              │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│    DATA LAYER (MongoDB)                      │
│   - 16 Collections                           │
│   - Full ACID transactions                   │
│   - Indexed queries                          │
└──────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│    FILE STORAGE                              │
│   - /uploads/ directory                      │
│   - Accessible at /uploads/ endpoint         │
│   - 10 MB file size limit                    │
└──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (60 seconds)

### Step 1: Start Backend (if not running)
```bash
cd d:\CRM-01\Backend
python src\main.py
```

### Step 2: Run Test Script
```bash
# In another terminal
cd d:\CRM-01\Backend
python test_api_workflow.py
```

### Step 3: Watch Output
- See all users registered
- Watch grievance lifecycle
- See all API responses
- Check alerts, events, tasks
- View final dashboard stats

**Total Time: ~2-3 minutes**

---

## 📋 Sample Test Data

All requests use realistic sample data:

### User
```json
{
  "fullName": "Rajesh Kumar",
  "mobile": "9876543210",
  "email": "rajesh@example.com",
  "password": "CitizenPass123@"
}
```

### Grievance
```json
{
  "description": "Large pothole on Main Street affecting traffic",
  "address": "123 Main Street, Downtown Area",
  "priority": "HIGH",
  "gpsLocation": {"type": "Point", "coordinates": [77.5946, 12.9716]}
}
```

### Alert
```json
{
  "alertType": "EMERGENCY",
  "priority": "CRITICAL",
  "description": "Accident near Main Street intersection",
  "location": {"type": "Point", "coordinates": [77.5946, 12.9716]}
}
```

---

## ✅ Verification Checklist

After running the tests, verify:

- [ ] Users registered successfully
- [ ] Tokens generated for authentication
- [ ] Grievance created with complaint number
- [ ] Document uploaded to /uploads/
- [ ] Grievance assigned to officer
- [ ] Status updated through workflow
- [ ] Feedback added
- [ ] Alert created with priority
- [ ] Event created and registered
- [ ] Dashboard shows stats
- [ ] No errors in responses

---

## 🎓 Learning Path

1. **Start Here**: Read `QUICK_START.md`
2. **Run Script**: Execute `python test_api_workflow.py`
3. **Study Responses**: Understand each API response
4. **Use Postman**: Import collection and test manually
5. **Read Guide**: Check `API_TESTING_GUIDE.md` for details
6. **Modify Data**: Try different inputs and see results

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Swagger UI** | http://localhost:8000/api/docs |
| **ReDoc** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/api/health |
| **Uploads** | http://localhost:8000/uploads/ |
| **Database** | mongodb://localhost:27017/crm_database |

---

## 📞 Troubleshooting

### Backend Not Running?
```bash
cd d:\CRM-01\Backend
python src\main.py
# Should show: "Uvicorn running on http://0.0.0.0:8000"
```

### MongoDB Not Connected?
```bash
# Check if MongoDB is running
# Windows: Check Services or run: mongod
```

### Python Script Error?
```bash
# Make sure requests library is installed
pip install requests

# Then run again
python test_api_workflow.py
```

### Postman Issues?
- Check `base_url` variable is set to `http://localhost:8000`
- Make sure tokens are in variables before running dependent requests
- Check JSON formatting in request body

---

## 📊 System Stats After Testing

After running the test script, you should see:

```
Dashboard Statistics:
├── Total Grievances: 1
├── Total Alerts: 1
├── Total Events: 1
├── Grievances Status:
│   ├── NEW: 0
│   ├── ASSIGNED: 0
│   ├── IN_PROGRESS: 0
│   ├── RESOLVED: 1
│   └── CLOSED: 0
├── Alerts Priority:
│   ├── CRITICAL: 1
│   ├── HIGH: 0
│   └── MEDIUM: 0
└── Files Uploaded: 0 (if no files were uploaded)
```

---

## 🎯 What's Next?

1. ✅ **Understand the APIs** (This package)
2. 👉 **Build Frontend** (React/Vue)
3. 👉 **Integrate SMS/Email** (Notifications)
4. 👉 **Deploy to Production** (Azure/AWS)
5. 👉 **Add ML** (Sentiment analysis, categorization)

---

## 📝 Summary

You now have:
- ✅ Complete API documentation
- ✅ Automated test script
- ✅ Postman collection
- ✅ Quick start guide
- ✅ Working backend system
- ✅ File upload functionality
- ✅ All sample data ready

**Everything is configured and ready to use!** 🚀

Pick any method above and start testing:
1. Python script (fastest)
2. Postman (easiest to understand)
3. cURL (for scripts)

Happy testing!
