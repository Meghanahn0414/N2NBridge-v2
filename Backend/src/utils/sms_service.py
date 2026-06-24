import os
import sys

_src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if _src_path not in sys.path:
    sys.path.insert(0, _src_path)

from config.settings import settings  # noqa: E402


def send_otp_via_sms(phone_number: str, otp: str, message: str = None) -> bool:
    if not message:
        message = f"Your CRM OTP is: {otp}. Valid for 5 minutes. Do not share."

    if settings.VONAGE_API_KEY:
        return send_via_vonage(phone_number, message)
    elif settings.TWOFACTOR_API_KEY:
        return send_via_2factor(phone_number, otp)
    elif settings.FAST2SMS_API_KEY:
        return send_via_fast2sms(phone_number, otp)
    elif settings.TWILIO_ACCOUNT_SID:
        return send_via_twilio(phone_number, message)
    elif settings.AWS_ACCESS_KEY_ID:
        return send_via_aws_sns(phone_number, message)
    elif settings.SMS_API_URL:
        return send_via_http_api(phone_number, message)
    else:
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
                "from": "JanSevaCRM",
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
        import requests

        # Strip +91 or any country code — Fast2SMS needs 10-digit Indian number
        number = phone_number.strip()
        if number.startswith("+91"):
            number = number[3:]
        elif number.startswith("91") and len(number) == 12:
            number = number[2:]
        number = number[-10:]  # always take last 10 digits

        url = "https://www.fast2sms.com/dev/bulkV2"
        params = {
            "authorization": settings.FAST2SMS_API_KEY,
            "route": "q",
            "message": f"Your Jan Seva CRM OTP is {otp}. Valid for 5 minutes. Do not share.",
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

        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        from_number = settings.TWILIO_PHONE_NUMBER

        if not all([account_sid, auth_token, from_number]):
            print("FAIL Twilio credentials not configured", flush=True)
            return False

        client = Client(account_sid, auth_token)

        if not phone_number.startswith("+"):
            phone_number = "+91" + phone_number

        message_obj = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )

        print(f"OK SMS sent via Twilio to {phone_number}", flush=True)
        print(f"   Message ID: {message_obj.sid}", flush=True)
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
