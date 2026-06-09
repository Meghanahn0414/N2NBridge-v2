import urllib.request

def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = r.read().decode('utf-8')
            print('URL:', url)
            print(data[:2000])
    except Exception as e:
        print('URL:', url, 'ERROR:', repr(e))

urls = [
    'http://127.0.0.1:8000/api/openapi.json',
    'http://127.0.0.1:8000/api/lookups/communication-channels',
    'http://127.0.0.1:8000/api/lookups/audience-segments',
]
for u in urls:
    fetch(u)
