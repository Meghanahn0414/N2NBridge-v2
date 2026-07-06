"""
Discovery Routes — citizen-facing cross-representative browsing.

GET    /api/discovery/representatives         Search/browse any MLA, MP, or COUNCILLOR
GET    /api/discovery/representatives/{db_name}   Public profile card
POST   /api/discovery/follow                   Follow a representative
DELETE /api/discovery/follow/{db_name}         Unfollow
GET    /api/discovery/following                This citizen's followed representatives
GET    /api/discovery/feed                     Aggregated feed across followed representatives

Auth: these all require a logged-in citizen (any tenant works — require_auth
resolves db_name/user_id from the JWT regardless of which tenant they
registered under). Search and public-profile are read-only and don't touch
the caller's own tenant db at all, only the master registry + the target
representative's own tenant db.

Representatives are identified by db_name alone — every tenant database
holds exactly one REPRESENTATIVE user, so no separate rep_id is needed
(see discovery/service.py's module docstring).
"""
import logging
from typing import Optional

from discovery.model import FollowRequest
from discovery.service import DiscoveryService
from fastapi import APIRouter, Depends, HTTPException, Query
from utils.response import success_response
from utils.tenant import require_auth

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])
logger = logging.getLogger(__name__)


def _home_identity(user: dict) -> tuple[str, str]:
    home_db_name = user.get("db_name")
    home_user_id = user.get("user_id")
    if not home_db_name or not home_user_id:
        raise HTTPException(status_code=401, detail="Invalid session")
    return home_db_name, home_user_id


@router.get("/representatives")
async def search_representatives(
    rep_type: Optional[str] = Query(None, description="MLA | MP | COUNCILLOR"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    q: Optional[str] = Query(None, description="Free-text search across name / constituency / ward"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(require_auth),  # noqa: ARG001 — any logged-in citizen, tenant-agnostic
):
    """Browse or search any representative in the system, regardless of the
    caller's own home tenant."""
    if rep_type and rep_type.strip().upper() not in ("MLA", "MP", "COUNCILLOR"):
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")
    data = DiscoveryService.search_representatives(rep_type, state, district, q, page, per_page)
    return success_response(data, "Representatives retrieved")


@router.get("/representatives/{db_name}")
async def get_representative_profile(
    db_name: str,
    user=Depends(require_auth),  # noqa: ARG001
):
    """Public profile card for one representative, read directly from their
    own tenant database — works for any rep_type and any tenant."""
    profile = DiscoveryService.get_public_profile(db_name)
    if not profile:
        raise HTTPException(status_code=404, detail="Representative not found")
    return success_response(profile, "Representative profile retrieved")


@router.post("/follow")
async def follow_representative(body: FollowRequest, user: dict = Depends(require_auth)):
    """Follow a representative — any MLA, MP, or COUNCILLOR — in addition to
    the citizen's own home representative. Safe to call again for the same
    representative (re-follow just refreshes followedAt)."""
    home_db_name, home_user_id = _home_identity(user)
    try:
        entry = DiscoveryService.follow(home_db_name, home_user_id, body.db_name, body.rep_type)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return success_response(entry, "Representative followed")


@router.delete("/follow/{db_name}")
async def unfollow_representative(db_name: str, user: dict = Depends(require_auth)):
    home_db_name, home_user_id = _home_identity(user)
    DiscoveryService.unfollow(home_db_name, home_user_id, db_name)
    return success_response(None, "Representative unfollowed")


@router.get("/following")
async def list_following(user: dict = Depends(require_auth)):
    home_db_name, home_user_id = _home_identity(user)
    items = DiscoveryService.list_following(home_db_name, home_user_id)
    return success_response({"items": items, "total": len(items)}, "Following list retrieved")


@router.get("/feed")
async def get_feed(user: dict = Depends(require_auth)):
    home_db_name, home_user_id = _home_identity(user)
    items = DiscoveryService.get_feed(home_db_name, home_user_id)
    return success_response({"items": items, "total": len(items)}, "Feed retrieved")
