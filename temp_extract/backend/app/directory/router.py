"""Directory — the tenant registry.

Source of truth for which tenants exist and their config. Read-heavy, so in
production put a Redis cache in front of these lookups. Runs above tenant RLS
because resolving a tenant is what happens *before* a tenant context exists.
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.common.db import system_session
from app.tenants.models import Tenant

router = APIRouter(prefix="/directory", tags=["directory"])


@router.get("/tenants/{slug}")
def resolve(slug: str):
    with system_session() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == slug))
        if not tenant:
            raise HTTPException(status_code=404, detail="Unknown tenant")
        return {"id": str(tenant.id), "name": tenant.name, "plan": tenant.plan}
