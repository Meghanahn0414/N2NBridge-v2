"""
Lookup Service request/response models.
"""
from typing import Optional

from pydantic import BaseModel, Field


class RegisterServerRequest(BaseModel):
    """
    Sent by a representative's own server (on startup, or by a one-time
    setup script) to add/update itself in the lookup registry.
    """
    name:                str            = Field(..., description="Representative's display name")
    rep_type:            str            = Field(..., description="MLA | MP | COUNCILLOR")
    server_url:          str            = Field(..., description="This representative's own server base URL, e.g. https://mandya-mla.example.com")
    db_url:              Optional[str]  = Field(None, description="This representative's own MongoDB connection string. Sensitive — see README security note before relying on this field.")

    assembly_name:       Optional[str]  = Field(None, description="Required for rep_type=MLA")
    parliamentary_name:  Optional[str]  = Field(None, description="Required for rep_type=MP")
    ward_id:             Optional[str]  = Field(None, description="Required for rep_type=COUNCILLOR")
    ward_name:           Optional[str]  = Field(None, description="Human-readable ward name")

    taluk:                Optional[str] = Field(None)
    district:             Optional[str] = Field(None)
    state:                Optional[str] = Field(None)
