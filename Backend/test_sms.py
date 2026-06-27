"""
Run this on EC2 to diagnose SMS delivery:
  cd /path/to/CRM-01/Backend
  python test_sms.py <10-digit-indian-number>
"""
import sys
import requests
from dotenv import dotenv_values

env = dotenv_values(".env")
api_key = env.get("FAST2SMS_API_KEY")
twilio_sid = env.get("TWILIO_ACCOUNT_SID")
twilio_token = env.get("TWILIO_AUTH_TOKEN")
twilio_number = env.get("TWILIO_PHONE_NUMBER")

phone = sys.argv[1] if len(sys.argv) > 1 else "9999999999"
otp = "123456"

print("\n=== SMS Diagnostic Tool ===")
print(f"Target number : {phone}")
print(f"Fast2SMS key  : {'SET (' + api_key[:8] + '...)' if api_key else 'NOT SET'}")
print(f"Twilio SID    : {'SET (' + twilio_sid[:8] + '...)' if twilio_sid else 'NOT SET'}")

# --- Test Fast2SMS ---
if api_key:
    print("\n[1] Testing Fast2SMS OTP route...")
    number = phone.strip()
    if number.startswith("+91"):
        number = number[3:]
    elif number.startswith("91") and len(number) == 12:
        number = number[2:]
    number = number[-10:]

    resp = requests.get("https://www.fast2sms.com/dev/bulkV2", params={
        "authorization": api_key,
        "route": "otp",
        "variables_values": otp,
        "numbers": number,
        "flash": 0,
    }, timeout=10)
    data = resp.json()
    print(f"    HTTP status : {resp.status_code}")
    print(f"    Response    : {data}")
    if data.get("return") is True:
        print("    RESULT: SUCCESS - Fast2SMS is working")
    else:
        print("    RESULT: FAILED - check the message above")
        print("    Common causes:")
        print("      - 'Insufficient balance' → recharge at fast2sms.com")
        print("      - 'Invalid authorization' → API key expired/wrong")
        print("      - 'Invalid route' → OTP route not enabled for your account")

# --- Test Twilio ---
if twilio_sid and twilio_token and twilio_number:
    print("\n[2] Testing Twilio...")
    try:
        from twilio.rest import Client
        client = Client(twilio_sid, twilio_token)
        to_number = "+91" + phone[-10:] if not phone.startswith("+") else phone
        msg = client.messages.create(
            body=f"Test OTP: {otp} — Jan Seva CRM diagnostic",
            from_=twilio_number,
            to=to_number,
        )
        print(f"    RESULT: SUCCESS — SID: {msg.sid}")
    except Exception as e:
        print(f"    RESULT: FAILED — {e}")
        if "unverified" in str(e).lower() or "trial" in str(e).lower():
            print("    → Twilio trial account: verify the recipient number at twilio.com/console")
else:
    print("\n[2] Twilio: not fully configured, skipping")

print("\n=== Done ===\n")
