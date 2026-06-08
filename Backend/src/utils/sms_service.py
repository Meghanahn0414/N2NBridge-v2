import os


def send_otp_via_sms(phone_number: str, otp: str, message: str = None) -> bool:
    """
    Send OTP via SMS to phone number
    
    Supports multiple providers:
    1. Twilio (Most reliable)
    2. AWS SNS
    3. Custom HTTP API
    
    Args:
        phone_number: Phone number to send OTP to (format: 10 digits or +91XXXXXXXXXX)
        otp: 4-digit OTP code
        message: Custom message template (optional)
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    
    # Default message
    if not message:
        message = f"Your CRM OTP is: {otp}\n\nThis OTP is valid for 5 minutes only.\nDo not share this with anyone.\n\nRegards,\nCRM Team"
    
    # Try Twilio first if configured
    if os.getenv("TWILIO_ACCOUNT_SID"):
        return send_via_twilio(phone_number, message)
    
    # Try AWS SNS if configured
    elif os.getenv("AWS_ACCESS_KEY_ID"):
        return send_via_aws_sns(phone_number, message)
    
    # Try custom HTTP API if configured
    elif os.getenv("SMS_API_URL"):
        return send_via_http_api(phone_number, message)
    
    # Fallback: Just log to console (for testing)
    else:
        return send_via_console(phone_number, otp)


def send_via_twilio(phone_number: str, message: str) -> bool:
    """Send SMS via Twilio"""
    try:
        from twilio.rest import Client
        
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not all([account_sid, auth_token, from_number]):
            print("❌ Twilio credentials not configured")
            return False
        
        client = Client(account_sid, auth_token)
        
        # Format phone number
        if not phone_number.startswith("+"):
            phone_number = "+91" + phone_number
        
        message_obj = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )
        
        print(f"✅ SMS sent via Twilio to {phone_number}")
        print(f"   Message ID: {message_obj.sid}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending SMS via Twilio: {str(e)}")
        return False


def send_via_aws_sns(phone_number: str, message: str) -> bool:
    """Send SMS via AWS SNS"""
    try:
        import boto3
        
        sns_client = boto3.client("sns")
        
        # Format phone number
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
        
        print(f"✅ SMS sent via AWS SNS to {phone_number}")
        print(f"   Message ID: {response['MessageId']}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending SMS via AWS SNS: {str(e)}")
        return False


def send_via_http_api(phone_number: str, message: str) -> bool:
    """Send SMS via custom HTTP API"""
    try:
        import requests
        
        sms_api_url = os.getenv("SMS_API_URL")
        sms_api_key = os.getenv("SMS_API_KEY")
        
        payload = {
            "phone": phone_number,
            "message": message,
            "api_key": sms_api_key
        }
        
        response = requests.post(sms_api_url, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ SMS sent via HTTP API to {phone_number}")
            return True
        else:
            print(f"❌ HTTP API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending SMS via HTTP API: {str(e)}")
        return False


def send_via_console(phone_number: str, otp: str) -> bool:
    """Fallback: Log OTP to console (for testing/development)"""
    print("\n" + "="*60)
    print("📱 SMS OTP (TESTING MODE)")
    print("="*60)
    print(f"Phone Number: {phone_number}")
    print(f"OTP Code: {otp}")
    print(f"Message: Your CRM OTP is: {otp}\n\nThis OTP is valid for 5 minutes only.\nDo not share this with anyone.\n\nRegards,\n CRM Team.")
    print("="*60 + "\n")
    return True
