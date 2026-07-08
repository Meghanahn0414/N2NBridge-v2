from fastapi import HTTPException
from sqlalchemy import select

from app.citizens.models import Citizen


def profile(db, citizen_id: str):
    citizen = db.get(Citizen, citizen_id)
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    return citizen


def update(db, citizen_id: str, name: str | None):
    citizen = profile(db, citizen_id)
    if name is not None:
        citizen.name = name
    return citizen
