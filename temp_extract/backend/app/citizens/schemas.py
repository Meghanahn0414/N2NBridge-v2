from datetime import datetime

from pydantic import BaseModel, Field


class CreateCase(BaseModel):
    category: str = Field(min_length=1, max_length=60)
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=1)
    ward: str | None = None


class CaseOut(BaseModel):
    id: str
    ref: str
    category: str
    title: str
    status: str
    ward: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CitizenOut(BaseModel):
    id: str
    mobile: str
    name: str | None

    class Config:
        from_attributes = True


class UpdateProfile(BaseModel):
    name: str | None = Field(default=None, max_length=120)
