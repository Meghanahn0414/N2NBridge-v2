"""
Survey Service — Multi-Tenant

Every method takes the caller's own tenant `db` (resolved by
utils.tenant.get_tenant_db from their JWT / X-DB-NAME) instead of reaching
for the shared master database. Previously this service always used
MongoDatabase.get_db() (crm_master) for surveys/survey_responses, so a
survey created by one representative's Admin was stored in a single global
collection and visible to every citizen across every tenant, regardless of
who they're actually registered under — see surveys/routes.py for the
matching fix (get_tenant_db/require_auth instead of get_current_user).
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from utils.helper import Helper

logger = logging.getLogger(__name__)


class SurveyService:

    # ------------------------------------------------------------------ #
    # Admin — CRUD                                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    def create_survey(db, data: dict, created_by: str) -> str:
        data["status"] = "ACTIVE"
        data["createdBy"] = created_by
        data["responseCount"] = 0
        data.update(Helper.audit_fields(created_by))
        result = db.surveys.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def list_surveys(db, status: Optional[str] = None) -> list:
        query = {"isDeleted": False}
        if status:
            query["status"] = status
        surveys = list(db.surveys.find(query).sort("createdAt", -1))
        for s in surveys:
            s["responseCount"] = db.survey_responses.count_documents(
                {"surveyId": str(s["_id"])}
            )
        return surveys

    @staticmethod
    def get_survey(db, survey_id: str) -> Optional[dict]:
        try:
            s = db.surveys.find_one({"_id": ObjectId(survey_id), "isDeleted": False})
            if s:
                s["responseCount"] = db.survey_responses.count_documents(
                    {"surveyId": survey_id}
                )
            return s
        except Exception:
            return None

    @staticmethod
    def update_survey(db, survey_id: str, data: dict, updated_by: str) -> bool:
        data["updatedAt"] = datetime.utcnow()
        data["updatedBy"] = updated_by
        result = db.surveys.update_one(
            {"_id": ObjectId(survey_id), "isDeleted": False},
            {"$set": data}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_survey(db, survey_id: str, deleted_by: str) -> bool:
        result = db.surveys.update_one(
            {"_id": ObjectId(survey_id)},
            {"$set": {"isDeleted": True, "updatedAt": datetime.utcnow(), "updatedBy": deleted_by}}
        )
        return result.modified_count > 0

    # ------------------------------------------------------------------ #
    # Citizen — submit response                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def already_responded(db, survey_id: str, citizen_id: str) -> bool:
        return db.survey_responses.find_one(
            {"surveyId": survey_id, "citizenId": citizen_id}
        ) is not None

    @staticmethod
    def submit_response(db, survey_id: str, citizen_id: str, answers: list) -> str:
        # Pull age and ward from the citizen's own profile for demographic
        # split. Citizens live in `db.citizens` (never `db.users`, which is
        # representative + staff only), keyed by `ward_id` — not `wardId`.
        age = None
        ward_id = None
        try:
            citizen = db.citizens.find_one({"_id": ObjectId(citizen_id)}, {"age": 1, "ward_id": 1})
            if citizen:
                age = citizen.get("age")
                ward_id = citizen.get("ward_id")
        except Exception:
            pass

        doc = {
            "surveyId":   survey_id,
            "citizenId":  citizen_id,
            "answers":    answers,
            "submittedAt": datetime.utcnow(),
            "age":        age,
            "wardId":     ward_id,
        }
        result = db.survey_responses.insert_one(doc)
        return str(result.inserted_id)

    # ------------------------------------------------------------------ #
    # MLA analytics                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_analytics(db, days: int = 90) -> dict:
        since = datetime.utcnow() - timedelta(days=days)

        responses = list(db.survey_responses.find({"submittedAt": {"$gte": since}}))
        if not responses:
            return {"hasData": False, "totalResponses": 0}

        # ---- overall satisfaction score (average of all RATING answers) ----
        rating_vals = []
        topic_buckets: dict = {}   # questionId -> {sum, count}
        text_feedback = []

        # Build question map from surveys
        survey_ids = list({r["surveyId"] for r in responses})
        questions_map: dict = {}   # questionId -> question doc
        for sid in survey_ids:
            try:
                s = db.surveys.find_one({"_id": ObjectId(sid)})
                if s:
                    for q in s.get("questions", []):
                        questions_map[q["id"]] = q
            except Exception:
                pass

        for resp in responses:
            for ans in resp.get("answers", []):
                qid = ans.get("questionId")
                val = ans.get("value")
                q   = questions_map.get(qid, {})

                if q.get("type") == "RATING":
                    try:
                        v = int(val)
                        rating_vals.append(v)
                        bucket = topic_buckets.setdefault(q.get("text", qid), {"sum": 0, "count": 0})
                        bucket["sum"]   += v
                        bucket["count"] += 1
                    except (TypeError, ValueError):
                        pass

                elif q.get("type") == "TEXT" and val:
                    text_feedback.append(str(val))

        avg_score = round(sum(rating_vals) / len(rating_vals), 2) if rating_vals else None

        topic_scores = [
            {"topic": k, "avgScore": round(v["sum"] / v["count"], 2), "responses": v["count"]}
            for k, v in topic_buckets.items()
        ]
        topic_scores.sort(key=lambda x: -x["avgScore"])

        # ---- monthly trend ----
        monthly: dict = {}
        for resp in responses:
            month = resp["submittedAt"].strftime("%b %Y")
            for ans in resp.get("answers", []):
                q = questions_map.get(ans.get("questionId"), {})
                if q.get("type") == "RATING":
                    try:
                        m = monthly.setdefault(month, {"sum": 0, "count": 0})
                        m["sum"]   += int(ans["value"])
                        m["count"] += 1
                    except (TypeError, ValueError):
                        pass

        trend = [
            {"month": m, "avgScore": round(v["sum"] / v["count"], 2), "responses": v["count"]}
            for m, v in sorted(monthly.items(), key=lambda x: datetime.strptime(x[0], "%b %Y"))
        ]

        # ---- demographic split by age group ----
        age_groups = {"18-29": [], "30-44": [], "45-59": [], "60+": []}
        for resp in responses:
            age = resp.get("age")
            if age is None:
                continue
            try:
                age = int(age)
            except (TypeError, ValueError):
                continue
            for ans in resp.get("answers", []):
                q = questions_map.get(ans.get("questionId"), {})
                if q.get("type") == "RATING":
                    try:
                        v = int(ans["value"])
                        if 18 <= age <= 29:
                            age_groups["18-29"].append(v)
                        elif 30 <= age <= 44:
                            age_groups["30-44"].append(v)
                        elif 45 <= age <= 59:
                            age_groups["45-59"].append(v)
                        elif age >= 60:
                            age_groups["60+"].append(v)
                    except (TypeError, ValueError):
                        pass

        demographics = [
            {
                "group": g,
                "avgScore": round(sum(vals) / len(vals), 2) if vals else None,
                "responses": len(vals),
            }
            for g, vals in age_groups.items()
        ]

        return {
            "hasData":        True,
            "totalResponses": len(responses),
            "avgScore":       avg_score,
            "maxScore":       5,
            "topicScores":    topic_scores,
            "trend":          trend,
            "demographics":   demographics,
            "recentFeedback": text_feedback[-5:],
        }
