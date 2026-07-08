import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select

from app.common.db import tenant_session
from app.common.security import create_token
from app.auth.models import OtpCode
from app.citizens.models import Citizen
from app.notifications import service as notify

OTP_TTL_MINUTES = 5


def request_otp(mobile: str, tenant_id: str) -> dict:
    code = f"{random.randint(100000, 999999)}"
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    with tenant_session(tenant_id) as db:
        db.add(
            OtpCode(mobile=mobile, tenant_id=tenant_id, code=code, expires_at=expires)
        )
    # In production, send via the SMS provider from a background worker.
    notify.send_sms(mobile, f"Your N2Bridge code is {code}")
    return {"sent": True}


def verify_otp(mobile: str, code: str, tenant_id: str) -> dict:
    with tenant_session(tenant_id) as db:
        otp = db.scalar(
            select(OtpCode).where(
                OtpCode.mobile == mobile,
                OtpCode.code == code,
                OtpCode.used_at.is_(None),
                OtpCode.expires_at > datetime.now(timezone.utc),
            )
        )
        if not otp:
            raise HTTPException(status_code=401, detail="Invalid or expired code")
        otp.used_at = datetime.now(timezone.utc)

        citizen = db.scalar(
            select(Citizen).where(
                Citizen.mobile == mobile, Citizen.tenant_id == tenant_id
            )
        )
        if not citizen:
            citizen = Citizen(mobile=mobile, tenant_id=tenant_id)
            db.add(citizen)
            db.flush()

        return {"token": create_token(str(citizen.id), tenant_id, "citizen")}
