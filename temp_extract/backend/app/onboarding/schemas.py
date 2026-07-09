from pydantic import BaseModel, Field


class ProvisionTenant(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=80)
    plan: str = "starter"
