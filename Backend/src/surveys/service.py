"""
Survey Service
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from config.database import MongoDatabase
from utils.helper import Helper

logger = logging.getLogger(__name__)


class SurveyService:

    # ------------------------------------------------------------------ #
    # Admin — CRUD                                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    def create_survey(data: dict, created_by: str) -> str:
        db = MongoDatabase.get_db()
        data["status"] = "ACTIVE"
        data["createdBy"] = created_by
        data["responseCount"] = 0
        data.update(Helper.audit_fields(created_by))
        result = db.surveys.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def list_surveys(status: Optional[str] = None) -> list:
        db = MongoDatabase.get_db()
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
    def get_survey(survey_id: str) -> Optional[dict]:
        db = MongoDatabase.get_db()
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
    def update_survey(survey_id: str, data: dict, updated_by: str) -> bool:
        db = MongoDatabase.get_db()
        data["updatedAt"] = datetime.utcnow()
        data["updatedBy"] = updated_by
        result = db.surveys.update_one(
            {"_id": ObjectId(survey_id), "isDeleted": False},
            {"$set": data}
        )
        return result.modified_count > 0

    @staticmethod
    def delete_survey(survey_id: str, deleted_by: str) -> bool:
        db = MongoDatabase.get_db()
        result = db.surveys.update_one(
            {"_id": ObjectId(survey_id)},
            {"$set": {"isDeleted": True, "updatedAt": datetime.utcnow(), "updatedBy": deleted_by}}
        )
        return result.modified_count > 0

    # ------------------------------------------------------------------ #
    # Citizen — submit response                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def already_responded(survey_id: str, citizen_id: str) -> bool:
        db = MongoDatabase.get_db()
        return db.survey_responses.find_one(
            {"surveyId": survey_id, "citizenId": citizen_id}
        ) is not None

    @staticmethod
    def submit_response(survey_id: str, citizen_id: str, answers: list) -> str:
        db = MongoDatabase.get_db()

        # Pull age and wardId from citizen profile for demographic split
        age = None
        ward_id = None
        try:
            user = db.users.find_one({"_id": ObjectId(citizen_id)}, {"age": 1, "wardId": 1})
            if user:
                age = user.get("age")
                ward_id = user.get("wardId")
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
    def get_analytics(days: int = 90) -> dict:
        db = MongoDatabase.get_db()
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
