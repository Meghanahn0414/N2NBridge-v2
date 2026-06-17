"""
Rate Limiting via SlowAPI
Protects sensitive endpoints (login, OTP) from brute-force and general
endpoints from abusive traffic.

Usage in a route:
    from config.rate_limit import limiter
    from fastapi import Request

    @router.post("/login")
    @limiter.limit("10/minute")
    async def login(request: Request, ...):
        ...
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Keyed by client IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
