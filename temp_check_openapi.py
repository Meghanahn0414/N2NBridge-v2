import urllib.request

url = 'http://127.0.0.1:8000/api/openapi.json'
with urllib.request.urlopen(url, timeout=5) as r:
    text = r.read().decode('utf-8')
print('/api/lookups/communication-channels' in text)
print('/api/lookups/audience-segments' in text)
print('/api/lookups/countries' in text)
