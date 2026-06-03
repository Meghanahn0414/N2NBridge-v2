# CRM Grievance Management System - Backend

A comprehensive Government CRM system for managing citizen grievances, alerts, events, and administrative tasks.

## 🌟 Features

### Core Functionality
- **Grievance Management**: Create, track, and resolve citizen grievances
- **Alert System**: Emergency alerts and incident reporting
- **Event Management**: Public events and citizen engagement
- **Task Management**: Officer work assignments and field reports
- **User Management**: Role-based access control (6 roles)
- **Notifications**: Real-time user notifications
- **Analytics**: Comprehensive system analytics and dashboards
- **Audit Logging**: Complete audit trail of all operations

### Technical Features
- **MongoDB**: NoSQL database with embedded documents
- **FastAPI**: Modern Python web framework
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: 6 user roles with specific permissions
- **Soft Deletes**: Government records never physically deleted
- **Geospatial Queries**: Location-based grievance and alert searches
- **API Documentation**: Automatic Swagger UI documentation
- **Pagination**: Efficient data retrieval with pagination
- **Error Handling**: Comprehensive error handling and logging

## 📁 Project Structure

```
Backend/
├── src/
│   ├── main.py                    # FastAPI application entry
│   ├── config/                    # Configuration
│   │   ├── database.py           # MongoDB setup
│   │   ├── settings.py           # App settings
│   │   └── security.py           # Security & JWT
│   ├── auth/                      # Authentication
│   │   ├── routes.py             # Auth endpoints
│   │   ├── service.py            # Business logic
│   │   └── model.py              # Schemas
│   ├── users/                     # User management
│   ├── grievances/                # Grievance handling
│   ├── alerts/                    # Alert management
│   ├── events/                    # Event management
│   ├── tasks/                     # Task management
│   ├── notifications/             # Notifications
│   ├── analytics/                 # Analytics
│   ├── dashboard/                 # Dashboards
│   └── utils/                     # Utilities
├── requirements.txt               # Dependencies
├── .env.example                   # Environment template
├── API_DOCUMENTATION.md           # API reference
├── DATABASE_DESIGN.md             # Database schema
└── SETUP_GUIDE.md                 # Setup instructions
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- MongoDB 4.4+

### Installation

1. **Clone repository**
```bash
cd Backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB URL and JWT secret
```

5. **Run application**

   **Option A: Using Run Script (Windows)**
   ```bash
   run.bat
   ```

   **Option B: Using Run Script (macOS/Linux)**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

   **Option C: Manual**
   ```bash
   cd src
   python main.py
   ```

6. **Access API**
- Swagger UI: http://localhost:8000/api/docs
- API Base: http://localhost:8000/api

## 📖 Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Database Design](DATABASE_DESIGN.md)** - MongoDB schema and design decisions
- **[Setup Guide](SETUP_GUIDE.md)** - Detailed setup and configuration instructions

## 🔐 User Roles

1. **ADMIN** - Full system access
2. **MANAGER** - Grievance and alert management
3. **FIELD_OFFICER** - Field operations and reports
4. **REPRESENTATIVE** - Read-only government representative access
5. **VOLUNTEER** - Limited access volunteer accounts
6. **CITIZEN** - Create grievances and view own records

## 📚 Main API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET /api/auth/verify` - Verify JWT token

### Grievances
- `POST /api/grievances/` - Create grievance
- `GET /api/grievances/{id}` - Get grievance details
- `GET /api/grievances/` - List grievances (paginated)
- `PUT /api/grievances/{id}` - Update grievance
- `POST /api/grievances/{id}/assign/{officer_id}` - Assign to officer
- `POST /api/grievances/{id}/feedback` - Submit feedback

### Alerts
- `POST /api/alerts/` - Create alert
- `GET /api/alerts/` - List alerts
- `PUT /api/alerts/{id}` - Update alert
- `POST /api/alerts/{id}/assign/{officer_id}` - Assign alert

### Events
- `POST /api/events/` - Create event
- `GET /api/events/` - List events
- `POST /api/events/{id}/register` - Register for event
- `GET /api/events/{id}/registrations` - Get registrations

### Tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/` - List tasks
- `GET /api/tasks/officer/{id}` - Get officer's tasks
- `POST /api/tasks/reports` - Submit field report

### Notifications
- `GET /api/notifications/` - Get notifications
- `GET /api/notifications/unread` - Get unread
- `PUT /api/notifications/{id}/read` - Mark as read

