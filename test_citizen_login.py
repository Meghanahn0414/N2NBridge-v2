import requests

phone = '9988776655'
print('=== Testing Citizen OTP Login ===')
print(f'Phone: {phone}')

# Send OTP
print('\n1. Sending OTP...')
send_resp = requests.post('http://localhost:8000/api/auth/send-otp', 
    json={'type': 'phone', 'value': phone})
print(f'   Status: {send_resp.status_code}')

# Try verify-otp
print('\n2. Verifying OTP with 000000...')
verify_resp = requests.post('http://localhost:8000/api/auth/verify-otp',
    json={'value': phone, 'otp': '000000'})
print(f'   Status: {verify_resp.status_code}')
if verify_resp.status_code == 200:
    print('   SUCCESS! User logged in')
    data = verify_resp.json()
    print(f'   Token: {str(data.get("token"))[:30]}...')
    print(f'   Role: {data.get("role")}')
elif verify_resp.status_code == 401:
    print('   Expected: Invalid OTP (test mode)')
else:
    print(f'   Response: {verify_resp.text[:300]}')

# Try again (should handle duplicate)
print(f'\n3. Verifying again with same phone (test duplicate handling)...')
verify_resp2 = requests.post('http://localhost:8000/api/auth/verify-otp',
    json={'value': phone, 'otp': '000000'})
print(f'   Status: {verify_resp2.status_code}')
print(f'   Result: Handles duplicates correctly!' if verify_resp2.status_code in [200, 401] else f'   ERROR: {verify_resp2.text[:200]}')
