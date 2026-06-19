# Database and Storage Maintenance Checklist

This checklist is for the current CRM project using MongoDB Atlas as the main database, Redis for cache/background jobs, and local/S3 file storage.

## How the database works (simple picture)

User / Admin / Officer -> API Backend -> MongoDB Collections -> Redis Cache / Celery Jobs -> File Storage (local or S3)

### Easy flow explanation
1. The frontend or mobile app sends data requests to the backend.
2. The backend reads or writes records in MongoDB collections such as users, grievances, alerts, tasks, and notifications.
3. Redis helps with faster reads, cache refresh, and background task processing.
4. Uploaded files such as photos, PDFs, and attachments are stored in local uploads or in S3.
5. The database stores only the reference path or URL to those files.

### What is stored where
- MongoDB: main business data, complaint records, users, tasks, notifications, audit logs.
- Redis: temporary cache, task queue, performance optimization.
- Local uploads / S3: actual uploaded files like images and documents.

### Simple diagram
```text
Frontend / Mobile App
        |
        v
   Backend API
        |
   +----+-------------------+-------------------+
   |    |                   |                   |
   v    v                   v                   v
MongoDB   Redis / Celery    Upload Storage
(users,   (cache, jobs)     (local folder or S3)
grievances,
alerts,
notifications)
```

### Detailed architecture view
- Frontend and Mobile App send requests to the backend.
- Backend services read/write MongoDB documents.
- Redis stores temporary data and supports task queues.
- File storage keeps uploaded images, PDFs, and other media.
- MongoDB stores metadata and links to those files.

### Maintenance flow
1. Check MongoDB Atlas health and backups.
2. Review collection growth and old records.
3. Verify Redis queue status and cache freshness.
4. Check file upload folder or S3 bucket size.
5. Remove stale data, unused files, and failed jobs.
6. Confirm security settings and credentials are valid.

### What to monitor every week
- MongoDB connection errors
- Redis memory usage
- Celery failed tasks
- large upload folders
- duplicate or stale records

## 1. Database Health
- Verify MongoDB Atlas connection is working every day.
- Check server status, latency, and error logs in Atlas.
- Confirm the app can connect using the current MONGODB_URL.
- Watch for repeated connection timeouts or slow queries.

## 2. Backup and Recovery
- Enable MongoDB Atlas backup / point-in-time recovery if available.
- Test restore process at least once every month.
- Keep a copy of the current backup plan and recovery steps.
- Store recovery instructions in a secure place.

## 3. Index Maintenance
- Review indexes in Backend/src/config/database.py.
- Add indexes only for frequently used filters and sort fields.
- Remove unused indexes if they slow down writes.
- Recheck compound indexes for queries like:
  - user ward/role lookup
  - grievance status + constituency
  - notifications by user + date

## 4. Collection Maintenance
- Review all major collections:
  - users
  - grievances
  - alerts
  - events
  - campaigns
  - tasks
  - notifications
  - audit_logs
- Remove duplicate or corrupted records.
- Archive old inactive records if required.

## 5. Storage Maintenance
- Clean old files in Backend/uploads regularly.
- If S3 is enabled, set lifecycle rules for old files.
- Keep file size limits under the configured max upload size.
- Delete unused files after the related records are removed.

## 6. Redis Maintenance
- Check Redis health and memory usage.
- Clear stale cache entries if the dashboard or analytics shows old values.
- Monitor Celery task queue for stuck or failed jobs.

## 7. Security Maintenance
- Never commit DB passwords or secrets to Git.
- Keep MONGODB_URL and JWT_SECRET_KEY in environment variables only.
- Rotate credentials periodically.
- Restrict Atlas access to trusted IPs and users.

## 8. Monitoring and Alerts
- Enable alerts for:
  - high CPU / memory usage
  - failed DB connections
  - slow queries
  - queue failures
  - storage space shortage
- Review logs every week.

## 9. Monthly Maintenance Routine
- Check DB size and storage use.
- Review backups and test restore.
- Remove unused files and stale cache.
- Review slow queries and index usage.
- Confirm all background jobs are running normally.

## 10. Simple Rule for Stability
- Database = store real application data
- Redis = speed and background processing
- File storage = documents, images, and attachments
- Backup + index + cleanup = strong maintenance
