"""
MLA AI Insights Routes

GET /api/mla/public-sentiment?days=90
GET /api/mla/approval-by-group?days=90
GET /api/mla/moving-numbers?days=90
GET /api/mla/insights          ← all three in one call (used by the dashboard)
"""

import logging
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from mla.sentiment_service import (
    get_public_sentiment,
    get_approval_by_group,
    get_moving_numbers,
    get_peer_ranking,
    get_sentiment_trend,
    get_feedback_sources,
    flush_sentiment_cache,
)

# Clear stale cached sentiment results on startup so expanded keywords take effect
flush_sentiment_cache()
from utils.response import success_response

router = APIRouter(prefix="/api/mla", tags=["MLA Insights"])
logger = logging.getLogger(__name__)


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error(f"{fn.__name__} failed: {exc}", exc_info=True)
        return {"error": str(exc), "hasData": False}


@router.get("/public-sentiment")
async def public_sentiment(days: int = Query(90, ge=7, le=365)):
    """Positive / neutral / negative breakdown from AI analysis of grievances."""
    data = _safe(get_public_sentiment, days)
    return success_response(data, "Public sentiment retrieved")


@router.get("/approval-by-group")
async def approval_by_group(days: int = Query(90, ge=7, le=365)):
    """Sentiment-derived approval score segmented by citizen age group."""
    data = _safe(get_approval_by_group, days)
    return success_response(data, "Approval by group retrieved")


@router.get("/moving-numbers")
async def moving_numbers(days: int = Query(90, ge=7, le=365)):
    """Top positive and negative grievance-category drivers."""
    data = _safe(get_moving_numbers, days)
    return success_response(data, "Moving numbers retrieved")


@router.get("/peer-ranking")
async def peer_ranking(days: int = Query(90, ge=7, le=365)):
    """Ward-level approval ranking for 'Standing vs. peers' card."""
    data = _safe(get_peer_ranking, days)
    return success_response(data, "Peer ranking retrieved")


@router.get("/sentiment-trend")
async def sentiment_trend(months: int = Query(12, ge=3, le=24)):
    """Monthly approval % trend for the career trajectory chart."""
    data = _safe(get_sentiment_trend, months)
    return success_response(data, "Sentiment trend retrieved")


@router.get("/insights")
async def all_insights(days: int = Query(90, ge=7, le=365)):
    """All insight cards in a single request."""
    months = 3 if days <= 90 else 6 if days <= 180 else 12
    data = {
        "publicSentiment":  _safe(get_public_sentiment, days),
        "approvalByGroup":  _safe(get_approval_by_group, days),
        "movingNumbers":    _safe(get_moving_numbers, days),
        "peerRanking":      _safe(get_peer_ranking, days),
        "sentimentTrend":   _safe(get_sentiment_trend, months),
        "feedbackSources":  _safe(get_feedback_sources, days),
    }
    return success_response(data, "MLA insights retrieved")
