"""
Celery Background Tasks
Offloads slow I/O operations (SMS, email, push notifications, bulk inserts)
off the FastAPI request thread so responses stay fast.
"""
import logging
from datetime import datetime

from celery import shared_task
from config.worker import celery_app

logger = logging.getLogger(__name__)


# ── SMS ────────────────────────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, name="tasks.send_sms")
def send_sms(self, phone_number: str, otp: str, message: str = None):
    """Send OTP / notification SMS asynchronously."""
    try:
        from utils.sms_service import send_otp_via_sms
        result = send_otp_via_sms(phone_number, otp, message)
        if not result:
            raise RuntimeError("SMS provider returned failure")
        logger.info(f"SMS sent to {phone_number}")
        return {"status": "sent", "phone": phone_number}
    except Exception as exc:
        logger.error(f"SMS task failed: {exc}")
        raise self.retry(exc=exc)


# ── Email ──────────────────────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, name="tasks.send_email")
def send_email(self, email: str, otp: str):
    """Send OTP email asynchronously."""
    try:
        from utils.email_service import send_otp_via_email
        result = send_otp_via_email(email, otp)
        if not result:
            raise RuntimeError("Email provider returned failure")
        logger.info(f"Email sent to {email}")
        return {"status": "sent", "email": email}
    except Exception as exc:
        logger.error(f"Email task failed: {exc}")
        raise self.retry(exc=exc)


# ── Push Notifications (bulk) ──────────────────────────────────────────────────

@celery_app.task(name="tasks.notify_ward_citizens")
def notify_ward_citizens(ward_id: str, title: str, body: str, notification_type: str, extra: dict = None):
    """
    Insert in-app notifications for every citizen in a ward.
    Runs in the background so the campaign/event launch endpoint returns immediately.
    Inserts in batches of 500 to avoid oversized write operations.
    """
    try:
        from config.database import MongoDatabase
        db = MongoDatabase.get_db()

        citizens = list(db.users.find(
            {"wardId": ward_id, "role": "CITIZEN", "isDeleted": {"$ne": True}},
            {"_id": 1}
        ))
        if not citizens:
            logger.info(f"notify_ward_citizens: no citizens in ward {ward_id}")
            return {"sent": 0}

        now = datetime.utcnow()
        records = [
            {
                "userId": str(c["_id"]),
                "title": title,
                "body": body,
                "type": notification_type,
                "isRead": False,
                "createdAt": now,
                **(extra or {}),
            }
            for c in citizens
        ]

        # Batch inserts — avoids single oversized write
        batch_size = 500
        for i in range(0, len(records), batch_size):
            db.notifications.insert_many(records[i:i + batch_size], ordered=False)

        logger.info(f"notify_ward_citizens: sent {len(records)} notifications to ward {ward_id}")
        return {"sent": len(records)}
    except Exception as exc:
        logger.error(f"notify_ward_citizens task error: {exc}")
        raise


@celery_app.task(name="tasks.notify_all_citizens")
def notify_all_citizens(title: str, body: str, notification_type: str, extra: dict = None):
    """
    Insert in-app notifications for ALL citizens.
    Runs in the background; batched in groups of 500.
    """
    try:
        from config.database import MongoDatabase
        db = MongoDatabase.get_db()

        citizens = list(db.users.find(
            {"role": "CITIZEN", "isDeleted": {"$ne": True}},
            {"_id": 1}
        ))
        if not citizens:
            return {"sent": 0}

        now = datetime.utcnow()
        records = [
            {
                "userId": str(c["_id"]),
                "title": title,
                "body": body,
                "type": notification_type,
                "isRead": False,
                "createdAt": now,
                **(extra or {}),
            }
            for c in citizens
        ]

        batch_size = 500
        for i in range(0, len(records), batch_size):
            db.notifications.insert_many(records[i:i + batch_size], ordered=False)

        logger.info(f"notify_all_citizens: sent {len(records)} notifications")
        return {"sent": len(records)}
    except Exception as exc:
        logger.error(f"notify_all_citizens task error: {exc}")
        raise


@celery_app.task(name="tasks.send_campaign_notifications")
def send_campaign_notifications(campaign_id: str):
    """
    Called when a campaign is launched. Resolves target users and sends
    in-app notifications in the background.
    """
    try:
        from bson import ObjectId
        from config.database import MongoDatabase
        db = MongoDatabase.get_db()

        campaign = db.campaigns.find_one({"_id": ObjectId(campaign_id)})
        if not campaign:
            logger.warning(f"Campaign {campaign_id} not found for notifications")
            return {"sent": 0}

        ward_id = campaign.get("wardId")
        query = {"role": "CITIZEN", "isDeleted": {"$ne": True}}
        if ward_id:
            query["wardId"] = ward_id

        citizens = list(db.users.find(query, {"_id": 1}))
        if not citizens:
            return {"sent": 0}

        title = f"New Campaign: {campaign.get('name', 'New Campaign')}"
        body = (
            campaign.get("message")
            or f"A new {campaign.get('type', 'awareness')} campaign has been launched."
        )
        if ward_id:
            body = f"[Ward update] {body}"

        now = datetime.utcnow()
        records = [
            {
                "userId": str(c["_id"]),
                "title": title,
                "body": body,
                "type": "CAMPAIGN",
                "campaignId": campaign_id,
                "wardId": ward_id,
                "isRead": False,
                "createdAt": now,
            }
            for c in citizens
        ]

        batch_size = 500
        for i in range(0, len(records), batch_size):
            db.notifications.insert_many(records[i:i + batch_size], ordered=False)

        logger.info(f"Campaign {campaign_id}: sent {len(records)} notifications")
        return {"sent": len(records)}
    except Exception as exc:
        logger.error(f"send_campaign_notifications error: {exc}")
        raise
