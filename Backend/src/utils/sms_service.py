import os
import sys

_src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if _src_path not in sys.path:
    sys.path.insert(0, _src_path)

from config.settings import settings  # noqa: E402


def _get_env_key(key: str) -> str:
    """Read a key fresh from .env file — bypasses cached settings on running server."""
    from dotenv import dotenv_values
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
    env_value = dotenv_values(env_path).get(key)
    if env_value not in (None, ""):
        return env_value
    return getattr(settings, key, None)


def send_otp_via_sms(phone_number: str, otp: str, message: str = None) -> bool:
    if not message:
        message = f"Your CRM OTP is: {otp}. Valid for 5 minutes. Do not share."

    provider_configured = any([
        _get_env_key("FAST2SMS_API_KEY"),
        _get_env_key("VONAGE_API_KEY"),
        _get_env_key("TWOFACTOR_API_KEY"),
        _get_env_key("TWILIO_ACCOUNT_SID"),
        _get_env_key("AWS_ACCESS_KEY_ID"),
        _get_env_key("SMS_API_URL"),
    ])

    if not provider_configured:
        print("[SMS] No SMS provider configured. Falling back to console OTP delivery.", flush=True)
        return send_via_console(phone_number, otp)

    if _get_env_key("FAST2SMS_API_KEY"):
        if send_via_fast2sms(phone_number, otp):
            return True
        print("[SMS] Fast2SMS failed, falling back to next provider", flush=True)

    if _get_env_key("VONAGE_API_KEY"):
        if send_via_vonage(phone_number, message):
            return True
        print("[SMS] Vonage failed, falling back to next provider", flush=True)

    if _get_env_key("TWOFACTOR_API_KEY"):
        if send_via_2factor(phone_number, otp):
            return True
        print("[SMS] 2Factor failed, falling back to next provider", flush=True)

    if _get_env_key("TWILIO_ACCOUNT_SID"):
        if send_via_twilio(phone_number, message):
            return True
        print("[SMS] Twilio failed, falling back to next provider", flush=True)

    if _get_env_key("AWS_ACCESS_KEY_ID"):
        if send_via_aws_sns(phone_number, message):
            return True
        print("[SMS] AWS SNS failed, falling back to next provider", flush=True)

    if _get_env_key("SMS_API_URL"):
        if send_via_http_api(phone_number, message):
            return True
        print("[SMS] HTTP API failed, falling back to console delivery", flush=True)

    print("[SMS] Falling back to console OTP delivery because no provider accepted the request.", flush=True)
    return send_via_console(phone_number, otp)


def send_via_vonage(phone_number: str, message: str) -> bool:
    try:
        import requests

        number = phone_number.strip()
        if not number.startswith("+"):
            number = "91" + number[-10:]
        else:
            number = number.replace("+", "")

        response = requests.post(
            "https://rest.nexmo.com/sms/json",
            data={
                "api_key": settings.VONAGE_API_KEY,
                "api_secret": settings.VONAGE_API_SECRET,
                "from": "N2NBridge",
                "to": number,
                "text": message,
            },
            timeout=10,
        )
        data = response.json()
        status = data.get("messages", [{}])[0].get("status", "99")

        if str(status) == "0":
            print(f"OK SMS sent via Vonage to {number}", flush=True)
            return True
        else:
            print(f"FAIL Vonage error: {data}", flush=True)
            return False

    except Exception as e:
        print(f"FAIL Vonage exception: {str(e)}", flush=True)
        return False


def send_via_2factor(phone_number: str, otp: str) -> bool:
    try:
        import requests

        number = phone_number.strip()
        if number.startswith("+91"):
            number = number[3:]
        elif number.startswith("91") and len(number) == 12:
            number = number[2:]
        number = number[-10:]

        url = f"https://2factor.in/API/V1/{settings.TWOFACTOR_API_KEY}/SMS/{number}/{otp}"
        response = requests.get(url, timeout=10)
        data = response.json()

        if data.get("Status") == "Success":
            print(f"OK SMS sent via 2Factor to {number}", flush=True)
            return True
        else:
            print(f"FAIL 2Factor error: {data}", flush=True)
            return False

    except Exception as e:
        print(f"FAIL 2Factor exception: {str(e)}", flush=True)
        return False


