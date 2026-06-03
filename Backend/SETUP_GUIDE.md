# CRM Grievance Management System - Setup Guide

## Quick Start

### Prerequisites
- Python 3.9 or higher
- MongoDB 4.4 or higher
- pip (Python package manager)

### Step 1: Clone and Navigate
```bash
cd Backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment
```bash
# Copy example .env file
cp .env.example .env

# Edit .env with your MongoDB connection
# MONGODB_URL=mongodb://localhost:27017
# MONGODB_DB=crm_database
# JWT_SECRET_KEY=your-secret-key
```

### Step 5: Run MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use local MongoDB installation
mongod
```

### Step 6: Run Application

**Option A: Using Run Script (Easiest - Windows)**
```bash
# From Backend directory
run.bat
```

**Option B: Using Run Script (Easiest - macOS/Linux)**
```bash
# From Backend directory
chmod +x run.sh
./run.sh
```

**Option C: Manual (All Platforms)**
```bash
# From Backend directory
cd src
python main.py
```

The application will start at: **http://localhost:8000**

## Accessing the API

### Swagger UI (Recommended)
```
http://localhost:8000/api/docs
```

### ReDoc
```
http://localhost:8000/docs
```

### Health Check
```bash
curl http://localhost:8000/api/health
```

## Environment Variables

See `.env.example` for all available configuration options.

**Essential Variables**:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=crm_database
JWT_SECRET_KEY=your-secure-key-here
PORT=8000
DEBUG=False
```

## Testing the API

### 1. Create Admin User
```bash
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "fullName": "Admin User",
  "mobile": "9999999999",
  "email": "admin@crm.com",
  "password": "admin@123",
  "role": "ADMIN"
}
```

### 2. Login
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@crm.com",
  "password": "admin@123"
}
```

Response will include JWT token:
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "tokenType": "bearer",
  "user": { ... }
}
```

### 3. Use Token in Requests
```bash
GET http://localhost:8000/api/users/
Authorization: Bearer <your-token>
```

## Database Initialization

The database collections and indexes are automatically created on first run. 

To manually reset database:
```bash
# Connect to MongoDB
mongosh

# In MongoDB shell
use crm_database
db.dropDatabase()

# Restart the application to recreate collections
```

## Create Initial Data

### 1. Create Constituencies
```bash
POST http://localhost:8000/api/users/constituencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "constituencyCode": "BNG001",
  "name": "Bangalore South",
  "district": "Bangalore",
  "state": "Karnataka"
}
```

### 2. Create Grievance Categories
```bash
POST http://localhost:8000/api/grievances/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryName": "Pothole",
  "description": "Road potholes and damage"
}
```

### 3. Create Test Event
```bash
POST http://localhost:8000/api/events/
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventName": "Town Hall Meeting",
  "description": "Monthly citizen engagement",
  "eventType": "Meeting",
  "venue": "City Hall",
  "eventDate": "2024-07-15T10:00:00Z",
  "organizerId": "<admin-user-id>",
  "capacity": 100,
  "qrEnabled": true
}
```

## Common Issues

### 1. MongoDB Connection Failed
**Error**: `Failed to connect to MongoDB at mongodb://localhost:27017`

**Solution**:
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check MONGODB_URL in .env
- Verify MongoDB port (default 27017)

### 2. Port Already in Use
**Error**: `Address already in use`

**Solution**:
```bash
# Change PORT in .env
PORT=8001

# Or kill process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

### 3. JWT Token Issues
**Error**: `Invalid or expired token`

**Solution**:
- Ensure JWT_SECRET_KEY is set in .env
- Token expires after JWT_EXPIRATION_HOURS
- Get new token by logging in again

### 4. Import Errors
**Error**: `ModuleNotFoundError: No module named 'xxx'`

**Solution**:
```bash
# Ensure virtual environment is activated
pip install -r requirements.txt

# Reinstall all packages
pip install --upgrade -r requirements.txt
```

## Development Tips

### Enable Debug Mode
```env
DEBUG=True
```

### View Request Logs
Logs are printed to console with timestamps and request details.

### Database GUI Tools
- **MongoDB Compass**: Visual MongoDB client
- **Robo 3T**: MongoDB IDE
- **MongoDB Atlas**: Cloud MongoDB

### Test with cURL
```bash
# Create grievance
curl -X POST http://localhost:8000/api/grievances/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "...",
    "description": "Potholes on Main Street",
    "address": "Main Street, City",
    "priority": "HIGH"
  }'
```

## Production Deployment

### Before Deploying
1. ✅ Change JWT_SECRET_KEY to strong value
2. ✅ Set DEBUG=False
3. ✅ Configure MongoDB with authentication
4. ✅ Set up HTTPS/TLS
5. ✅ Enable rate limiting
6. ✅ Configure CORS properly
7. ✅ Set up logging to files
8. ✅ Run security audit

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ .

CMD ["python", "main.py"]
```

```bash
docker build -t crm-app .
docker run -e MONGODB_URL=mongodb://mongo:27017 \
           -e JWT_SECRET_KEY=your-secret \
           -p 8000:8000 \
           crm-app
```

### Using Gunicorn
```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

## Monitoring

### Health Check
```bash
curl http://localhost:8000/api/health
```

### View Logs
```bash
# Logs to console with INFO level
# Set LOG_LEVEL in .env for different levels
```

### Database Monitoring
```bash
# Check collection sizes
mongosh

# In MongoDB shell
use crm_database
db.grievances.stats()
db.users.stats()
```

## Support

For issues or questions:
1. Check API documentation: http://localhost:8000/api/docs
2. Review database schema: DATABASE_DESIGN.md
3. Check API endpoints: API_DOCUMENTATION.md
4. Review logs for errors

## Next Steps

1. Review API_DOCUMENTATION.md for all endpoints
2. Review DATABASE_DESIGN.md for schema details
3. Set up Frontend application
4. Configure email/SMS notifications
5. Set up monitoring and alerts
6. Deploy to production environment
