from fastapi import APIRouter, Depends

from app.common.deps import get_db
from app.citizens import cases_service as svc
from app.citizens.schemas import CreateCase, CaseOut

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=CaseOut)
def create(body: CreateCase, ctx=Depends(get_db)):
    db, claims = ctx
    return svc.create(db, claims["sub"], claims["tid"], body)


@router.get("", response_model=list[CaseOut])
def list_cases(ctx=Depends(get_db)):
    db, claims = ctx
    return svc.list_for_citizen(db, claims["sub"])


@router.get("/{case_id}", response_model=CaseOut)
def detail(case_id: str, ctx=Depends(get_db)):
    db, claims = ctx
    return svc.detail(db, claims["sub"], case_id)
