from typing import Optional

from pydantic import BaseModel, Field


class CampaignBase(BaseModel):
    name: str
    type: Optional[str] = "AWARENESS"
    status: Optional[str] = "DRAFT"
    channel: Optional[str] = "SMS"
    audience: Optional[str] = None
    message: Optional[str] = None
    reach: Optional[int] = 0
    engagement: Optional[int] = 0
    roi: Optional[int] = 0
    startDate: Optional[str] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignResponse(CampaignBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
