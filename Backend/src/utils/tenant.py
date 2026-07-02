"""
Tenant database dependency for FastAPI routes.
"""
from typing import Optional

from bson import ObjectId
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
    payload = TokenManager.verify_token(token)
    return _resolve_admin_managed_tenant(payload)


def _resolve_admin_managed_tenant(payload: Optional[dict]) -> Optional[dict]:
    """
    A scoped Admin's own login never becomes a Representative login (that
    elevation flow was deliberately removed — the Admin keeps using the
    normal Admin Portal permanently). But tenant-scoped, rep-only endpoints
    (/api/staff/, /api/rep/grievances/*, /api/citizens/ list/detail, etc.)
    only work for a caller whose db_name points at a tenant and whose role
    passes each endpoint's own REPRESENTATIVE/STAFF check — an Admin's token
    carries db_name=master and role=ADMIN, so those endpoints would either
    404 on the wrong database or 403 on the role check, even though the
    Admin is the one meant to manage that tenant's team/grievances/citizens
    day to day.

    Once the Admin has registered their one representative (managedDbName
    set on their master.users doc), resolve their EFFECTIVE tenant identity
    here — db_name becomes the managed tenant, role becomes REPRESENTATIVE —
    for every endpoint that goes through require_auth/get_tenant_db. The
    original admin user_id is preserved under `admin_user_id` so any
    endpoint that still needs to tell "this is really an Admin, treat them
    specially" apart from a genuine Representative can check for that key —
    see users/routes.py's list_users(), which restores its own ADMIN-specific
    cross-tenant/isolation branch when admin_user_id is present rather than
    falling into the plain single-tenant Representative branch.
    """
    if not payload or payload.get("role") != "ADMIN":
        return payload
    try:
        master = MongoDatabase.get_db()
        admin_doc = master.users.find_one({"_id": ObjectId(payload.get("user_id"))})
    except Exception:
        return payload
    managed_db_name = (admin_doc or {}).get("managedDbName")
    if not managed_db_name:
        return payload
    return {**payload, "db_name": managed_db_name, "role": "REPRESENTATIVE", "admin_user_id": payload.get("user_id")}


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
