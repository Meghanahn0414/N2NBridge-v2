from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.common.deps import get_db
from app.tenants.models import Category, Role

router = APIRouter(prefix="/tenant", tags=["tenants"])


@router.get("/categories")
def categories(ctx=Depends(get_db)):
    db, _ = ctx
    return db.scalars(select(Category)).all()


@router.get("/roles")
def roles(ctx=Depends(get_db)):
    db, _ = ctx
    return db.scalars(select(Role)).all()
