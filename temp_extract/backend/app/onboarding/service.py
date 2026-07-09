"""Tenant provisioning — onboards a new tenant in one transaction.

Runs above tenant RLS (it *creates* the tenant), so it uses a system session.
"""
from app.common.db import system_session
from app.tenants.models import Tenant, Role, Category
from app.subscriptions.models import Subscription

DEFAULT_ROLES = ["admin", "rep", "field_officer"]
DEFAULT_CATEGORIES = ["Roads", "Water", "Power", "Sanitation", "Parks", "Other"]


def provision(body) -> dict:
    with system_session() as db:
        tenant = Tenant(name=body.name, slug=body.slug, plan=body.plan)
        db.add(tenant)
        db.flush()

        db.add_all([Role(tenant_id=tenant.id, name=r) for r in DEFAULT_ROLES])
        db.add_all(
            [Category(tenant_id=tenant.id, name=c) for c in DEFAULT_CATEGORIES]
        )
        db.add(
            Subscription(tenant_id=tenant.id, plan=body.plan, status="trialing")
        )
        return {"tenant_id": str(tenant.id), "slug": tenant.slug}
