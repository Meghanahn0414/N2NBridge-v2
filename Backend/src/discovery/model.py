"""
Discovery Models — citizen-facing "browse / follow any representative" feature.

This sits on top of the existing master.representatives registry (already
populated by auth/routes.py registration flow) and adds a new master
collection, citizen_follows, so a citizen who registered under one
representative's tenant database can still follow and read public content
from ANY other representative (MLA, MP, or COUNCILLOR) in the system.

A representative is identified purely by db_name — every tenant database
holds exactly one REPRESENTATIVE user (see utils/lookup_client.py and
citizens/routes.py's my_representatives), so no separate rep_id is needed.
"""
from typing import Optional

from pydantic import BaseModel, Field


class FollowRequest(BaseModel):
    """Body for POST /api/discovery/follow"""
    db_name:  str = Field(..., description="Tenant db_name of the representative to follow (from search results)")
    rep_type: Optional[str] = Field(None, description="MLA | MP | COUNCILLOR (stored for display; re-derived from registry if omitted)")
