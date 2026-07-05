from fastapi import APIRouter

from app.auth import service
from app.auth.schemas import OtpRequest, OtpVerify, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/request")
def request_otp(body: OtpRequest):
    return service.request_otp(body.mobile, body.tenant_id)


@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(body: OtpVerify):
    return service.verify_otp(body.mobile, body.code, body.tenant_id)