def send_via_fast2sms(phone_number: str, otp: str) -> bool:
    try:
        import os

        import requests
        from dotenv import dotenv_values

        # Read key fresh from .env so server restart is not required after .env change
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
        api_key = dotenv_values(env_path).get("FAST2SMS_API_KEY") or settings.FAST2SMS_API_KEY
        if not api_key:
            print("FAIL Fast2SMS key not configured", flush=True)
            return False

        # Strip +91 or any country code — Fast2SMS needs 10-digit Indian number
        number = phone_number.strip()
        if number.startswith("+91"):
            number = number[3:]
        elif number.startswith("91") and len(number) == 12:
            number = number[2:]
        number = number[-10:]  # always take last 10 digits

        url = "https://www.fast2sms.com/dev/bulkV2"
        params = {
            "authorization": api_key,
            "route": "q",
            "message": f"Your N2N Bridge OTP is {otp}. Valid for 5 minutes. Do not share.",
            "numbers": number,
            "flash": 0,
        }

        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if data.get("return") is True:
            print(f"OK SMS sent via Fast2SMS to {number}", flush=True)
            return True
        else:
            print(f"FAIL Fast2SMS error: {data}", flush=True)
            return False

    except Exception as e:
        print(f"FAIL Fast2SMS exception: {str(e)}", flush=True)
        return False


def send_via_twilio(phone_number: str, message: str) -> bool:
    try:
        from twilio.rest import Client

        account_sid = _get_env_key("TWILIO_ACCOUNT_SID")
        auth_token = _get_env_key("TWILIO_AUTH_TOKEN")
        from_number = _get_env_key("TWILIO_PHONE_NUMBER")

        if not all([account_sid, auth_token, from_number]):
            print("FAIL Twilio credentials not configured", flush=True)
            return False

        client = Client(account_sid, auth_token)

        if not phone_number.startswith("+"):
            phone_number = "+91" + phone_number

        message = client.messages.create(
            body=f"Your OTP is {message}",
            from_=from_number,
            to=phone_number
        )

        print(message.sid)
        print(message.status)
        print(f"OK SMS sent via Twilio to {phone_number}", flush=True)
        print(f"   Message ID: {message.sid}", flush=True)
        return True

    except Exception as e:
        print(f"FAIL Error sending SMS via Twilio: {str(e)}", flush=True)
        return False


def send_via_aws_sns(phone_number: str, message: str) -> bool:
    try:
        import boto3

        sns_client = boto3.client("sns")

        if not phone_number.startswith("+"):
            phone_number = "+91" + phone_number

        response = sns_client.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": "CRM"},
                "AWS.SNS.SMS.SMSType": {"DataType": "String", "StringValue": "Transactional"}
            }
        )

        print(f"OK SMS sent via AWS SNS to {phone_number}", flush=True)
        print(f"   Message ID: {response['MessageId']}", flush=True)
        return True

    except Exception as e:
        print(f"FAIL Error sending SMS via AWS SNS: {str(e)}", flush=True)
        return False


def send_via_http_api(phone_number: str, message: str) -> bool:
    try:
        import requests

        payload = {
            "phone": phone_number,
            "message": message,
            "api_key": settings.SMS_API_KEY
        }

        response = requests.post(settings.SMS_API_URL, json=payload, timeout=10)

        if response.status_code == 200:
            print(f"OK SMS sent via HTTP API to {phone_number}", flush=True)
            return True
        else:
            print(f"FAIL HTTP API returned status {response.status_code}", flush=True)
            return False

    except Exception as e:
        print(f"FAIL Error sending SMS via HTTP API: {str(e)}", flush=True)
        return False


def send_via_console(phone_number: str, otp: str) -> bool:
    print("\n" + "="*60, flush=True)
    print("[SMS] SMS OTP (TESTING MODE - no provider configured)", flush=True)
    print("="*60, flush=True)
    print(f"Phone Number: {phone_number}", flush=True)
    print(f"OTP Code: {otp}", flush=True)
    print("="*60 + "\n", flush=True)
    return True
