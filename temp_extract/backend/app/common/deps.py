from fastapi import Depends, Header, HTTPException

from app.common.db import tenant_session
from app.common.security import decode_token


def current_claims(authorization: str = Header(...)) -> dict:
    """Extract and verify the JWT claims from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        return decode_token(authorization[7:])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_db(claims: dict = Depends(current_claims)):
    """Yield a tenant-scoped DB session plus the caller's claims.

    Every protected route depends on this — it guarantees RLS context is set.
    """
    with tenant_session(claims["tid"]) as db:
        yield db, claims


def require_role(*roles: str):
    """Dependency factory: restrict a route to specific roles."""

    def _guard(claims: dict = Depends(current_claims)) -> dict:
        if claims.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return claims

    return _guard
