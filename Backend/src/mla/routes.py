"""
MLA AI Insights Routes

GET /api/mla/public-sentiment?days=90
GET /api/mla/approval-by-group?days=90
GET /api/mla/moving-numbers?days=90
GET /api/mla/insights          ← all three in one call (used by the dashboard)
GET /api/mla/public-profile    ← citizen-facing: MLA card for the citizen's constituency
"""

import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from mla.sentiment_service import (
    get_public_sentiment,
    get_approval_by_group,
    get_moving_numbers,
    get_peer_ranking,
    get_sentiment_trend,
    get_feedback_sources,
    get_election_probability,
    flush_sentiment_cache,
)

# Clear stale cached sentiment results on startup so expanded keywords take effect
flush_sentiment_cache()
from auth.service import AuthService
from config.database import MongoDatabase
from utils.jwt import TokenManager
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

router = APIRouter(prefix="/api/mla", tags=["MLA Insights"])
logger = logging.getLogger(__name__)


def _get_optional_user(request: Request):
    authorization = request.headers.get("Authorization")
    if not authorization:
        return None
    token = TokenManager.extract_token_from_header(authorization)
    if not token:
        return None
    return AuthService.verify_token(token)


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error(f"{fn.__name__} failed: {exc}", exc_info=True)
        return {"error": str(exc), "hasData": False}


