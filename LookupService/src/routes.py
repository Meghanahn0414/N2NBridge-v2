"""
Lookup Service routes.

Three jobs, and nothing else:
  1. GET  /api/lookup/constituencies   — dropdown data for the app's
     "choose your Councillor / MLA / MP" screen.
  2. GET  /api/lookup/resolve          — given a rep_type + the constituency
     identifier the citizen picked (ward_id / assembly_name / parliamentary_name),
     return that representative's OWN server_url. The app then talks directly
     to that server for everything else (login, profile, grievances...).
  3. POST /api/lookup/register         — a representative's own server
     calls this (on startup, or via a one-time setup script) to add/update
     itself in the registry. Protected by a shared secret header.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from config import settings
from database import LookupDatabase
from models import RegisterServerRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/lookup", tags=["Lookup"])

REP_TYPES = ("MLA", "MP", "COUNCILLOR")


def _success(data, message="OK"):
    return {"success": True, "message": message, "data": data}


def _slugify(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "rep"


def _ensure_unique_slug(db, base_slug: str) -> str:
    slug = base_slug
    n = 2
    while db.representatives.find_one({"slug": slug}):
        slug = f"{base_slug}-{n}"
        n += 1
    return slug


def _next_rep_code(db, rep_type: str) -> str:
    prefix = rep_type[:3].upper()
    count = db.representatives.count_documents({"rep_type": rep_type.upper()})
    return f"{prefix}{count + 1:05d}"


def _identifier_query(rep_type: str, assembly_name: Optional[str],
                       parliamentary_name: Optional[str], ward_id: Optional[str]) -> dict:
    """Case-insensitive exact match on whichever identifier applies to rep_type."""
    if rep_type == "MLA":
        if not assembly_name:
            raise HTTPException(status_code=400, detail="assembly_name is required for MLA")
        return {"rep_type": "MLA", "assembly_name": {"$regex": f"^{re.escape(assembly_name.strip())}$", "$options": "i"}}
    if rep_type == "MP":
        if not parliamentary_name:
            raise HTTPException(status_code=400, detail="parliamentary_name is required for MP")
        return {"rep_type": "MP", "parliamentary_name": {"$regex": f"^{re.escape(parliamentary_name.strip())}$", "$options": "i"}}
    if not ward_id:
        raise HTTPException(status_code=400, detail="ward_id is required for COUNCILLOR")
    return {"rep_type": "COUNCILLOR", "ward_id": {"$regex": f"^{re.escape(ward_id.strip())}$", "$options": "i"}}


def _public_doc(r: dict) -> dict:
    return {
        "rep_code":            r.get("rep_code", ""),
        "slug":                r.get("slug", ""),
        "name":                r.get("name", ""),
        "rep_type":            r.get("rep_type", ""),
        "server_url":          r.get("server_url", ""),
        "db_url":              r.get("db_url") or "",
        "assembly_name":       r.get("assembly_name") or "",
        "parliamentary_name":  r.get("parliamentary_name") or "",
        "ward_id":             r.get("ward_id") or "",
        "ward_name":           r.get("ward_name") or "",
        "taluk":               r.get("taluk") or "",
        "district":            r.get("district") or "",
        "state":               r.get("state") or "",
    }


@router.get("/health")
async def health():
    return {"status": "healthy", "service": "N2N Lookup Service"}


@router.get("/representatives", summary="List every registered representative with full details")
async def list_representatives(
    rep_type:      Optional[str] = None,
    x_lookup_key:  Optional[str] = Header(None, alias="X-Lookup-Key"),
):
    """
    Admin/debug endpoint — returns the full registry (name, rep_type,
    server_url, constituency identifiers) for every representative, or
    filtered by rep_type. Protected by the same shared secret used for
    /register, since server_url is otherwise not exposed anywhere else.

    Examples:
      GET /api/lookup/representatives                     -> all reps
      GET /api/lookup/representatives?rep_type=MLA          -> only MLAs
    """
    if x_lookup_key != settings.LOOKUP_REGISTER_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Lookup-Key")

    query = {}
    if rep_type:
        rep_type = rep_type.strip().upper()
        if rep_type not in REP_TYPES:
            raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")
        query["rep_type"] = rep_type

    db = LookupDatabase.get_db()
    reps = list(db.representatives.find(query).sort([("rep_type", 1), ("name", 1)]))

    return _success({
        "count": len(reps),
        "items": [_public_doc(r) for r in reps],
    }, "Representatives retrieved")


@router.get("/constituencies", summary="List registered constituencies for a representative type")
async def list_constituencies(rep_type: str):
    """Public — no auth. Populates the citizen app's constituency picker."""
    rep_type = rep_type.strip().upper()
    if rep_type not in REP_TYPES:
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

    db = LookupDatabase.get_db()
    reps = list(db.representatives.find(
        {"rep_type": rep_type},
        {"_id": 0, "name": 1, "assembly_name": 1, "parliamentary_name": 1,
         "ward_id": 1, "ward_name": 1, "district": 1, "state": 1},
    ))

    items = []
    for r in reps:
        if rep_type == "MLA":
            items.append({
                "label": r.get("assembly_name", ""), "rep_name": r.get("name", ""),
                "assembly_name": r.get("assembly_name", ""),
                "district": r.get("district", ""), "state": r.get("state", ""),
            })
        elif rep_type == "MP":
            items.append({
                "label": r.get("parliamentary_name", ""), "rep_name": r.get("name", ""),
                "parliamentary_name": r.get("parliamentary_name", ""),
                "district": r.get("district", ""), "state": r.get("state", ""),
            })
        else:
            items.append({
                "label": r.get("ward_name") or r.get("ward_id", ""), "rep_name": r.get("name", ""),
                "ward_id": r.get("ward_id", ""), "ward_name": r.get("ward_name", ""),
                "district": r.get("district", ""), "state": r.get("state", ""),
            })

    return _success({"rep_type": rep_type, "items": items}, "Constituencies retrieved")


