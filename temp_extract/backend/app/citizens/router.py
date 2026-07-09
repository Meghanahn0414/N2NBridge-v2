from fastapi import APIRouter, Depends

from app.common.deps import get_db
from app.citizens import service
from app.citizens.schemas import CitizenOut, UpdateProfile

router = APIRouter(tags=["citizens"])


@router.get("/me", response_model=CitizenOut)
def me(ctx=Depends(get_db)):
    db, claims = ctx
    return service.profile(db, claims["sub"])


@router.patch("/me", response_model=CitizenOut)
def update_me(body: UpdateProfile, ctx=Depends(get_db)):
    db, claims = ctx
    return service.update(db, claims["sub"], body.name)
