"""Debug helper to run notification route logic locally"""
import sys
sys.path.insert(0, __file__.rsplit('\\', 2)[0])

from config.settings import settings
from config.database import MongoDatabase
from utils.jwt import TokenManager
import asyncio


def main():
    MongoDatabase.connect(settings.MONGODB_URL, settings.MONGODB_DB)

    # token copied from earlier run
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNmEyMWJhYzZjMjU2MTg3Yjg1YjcyMmFkIiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzgwNzM1MDg2fQ.L9ysaXEghMSgRReminUrRfGG7yqXe1JsJogjfcKzYWA'
    payload = TokenManager.verify_token(token)
    print('payload:', payload)

    from notifications.routes import get_unread_notifications

    res = asyncio.run(get_unread_notifications(payload))
    print('route result:', res)


if __name__ == '__main__':
    main()
