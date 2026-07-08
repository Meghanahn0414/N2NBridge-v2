from fastapi import APIRouter, Depends

from app.common.deps import get_db
from app.notifications import service
from app.notifications.schemas import RegisterDevice

router = APIRouter(prefix="/devices", tags=["notifications"])


@router.post("")
def register(body: RegisterDevice, ctx=Depends(get_db)):
    db, claims = ctx
    return service.register_device(
        db, claims["tid"], claims["sub"], body.token, body.platform
    )
