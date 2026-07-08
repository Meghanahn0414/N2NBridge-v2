from pydantic import BaseModel, Field


class OtpRequest(BaseModel):
    mobile: str = Field(min_length=6, max_length=20)
    tenant_id: str


class OtpVerify(BaseModel):
    mobile: str = Field(min_length=6, max_length=20)
    code: str = Field(min_length=6, max_length=6)
    tenant_id: str


class TokenResponse(BaseModel):
    token: str
