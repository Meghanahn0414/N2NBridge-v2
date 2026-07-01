"""
MLA Sentiment Analysis Service  —  NLP-powered (VADER) + star ratings

Analyses grievance descriptions using VADER (Valence Aware Dictionary and
sEntiment Reasoner), a purpose-built NLP model for real-world short texts.
VADER understands negation ("not good"), intensifiers ("very bad"), punctuation
("great!!!"), and capitalization ("TERRIBLE") — far beyond keyword matching.

Results derive:
  1. Public sentiment  (positive / neutral / negative breakdown)
  2. Approval by group (sentiment segmented by citizen age group)
  3. What's moving your numbers (top positive & negative category drivers)

Scores are stored back into each grievance's `aiAnalysis.sentimentScore` field
so each record is only processed once.  Results are cached in Redis (10 min).
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any

from bson import ObjectId
from config.database import MongoDatabase
from config.settings import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Redis helpers (gracefully skipped if Redis is not running)
# ---------------------------------------------------------------------------

def _get_redis():
    try:
        import redis as _redis
        r = _redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        r.ping()
        return r
    except Exception:
        return None


def _cache_get(key: str) -> Any | None:
    r = _get_redis()
    if r is None:
        return None
    raw = r.get(key)
    return json.loads(raw) if raw else None


def _cache_set(key: str, value: Any, ttl: int = 600) -> None:
    r = _get_redis()
    if r is None:
        return
    r.setex(key, ttl, json.dumps(value))


# ---------------------------------------------------------------------------
# VADER NLP engine — loads once at module import
# ---------------------------------------------------------------------------

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer as _SIA
    _vader = _SIA()

    # Extend VADER's lexicon with Indian civic-complaint domain words
    # Values: positive float = positive sentiment, negative = negative
    _CIVIC_LEXICON = {
        # civic infrastructure problems (strongly negative)
        "pothole": -2.5, "potholes": -2.5, "waterlogging": -2.2,
        "waterlogged": -2.2, "sewage": -2.0, "stench": -2.0,
        "mosquitoes": -1.8, "mosquito": -1.8, "filthy": -2.0,
        "garbage": -1.5, "dumping": -1.8, "littering": -1.5,
        "flooding": -2.0, "flood": -1.8, "drainage": -1.0,
        "outage": -1.8, "leaking": -1.8, "unresolved": -2.2,
        "unattended": -2.0, "neglected": -2.2, "ignored": -2.0,
        "repeatedly": -1.5, "hazardous": -2.2, "overflowing": -2.0,
        # positive civic outcomes (strongly positive)
        "resolved": 2.5, "repaired": 2.2, "cleaned": 2.0,
        "addressed": 2.0, "fixed": 2.2, "cleared": 1.8,
        "cooperative": 1.8, "responsive": 1.8, "prompt": 1.5,
        "timely": 1.5, "efficient": 1.5,
    }
    _vader.lexicon.update(_CIVIC_LEXICON)
    logger.info("VADER NLP sentiment engine loaded with civic lexicon extensions.")

except ImportError:
    _vader = None
    logger.warning(
        "vaderSentiment not installed. Run: pip install vaderSentiment  "
        "Falling back to basic scoring."
    )


def _score_text(text: str) -> float:
    """
    Return a sentiment score in [-1.0, +1.0] using VADER NLP.

    VADER automatically handles:
    - Negation:     'not good' → negative,  'not bad' → positive
    - Intensifiers: 'very bad' > 'bad'
    - Punctuation:  'great!!!' > 'great'
    - Caps:         'TERRIBLE' > 'terrible'
    - Conjunctions: 'road is bad BUT team was helpful' → balanced
    """
    if not text:
        return 0.0

    if _vader is not None:
        scores = _vader.polarity_scores(text)
        # compound score is already normalised to [-1, +1]
        return round(scores["compound"], 3)

    # Fallback: neutral score if library missing
    return 0.0


def _score_grievance(description: str, feedback: dict | None, rating: int | None) -> float:
    """
    Combine text score with star rating for a final sentiment score.
    - Star rating (1-5) is the strongest signal when present.
    - Text score fills in when there's no rating.
    """
    text_score = _score_text(description or "")
    comment_score = 0.0
    if feedback:
        comment = feedback.get("comments", "")
        if comment:
            comment_score = _score_text(comment)

    # Blend text sources (description 60%, comment 40%)
    base = text_score * 0.6 + comment_score * 0.4

    # Incorporate star rating if available: map 1→-0.9, 3→0, 5→+0.9
    if rating is not None:
        try:
            r = int(rating)
            if 1 <= r <= 5:
                star_score = (r - 3) / 2.2          # maps [1..5] → [-0.91..+0.91]
                base = base * 0.4 + star_score * 0.6  # rating dominates when present
        except (TypeError, ValueError):
            pass

    return round(max(-1.0, min(1.0, base)), 3)


# ---------------------------------------------------------------------------
# Batch scorer — runs on unanalysed grievances
# ---------------------------------------------------------------------------

def _ensure_sentiment_scores(db, limit: int = 500) -> None:
    """
    Find grievances without a sentimentScore, score them locally,
    and write the result back to MongoDB.
    """
    unanalysed = list(
        db.grievances.find(
            {
                "isDeleted": False,
                "$or": [
                    {"aiAnalysis": {"$exists": False}},
                    {"aiAnalysis.sentimentScore": None},
                    {"aiAnalysis.sentimentScore": {"$exists": False}},
                    # NOTE: previously also re-scored anything with a stored score of
                    # exactly 0.0, intended as a one-time re-pass after the keyword
                    # vocabulary was expanded. Left permanently, that condition made
                    # every genuinely-neutral grievance (a real, correct 0.0 score)
                    # get re-scored on every single request forever — this was the
                    # main cause of 15-30s dashboard load times. Removed; scores are
                    # now truly persisted once computed.
                ],
            },
            {"_id": 1, "description": 1, "feedback": 1},
        ).limit(limit)
    )

    if not unanalysed:
        return

    logger.info(f"Scoring sentiment for {len(unanalysed)} grievances…")

    # Was: one db.grievances.update_one() call per grievance in a loop — up to
    # `limit` (500) individual round trips to MongoDB. Same result, single
    # bulk_write() instead: one round trip covering all of them.
    from pymongo import UpdateOne

    now = datetime.utcnow()
    ops = []
    for g in unanalysed:
        feedback = g.get("feedback") or {}
        rating   = feedback.get("rating")
        score    = _score_grievance(g.get("description", ""), feedback, rating)
        ops.append(
            UpdateOne(
                {"_id": g["_id"]},
                {
                    "$set": {
                        "aiAnalysis.sentimentScore": score,
                        "aiAnalysis.analyzedAt": now,
                    }
                },
            )
        )

    if ops:
        try:
            db.grievances.bulk_write(ops, ordered=False)
        except Exception as exc:
            logger.error(f"Failed to bulk-write sentiment scores: {exc}", exc_info=True)

    logger.info("Sentiment scoring complete.")


# ---------------------------------------------------------------------------
# Card 1 — Public sentiment
# ---------------------------------------------------------------------------

def flush_sentiment_cache() -> None:
    """Delete all cached MLA sentiment/approval results so next request is fresh."""
    r = _get_redis()
    if r is None:
        return
    keys = list(r.scan_iter("mla:*"))
    if keys:
        r.delete(*keys)


def get_public_sentiment(days: int = 90) -> dict:
    cache_key = f"mla:public_sentiment:{days}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    db = MongoDatabase.get_db()
    _ensure_sentiment_scores(db)

    now   = datetime.utcnow()
    since = now - timedelta(days=days)
    prev  = now - timedelta(days=days * 2)

    def _count_period(start, end):
        docs = list(
            db.grievances.find(
                {
                    "isDeleted": False,
                    "createdAt": {"$gte": start, "$lt": end},
                    "aiAnalysis.sentimentScore": {"$exists": True, "$ne": None},
                },
                {"aiAnalysis.sentimentScore": 1},
            )
        )
        pos = neu = neg = 0
        for d in docs:
            s = d.get("aiAnalysis", {}).get("sentimentScore", 0) or 0
            if s > 0.08:
                pos += 1
            elif s < -0.08:
                neg += 1
            else:
                neu += 1
        return pos, neu, neg

    pos, neu, neg = _count_period(since, now)
    prev_pos, _, _ = _count_period(prev, since)

    total = pos + neu + neg

    def pct(n):
        return round(n / total * 100, 1) if total else 0

    pos_trend = None
    if pos > 0 and prev_pos > 0:
        pos_trend = round(((pos - prev_pos) / prev_pos) * 100, 1)

    result = {
        "total": total,
        "positive": {"count": pos, "pct": pct(pos)},
        "neutral":  {"count": neu, "pct": pct(neu)},
        "negative": {"count": neg, "pct": pct(neg)},
        "positiveTrend": pos_trend,
        "hasData": total > 0,
    }
    _cache_set(cache_key, result, settings.CACHE_TTL_ANALYTICS)
    return result


# ---------------------------------------------------------------------------
# Card 2 — Approval by group (citizen age segments)
# ---------------------------------------------------------------------------

AGE_GROUPS = [
    ("18–29", 18, 29),
    ("30–44", 30, 44),
    ("45–59", 45, 59),
    ("60+",   60, 999),
]


def get_approval_by_group(days: int = 90) -> dict:
    """
    Joins citizens (age) with their grievance sentiment scores and returns
    an approval percentage per age group.
    Age is now a required field on citizen profile, so this will have real data.
    """
    cache_key = f"mla:approval_by_group:{days}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    db = MongoDatabase.get_db()
    _ensure_sentiment_scores(db)

    since = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "isDeleted": False,
                "createdAt": {"$gte": since},
                "aiAnalysis.sentimentScore": {"$exists": True, "$ne": None},
            }
        },
        # Convert citizenId string → ObjectId so $lookup can match users._id
        {
            "$addFields": {
                "citizenObjId": {
                    "$cond": {
                        "if": {"$and": [
                            {"$ne": ["$citizenId", None]},
                            {"$ne": ["$citizenId", ""]},
                        ]},
                        "then": {"$toObjectId": "$citizenId"},
                        "else": None,
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "citizenObjId",
                "foreignField": "_id",
                "as": "citizen",
            }
        },
        {"$unwind": {"path": "$citizen", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "sentimentScore": "$aiAnalysis.sentimentScore",
                # age may be on citizen directly OR nested under profile
                "age": {
                    "$ifNull": [
                        "$citizen.age",
                        "$citizen.profile.age",
                    ]
                },
            }
        },
    ]

    docs = list(db.grievances.aggregate(pipeline))
    groups = {g[0]: {"positive": 0, "total": 0} for g in AGE_GROUPS}

    for doc in docs:
        age   = doc.get("age")
        score = doc.get("sentimentScore", 0) or 0
        if age is None:
            continue
        try:
            age = int(age)
        except (TypeError, ValueError):
            continue
        for label, lo, hi in AGE_GROUPS:
            if lo <= age <= hi:
                groups[label]["total"] += 1
                if score > -0.08:   # not strongly negative = proxy for approval
                    groups[label]["positive"] += 1
                break

    result = []
    for label, _, __ in AGE_GROUPS:
        g     = groups[label]
        total = g["total"]
        pct   = round(g["positive"] / total * 100) if total > 0 else None
        result.append({"label": label, "approvalPct": pct, "total": total})

    payload = {"groups": result, "hasData": any(g["total"] > 0 for g in result)}
    _cache_set(cache_key, payload, settings.CACHE_TTL_ANALYTICS)
    return payload


# ---------------------------------------------------------------------------
# Card 3 — What's moving your numbers
# ---------------------------------------------------------------------------

CATEGORY_META = {
    "ROAD_ISSUE":      {"label": "Road repairs",    "icon": "edit_road"},
    "WATER_SUPPLY":    {"label": "Water supply",    "icon": "water_drop"},
    "ELECTRICITY":     {"label": "Electricity",     "icon": "bolt"},
    "GARBAGE":         {"label": "Garbage & waste", "icon": "delete"},
    "NOISE_POLLUTION": {"label": "Noise pollution", "icon": "volume_up"},
    "OTHER":           {"label": "Other issues",    "icon": "help_outline"},
}

CATEGORY_KEY_MAP = {
    "POWER_OUTAGE": "ELECTRICITY",
    "ELECTRICITY_SUPPLY": "ELECTRICITY",
    "POWER": "ELECTRICITY",
    "ELECTRIC": "ELECTRICITY",
    "POWER OUTAGE": "ELECTRICITY",
    "ELECTRICITY ISSUE": "ELECTRICITY",
    "NOISE": "NOISE_POLLUTION",
    "NOISE POLLUTION": "NOISE_POLLUTION",
    "GARBAGE": "GARBAGE",
    "WASTE": "GARBAGE",
    "ROAD": "ROAD_ISSUE",
    "ROADS": "ROAD_ISSUE",
    "ROAD ISSUE": "ROAD_ISSUE",
    "WATER": "WATER_SUPPLY",
    "WATER SUPPLY": "WATER_SUPPLY",
}


def _normalize_category_key(raw_key: Any) -> str:
    if not raw_key:
        return "OTHER"

    key = str(raw_key).strip()
    if not key:
        return "OTHER"

    if key in CATEGORY_META:
        return key

    normalized = key.upper().replace("-", " ").replace("_", " ").strip()
    if normalized in CATEGORY_KEY_MAP:
        return CATEGORY_KEY_MAP[normalized]

    if normalized in CATEGORY_META:
        return normalized

    if "NOISE" in normalized or "SOUND" in normalized or "VOLUME" in normalized:
        return "NOISE_POLLUTION"
    if "POWER" in normalized or "ELECTRIC" in normalized or "LIGHT" in normalized:
        return "ELECTRICITY"
    if "WATER" in normalized:
        return "WATER_SUPPLY"
    if "ROAD" in normalized or "POTHOLE" in normalized or "STREET" in normalized:
        return "ROAD_ISSUE"
    if "GARB" in normalized or "WASTE" in normalized or "SANIT" in normalized or "TRASH" in normalized:
        return "GARBAGE"

    return "OTHER"


def get_moving_numbers(days: int = 90) -> dict:
    db  = MongoDatabase.get_db()
    now = datetime.utcnow()
    since      = now - timedelta(days=days)
    prev_since = now - timedelta(days=days * 2)

    def _cat_stats(start, end):
        pipeline = [
            {"$match": {"isDeleted": False, "createdAt": {"$gte": start, "$lt": end}}},
            {
                "$group": {
                    # categoryId stores enum string e.g. "ROAD_ISSUE"; fall back to category field
                    "_id": {"$ifNull": ["$categoryId", "$category"]},
                    "total": {"$sum": 1},
                    "resolved": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$status", ["RESOLVED", "CLOSED"]]},
                                1, 0,
                            ]
                        }
                    },
                }
            },
        ]
        result = {}
        for doc in db.grievances.aggregate(pipeline):
            raw_key = doc["_id"]
            if not raw_key:
                continue
            # Normalise to a known CATEGORY_META key; unknown values map to OTHER
            cat_key = _normalize_category_key(raw_key)
            existing = result.get(cat_key, {"total": 0, "resolved": 0})
            existing["total"]    += doc["total"]
            existing["resolved"] += doc["resolved"]
            result[cat_key] = existing
        return result

    current  = _cat_stats(since, now)
    previous = _cat_stats(prev_since, since)

    logger.info(f"Moving numbers — current period categories: {list(current.keys())}")

    drivers = []
    for cat_key, meta in CATEGORY_META.items():
        cur = current.get(cat_key,  {"total": 0, "resolved": 0})
        prv = previous.get(cat_key, {"total": 0, "resolved": 0})

        if cur["total"] == 0 and prv["total"] == 0:
            continue

        cur_rate = cur["resolved"] / cur["total"] if cur["total"] else 0
        prv_rate = prv["resolved"] / prv["total"] if prv["total"] else 0

        volume_weight = min(cur["total"] / 10, 5)
        impact = round((cur_rate - prv_rate) * 10 * (1 + volume_weight * 0.1), 1)

        sub_parts = []
        if cur["total"]:
            sub_parts.append(f"{cur['total']} reports")
        if cur["resolved"]:
            sub_parts.append(f"{cur['resolved']} resolved")
        sub = " · ".join(sub_parts) if sub_parts else "No reports"

        drivers.append({
            "key":    cat_key,
            "label":  meta["label"],
            "icon":   meta["icon"],
            "impact": impact,
            "sub":    sub,
            "total":  cur["total"],
            "resolved": cur.get("resolved", 0),
            "prev_total": prv.get("total", 0),
            "prev_resolved": prv.get("resolved", 0),
        })

    drivers = sorted(drivers, key=lambda d: abs(d["impact"]), reverse=True)[:4]
    payload = {"drivers": drivers, "hasData": len(drivers) > 0}
    return payload


# ---------------------------------------------------------------------------
# Card 4 — Standing vs. peers (ward-level approval ranking)
# ---------------------------------------------------------------------------

def get_peer_ranking(days: int = 90) -> dict:
    """
    Rank all wards by their grievance-derived approval %, giving a
    'Standing vs. peers' view across constituencies.
    """
    db = MongoDatabase.get_db()
    _ensure_sentiment_scores(db)

    since = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "isDeleted": False,
                "createdAt": {"$gte": since},
                "aiAnalysis.sentimentScore": {"$exists": True, "$ne": None},
                "wardId": {"$exists": True, "$ne": None},
            }
        },
        {
            "$group": {
                "_id": "$wardId",
                "total": {"$sum": 1},
                "positive": {
                    "$sum": {
                        "$cond": [{"$gt": ["$aiAnalysis.sentimentScore", 0.08]}, 1, 0]
                    }
                },
            }
        },
    ]

    docs = list(db.grievances.aggregate(pipeline))

    wards = []
    for doc in docs:
        ward_id = doc["_id"]
        if not ward_id:
            continue
        total = doc["total"]
        approval_pct = round(doc["positive"] / total * 100) if total > 0 else 0
        # Try to resolve a friendly ward name from the wards collection
        ward_name = None
        try:
            from bson import ObjectId as _ObjId
            ward_doc = db.wards.find_one(
                {"_id": _ObjId(str(ward_id))},
                {"wardName": 1, "name": 1}
            )
            if ward_doc:
                ward_name = ward_doc.get("wardName") or ward_doc.get("name")
        except Exception:
            pass
        if not ward_name:
            # Use the raw wardId if it looks like a human-readable label,
            # otherwise fall back to a positional label added after sorting
            ward_name = str(ward_id) if len(str(ward_id)) < 30 else None

        wards.append({
            "wardId":      str(ward_id),
            "wardName":    ward_name,
            "approvalPct": approval_pct,
            "total":       total,
        })

    # Rank highest approval first
    wards.sort(key=lambda x: -x["approvalPct"])
    for i, w in enumerate(wards):
        w["rank"] = i + 1
        if not w["wardName"]:
            w["wardName"] = f"Ward {i + 1}"

    return {
        "wards":      wards,
        "totalWards": len(wards),
        "hasData":    len(wards) > 0,
    }


# ---------------------------------------------------------------------------
# Card 5 — Career trajectory (monthly approval trend)
# ---------------------------------------------------------------------------

def get_sentiment_trend(months: int = 12) -> dict:
    """
    Returns monthly approval % for the past N months.
    Used to draw the career trajectory sparkline.
    """
    db = MongoDatabase.get_db()
    _ensure_sentiment_scores(db)

    now = datetime.utcnow()
    points = []

    for i in range(months - 1, -1, -1):
        # Start and end of each calendar month
        month_end   = now.replace(day=1) - timedelta(days=1) if i == 0 else \
                      (now.replace(day=1) - timedelta(days=1) - timedelta(days=30 * (i - 1)))
        month_start = (month_end.replace(day=1))

        # Correct month boundaries
        target = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)

        docs = list(db.grievances.find(
            {
                "isDeleted": False,
                "createdAt": {"$gte": m_start, "$lt": m_end},
                "aiAnalysis.sentimentScore": {"$exists": True, "$ne": None},
            },
            {"aiAnalysis.sentimentScore": 1}
        ))

        total = len(docs)
        if total == 0:
            points.append({
                "month": m_start.strftime("%b %Y"),
                "approvalPct": None,
                "positivePct": None,
                "neutralPct":  None,
                "negativePct": None,
                "total": 0,
            })
            continue

        pos_c = neu_c = neg_c = 0
        for d in docs:
            s = (d.get("aiAnalysis") or {}).get("sentimentScore", 0) or 0
            if s > 0.08:
                pos_c += 1
            elif s < -0.08:
                neg_c += 1
            else:
                neu_c += 1

        points.append({
            "month":       m_start.strftime("%b %Y"),
            "approvalPct": round((pos_c + neu_c) / total * 100),
            "positivePct": round(pos_c / total * 100),
            "neutralPct":  round(neu_c / total * 100),
            "negativePct": round(neg_c / total * 100),
            "total":       total,
        })

    has_data = any(p["approvalPct"] is not None for p in points)
    return {"points": points, "hasData": has_data}


# ---------------------------------------------------------------------------
# Card 6 — Where feedback comes from
# ---------------------------------------------------------------------------

def get_election_probability(approval_pct) -> dict:
    """
    Compute re-election probability scenarios from an approval percentage.
    Uses a normal-distribution model (Abramowitz & Stegun CDF approximation).

    Moved here from the frontend ExecutiveDashboard so the algorithm lives
    in exactly one place and is testable server-side.
    """
    if approval_pct is None:
        return {
            "strongReelection": None,
            "competitiveRace": None,
            "atRisk": None,
            "hasData": False,
        }

    import math

    def phi(z: float) -> float:
        """Standard normal CDF — Abramowitz & Stegun §7.1.26 (max |error| < 7.5e-8)."""
        s = -1 if z < 0 else 1
        x = abs(z)
        t2 = 1.0 / (1.0 + 0.3275911 * x)
        p = t2 * (0.254829592 + t2 * (
            -0.284496736 + t2 * (
                1.421413741 + t2 * (
                    -1.453152027 + t2 * 1.061405429
                )
            )
        ))
        return 0.5 + s * 0.5 * (1.0 - p * math.exp(-x * x / 2.0))

    # Map approval % → estimated vote-share (heuristic: every 1 pt approval ≈ 0.5 pt vote-share, offset by -5)
    sigma = 15.0
    vote_share = max(5.0, min(95.0, 0.5 * approval_pct + 25.0 - 5.0))

    p_strong = (1.0 - phi((55.0 - vote_share) / sigma)) * 100.0   # P(vote_share > 55%)
    p_loss   = phi((45.0 - vote_share) / sigma)         * 100.0   # P(vote_share < 45%)

    strong_prob   = max(1, round(p_strong))
    at_risk_prob  = max(1, round(p_loss))
    comp_prob     = max(1, 100 - strong_prob - at_risk_prob)

    return {
        "strongReelection": strong_prob,
        "competitiveRace":  comp_prob,
        "atRisk":           at_risk_prob,
        "hasData":          True,
    }


def get_feedback_sources(days: int = 90) -> dict:
    """Count feedback signals from each channel in the given period."""
    db    = MongoDatabase.get_db()
    since = datetime.utcnow() - timedelta(days=days)

    # In-app grievance reports
    reports = db.grievances.count_documents({
        "isDeleted": False,
        "createdAt": {"$gte": since},
    })

    # Grievances that have a text comment in feedback
    comments = db.grievances.count_documents({
        "isDeleted": False,
        "createdAt": {"$gte": since},
        "feedback.comments": {"$exists": True, "$nin": [None, ""]},
    })

    # Event registrations (poll / event participation)
    polls = db.events.count_documents({
        "createdAt": {"$gte": since},
    })

    # Survey responses
    try:
        surveys = db.survey_responses.count_documents({
            "submittedAt": {"$gte": since},
        })
    except Exception:
        surveys = 0

    total = reports + comments + polls + surveys
    return {
        "reports":  reports,
        "comments": comments,
        "polls":    polls,
        "surveys":  surveys,
        "total":    total,
        "hasData":  total > 0,
    }
