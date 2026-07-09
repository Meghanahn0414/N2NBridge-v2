from fastapi import APIRouter, Depends

from app.common.deps import require_role
from app.onboarding import service
from app.onboarding.schemas import ProvisionTenant

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/provision")
def provision(body: ProvisionTenant, _claims=Depends(require_role("admin"))):
    return service.provision(body)
