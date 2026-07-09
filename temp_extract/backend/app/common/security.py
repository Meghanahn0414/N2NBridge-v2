from datetime import datetime, timedelta, timezone

from jose import jwt

from app.settings import settings

ALGO = "HS256"
TOKEN_TTL_HOURS = 12


def create_token(sub: str, tenant_id: str, role: str) -> str:
    payload = {
        "sub": sub,
        "tid": tenant_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGO])
