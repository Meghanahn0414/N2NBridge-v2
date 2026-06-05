"""
OTP Service for authentication
"""
import random
import time
from typing import Optional, Dict
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
            otp = OTPService.generate_otp()
            timestamp = time.time()

            # Store OTP
            OTP_STORAGE[value] = {
                "otp": otp,
                "timestamp": timestamp,
                "attempts": 0,
                "type": type_,
            }

            # TODO: Integrate with actual SMS/Email service
            # For now, log to console for testing
            print(f"🔐 DEBUG OTP sent to {type_} {value}: {otp}")  # Debug output
            logger.info(f"OTP for {type_} {value}: {otp}")
            print(f"🔐 DEBUG OTP: {otp} for {value}")

            return True
        except Exception as e:
            logger.error(f"Failed to send OTP: {e}")
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
            if value not in OTP_STORAGE:
                logger.warning(f"OTP verification failed: No OTP found for {value}")
                return False

            otp_data = OTP_STORAGE[value]
            current_time = time.time()

            # Check if OTP expired
            if current_time - otp_data["timestamp"] > OTP_EXPIRY:
                del OTP_STORAGE[value]
                logger.warning(f"OTP verification failed: OTP expired for {value}")
                return False

            # Check attempt limit
            if otp_data["attempts"] >= MAX_OTP_ATTEMPTS:
                del OTP_STORAGE[value]
                logger.warning(f"OTP verification failed: Max attempts exceeded for {value}")
                return False

            # Verify OTP
            if otp_data["otp"] != otp:
                otp_data["attempts"] += 1
                logger.warning(f"OTP verification failed: Invalid OTP for {value} (attempt {otp_data['attempts']})")
                return False

            # OTP verified successfully
            del OTP_STORAGE[value]
            logger.info(f"OTP verified successfully for {value}")
            return True
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return False
