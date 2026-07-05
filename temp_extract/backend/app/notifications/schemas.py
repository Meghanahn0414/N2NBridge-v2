from typing import Literal

from pydantic import BaseModel, Field


class RegisterDevice(BaseModel):
    token: str = Field(min_length=8, max_length=255)
    platform: Literal["ios", "android"]
