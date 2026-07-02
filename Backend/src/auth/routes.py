"""
Authentication Routes — Multi-Tenant Architecture

─── Representative ──────────────────────────────────────────────
POST /api/auth/representative/register   Register MLA / MP / Councillor
POST /api/auth/representative/login      Login (email + password)
GET  /api/auth/representative/verify     Verify JWT token
POST /api/auth/representative/change-password

─── Staff ───────────────────────────────────────────────────────
POST /api/auth/staff/register            Representative adds staff member

─── Citizen ─────────────────────────────────────────────────────
GET  /api/auth/citizen/resolve/{slug}    Get tenant info from invite link
POST /api/auth/citizen/send-otp          Send OTP (mobile or email)
POST /api/auth/citizen/register          Verify OTP → create/login citizen
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from auth.otp_service import OTP_STORAGE, OTPService
from auth.service import AuthService
from config.database import MongoDatabase
from config.rate_limit import limiter
from config.security import SecurityManager
from config.settings import settings
from users.model import (
    CitizenCompleteProfileRequest,
    CitizenRegisterRequest,
    OtpResponse,
    RepresentativeRegisterRequest,
    SendOtpRequest,
    StaffRegisterRequest,
    TokenResponse,
    UserCreate,
    UserLoginRequest,
    UserPasswordChange,
    UserResponse,
    VerifyOtpRequest,
)
from users.service import UserService
from utils.email_service import send_email
from utils.jwt import TokenManager
from utils.response import success_response

# ── Three routers — one per Swagger section ───────────────────────────────────
rep_router     = APIRouter(prefix="/api/auth/representative", tags=["Representative"])
staff_router   = APIRouter(prefix="/api/auth/staff",          tags=["Staff Auth"])
citizen_router = APIRouter(prefix="/api/auth/citizen",        tags=["Citizen"])

# Keep old prefix router for backward-compat endpoints (login-admin, /register legacy)
compat_router  = APIRouter(prefix="/api/auth",                tags=["Authentication"])

logger = logging.getLogger(__name__)


# ── Shared auth helpers ───────────────────────────────────────────────────────

def get_current_user(request: Request):
    """Strict auth — raises 401 if missing or invalid."""
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def get_current_user_optional(request: Request):
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        return None
    return AuthService.verify_token(token)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _generate_slug(name: str, rep_type: str) -> str:
    clean  = re.sub(r"[^a-z0-9]+", "-", name.lower().strip()).strip("-")
    suffix = rep_type.lower()
    return f"{clean}-{suffix}" if not clean.endswith(f"-{suffix}") else clean


def _generate_db_name(slug: str) -> str:
    return slug.replace("-", "_") + "_db"


def _next_rep_code(master_db, rep_type: str) -> str:
    prefix = rep_type[:3].upper()
    count  = master_db.representatives.count_documents({"rep_type": rep_type.upper()})
    return f"{prefix}{count + 1:05d}"


def _ensure_unique_slug(master_db, base_slug: str) -> str:
    slug = base_slug
    n    = 2
    while master_db.representatives.find_one({"slug": slug}):
        slug = f"{base_slug}-{n}"
        n += 1
    return slug


def _next_citizen_id(tenant_db) -> str:
    count = tenant_db.citizens.count_documents({})
    return f"CIT{count + 1:05d}"


def _citizen_to_user_response(citizen: dict) -> dict:
    return {
        "_id":      citizen.get("_id", ""),
        "fullName": citizen.get("name", ""),
        "mobile":   citizen.get("mobile", ""),
        "email":    citizen.get("email", ""),
        "role":     "CITIZEN",
        "status":   "ACTIVE" if not citizen.get("is_deleted") else "INACTIVE",
        "createdAt": citizen.get("created_at"),
        "updatedAt": citizen.get("updated_at"),
    }


def _find_existing_citizen(master, email: Optional[str], mobile: Optional[str]):
    """
    Returns (db_name, citizen_doc) for a RETURNING citizen who already
    completed their profile in some representative's tenant, or None if this
    is a genuinely new citizen.

    Citizens never got a master.user_registry entry the way Admin/Rep/Staff
    accounts do (see citizen_register / complete_citizen_profile below, which
    now write one). Without this, every plain OTP re-login in
    verify_otp_compat had no way to find a citizen's existing tenant record —
    it always fell back to creating a brand-new, blank master.users
    placeholder (empty fullName, no db_name), which is why a citizen who'd
    already registered and filed real grievances could log back in and see
    an empty "No reports yet" dashboard under their own email as the display
    name.

    Checks the registry first (fast path, populated going forward). Falls
    back to scanning each active representative's tenant `citizens`
    collection by email/mobile for accounts created before the registry
    started being populated — self-healing, and backfills the registry once
    found so the fast path works next time.
    """
    contact_or = []
    if email:
        contact_or.append({"email": email})
    if mobile:
        contact_or.append({"mobile": mobile})
    if not contact_or:
        return None

    entry = master.user_registry.find_one({"role": "CITIZEN", "$or": contact_or})
    if entry and entry.get("db_name") and entry.get("user_id"):
        try:
            tenant_db = MongoDatabase.get_tenant_db(entry["db_name"])
            citizen = tenant_db.citizens.find_one(
                {"_id": ObjectId(entry["user_id"]), "is_deleted": {"$ne": True}}
            )
            if citizen:
                return entry["db_name"], citizen
        except Exception:
            pass

    for rep in master.representatives.find({"status": "ACTIVE"}, {"db_name": 1}):
        db_name = rep.get("db_name")
        if not db_name:
            continue
        tenant_db = MongoDatabase.get_tenant_db(db_name)
        citizen = tenant_db.citizens.find_one({"is_deleted": {"$ne": True}, "$or": contact_or})
        if citizen and (citizen.get("name") or "").strip():
            master.user_registry.update_one(
                {"role": "CITIZEN", "user_id": str(citizen["_id"])},
                {"$set": {
                    "email":   citizen.get("email") or email,
                    "mobile":  citizen.get("mobile") or mobile,
                    "db_name": db_name, "role": "CITIZEN",
                    "user_id": str(citizen["_id"]),
                }},
                upsert=True,
            )
            return db_name, citizen
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# REPRESENTATIVE ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

def _create_representative_account(body: RepresentativeRegisterRequest) -> dict:
    """
    Shared by the public rep_router registration endpoint and the scoped-
    admin "register my representative" flow — creates the tenant database +
    representative account and returns everything the caller needs
    (slug, db_name, token, user info). Raises HTTPException on validation
    failure or duplicate email/mobile, same as before this was extracted.
    """
    master = MongoDatabase.get_db()

    name     = body.name.strip()
    rep_type = body.rep_type.strip().upper()
    mobile   = body.mobile.strip()
    email    = body.email.strip().lower()
    password = body.password.strip()
    location = body.location.strip()

    assembly_name      = (body.assembly_name      or "").strip()
    parliamentary_name = (body.parliamentary_name or "").strip()
    ward_id            = (body.ward_id            or "").strip()
    ward_name          = (body.ward_name          or "").strip()
    taluk              = (body.taluk              or "").strip()
    district           = (body.district           or "").strip()
    state              = (body.state              or "").strip()

    if not all([name, mobile, email, password]):
        raise HTTPException(status_code=400, detail="name, mobile, email, and password are required")
    if rep_type not in ("MLA", "MP", "COUNCILLOR"):
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")
    if rep_type == "MLA" and not assembly_name:
        raise HTTPException(status_code=400, detail="assembly_name is required for MLA")
    if rep_type == "MP" and not parliamentary_name:
        raise HTTPException(status_code=400, detail="parliamentary_name is required for MP")
    if rep_type == "COUNCILLOR" and not ward_id:
        raise HTTPException(status_code=400, detail="ward_id is required for COUNCILLOR")

    if master.representatives.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if master.representatives.find_one({"mobile": mobile}):
        raise HTTPException(status_code=400, detail="Mobile already registered")

    base_slug = _generate_slug(location, rep_type)
    slug      = _ensure_unique_slug(master, base_slug)
    db_name   = _generate_db_name(slug)
    rep_code  = _next_rep_code(master, rep_type)

    tenant_db     = MongoDatabase.setup_tenant_db(db_name)
    now           = datetime.utcnow()
    password_hash = SecurityManager.hash_password(password)

    rep_doc = {
        "fullName":           name,
        "email":              email,
        "mobile":             mobile,
        "passwordHash":       password_hash,
        "role":               "REPRESENTATIVE",
        "title":              rep_type,
        "status":             "ACTIVE",
        "isDeleted":          False,
        "assembly_name":      assembly_name,
        "parliamentary_name": parliamentary_name,
        "ward_id":            ward_id,
        "ward_name":          ward_name,
        "taluk":              taluk,
        "district":           district,
        "state":              state,
        "createdAt":          now,
        "updatedAt":          now,
    }
    insert_result = tenant_db.users.insert_one(rep_doc)
    user_id       = str(insert_result.inserted_id)

    master.representatives.insert_one({
        "slug":               slug,
        "rep_code":           rep_code,
        "db_name":            db_name,
        "name":               name,
        "rep_type":           rep_type,
        "email":              email,
        "mobile":             mobile,
        "status":             "ACTIVE",
        "assembly_name":      assembly_name,
        "parliamentary_name": parliamentary_name,
        "ward_id":            ward_id,
        "ward_name":          ward_name,
        "taluk":              taluk,
        "district":           district,
        "state":              state,
        "created_at":         now,
    })
    master.user_registry.insert_one({
        "email":   email,
        "mobile":  mobile,
        "db_name": db_name,
        "role":    "REPRESENTATIVE",
        "user_id": user_id,
    })

    token = TokenManager.create_token(user_id, "REPRESENTATIVE", db_name)
    logger.info(f"Representative registered: {name} ({rep_type}), DB: {db_name}")

    return {
        "slug": slug, "rep_code": rep_code, "db_name": db_name, "user_id": user_id,
        "token": token, "name": name, "rep_type": rep_type, "email": email, "mobile": mobile,
        "assembly_name": assembly_name, "parliamentary_name": parliamentary_name,
        "ward_id": ward_id, "ward_name": ward_name,
        "taluk": taluk, "district": district, "state": state,
    }


@rep_router.post("/register", status_code=status.HTTP_201_CREATED,
                 summary="Register a new MLA / MP / Councillor")
@limiter.limit("5/minute")
async def register_representative(request: Request, body: RepresentativeRegisterRequest):
    """
    Create a new representative account and their isolated tenant database.

    **Constituency field required per role:**
    - MLA → `assembly_name`
    - MP → `parliamentary_name`
    - COUNCILLOR → `ward_id` (+ optional `ward_name`)

    **Optional common fields:** `taluk`, `district`, `state`
    """
    r = _create_representative_account(body)
    slug, rep_code, db_name, user_id, token = r["slug"], r["rep_code"], r["db_name"], r["user_id"], r["token"]
    name, rep_type, email, mobile = r["name"], r["rep_type"], r["email"], r["mobile"]
    assembly_name, parliamentary_name = r["assembly_name"], r["parliamentary_name"]
    ward_id, ward_name = r["ward_id"], r["ward_name"]
    taluk, district, state = r["taluk"], r["district"], r["state"]

    return {
        "success": True,
        "message": "Representative registered successfully",
        "data": {
            "slug":        slug,
            "rep_code":    rep_code,
            "db_name":     db_name,
            "invite_url":  f"/register/{slug}",
            "accessToken": token,
            "user": {
                "id":                 user_id,
                "name":               name,
                "role":               "REPRESENTATIVE",
                "title":              rep_type,
                "email":              email,
                "mobile":             mobile,
                "assembly_name":      assembly_name      or None,
                "parliamentary_name": parliamentary_name or None,
                "ward_id":            ward_id            or None,
                "ward_name":          ward_name          or None,
                "taluk":              taluk              or None,
                "district":           district           or None,
                "state":              state              or None,
            },
        },
    }


@compat_router.post("/admin/register-my-representative",
                     summary="Scoped admin's one-time representative registration")
async def register_my_representative(body: RepresentativeRegisterRequest, current_user: dict = Depends(get_current_user)):
    """
    A scoped Admin (one who chose an MLA/MP/COUNCILLOR scope on the Admin
    Signup form) calls this exactly once to register the one representative
    their scope authorizes. `rep_type` in the body must match that scope.

    The Admin's own login is NOT replaced or elevated — they stay logged in
    as an Admin, on the normal Admin Portal, exactly as before. This just
    links their account to the representative it created (managedDbName),
    which is what GET /api/users/ uses to scope their admin-panel views
    (Citizens, Representatives, Field Officers, Managers) down to only this
    one representative's data — see list_users() in users/routes.py.
    """
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Only a scoped Admin can register their representative")

    master = MongoDatabase.get_db()
    try:
        admin_object_id = ObjectId(current_user["user_id"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")
    admin_doc = master.users.find_one({"_id": admin_object_id})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="Admin account not found")

    scope = admin_doc.get("scope")
    if not scope:
        raise HTTPException(status_code=403, detail="Your account has no assigned scope")
    if admin_doc.get("managedDbName"):
        raise HTTPException(status_code=400, detail="You have already registered your representative")

    rep_type = (body.rep_type or "").strip().upper()
    if rep_type != scope:
        raise HTTPException(status_code=403, detail=f"Your account is scoped to {scope}, not {rep_type or '(none)'}")

    r = _create_representative_account(body)

    update_result = master.users.update_one(
        {"_id": admin_doc["_id"]},
        {"$set": {"managedDbName": r["db_name"], "updatedAt": datetime.utcnow()}},
    )
    logger.info(
        f"register_my_representative: admin_id={admin_doc['_id']} admin_email={admin_doc.get('email')} "
        f"matched={update_result.matched_count} modified={update_result.modified_count} "
        f"set_managedDbName={r['db_name']}"
    )

    return success_response({
        "managedDbName": r["db_name"],
        "representative": {
            "id": r["user_id"], "fullName": r["name"], "email": r["email"],
            "mobile": r["mobile"], "role": "REPRESENTATIVE", "title": r["rep_type"],
        },
    }, "Representative registered — you can now manage them from your Admin Portal")


@rep_router.post("/login", response_model=TokenResponse,
                 summary="Representative / Staff login (email + password)")
@limiter.limit("10/minute")
async def rep_login(request: Request, login_data: UserLoginRequest):
    """Login for representative and staff using email and password."""
    result = AuthService.login(login_data)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    return result


@rep_router.get("/verify", summary="Verify JWT token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Check if the bearer token is valid and return its claims."""
    return success_response(
        {
            "user_id": current_user["user_id"],
            "role":    current_user["role"],
            "db_name": current_user.get("db_name", ""),
        },
        "Token valid",
    )


