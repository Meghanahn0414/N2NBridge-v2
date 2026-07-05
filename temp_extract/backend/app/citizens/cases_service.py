import uuid

from fastapi import HTTPException
from sqlalchemy import select

from app.citizens.models import Case, CaseEvent
from app.notifications import service as notify


def _make_ref() -> str:
    return "N2-" + uuid.uuid4().hex[:6].upper()


def create(db, citizen_id: str, tenant_id: str, body):
    case = Case(
        tenant_id=tenant_id,
        citizen_id=citizen_id,
        ref=_make_ref(),
        category=body.category,
        title=body.title,
        description=body.description,
        ward=body.ward,
        status="new",
    )
    db.add(case)
    db.flush()
    db.add(
        CaseEvent(
            tenant_id=tenant_id,
            case_id=case.id,
            kind="created",
            detail="Report received",
        )
    )
    # Fire-and-forget notification (move to a worker in production).
    notify.on_case_created(tenant_id, citizen_id, case)
    return case


def list_for_citizen(db, citizen_id: str):
    return db.scalars(
        select(Case)
        .where(Case.citizen_id == citizen_id)
        .order_by(Case.created_at.desc())
    ).all()


def detail(db, citizen_id: str, case_id: str):
    case = db.scalar(
        select(Case).where(Case.id == case_id, Case.citizen_id == citizen_id)
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