@router.get("/public-profile")
async def mla_public_profile(
    constituency_id: Optional[str] = Query(None, alias="constituencyId"),
    user_id: Optional[str] = Query(None, alias="userId"),
    current_user: Optional[dict] = Depends(_get_optional_user),
):
    """
    Return the public-facing MLA profile card for a citizen's constituency.

    Lookup priority:
      1. ?constituencyId=<id>  — explicit param
      2. citizen doc fetched via ?userId=<id> or JWT user_id → constituencyId
      3. Fallback: return the first REPRESENTATIVE in the system
    """
    try:
        from bson import ObjectId as _OID
        db = MongoDatabase.get_db()

        def _find_citizen(uid: str):
            """Try to load citizen doc by string or ObjectId."""
            try:
                return db.users.find_one(
                    {"$or": [{"_id": _OID(uid)}, {"_id": uid}]},
                    {"constituencyId": 1, "wardId": 1}
                )
            except Exception:
                return db.users.find_one({"_id": uid}, {"constituencyId": 1, "wardId": 1})

        # Resolve constituency_id
        cid = constituency_id

        if not cid:
            # Try explicit userId param first, then JWT user_id
            lookup_uid = user_id or (current_user.get("user_id") if current_user else None)
            if lookup_uid:
                citizen_doc = _find_citizen(lookup_uid)
                if citizen_doc:
                    cid = citizen_doc.get("constituencyId")

        # Find the REPRESENTATIVE for this constituency
        rep_query = {"role": "REPRESENTATIVE"}
        if cid:
            rep_query["constituencyId"] = cid

        rep = db.users.find_one(
            rep_query,
            {
                "_id": 1, "fullName": 1, "title": 1, "bio": 1,
                "profileImage": 1, "constituencyId": 1, "wardId": 1,
                "showApprovalRating": 1, "showResolvedCount": 1,
                "officePhone": 1, "officeAddress": 1,
            }
        )
        # If no match by constituencyId, fall back to any representative
        if not rep and cid:
            rep = db.users.find_one(
                {"role": "REPRESENTATIVE"},
                {
                    "_id": 1, "fullName": 1, "title": 1, "bio": 1,
                    "profileImage": 1, "constituencyId": 1, "wardId": 1,
                    "showApprovalRating": 1, "showResolvedCount": 1,
                    "officePhone": 1, "officeAddress": 1,
                }
            )
        if not rep:
            raise HTTPException(status_code=404, detail="No representative found for this constituency")

        show_approval = rep.get("showApprovalRating", True)
        show_resolved = rep.get("showResolvedCount", True)

        # Approval % from sentiment (only if MLA opted in)
        approval_pct = None
        if show_approval:
            try:
                sentiment = get_public_sentiment(90)
                if sentiment.get("hasData") and sentiment.get("positive", {}).get("pct") is not None:
                    approval_pct = round(sentiment["positive"]["pct"], 1)
            except Exception as exc:
                logger.warning(f"Could not fetch approval pct: {exc}")

        # Resolved grievances count (only if MLA opted in)
        resolved_count = None
        if show_resolved:
            try:
                resolved_count = db.grievances.count_documents({
                    "constituencyId": cid,
                    "status": {"$in": ["RESOLVED", "CLOSED"]},
                })
            except Exception as exc:
                logger.warning(f"Could not count resolved grievances: {exc}")

        # Constituency name
        constituency_name = None
        try:
            const_doc = db.constituencies.find_one({"_id": cid}, {"name": 1})
            if not const_doc:
                from bson import ObjectId as _OID
                try:
                    const_doc = db.constituencies.find_one({"_id": _OID(cid)}, {"name": 1})
                except Exception:
                    pass
            if const_doc:
                constituency_name = const_doc.get("name")
        except Exception:
            pass

        data = {
            "id": str(rep["_id"]),
            "fullName": rep.get("fullName"),
            "title": rep.get("title") or "MLA",
            "bio": rep.get("bio"),
            "profileImage": rep.get("profileImage"),
            "constituencyId": rep.get("constituencyId"),
            "constituencyName": constituency_name,
            "officePhone": rep.get("officePhone"),
            "officeAddress": rep.get("officeAddress"),
            "showApprovalRating": show_approval,
            "showResolvedCount": show_resolved,
            "approvalPct": approval_pct,
            "resolvedCount": resolved_count,
        }
        return success_response(data, "MLA public profile retrieved")

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"mla_public_profile failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/public-sentiment")
async def public_sentiment(days: int = Query(90, ge=7, le=365), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Positive / neutral / negative breakdown from AI analysis of grievances."""
    data = _safe(get_public_sentiment, db, days)
    return success_response(data, "Public sentiment retrieved")


@router.get("/approval-by-group")
async def approval_by_group(days: int = Query(90, ge=7, le=365), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Sentiment-derived approval score segmented by citizen age group."""
    data = _safe(get_approval_by_group, db, days)
    return success_response(data, "Approval by group retrieved")


@router.get("/moving-numbers")
async def moving_numbers(days: int = Query(90, ge=7, le=365), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Top positive and negative grievance-category drivers."""
    data = _safe(get_moving_numbers, db, days)
    return success_response(data, "Moving numbers retrieved")


@router.get("/peer-ranking")
async def peer_ranking(days: int = Query(90, ge=7, le=365), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Ward-level approval ranking for 'Standing vs. peers' card."""
    data = _safe(get_peer_ranking, db, days)
    return success_response(data, "Peer ranking retrieved")


@router.get("/sentiment-trend")
async def sentiment_trend(months: int = Query(12, ge=3, le=24), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """Monthly approval % trend for the career trajectory chart."""
    data = _safe(get_sentiment_trend, db, months)
    return success_response(data, "Sentiment trend retrieved")


@router.get("/insights")
async def all_insights(days: int = Query(90, ge=7, le=365), db=Depends(get_tenant_db), current_user: dict = Depends(require_auth)):
    """All insight cards in a single request — tenant-scoped to the caller's own db."""
    months = 3 if days <= 90 else 6 if days <= 180 else 12

    # These six calls each run their own MongoDB queries/aggregations and don't
    # depend on each other (election probability is the only one that needs
    # sentiment's result, so it's computed after). They used to run one after
    # another inside this `async def`, which — since they're plain sync/blocking
    # calls — both serialized their wait time (sum of all six) AND blocked the
    # event loop for other requests being handled by this worker in the
    # meantime. Running them in a threadpool concurrently keeps the exact same
    # results but cuts wall-clock time to roughly the slowest single call
    # instead of the sum of all of them, and stops this endpoint from stalling
    # unrelated requests (like the notification/dashboard polling) while it runs.
    (
        sentiment,
        approval_by_group,
        moving_numbers,
        peer_ranking,
        sentiment_trend,
        feedback_sources,
    ) = await asyncio.gather(
        run_in_threadpool(_safe, get_public_sentiment, db, days),
        run_in_threadpool(_safe, get_approval_by_group, db, days),
        run_in_threadpool(_safe, get_moving_numbers, db, days),
        run_in_threadpool(_safe, get_peer_ranking, db, days),
        run_in_threadpool(_safe, get_sentiment_trend, db, months),
        run_in_threadpool(_safe, get_feedback_sources, db, days),
    )

    approval_pct = None
    if isinstance(sentiment, dict) and sentiment.get("hasData"):
        approval_pct = (sentiment.get("positive") or {}).get("pct")

    data = {
        "publicSentiment":     sentiment,
        "approvalByGroup":     approval_by_group,
        "movingNumbers":       moving_numbers,
        "peerRanking":         peer_ranking,
        "sentimentTrend":      sentiment_trend,
        "feedbackSources":     feedback_sources,
        # Election probability is computed from live approval data — keeps the
        # CDF algorithm on the server so the frontend only renders results.
        "electionProbability": _safe(get_election_probability, approval_pct),
    }
    return success_response(data, "MLA insights retrieved")
