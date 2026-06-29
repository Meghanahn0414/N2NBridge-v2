"""
OTP Service for authentication
"""
import random
import re
import time
import json
import logging
from typing import Dict

logger = logging.getLogger(__name__)

# In-memory fallback if Redis is unavailable
OTP_STORAGE: Dict[str, dict] = {}
OTP_EXPIRY = 300  # 5 minutes
OTP_DIGITS = 6
MAX_OTP_ATTEMPTS = 3

REDIS_PREFIX = "otp:"


def _get_redis():
    """Return Redis client if available, else None."""
    try:
        from config.cache import get_redis
        return get_redis()
    except Exception:
        return None


class OTPService:
    """OTP generation and verification service"""

    @staticmethod
    def generate_otp() -> str:
        return ''.join([str(random.randint(0, 9)) for _ in range(OTP_DIGITS)])

    @staticmethod
    def normalize_contact(type_: str, value: str) -> str:
        if type_ == "phone":
            cleaned = re.sub(r"\D", "", (value or ""))
            if cleaned.startswith("91") and len(cleaned) > 10:
                cleaned = cleaned[2:]
            return cleaned
        if type_ == "email":
            return (value or "").strip().lower()
        return value or ""

    @staticmethod
    def _store(key: str, data: dict) -> None:
        redis = _get_redis()
        if redis:
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(
                    redis.setex(REDIS_PREFIX + key, OTP_EXPIRY, json.dumps(data))
                )
                return
            except Exception as e:
                logger.warning(f"Redis OTP store failed, using memory: {e}")
        OTP_STORAGE[key] = data

    @staticmethod
    def _get(key: str) -> dict | None:
        redis = _get_redis()
        if redis:
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                raw = loop.run_until_complete(redis.get(REDIS_PREFIX + key))
                if raw:
                    return json.loads(raw)
                return None
            except Exception as e:
                logger.warning(f"Redis OTP get failed, using memory: {e}")
        return OTP_STORAGE.get(key)

    @staticmethod
    def _delete(key: str) -> None:
        redis = _get_redis()
        if redis:
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                loop.run_until_complete(redis.delete(REDIS_PREFIX + key))
                return
            except Exception as e:
                logger.warning(f"Redis OTP delete failed, using memory: {e}")
        OTP_STORAGE.pop(key, None)

    @staticmethod
    def send_otp(type_: str, value: str) -> bool:
        try:
            normalized_value = OTPService.normalize_contact(type_, value)
            otp = OTPService.generate_otp()

            OTPService._store(normalized_value, {
                "otp": otp,
                "timestamp": time.time(),
                "attempts": 0,
                "type": type_,
            })

            if type_ == "phone":
                print(f"[OTP] Sending SMS to {normalized_value}", flush=True)
                try:
                    from utils.sms_service import send_otp_via_sms
                    sent = send_otp_via_sms(normalized_value, otp)
                    if not sent:
                        logger.warning(f"SMS delivery failed for {value}")
                        return False
                    print(f"[OTP] SMS sent to {normalized_value}", flush=True)
                except Exception as sms_err:
                    print(f"[OTP] SMS exception: {sms_err}", flush=True)
                    logger.error(f"SMS exception: {sms_err}", exc_info=True)
                    return False
            else:
                logger.info(f"OTP for email {value}: {otp}")

            return True
        except Exception as e:
            print(f"[OTP] Outer exception: {e}", flush=True)
            logger.error(f"Failed to send OTP: {e}", exc_info=True)
            return False

    @staticmethod
    def verify_otp(value: str, otp: str) -> bool:
        try:
            is_phone = value is not None and "@" not in value
            normalized_value = OTPService.normalize_contact("phone" if is_phone else "email", value)

            otp_data = OTPService._get(normalized_value)
            if not otp_data:
                logger.warning(f"OTP verification failed: No OTP found for {value}")
                return False

            # Check expiry (Redis TTL handles it, but check for in-memory fallback)
            if time.time() - otp_data["timestamp"] > OTP_EXPIRY:
                OTPService._delete(normalized_value)
                logger.warning(f"OTP expired for {value}")
                return False

            if otp_data["attempts"] >= MAX_OTP_ATTEMPTS:
                OTPService._delete(normalized_value)
                logger.warning(f"Max OTP attempts exceeded for {value}")
                return False

            if otp_data["otp"] != otp:
                otp_data["attempts"] += 1
                OTPService._store(normalized_value, otp_data)
                logger.warning(f"Invalid OTP for {value} (attempt {otp_data['attempts']})")
                return False

            OTPService._delete(normalized_value)
            logger.info(f"OTP verified for {value}")
            return True
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return False
