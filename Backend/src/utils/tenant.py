"""
Tenant database dependency for FastAPI routes.
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request
from utils.jwt import TokenManager
from config.database import MongoDatabase
import logging

logger = logging.getLogger(__name__)


def _extract_user(request: Request) -> Optional[dict]:
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        return None
    return TokenManager.verify_token(token)


def require_auth(
    request: Request,
    token_payload: Optional[dict] = Depends(_extract_user),
) -> dict:
    """Return auth payload when available, otherwise fall back to tenant identity headers/query."""
    if token_payload:
        return token_payload

    x_db_name = request.headers.get("X-DB-NAME")
    x_user_id = request.headers.get("X-USER-ID")
    x_user_role = request.headers.get("X-USER-ROLE")
    db_name_query = request.query_params.get("db_name")

    if not x_db_name and not db_name_query:
        return {}

    return {
        "db_name": x_db_name or db_name_query,
        "user_id": x_user_id,
        "role": (x_user_role or "REPRESENTATIVE").upper(),
    }


def optional_auth(request: Request) -> Optional[dict]:
    """Same as require_auth but returns None instead of raising if missing/invalid."""
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        return None
    return TokenManager.verify_token(token)


def get_tenant_db(
    request: Request,
    current_user: dict = Depends(require_auth),
):
    """Resolves the caller's tenant database from JWT or explicit tenant identity."""
    db_name = current_user.get("db_name") if current_user else None
    if not db_name:
        db_name = request.headers.get("X-DB-NAME") or request.query_params.get("db_name")

    if not db_name:
        raise HTTPException(
            status_code=400,
            detail="Tenant db_name is required. Provide a valid JWT or pass X-DB-NAME / db_name.",
        )
    return MongoDatabase.get_tenant_db(db_name)
