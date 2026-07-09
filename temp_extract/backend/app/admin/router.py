"""Admin Portal API — internal operations over all modules.

Guarded by the 'admin' role. Reads run in the caller's tenant context.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.common.deps import get_db, require_role
from app.citizens.models import Case, Citizen

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def overview(ctx=Depends(get_db), _claims=Depends(require_role("admin"))):
    db, _ = ctx
    citizens = db.scalar(select(func.count()).select_from(Citizen))
    open_cases = db.scalar(
        select(func.count()).select_from(Case).where(Case.status != "resolved")
    )
    return {"citizens": citizens, "open_cases": open_cases}
