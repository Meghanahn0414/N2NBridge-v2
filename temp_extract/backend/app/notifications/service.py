"""Notifications module — device registry + delivery.

SMS/push calls are stubbed with prints so the skeleton runs without live
FCM/APNs credentials. Swap in the real SDK calls (commented below) and move
delivery to a background worker before production.
"""
from sqlalchemy import select

from app.common.db import tenant_session
from app.notifications.models import Device


def send_sms(mobile: str, text: str) -> None:
    # TODO: integrate the SMS provider (OTP delivery).
    print(f"[SMS] -> {mobile}: {text}")


def register_device(db, tenant_id: str, user_id: str, token: str, platform: str) -> dict:
    dev = db.scalar(select(Device).where(Device.token == token))
    if dev:
        dev.user_id = user_id
        dev.tenant_id = tenant_id
        dev.platform = platform
    else:
        db.add(
            Device(token=token, user_id=user_id, tenant_id=tenant_id, platform=platform)
        )
    return {"registered": True}


def on_case_created(tenant_id: str, citizen_id: str, case) -> None:
    _push(
        tenant_id,
        citizen_id,
        "Report received",
        f"Case {case.ref} is on its way to {case.ward or 'your ward'}.",
    )


def _push(tenant_id: str, user_id: str, title: str, body: str) -> None:
    with tenant_session(tenant_id) as db:
        devices = db.scalars(select(Device).where(Device.user_id == user_id)).all()
    for d in devices:
        if d.platform == "android":
            # from firebase_admin import messaging
            # messaging.send(messaging.Message(
            #     token=d.token,
            #     notification=messaging.Notification(title, body)))
            print(f"[FCM] -> {d.token[:8]}…: {title} — {body}")
        else:
            # APNsClient(settings.APNS_CERT).send_notification(
            #     d.token, Payload(alert=f"{title}: {body}"))
            print(f"[APNs] -> {d.token[:8]}…: {title} — {body}")