@rep_router.post("/change-password", summary="Change password")
async def change_password(
    data: UserPasswordChange,
    current_user: dict = Depends(get_current_user),
):
    db_name = current_user.get("db_name", "")
    role    = current_user.get("role", "")

    if role == "CITIZEN":
        db  = MongoDatabase.get_tenant_db(db_name)
        col = db.citizens
    elif db_name:
        db  = MongoDatabase.get_tenant_db(db_name)
        col = db.users
    else:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = col.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not SecurityManager.verify_password(data.oldPassword, user.get("passwordHash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    col.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"passwordHash": SecurityManager.hash_password(data.newPassword),
                  "updatedAt": datetime.utcnow()}},
    )
    return {"success": True, "message": "Password updated successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# STAFF ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@staff_router.post("/register", status_code=status.HTTP_201_CREATED,
                   summary="Add a staff member (representative only)")
async def register_staff(
    body: StaffRegisterRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Register a staff member inside the representative's tenant DB.

    Requires **Bearer token** of the representative.
    """
    if current_user.get("role") not in ("REPRESENTATIVE", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only representatives can register staff")

    db_name = current_user.get("db_name", "")
    if not db_name:
        raise HTTPException(status_code=401, detail="Invalid session: no tenant context")

    tenant_db = MongoDatabase.get_tenant_db(db_name)
    master    = MongoDatabase.get_db()

    name        = body.name.strip()
    mobile      = body.mobile.strip()
    email       = body.email.strip().lower()
    password    = body.password.strip()
    designation = (body.designation or "Staff").strip()
    role        = (body.role or "STAFF").strip().upper()

    if not all([name, mobile, email, password]):
        raise HTTPException(status_code=400, detail="name, mobile, email, and password are required")
    if tenant_db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if tenant_db.users.find_one({"mobile": mobile}):
        raise HTTPException(status_code=400, detail="Mobile already registered")

    now = datetime.utcnow()
    staff_doc = {
        "fullName":     name,
        "email":        email,
        "mobile":       mobile,
        "passwordHash": SecurityManager.hash_password(password),
        "role":         role,
        "designation":  designation,
        "status":       "ACTIVE",
        "isDeleted":    False,
        "createdAt":    now,
        "updatedAt":    now,
    }
    result  = tenant_db.users.insert_one(staff_doc)
    user_id = str(result.inserted_id)

    master.user_registry.update_one(
        {"email": email},
        {"$setOnInsert": {
            "email":   email,
            "mobile":  mobile,
            "db_name": db_name,
            "role":    role,
            "user_id": user_id,
        }},
        upsert=True,
    )

    logger.info(f"Staff registered: {name} ({role}) in {db_name}")
    return success_response(
        {"id": user_id, "name": name, "role": role, "designation": designation},
        "Staff registered successfully",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CITIZEN ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@citizen_router.get("/constituencies", summary="List available constituencies by representative type")
async def list_constituencies(rep_type: str):
    """
    **Public endpoint — no login required.**

    Returns the list of constituencies registered for the given representative type.
    Use this to populate the dropdown on the citizen registration screen.

    - `rep_type=MLA`        → returns `assembly_name` values
    - `rep_type=MP`         → returns `parliamentary_name` values
    - `rep_type=COUNCILLOR` → returns `ward_id` + `ward_name` values
    """
    rep_type = rep_type.strip().upper()
    if rep_type not in ("MLA", "MP", "COUNCILLOR"):
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

    master = MongoDatabase.get_db()
    reps   = list(master.representatives.find(
        {"rep_type": rep_type, "status": "ACTIVE"},
        {"_id": 0, "name": 1, "assembly_name": 1, "parliamentary_name": 1,
         "ward_id": 1, "ward_name": 1, "district": 1, "state": 1},
    ))

    items = []
    for r in reps:
        if rep_type == "MLA":
            items.append({
                "label":         r.get("assembly_name", ""),
                "rep_name":      r.get("name", ""),
                "assembly_name": r.get("assembly_name", ""),
                "district":      r.get("district", ""),
                "state":         r.get("state", ""),
            })
        elif rep_type == "MP":
            items.append({
                "label":              r.get("parliamentary_name", ""),
                "rep_name":           r.get("name", ""),
                "parliamentary_name": r.get("parliamentary_name", ""),
                "district":           r.get("district", ""),
                "state":              r.get("state", ""),
            })
        else:
            items.append({
                "label":     r.get("ward_name") or r.get("ward_id", ""),
                "rep_name":  r.get("name", ""),
                "ward_id":   r.get("ward_id", ""),
                "ward_name": r.get("ward_name", ""),
                "district":  r.get("district", ""),
                "state":     r.get("state", ""),
            })

    return success_response({"rep_type": rep_type, "items": items}, "Constituencies retrieved")


@citizen_router.get("/representative-info", summary="Get representative details for selected constituency")
async def get_representative_info(
    rep_type:           str,
    assembly_name:      Optional[str] = None,
    parliamentary_name: Optional[str] = None,
    ward_id:            Optional[str] = None,
):
    """
    **Public endpoint — no login required.**

    After the citizen selects a rep_type and constituency, call this to display
    the representative's profile below the dropdown.

    - `rep_type=MLA&assembly_name=Mandya Assembly Constituency`
    - `rep_type=MP&parliamentary_name=Mysore Parliamentary Constituency`
    - `rep_type=COUNCILLOR&ward_id=WARD-012`
    """
    rep_type = rep_type.strip().upper()
    if rep_type not in ("MLA", "MP", "COUNCILLOR"):
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

    master = MongoDatabase.get_db()

    if rep_type == "MLA":
        if not assembly_name:
            raise HTTPException(status_code=400, detail="assembly_name is required for MLA")
        query = {
            "rep_type": "MLA",
            "assembly_name": {"$regex": f"^{re.escape(assembly_name.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        }
    elif rep_type == "MP":
        if not parliamentary_name:
            raise HTTPException(status_code=400, detail="parliamentary_name is required for MP")
        query = {
            "rep_type": "MP",
            "parliamentary_name": {"$regex": f"^{re.escape(parliamentary_name.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        }
    else:
        if not ward_id:
            raise HTTPException(status_code=400, detail="ward_id is required for COUNCILLOR")
        query = {
            "rep_type": "COUNCILLOR",
            "ward_id": {"$regex": f"^{re.escape(ward_id.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        }

    rep = master.representatives.find_one(query, {"_id": 0, "passwordHash": 0})
    if not rep:
        raise HTTPException(status_code=404, detail="No active representative found for the selected constituency")

    # Pull richer profile from the tenant DB (photo, bio, office address)
    db_name   = rep.get("db_name", "")
    profile   = {}
    if db_name:
        tenant_db = MongoDatabase.get_tenant_db(db_name)
        user = tenant_db.users.find_one(
            {"role": "REPRESENTATIVE"},
            {"fullName": 1, "profileImage": 1, "bio": 1, "officeAddress": 1,
             "officePhone": 1, "mobile": 1, "email": 1, "title": 1},
        ) or {}
        profile = {k: str(v) if hasattr(v, "__str__") and not isinstance(v, (str, int, float, bool, type(None))) else v
                   for k, v in user.items() if k != "_id"}

    return success_response({
        "name":              rep.get("name", ""),
        "rep_type":          rep.get("rep_type", ""),
        "assembly_name":     rep.get("assembly_name", ""),
        "parliamentary_name": rep.get("parliamentary_name", ""),
        "ward_id":           rep.get("ward_id", ""),
        "ward_name":         rep.get("ward_name", ""),
        "district":          rep.get("district", ""),
        "state":             rep.get("state", ""),
        "profileImage":      profile.get("profileImage", ""),
        "bio":               profile.get("bio", ""),
        "officeAddress":     profile.get("officeAddress", ""),
        "officePhone":       profile.get("officePhone", ""),
    }, "Representative info retrieved")


@citizen_router.post("/send-otp", summary="Send OTP to mobile or email")
@limiter.limit("5/minute")
async def send_otp(request: Request, body: SendOtpRequest):
    """
    **Step 1 of citizen registration / login.**

    Send a 6-digit OTP to the citizen's mobile number or email.
    """
    contact_type = body.type.strip()
    value        = body.value.strip()

    if contact_type not in ("phone", "email"):
        raise HTTPException(status_code=400, detail="type must be 'phone' or 'email'")
    if not value:
        raise HTTPException(status_code=400, detail="Phone number or email required")

    success = OTPService.send_otp(contact_type, value)
    if not success:
        return {"success": False, "error": "Failed to send OTP"}

    normalized = OTPService.normalize_contact(contact_type, value)
    otp_data   = OTP_STORAGE.get(normalized, {})

    return {
        "success":    True,
        "message":    f"OTP sent to {contact_type}",
        "statusCode": 200,
        "debug_otp":  otp_data.get("otp", ""),
    }


@citizen_router.post("/register", response_model=OtpResponse,
                     summary="Verify OTP → register or login citizen")
async def citizen_register(request: CitizenRegisterRequest):
    """
    **Step 2 of citizen registration / login.**

    Verify OTP and automatically find the correct representative DB
    based on the selected constituency — no slug required.

    **Required fields:**
    - `value` — mobile or email used in send-otp
    - `otp` — 6-digit code
    - `rep_type` — MLA | MP | COUNCILLOR
    - `assembly_name` — if MLA
    - `parliamentary_name` — if MP
    - `ward_id` — if COUNCILLOR
    """
    try:
        from users.service import UserService

        normalized_value  = request.value.strip()
        is_email          = "@" in normalized_value
        normalized_email  = UserService.normalize_email(normalized_value) if is_email else None
        normalized_mobile = UserService.normalize_mobile(normalized_value)
        is_mobile         = bool(normalized_mobile) and not is_email

        otp_key = OTPService.normalize_contact(
            "phone" if is_mobile else "email", normalized_value
        )
        if not OTPService.verify_otp(otp_key, request.otp):
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        rep_type = request.rep_type.strip().upper()
        if rep_type not in ("MLA", "MP", "COUNCILLOR"):
            raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

        # Look up the representative in master DB by constituency
        master = MongoDatabase.get_db()
        if rep_type == "MLA":
            if not request.assembly_name:
                raise HTTPException(status_code=400, detail="assembly_name is required for MLA")
            rep = master.representatives.find_one({
                "rep_type": "MLA",
                "assembly_name": {"$regex": f"^{re.escape(request.assembly_name.strip())}$", "$options": "i"},
                "status": "ACTIVE",
            })
        elif rep_type == "MP":
            if not request.parliamentary_name:
                raise HTTPException(status_code=400, detail="parliamentary_name is required for MP")
            rep = master.representatives.find_one({
                "rep_type": "MP",
                "parliamentary_name": {"$regex": f"^{re.escape(request.parliamentary_name.strip())}$", "$options": "i"},
                "status": "ACTIVE",
            })
        else:
            if not request.ward_id:
                raise HTTPException(status_code=400, detail="ward_id is required for COUNCILLOR")
            rep = master.representatives.find_one({
                "rep_type": "COUNCILLOR",
                "ward_id": {"$regex": f"^{re.escape(request.ward_id.strip())}$", "$options": "i"},
                "status": "ACTIVE",
            })

        if not rep:
            raise HTTPException(status_code=404, detail="No active representative found for the selected constituency")

        db_name   = rep["db_name"]
        tenant_db = MongoDatabase.get_tenant_db(db_name)
        now       = datetime.utcnow()

        rep_user = tenant_db.users.find_one({"role": "REPRESENTATIVE"}, {
            "assembly_name": 1, "parliamentary_name": 1,
            "ward_id": 1, "ward_name": 1, "taluk": 1, "district": 1, "state": 1,
        }) or {}

        if is_mobile:
            lookup_filter = {"mobile": normalized_mobile, "is_deleted": {"$ne": True}}
        else:
            lookup_filter = {"email": normalized_email, "is_deleted": {"$ne": True}}

        citizen = tenant_db.citizens.find_one_and_update(
            lookup_filter,
            {
                "$setOnInsert": {
                    "citizen_id":         _next_citizen_id(tenant_db),
                    "name":               "",
                    "mobile":             normalized_mobile if is_mobile else f"otp-{uuid.uuid4().hex[:8]}",
                    "email":              normalized_email  if is_email  else f"otp-{uuid.uuid4().hex[:8]}@otp.local",
                    "address":            "",
                    "gender":             "",
                    "dob":                "",
                    "assembly_name":      rep_user.get("assembly_name", ""),
                    "parliamentary_name": rep_user.get("parliamentary_name", ""),
                    "ward_id":            rep_user.get("ward_id", ""),
                    "area_name":          rep_user.get("ward_name", ""),
                    "taluk":              rep_user.get("taluk", ""),
                    "district":           rep_user.get("district", ""),
                    "state":              rep_user.get("state", ""),
                    "is_deleted":         False,
                    "created_at":         now,
                    "updated_at":         now,
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

        if citizen is None:
            raise HTTPException(status_code=500, detail="Failed to create or find citizen")

        citizen_id = str(citizen["_id"])
        token      = TokenManager.create_token(citizen_id, "CITIZEN", db_name)
        logger.info(f"Citizen registered/logged in: {citizen_id} in {db_name}")

        # So a returning citizen's next plain OTP login (verify_otp_compat)
        # can find this tenant record directly via _find_existing_citizen
        # instead of creating a disconnected blank placeholder.
        master.user_registry.update_one(
            {"role": "CITIZEN", "user_id": citizen_id},
            {"$set": {
                "email":   citizen.get("email"), "mobile": citizen.get("mobile"),
                "db_name": db_name, "role": "CITIZEN", "user_id": citizen_id,
            }},
            upsert=True,
        )

        citizen_payload = {**citizen, "_id": str(citizen["_id"])}
        return OtpResponse(
            success=True,
            message="OTP verified successfully",
            accessToken=token,
            role="CITIZEN",
            user=UserResponse(**_citizen_to_user_response(citizen_payload)),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OTP verification failed")


@citizen_router.post("/complete-profile", summary="Resolve representative and complete citizen profile")
async def complete_citizen_profile(
    body: CitizenCompleteProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    **Called from the "Complete Your Profile" page**, for citizens who signed
    in via the plain OTP flow (verify_otp_compat) without picking a
    representative up front. This is where Ward/Assembly/Parliament selection
    finally happens: we resolve the matching representative here, move the
    citizen's record into that representative's tenant database, and issue a
    new token scoped to it. The old, tenant-less placeholder record from OTP
    verification is soft-deleted.
    """
    if current_user.get("role") != "CITIZEN":
        raise HTTPException(status_code=403, detail="Only citizens can complete a profile this way")

    old_user_id = current_user.get("user_id")
    if not old_user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    rep_type = body.rep_type.strip().upper()
    if rep_type not in ("MLA", "MP", "COUNCILLOR"):
        raise HTTPException(status_code=400, detail="rep_type must be MLA, MP, or COUNCILLOR")

    master = MongoDatabase.get_db()

    if rep_type == "MLA":
        if not body.assembly_name:
            raise HTTPException(status_code=400, detail="assembly_name is required for MLA")
        rep = master.representatives.find_one({
            "rep_type": "MLA",
            "assembly_name": {"$regex": f"^{re.escape(body.assembly_name.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        })
    elif rep_type == "MP":
        if not body.parliamentary_name:
            raise HTTPException(status_code=400, detail="parliamentary_name is required for MP")
        rep = master.representatives.find_one({
            "rep_type": "MP",
            "parliamentary_name": {"$regex": f"^{re.escape(body.parliamentary_name.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        })
    else:
        if not body.ward_id:
            raise HTTPException(status_code=400, detail="ward_id is required for COUNCILLOR")
        rep = master.representatives.find_one({
            "rep_type": "COUNCILLOR",
            "ward_id": {"$regex": f"^{re.escape(body.ward_id.strip())}$", "$options": "i"},
            "status": "ACTIVE",
        })

    if not rep:
        logger.warning(
            f"complete-profile: NO MATCH for rep_type={rep_type} "
            f"assembly_name={body.assembly_name!r} parliamentary_name={body.parliamentary_name!r} "
            f"ward_id={body.ward_id!r}"
        )
        raise HTTPException(status_code=404, detail="No active representative found for the selected constituency")

    # How many ACTIVE reps match this rep_type + area — if this is >1, the
    # citizen may be landing in a different (e.g. older/duplicate) tenant
    # than the one currently logged in under the same name.
    dup_query = {"rep_type": rep_type, "status": "ACTIVE"}
    if rep_type == "MLA":
        dup_query["assembly_name"] = {"$regex": f"^{re.escape(body.assembly_name.strip())}$", "$options": "i"}
    elif rep_type == "MP":
        dup_query["parliamentary_name"] = {"$regex": f"^{re.escape(body.parliamentary_name.strip())}$", "$options": "i"}
    else:
        dup_query["ward_id"] = {"$regex": f"^{re.escape(body.ward_id.strip())}$", "$options": "i"}
    dup_count = master.representatives.count_documents(dup_query)
    logger.info(
        f"complete-profile: MATCHED rep_type={rep_type} slug={rep.get('slug')} "
        f"db_name={rep.get('db_name')} rep_code={rep.get('rep_code')} "
        f"(candidates matching this rep_type+area: {dup_count})"
    )

    db_name   = rep["db_name"]
    tenant_db = MongoDatabase.get_tenant_db(db_name)
    now       = datetime.utcnow()

    # Carry over identity fields from the tenant-less placeholder record
    # created at OTP-verify time.
    try:
        old_doc = master.users.find_one({"_id": ObjectId(old_user_id)}) or {}
    except Exception:
        old_doc = {}
    mobile    = (body.mobile or old_doc.get("mobile", "") or "").strip()
    email     = (body.email or old_doc.get("email", "") or "").strip()
    is_mobile = bool(mobile) and not mobile.startswith("otp-")

    rep_user = tenant_db.users.find_one({"role": "REPRESENTATIVE"}, {
        "ward_name": 1, "taluk": 1, "district": 1, "state": 1,
    }) or {}

    if is_mobile:
        lookup_filter = {"mobile": mobile, "is_deleted": {"$ne": True}}
    else:
        lookup_filter = {"email": email, "is_deleted": {"$ne": True}}

    citizen = tenant_db.citizens.find_one_and_update(
        lookup_filter,
        {
            "$set": {
                "name":               body.fullName.strip(),
                "email":              email,
                "mobile":             mobile,
                "age":                body.age,
                "address":            body.address or "",
                "assembly_name":      body.assembly_name or "",
                "parliamentary_name": body.parliamentary_name or "",
                "ward_id":            body.ward_id or "",
                "ward_number":        body.ward_number or "",
                "area_name":          body.ward_name or rep_user.get("ward_name", ""),
                "taluk":              rep_user.get("taluk", ""),
                "district":           rep_user.get("district", ""),
                "state":              rep_user.get("state", ""),
                "is_deleted":         False,
                "updated_at":         now,
            },
            "$setOnInsert": {
                "citizen_id": _next_citizen_id(tenant_db),
                "created_at": now,
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    if citizen is None:
        raise HTTPException(status_code=500, detail="Failed to save profile")

    # Soft-delete the tenant-less placeholder now that the citizen has a real
    # home in the representative's tenant DB — avoids an orphaned duplicate.
    try:
        master.users.update_one(
            {"_id": ObjectId(old_user_id)},
            {"$set": {"isDeleted": True, "updatedAt": now}},
        )
    except Exception:
        pass

    citizen_id = str(citizen["_id"])
    token = TokenManager.create_token(citizen_id, "CITIZEN", db_name)
    logger.info(f"Citizen profile completed, migrated to tenant {db_name}: {citizen_id}")

    # So a returning citizen's next plain OTP login (verify_otp_compat) can
    # find this tenant record directly via _find_existing_citizen instead of
    # creating a disconnected blank placeholder.
    master.user_registry.update_one(
        {"role": "CITIZEN", "user_id": citizen_id},
        {"$set": {
            "email":   citizen.get("email"), "mobile": citizen.get("mobile"),
            "db_name": db_name, "role": "CITIZEN", "user_id": citizen_id,
        }},
        upsert=True,
    )

    return success_response({
        "accessToken": token,
        "user": UserResponse(
            _id=citizen_id,
            fullName=citizen.get("name", ""),
            mobile=citizen.get("mobile", ""),
            email=citizen.get("email", ""),
            role="CITIZEN",
            status="ACTIVE",
            assembly_name=citizen.get("assembly_name"),
            parliamentary_name=citizen.get("parliamentary_name"),
            ward_id=citizen.get("ward_id"),
            ward_name=citizen.get("area_name"),
            createdAt=citizen.get("created_at"),
            updatedAt=citizen.get("updated_at"),
        ),
    }, "Profile completed successfully")


@citizen_router.get("/resolve/{slug}", include_in_schema=False)
async def resolve_slug(slug: str = Path(...)):
    master = MongoDatabase.get_db()
    rep = master.representatives.find_one(
        {"slug": slug, "status": "ACTIVE"},
        {"_id": 0, "slug": 1, "rep_code": 1, "db_name": 1, "name": 1, "rep_type": 1,
         "assembly_name": 1, "parliamentary_name": 1,
         "ward_id": 1, "ward_name": 1, "taluk": 1, "district": 1, "state": 1},
    )
    if not rep:
        raise HTTPException(status_code=404, detail="Representative not found")
    return success_response({
        "slug": rep["slug"], "dbName": rep["db_name"], "name": rep["name"],
        "repType": rep["rep_type"],
    }, "Representative resolved")


# ═══════════════════════════════════════════════════════════════════════════════
# BACKWARD-COMPAT ROUTES  (old /api/auth/* paths — keep so existing clients
# don't break, but they simply delegate to the new functions above)
# ═══════════════════════════════════════════════════════════════════════════════

@compat_router.post("/login", response_model=TokenResponse, include_in_schema=False)
@limiter.limit("10/minute")
async def login_compat(request: Request, login_data: UserLoginRequest):
    result = AuthService.login(login_data)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return result


@compat_router.post("/login-admin", response_model=TokenResponse, include_in_schema=False)
@limiter.limit("10/minute")
async def login_admin_compat(request: Request, login_data: UserLoginRequest):
    try:
        result = AuthService.login(login_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    allowed_roles = {"ADMIN", "REPRESENTATIVE", "STAFF", "CONSTITUENCY_MANAGER",
                     "FIELD_OFFICER", "MANAGER"}
    if result.user and result.user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Citizens must use OTP login")
    return result


@compat_router.post("/register/representative", include_in_schema=False)
@limiter.limit("5/minute")
async def register_rep_compat(request: Request, body: RepresentativeRegisterRequest):
    return await register_representative(request, body)


@compat_router.post("/register/staff", include_in_schema=False)
async def register_staff_compat(body: StaffRegisterRequest, current_user: dict = Depends(get_current_user)):
    return await register_staff(body, current_user)


@compat_router.post("/send-otp", include_in_schema=False)
@limiter.limit("5/minute")
async def send_otp_compat(request: Request, body: SendOtpRequest):
    return await send_otp(request, body)


@compat_router.post("/verify-otp", include_in_schema=False)
async def verify_otp_compat(request: VerifyOtpRequest):
    """
    Simple citizen OTP verification — logs the citizen in (creating a bare
    account on first verification) WITHOUT requiring a representative to be
    picked yet. This used to delegate straight into citizen_register(), but
    that function now requires rep_type + assembly_name/parliamentary_name/
    ward_id up front to resolve which representative's tenant DB to use —
    fields this plain {value, otp} request never sends, which crashed every
    call with an AttributeError.

    Representative / ward / assembly / parliament details are collected
    afterward on the profile completion page instead (UserUpdate already has
    assembly_name / parliamentary_name / ward_id / ward_name as optional
    fields for exactly this).

    If request.db_name IS provided (a representative has already been
    resolved by an earlier step), we still route into the tenant-aware
    citizen_register so that flow keeps working.
    """
    if request.db_name:
        return await citizen_register(request)

    try:
        from users.service import UserService

        normalized_value  = request.value.strip()
        is_email          = "@" in normalized_value
        normalized_email  = UserService.normalize_email(normalized_value) if is_email else None
        normalized_mobile = UserService.normalize_mobile(normalized_value)
        is_mobile         = bool(normalized_mobile) and not is_email

        otp_key = OTPService.normalize_contact(
            "phone" if is_mobile else "email", normalized_value
        )
        if not OTPService.verify_otp(otp_key, request.otp):
            raise HTTPException(status_code=401, detail="Invalid or expired OTP")

        db  = MongoDatabase.get_db()
        now = datetime.utcnow()

        # Returning citizen who already completed their profile in a
        # representative's tenant? Resolve straight to that record and issue
        # a properly tenant-scoped token — skip the blank master.users
        # placeholder below entirely, so they land back on their real
        # dashboard (with their real grievances) instead of an empty one
        # under a fresh, disconnected identity.
        existing = _find_existing_citizen(
            db,
            normalized_email if is_email else None,
            normalized_mobile if is_mobile else None,
        )
        if existing:
            existing_db_name, existing_citizen = existing
            existing_citizen_id = str(existing_citizen["_id"])
            token = TokenManager.create_token(existing_citizen_id, "CITIZEN", existing_db_name)
            logger.info(
                f"Citizen returning login resolved to existing tenant record: "
                f"{existing_citizen_id} in {existing_db_name}"
            )
            return OtpResponse(
                success=True,
                message="OTP verified successfully",
                accessToken=token,
                role="CITIZEN",
                user=UserResponse(**_citizen_to_user_response(
                    {**existing_citizen, "_id": existing_citizen_id}
                )),
            )

        if is_mobile:
            lookup_filter = {"mobile": normalized_mobile, "role": "CITIZEN", "isDeleted": {"$ne": True}}
        else:
            lookup_filter = {"email": normalized_email, "role": "CITIZEN", "isDeleted": {"$ne": True}}

        user = db.users.find_one_and_update(
            lookup_filter,
            {
                "$setOnInsert": {
                    "role":      "CITIZEN",
                    "fullName":  "",
                    "mobile":    normalized_mobile if is_mobile else f"otp-{uuid.uuid4().hex[:8]}",
                    "email":     normalized_email  if is_email  else f"otp-{uuid.uuid4().hex[:8]}@otp.local",
                    "isDeleted": False,
                    "createdAt": now,
                    "updatedAt": now,
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

        if user is None:
            raise HTTPException(status_code=500, detail="Failed to create or find citizen")

        user_id = str(user["_id"])
        token   = TokenManager.create_token(user_id, "CITIZEN")
        logger.info(f"Citizen registered/logged in: {user_id}")

        return OtpResponse(
            success=True,
            message="OTP verified successfully",
            accessToken=token,
            role="CITIZEN",
            user=UserResponse(
                _id=user_id,
                fullName=user.get("fullName", ""),
                mobile=user.get("mobile", ""),
                email=user.get("email", ""),
                role="CITIZEN",
                status="ACTIVE" if not user.get("isDeleted") else "INACTIVE",
                assembly_name=user.get("assembly_name"),
                parliamentary_name=user.get("parliamentary_name"),
                ward_id=user.get("ward_id"),
                ward_name=user.get("ward_name"),
                createdAt=user.get("createdAt"),
                updatedAt=user.get("updatedAt"),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OTP verification failed")


@compat_router.get("/resolve/{slug}", include_in_schema=False)
async def resolve_slug_compat(slug: str = Path(...)):
    return await resolve_slug(slug)


@compat_router.get("/verify", include_in_schema=False)
async def verify_token_compat(current_user: dict = Depends(get_current_user)):
    return success_response(
        {"user_id": current_user["user_id"], "role": current_user["role"],
         "db_name": current_user.get("db_name", "")},
        "Token valid",
    )


def _require_admin(current_user: dict):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Only an Admin can do this")


@compat_router.post("/register", include_in_schema=False)
async def register_compat(user_data: UserCreate, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """
    Legacy registration shim.

    Was hard-coded to always create a REPRESENTATIVE account regardless of
    the requested role — any non-MLA/MP/COUNCILLOR role (including "ADMIN",
    "FIELD_OFFICER", "CONSTITUENCY_MANAGER") silently fell through to "MLA".
    That's why registering an admin, field officer, or manager via the admin
    panel produced a working login, just logged in as an MLA/Representative
    with its own bogus tenant database instead.

    ADMIN / FIELD_OFFICER / CONSTITUENCY_MANAGER are "platform-level" roles
    handled below — they don't belong to any one representative's tenant
    database (the admin-panel forms that create them don't even collect a
    constituency/representative to attach them to), so they live in the
    master DB instead, matching how AuthService.login() resolves accounts
    (master.user_registry → db_name → tenant_db.users). Using db_name =
    the master DB's own name makes that lookup resolve right back to
    master.users.
    """
    master = MongoDatabase.get_db()
    role = (user_data.role or "MLA").upper()

    if role in ("ADMIN", "FIELD_OFFICER", "CONSTITUENCY_MANAGER"):
        scope = None
        scope_label = None
        if role == "ADMIN":
            # Public self-registration (Admin Signup page) — open, no invite
            # token / Super Admin approval required. The admin picks which
            # representative type (MLA/MP/COUNCILLOR) they'll manage right
            # on the signup form; that's stored as their scope so they can
            # later register exactly one representative of that type via
            # /api/auth/admin/register-my-representative, at which point
            # managedDbName gets filled in.
            #
            # The signup form also offers an "Other" option — the rest of
            # the app (citizen registration, constituency lookup, etc.) only
            # understands MLA/MP/COUNCILLOR, so the frontend still sends one
            # of those three as `scope`; scopeLabel just carries the custom
            # name the admin typed, purely for display.
            scope = (user_data.scope or "").strip().upper() or None
            if scope not in ("MLA", "MP", "COUNCILLOR"):
                raise HTTPException(status_code=400, detail="scope must be MLA, MP, or COUNCILLOR")
            scope_label = (user_data.scopeLabel or "").strip() or None

        if master.users.find_one({"email": user_data.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        if master.users.find_one({"mobile": user_data.mobile}):
            raise HTTPException(status_code=400, detail="Mobile already registered")

        now = datetime.utcnow()
        # FIELD_OFFICER / CONSTITUENCY_MANAGER are always created by an
        # already-logged-in Admin from the admin panel — stamp which admin,
        # so that admin's own team stays isolated from every other admin's
        # (see list_users' createdByAdminId filter). ADMIN accounts don't
        # get one — they're not "created by" anyone in that sense.
        created_by_admin_id = None
        if role in ("FIELD_OFFICER", "CONSTITUENCY_MANAGER") and current_user and current_user.get("role") == "ADMIN":
            created_by_admin_id = current_user.get("user_id")
        user_doc = {
            "fullName": user_data.fullName, "email": user_data.email, "mobile": user_data.mobile,
            "passwordHash": SecurityManager.hash_password(user_data.password),
            "role": role, "status": "ACTIVE", "isDeleted": False,
            "scope": scope, "scopeLabel": scope_label, "managedDbName": None,
            "createdByAdminId": created_by_admin_id,
            "createdAt": now, "updatedAt": now,
        }
        insert_result = master.users.insert_one(user_doc)
        user_id = str(insert_result.inserted_id)

        master.user_registry.insert_one({
            "email": user_data.email, "mobile": user_data.mobile,
            "db_name": settings.MONGODB_MASTER_DB, "role": role, "user_id": user_id,
        })

        token = TokenManager.create_token(user_id, role, settings.MONGODB_MASTER_DB)
        return {"accessToken": token, "user": {
            "id": user_id, "email": user_data.email,
            "fullName": user_data.fullName, "role": role, "scope": scope, "scopeLabel": scope_label,
        }}

    if master.representatives.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if master.representatives.find_one({"mobile": user_data.mobile}):
        raise HTTPException(status_code=400, detail="Mobile already registered")

    rep_type = role
    if rep_type not in ("MLA", "MP", "COUNCILLOR"):
        rep_type = "MLA"

    name      = user_data.fullName
    base_slug = _generate_slug(name, rep_type)
    slug      = _ensure_unique_slug(master, base_slug)
    db_name   = _generate_db_name(slug)
    rep_code  = _next_rep_code(master, rep_type)
    tenant_db = MongoDatabase.setup_tenant_db(db_name)
    now       = datetime.utcnow()

    rep_doc = {
        "fullName": name, "email": user_data.email, "mobile": user_data.mobile,
        "passwordHash": SecurityManager.hash_password(user_data.password),
        "role": "REPRESENTATIVE", "title": rep_type,
        "status": "ACTIVE", "isDeleted": False,
        "createdAt": now, "updatedAt": now,
    }
    insert_result = tenant_db.users.insert_one(rep_doc)
    user_id = str(insert_result.inserted_id)

    master.representatives.insert_one({
        "slug": slug, "rep_code": rep_code, "db_name": db_name,
        "name": name, "rep_type": rep_type,
        "email": user_data.email, "mobile": user_data.mobile,
        "status": "ACTIVE", "created_at": now,
    })
    master.user_registry.insert_one({
        "email": user_data.email, "mobile": user_data.mobile,
        "db_name": db_name, "role": "REPRESENTATIVE", "user_id": user_id,
    })

    token = TokenManager.create_token(user_id, "REPRESENTATIVE", db_name)
    return {"accessToken": token, "user": {
        "id": user_id, "email": user_data.email,
        "fullName": name, "role": "REPRESENTATIVE",
        "db_name": db_name, "slug": slug,
    }}


@compat_router.get("/debug/otp-storage", include_in_schema=False)
async def debug_otp():
    return {"otp_storage": {
        k: {"otp": v["otp"], "attempts": v["attempts"], "type": v["type"]}
        for k, v in OTP_STORAGE.items()
    }}
