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
from starlette.requests import Request


def get_client_ip(request: Request) -> str:
    """Safe IP extractor that works behind Vite proxy and direct connections."""
    # Respect forwarded headers set by proxies
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    # Direct connection (uvicorn)
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


# Keyed by client IP address
limiter = Limiter(key_func=get_client_ip, default_limits=["200/minute"])
