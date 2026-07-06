"""
Discovery Service

Lets a citizen — who still has exactly one "home" tenant database from
registration, unchanged — search, follow, and read public content from ANY
representative in the system (MLA, MP, or COUNCILLOR), not just their own.

Identity note: every tenant database holds exactly one REPRESENTATIVE user
(see utils/directory_client.py's `db.users.find_one({"role": "REPRESENTATIVE"})`
and citizens/routes.py's my_representatives — both assume this). So db_name
alone uniquely identifies a representative; there's no separate "rep_id"
needed, and using the master registry's own _id as if it were the tenant
user's _id would be wrong (they're different documents in different
databases with independently generated ObjectIds).

Two master-DB collections make this possible:
  - representatives   (already existed — the slug/db_name registry every
                        representative is written into at registration time,
                        see auth/routes.py)
  - citizen_follows    (new — one doc per citizen, keyed by "{db_name}:{user_id}"
                        from their JWT, holding the list of representatives
                        they follow across every tenant database)

Nothing here touches a citizen's home-tenant registration/login flow or any
existing tenant collection's schema — this is purely additive.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from config.database import MongoDatabase

logger = logging.getLogger(__name__)

PUBLIC_REP_FIELDS = {
    "_id": 0, "name": 1, "rep_type": 1, "db_name": 1, "slug": 1, "rep_code": 1,
    "assembly_name": 1, "parliamentary_name": 1, "ward_id": 1, "ward_name": 1,
    "taluk": 1, "district": 1, "state": 1, "status": 1,
}


def _citizen_key(db_name: str, user_id: str) -> str:
    return f"{db_name}:{user_id}"


class DiscoveryService:
    """Cross-tenant representative search + citizen follow list."""

    # ── Search / browse ────────────────────────────────────────────────────────

    @staticmethod
    def search_representatives(
        rep_type: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        q: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        master = MongoDatabase.get_db()
        query: dict = {"status": "ACTIVE"}
        if rep_type:
            query["rep_type"] = rep_type.strip().upper()
        if state:
            query["state"] = {"$regex": f"^{state}$", "$options": "i"}
        if district:
            query["district"] = {"$regex": f"^{district}$", "$options": "i"}
        if q:
            query["$or"] = [
                {"name":               {"$regex": q, "$options": "i"}},
                {"assembly_name":      {"$regex": q, "$options": "i"}},
                {"parliamentary_name": {"$regex": q, "$options": "i"}},
                {"ward_name":          {"$regex": q, "$options": "i"}},
            ]

        skip = (page - 1) * per_page
        cursor = master.representatives.find(query, PUBLIC_REP_FIELDS).skip(skip).limit(per_page)
        items = list(cursor)
        total = master.representatives.count_documents(query)
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_public_profile(db_name: str) -> Optional[dict]:
        """Public profile card for one representative, fetched from THEIR OWN
        tenant database (not the master DB) — fixes the pattern used by the
        older mla/routes.py public-profile endpoint, which read from
        MongoDatabase.get_db() (the master DB) and only ever worked for the
        caller's own tenant."""
        master = MongoDatabase.get_db()
        registry = master.representatives.find_one({"db_name": db_name}, PUBLIC_REP_FIELDS)
        if not registry:
            return None

        tenant_db = MongoDatabase.get_tenant_db(db_name)
        rep = tenant_db.users.find_one(
            {"role": "REPRESENTATIVE"},
            {
                "_id": 1, "fullName": 1, "title": 1, "bio": 1, "profileImage": 1,
                "officePhone": 1, "officeAddress": 1,
                "showApprovalRating": 1, "showResolvedCount": 1,
            },
        )
        if not rep:
            return None

        resolved_count = None
        if rep.get("showResolvedCount", True):
            try:
                resolved_count = tenant_db.grievances.count_documents(
                    {"status": {"$in": ["RESOLVED", "CLOSED"]}}
                )
            except Exception as exc:
                logger.warning(f"get_public_profile: resolved count failed for {db_name}: {exc}")

        return {
            "dbName":           db_name,
            "repType":          registry.get("rep_type"),
            "fullName":         rep.get("fullName"),
            "title":            rep.get("title") or registry.get("rep_type"),
            "bio":              rep.get("bio"),
            "profileImage":     rep.get("profileImage"),
            "officePhone":      rep.get("officePhone"),
            "officeAddress":    rep.get("officeAddress"),
            "assemblyName":     registry.get("assembly_name"),
            "parliamentaryName": registry.get("parliamentary_name"),
            "wardName":         registry.get("ward_name"),
            "district":         registry.get("district"),
            "state":            registry.get("state"),
            "showResolvedCount": rep.get("showResolvedCount", True),
            "resolvedCount":    resolved_count,
        }

    # ── Follow / unfollow ──────────────────────────────────────────────────────

    @staticmethod
    def follow(home_db_name: str, home_user_id: str, db_name: str, rep_type: Optional[str] = None) -> dict:
        master = MongoDatabase.get_db()
        registry = master.representatives.find_one({"db_name": db_name})
        if not registry:
            raise ValueError(f"No representative registry entry for db_name={db_name}")

        key = _citizen_key(home_db_name, home_user_id)
        entry = {
            "db_name":    db_name,
            "rep_type":   rep_type or registry.get("rep_type"),
            "name":       registry.get("name"),
            "followedAt": datetime.now(timezone.utc),
        }
        # Avoid duplicates: pull any existing entry for this db_name first,
        # then push the fresh one — cheaper than a positional upsert and
        # keeps followedAt accurate if a citizen unfollows/refollows.
        master.citizen_follows.update_one(
            {"citizen_key": key},
            {"$pull": {"following": {"db_name": db_name}}},
        )
        master.citizen_follows.update_one(
            {"citizen_key": key},
            {
                "$push": {"following": entry},
                "$setOnInsert": {
                    "citizen_key": key,
                    "home_db_name": home_db_name,
                    "home_user_id": home_user_id,
                    "createdAt": datetime.now(timezone.utc),
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)},
            },
            upsert=True,
        )
        return entry

    @staticmethod
    def unfollow(home_db_name: str, home_user_id: str, db_name: str) -> bool:
        master = MongoDatabase.get_db()
        key = _citizen_key(home_db_name, home_user_id)
        result = master.citizen_follows.update_one(
            {"citizen_key": key},
            {
                "$pull": {"following": {"db_name": db_name}},
                "$set": {"updatedAt": datetime.now(timezone.utc)},
            },
        )
        return result.modified_count > 0

    @staticmethod
    def list_following(home_db_name: str, home_user_id: str) -> list:
        master = MongoDatabase.get_db()
        key = _citizen_key(home_db_name, home_user_id)
        doc = master.citizen_follows.find_one({"citizen_key": key}, {"_id": 0, "following": 1})
        return (doc or {}).get("following", [])

    # ── Aggregated feed ─────────────────────────────────────────────────────────

    @staticmethod
    def get_feed(home_db_name: str, home_user_id: str, limit_per_rep: int = 10, total_limit: int = 40) -> list:
        """Merge recent published campaigns + events from every representative
        this citizen follows, across their separate tenant databases, into one
        chronological feed."""
        following = DiscoveryService.list_following(home_db_name, home_user_id)
        items: list = []
        for f in following:
            db_name = f.get("db_name")
            if not db_name:
                continue
            try:
                tdb = MongoDatabase.get_tenant_db(db_name)
                campaigns = tdb.campaigns.find(
                    {"status": "ACTIVE", "isDeleted": {"$ne": True}}
                ).sort("createdAt", -1).limit(limit_per_rep)
                for c in campaigns:
                    items.append({
                        "type": "campaign",
                        "repName": f.get("name"),
                        "repType": f.get("rep_type"),
                        "dbName": db_name,
                        "id": str(c["_id"]),
                        "title": c.get("name"),
                        "message": c.get("message"),
                        "coverImage": c.get("coverImage"),
                        "createdAt": c.get("createdAt"),
                    })
                events = tdb.events.find(
                    {"status": "PUBLISHED", "isDeleted": {"$ne": True}}
                ).sort("createdAt", -1).limit(limit_per_rep)
                for e in events:
                    items.append({
                        "type": "event",
                        "repName": f.get("name"),
                        "repType": f.get("rep_type"),
                        "dbName": db_name,
                        "id": str(e["_id"]),
                        "title": e.get("eventName"),
                        "message": e.get("description"),
                        "eventDate": e.get("eventDate"),
                        "venue": e.get("venue"),
                        "createdAt": e.get("createdAt"),
                    })
            except Exception as exc:
                logger.warning(f"get_feed: failed to read tenant db {db_name}: {exc}")
                continue

        def _sort_key(item: dict):
            # Different modules in this codebase store createdAt as either a
            # naive datetime.utcnow() or a tz-aware datetime.now(timezone.utc)
            # (compare campaigns/service.py vs citizens/routes.py). Mixing
            # naive and aware datetimes in a single sort() raises TypeError,
            # so normalize everything to aware-UTC before comparing.
            dt = item.get("createdAt")
            if dt is None:
                return datetime.min.replace(tzinfo=timezone.utc)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt

        items.sort(key=_sort_key, reverse=True)
        return items[:total_limit]
