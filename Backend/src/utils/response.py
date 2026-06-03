"""
Utility Response Handler
"""
from typing import Any, Optional, Dict
from pydantic import BaseModel


class ResponseMessage:
    """Response messages"""
    SUCCESS = "Success"
    ERROR = "Error"
    NOT_FOUND = "Resource not found"
    UNAUTHORIZED = "Unauthorized"
    FORBIDDEN = "Forbidden"
    INVALID_INPUT = "Invalid input"
    INTERNAL_ERROR = "Internal server error"


class APIResponse(BaseModel):
    """Standard API response"""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    statusCode: int


def success_response(
    data: Any = None,
    message: str = ResponseMessage.SUCCESS,
    status_code: int = 200
) -> APIResponse:
    """Generate success response"""
    return APIResponse(
        success=True,
        message=message,
        data=data,
        statusCode=status_code
    )


def error_response(
    message: str = ResponseMessage.ERROR,
    error: Optional[Dict[str, Any]] = None,
    status_code: int = 400
) -> APIResponse:
    """Generate error response"""
    return APIResponse(
        success=False,
        message=message,
        error=error,
        statusCode=status_code
    )
