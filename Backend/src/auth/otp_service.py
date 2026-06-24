"""
OTP Service for authentication
"""
import random
import re
import time
# import sys
from typing import  Dict
import logging

logger = logging.getLogger(__name__)

# In-memory OTP storage: {identifier: {otp, timestamp, attempts}}
OTP_STORAGE: Dict[str, dict] = {}
OTP_EXPIRY = 300  # 5 minutes
OTP_DIGITS = 6
MAX_OTP_ATTEMPTS = 3


class OTPService:
    """OTP generation and verification service"""

    @staticmethod
    def generate_otp() -> str:
        """Generate a random 6-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(OTP_DIGITS)])

    @staticmethod
    def normalize_contact(type_: str, value: str) -> str:
        if type_ == "phone":
            return re.sub(r"\D", "", (value or ""))
        if type_ == "email":
            return (value or "").strip().lower()
        return value or ""

    @staticmethod
    def send_otp(type_: str, value: str) -> bool:
        """
        Send OTP to phone or email
        Args:
            type_: 'phone' or 'email'
            value: phone number or email address
        Returns:
            bool: True if OTP sent successfully
        """
        try:
            normalized_value = OTPService.normalize_contact(type_, value)
            otp = OTPService.generate_otp()
            timestamp = time.time()

            # Store OTP
            OTP_STORAGE[normalized_value] = {
                "otp": otp,
                "timestamp": timestamp,
                "attempts": 0,
                "type": type_,
            }

            if type_ == "phone":
                print(f"[OTP] Calling send_otp_via_sms for {normalized_value}", flush=True)
                try:
                    from utils.sms_service import send_otp_via_sms
                    sent = send_otp_via_sms(normalized_value, otp)
                    if sent:
                        print(f"[OTP] SMS sent successfully to {normalized_value}", flush=True)
                    else:
                        print(f"[OTP] SMS failed for {normalized_value}", flush=True)
                        logger.warning(f"SMS delivery failed for {value}")
                except Exception as sms_err:
                    print(f"[OTP] SMS exception: {sms_err}", flush=True)
                    logger.error(f"SMS exception: {sms_err}", exc_info=True)
            else:
                logger.info(f"OTP for email {value}: {otp}")

            return True
        except Exception as e:
            print(f"[OTP] Outer exception: {e}", flush=True)
            logger.error(f"Failed to send OTP: {e}", exc_info=True)
            return False

    @staticmethod
    def verify_otp(value: str, otp: str) -> bool:
        """
        Verify OTP for phone or email
        Args:
            value: phone number or email address
            otp: OTP code to verify
        Returns:
            bool: True if OTP is valid
        """
        try:
            # Normalize the value using the same logic as send_otp
            is_phone = value is not None and "@" not in value
            normalized_value = OTPService.normalize_contact("phone" if is_phone else "email", value)
            if normalized_value not in OTP_STORAGE:
                logger.warning(f"OTP verification failed: No OTP found for {value}")
                return False

            otp_data = OTP_STORAGE[normalized_value]
            current_time = time.time()

            # Check if OTP expired
            if current_time - otp_data["timestamp"] > OTP_EXPIRY:
                del OTP_STORAGE[normalized_value]
                logger.warning(f"OTP verification failed: OTP expired for {value}")
                return False

            # Check attempt limit
            if otp_data["attempts"] >= MAX_OTP_ATTEMPTS:
                del OTP_STORAGE[normalized_value]
                logger.warning(f"OTP verification failed: Max attempts exceeded for {value}")
                return False

            # Verify OTP
            if otp_data["otp"] != otp:
                otp_data["attempts"] += 1
                logger.warning(f"OTP verification failed: Invalid OTP for {value} (attempt {otp_data['attempts']})")
                return False

            # OTP verified successfully
            del OTP_STORAGE[normalized_value]
            logger.info(f"OTP verified successfully for {value}")
            return True
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return False
