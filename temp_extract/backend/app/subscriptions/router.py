from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.common.deps import get_db
from app.subscriptions.models import Subscription

router = APIRouter(prefix="/billing", tags=["subscriptions"])


@router.get("/subscription")
def current_subscription(ctx=Depends(get_db)):
    db, _ = ctx
    return db.scalar(select(Subscription))
