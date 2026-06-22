"""
MLA Sentiment Analysis Service  —  Rule-based (no API key required)

Analyses grievance descriptions using keyword matching + star ratings to derive:
  1. Public sentiment  (positive / neutral / negative breakdown)
  2. Approval by group (sentiment segmented by citizen age group)
  3. What's moving your numbers (top positive & negative category drivers)

Scores are stored back into each grievance's `aiAnalysis.sentimentScore` field
so each record is only processed once.  Results are cached in Redis (10 min).
"""

import json
import logging
import re
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
# Rule-based sentiment scorer
# ---------------------------------------------------------------------------

# Words that push the score positive (each +0.2, capped at +1.0)
_POSITIVE_WORDS = {
    # gratitude / satisfaction
    "thank", "thanks", "thankful", "grateful", "appreciate", "appreciated",
    "appreciation", "pleased", "happy", "satisfied", "satisfaction",
    "excellent", "good", "great", "nice", "well", "wonderful", "perfect",
    "awesome", "fantastic", "brilliant", "outstanding", "superb",
    # resolution / progress
    "resolved", "resolve", "fixed", "fix", "repaired", "repair", "done",
    "completed", "complete", "finished", "addressed", "solved", "solution",
    "improved", "improvement", "better", "best", "working", "works",
    "quick", "fast", "prompt", "timely", "efficient", "helpful", "help",
    "cooperative", "responsive", "response", "support", "supported",
    "clean", "cleared", "functional", "reliable", "safe", "proper",
}

# Words that push the score negative (each -0.2, capped at -1.0)
_NEGATIVE_WORDS = {
    # frustration / anger
    "bad", "terrible", "horrible", "awful", "worst", "poor", "useless",
    "pathetic", "disgusting", "shameful", "disgrace", "ridiculous",
    "frustrated", "frustrating", "angry", "upset", "disappointed",
    "disappointment", "disgusted", "unhappy", "unhelpful",
    # problems — expanded for Indian municipal complaints
    "problem", "problems", "issue", "issues", "broken", "damage", "damaged",
    "dangerous", "hazard", "hazardous", "leaking", "leak", "flood", "flooding",
    "dirty", "filthy", "smell", "stench", "stinking", "noise", "noisy",
    "blocked", "overflowing", "overflow", "polluted", "pollution",
    "crack", "cracks", "pothole", "potholes", "accident", "accidents",
    "urgent", "emergency", "immediate", "sewage", "garbage", "waste",
    "drainage", "waterlogging", "waterlogged", "shortage", "supply",
    "outage", "cut", "failure", "burst", "pipe", "road", "street",
    "light", "dark", "construction", "dumping", "littering", "mosquito",
    "mosquitoes", "rats", "stray", "dogs",
    # no action / neglect
    "ignored", "ignore", "neglected", "neglect", "pending",
    "delayed", "delay", "weeks", "months", "years", "repeatedly",
    "complained", "complaint", "again", "nobody", "nothing",
    "unresolved", "unattended", "untreated",
}

# Intensifiers — multiply the next word's impact
_INTENSIFIERS = {"very", "extremely", "highly", "completely", "totally", "absolutely", "so"}

# Negators — flip the sentiment of the following word
_NEGATORS = {"not", "no", "never", "cannot", "can't", "isn't", "wasn't", "doesn't", "don't", "didn't"}


def _score_text(text: str) -> float:
    """
    Return a sentiment score in [-1.0, +1.0] from plain text.
    Uses simple token-level keyword matching with negation and intensifiers.
    """
    if not text:
        return 0.0

    tokens = re.findall(r"[a-z']+", text.lower())
    score = 0.0
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        multiplier = 1.0

        # Check for intensifier before this token
        if i > 0 and tokens[i - 1] in _INTENSIFIERS:
            multiplier = 1.5

        # Negation window: any negator in the previous 3 tokens flips sentiment
        negated = any(tokens[max(0, i - 3) : i].count(n) for n in _NEGATORS)

        if tok in _POSITIVE_WORDS:
            delta = 0.2 * multiplier
            score += -delta if negated else delta
        elif tok in _NEGATIVE_WORDS:
            delta = 0.2 * multiplier
            score += delta if negated else -delta

        i += 1

    # Clamp to [-1, 1]
    return max(-1.0, min(1.0, round(score, 3)))


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
                    # Re-score grievances that got exactly 0.0 (no keywords matched
                    # on the first pass — may score differently now with expanded vocab)
                    {"aiAnalysis.sentimentScore": 0.0},
                ],
            },
            {"_id": 1, "description": 1, "feedback": 1},
        ).limit(limit)
    )

    if not unanalysed:
        return

    logger.info(f"Scoring sentiment for {len(unanalysed)} grievances…")

    for g in unanalysed:
        feedback = g.get("feedback") or {}
        rating   = feedback.get("rating")
        score    = _score_grievance(g.get("description", ""), feedback, rating)
        try:
            db.grievances.update_one(
                {"_id": g["_id"]},
                {
                    "$set": {
                        "aiAnalysis.sentimentScore": score,
                        "aiAnalysis.analyzedAt": datetime.utcnow(),
                    }
                },
            )
        except Exception as exc:
            logger.error(f"Failed to write sentiment score for {g['_id']}: {exc}")

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
            cat_key = raw_key if raw_key in CATEGORY_META else "OTHER"
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
        })

    positives = sorted([d for d in drivers if d["impact"] >= 0], key=lambda x: -x["impact"])[:2]
    negatives = sorted([d for d in drivers if d["impact"] <  0], key=lambda x:  x["impact"])[:2]

    payload = {"drivers": positives + negatives, "hasData": len(drivers) > 0}
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