### Analytics
- `GET /api/analytics/grievances` - Grievance statistics
- `GET /api/analytics/dashboard` - Dashboard metrics

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint list.

## 🗄️ Database Collections

The system uses 16 MongoDB collections:

1. **users** - User accounts and profiles
2. **constituencies** - Geographic divisions
3. **wards** - Sub-divisions within constituencies
4. **grievance_categories** - Grievance types
5. **grievances** - Grievance records (main)
6. **alerts** - Emergency/incident alerts
7. **events** - Public events
8. **event_registrations** - Event attendees
9. **campaigns** - Communication campaigns
10. **communications** - Individual messages
11. **tasks** - Officer work assignments
12. **field_reports** - Field officer reports
13. **surveys** - Public surveys
14. **survey_responses** - Survey responses
15. **notifications** - User notifications
16. **audit_logs** - System audit trail

See [DATABASE_DESIGN.md](DATABASE_DESIGN.md) for detailed schema.

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt password hashing
- **Role-Based Access** - Permission-based access control
- **Soft Deletes** - Never physically delete records
- **Audit Logging** - Complete operation audit trail
- **CORS Support** - Configurable cross-origin requests
- **SQL Injection Prevention** - MongoDB parameterized queries
- **Input Validation** - Pydantic schema validation

## 📊 Analytics & Dashboard

### Available Metrics
- Grievance counts by status and priority
- Alert statistics and distribution
- User counts by role
- Event registrations and attendance
- Average grievance resolution time
- Custom role-based dashboards

### Endpoints
- `GET /api/dashboard/admin` - Admin overview
- `GET /api/dashboard/officer` - Officer workload
- `GET /api/dashboard/citizen` - Citizen summary

## 🔄 Grievance Workflow

```
NEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
         ↓             ↓
      ON_HOLD     ON_HOLD
                     ↓
                 REJECTED
```

Each status transition is tracked with:
- Old and new status
- Remarks/comments
- User who made change
- Timestamp

## 📱 Features Highlight

### Embedded Documents
- Grievance history (no separate collection needed)
- Grievance feedback (one per grievance)
- Attachments with metadata
- AI analysis results

### Soft Delete Implementation
All major collections support:
- `isDeleted` flag (Boolean)
- `deletedAt` timestamp
- Automatic filtering in queries

### Audit Trail
Every document includes:
- `createdBy` - User who created
- `updatedBy` - User who last updated
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- Plus `audit_logs` collection

### Geospatial Support
- Grievance locations (GeoJSON Points)
- Alert locations
- Field report GPS coordinates
- Range queries (find nearby)

## 🧪 Testing

### Test with Swagger UI
```
1. Go to http://localhost:8000/api/docs
2. Click "Try it out" on any endpoint
3. Fill parameters and click "Execute"
```

### Test with cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","password":"admin@123"}'

# Use token in requests
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <token>"
```

## 🚢 Deployment

### Docker
```bash
docker build -t crm-backend .
docker run -p 8000:8000 -e MONGODB_URL=mongodb://mongo crm-backend
```

### Production Checklist
- [ ] Change JWT secret
- [ ] Enable HTTPS
- [ ] Configure MongoDB auth
- [ ] Set DEBUG=False
- [ ] Configure proper CORS
- [ ] Set up logging
- [ ] Enable rate limiting
- [ ] Set up monitoring

## 📝 Environment Variables

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=crm_database

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False

# CORS
CORS_ORIGINS=http://localhost:3000
```

## 🛠️ Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check MONGODB_URL in .env
- Verify port 27017 is accessible

**Port Already in Use**
```bash
# Change PORT in .env or kill process
# macOS/Linux: kill -9 $(lsof -t -i:8000)
```

**Import Errors**
```bash
pip install --upgrade -r requirements.txt
```

## 📞 Support

- Documentation: See markdown files in Backend/
- API Docs: http://localhost:8000/api/docs
- Issues: Check application logs

## 📄 License

Proprietary - Government CRM System

## 🎯 Roadmap

- [ ] SMS/Email notifications
- [ ] File upload handling
- [ ] Advanced search/filtering
- [ ] Real-time WebSocket updates
- [ ] Mobile app integration
- [ ] AI-powered categorization
- [ ] Document OCR
- [ ] Multi-language support
- [ ] Performance optimization
- [ ] Advanced reporting

## Contributors

Built with ❤️ for efficient government service delivery.

---

**Ready to get started?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.