@router.get("/resolve", summary="Resolve a chosen constituency to its representative's server")
async def resolve(
    rep_type:            str,
    assembly_name:       Optional[str] = None,
    parliamentary_name:  Optional[str] = None,
    ward_id:             Optional[str] = None,
):
    """
    Public — no auth. This is the one call the app makes before it can talk
    to a representative's server at all.

    - `rep_type=MLA&assembly_name=Mandya Assembly Constituency`
    - `rep_type=MP&parliamentary_name=Mysore Parliamentary Constituency`
    - `rep_type=COUNCILLOR&ward_id=WARD-012`

    Returns the representative's summary AND `server_url` — the app then
    points all further requests (registration, login, grievances, ...) at
    that server directly.
    """
    rep_type = rep_type.strip().upper()
    if rep_type not in REP_TYPES:
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

    query = _identifier_query(rep_type, assembly_name, parliamentary_name, ward_id)

    db = LookupDatabase.get_db()
    rep = db.representatives.find_one(query)
    if not rep:
        raise HTTPException(status_code=404, detail="No representative found for the selected constituency")
    if not rep.get("server_url"):
        raise HTTPException(status_code=503, detail="Representative found but has no server registered yet")

    return _success(_public_doc(rep), "Representative resolved")


@router.post("/register", summary="A representative's server registers/updates itself")
async def register_server(
    body: RegisterServerRequest,
    x_lookup_key: Optional[str] = Header(None, alias="X-Lookup-Key"),
):
    """
    Called by each representative's own server — typically once at startup
    — so the lookup registry always has an up-to-date server_url for it.
    Idempotent: calling this again for the same rep_type + constituency just
    updates the existing entry (e.g. after the server's URL changes).
    """
    if x_lookup_key != settings.LOOKUP_REGISTER_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Lookup-Key")

    rep_type = body.rep_type.strip().upper()
    if rep_type not in REP_TYPES:
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")
    if not body.server_url.strip():
        raise HTTPException(status_code=400, detail="server_url is required")

    query = _identifier_query(rep_type, body.assembly_name, body.parliamentary_name, body.ward_id)

    db = LookupDatabase.get_db()
    now = datetime.now(timezone.utc)
    existing = db.representatives.find_one(query)

    if existing:
        db.representatives.update_one({"_id": existing["_id"]}, {"$set": {
            "name":       body.name.strip(),
            "server_url": body.server_url.strip().rstrip("/"),
            "db_url":     (body.db_url.strip() if body.db_url else existing.get("db_url", "")),
            "ward_name":  (body.ward_name or existing.get("ward_name") or ""),
            "taluk":      (body.taluk or existing.get("taluk") or ""),
            "district":   (body.district or existing.get("district") or ""),
            "state":      (body.state or existing.get("state") or ""),
            "updated_at": now,
        }})
        rep = db.representatives.find_one({"_id": existing["_id"]})
        logger.info(f"Lookup: updated {rep_type} '{body.name}' -> {body.server_url}")
    else:
        base_slug = _slugify(f"{body.name}-{rep_type}")
        slug = _ensure_unique_slug(db, base_slug)
        rep_code = _next_rep_code(db, rep_type)
        doc = {
            "slug": slug, "rep_code": rep_code, "name": body.name.strip(), "rep_type": rep_type,
            "assembly_name":      (body.assembly_name or ""),
            "parliamentary_name": (body.parliamentary_name or ""),
            "ward_id":            (body.ward_id or ""),
            "ward_name":          (body.ward_name or ""),
            "taluk":              (body.taluk or ""),
            "district":           (body.district or ""),
            "state":              (body.state or ""),
            "server_url":         body.server_url.strip().rstrip("/"),
            "db_url":             (body.db_url.strip() if body.db_url else ""),
            "created_at":         now,
            "updated_at":         now,
        }
        db.representatives.insert_one(doc)
        rep = doc
        logger.info(f"Lookup: registered new {rep_type} '{body.name}' ({rep_code}) -> {body.server_url}")

    return _success(_public_doc(rep), "Representative registered")
