# Database and Storage Maintenance Checklist

This checklist is for the current CRM project using MongoDB Atlas as the main database, Redis for cache/background jobs, and local/S3 file storage.

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
