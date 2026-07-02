"""
Survey Routes — Multi-Tenant

Previously used get_current_user (auth only, no tenant db resolution) and
SurveyService always read/wrote MongoDatabase.get_db() (the shared master
database) — so every survey, regardless of which representative's Admin
created it, landed in one global collection visible to every citizen across
every tenant. Switched to get_tenant_db/require_auth (same dependency pair
every other module — campaigns, events, citizens, notifications — already
uses) so surveys are scoped to the creating representative's own tenant
database, same as everything else in this app.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from surveys.model import SurveyCreate, SurveyUpdate, SurveyResponseCreate
from surveys.service import SurveyService
from utils.helper import Helper
from utils.response import success_response
from utils.tenant import get_tenant_db, require_auth

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])
logger = logging.getLogger(__name__)


def _doc(s: dict) -> dict:
    return Helper.convert_mongo_doc(s)


# ------------------------------------------------------------------ #
# Admin — manage surveys                                               #
# ------------------------------------------------------------------ #

@router.post("")
async def create_survey(
    data: SurveyCreate,
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Admin only")
    survey_id = SurveyService.create_survey(
        db, data.model_dump(), user.get("user_id")
    )
    survey = SurveyService.get_survey(db, survey_id)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Survey created",
        "data": _doc(survey), "statusCode": 201,
    }), status_code=201)


@router.get("/analytics")
async def survey_analytics(
    days: int = Query(90, ge=7, le=365),
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Admin/MLA only")
    data = SurveyService.get_analytics(db, days)
    return JSONResponse(content=jsonable_encoder(
        {"success": True, "message": "Analytics retrieved", "data": data, "statusCode": 200}
    ))


@router.get("")
async def list_surveys(
    status: str = Query(None),
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    surveys = SurveyService.list_surveys(db, status)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Surveys retrieved",
        "data": [_doc(s) for s in surveys], "statusCode": 200,
    }))


@router.get("/{survey_id}")
async def get_survey(
    survey_id: str,
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    survey = SurveyService.get_survey(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Survey retrieved",
        "data": _doc(survey), "statusCode": 200,
    }))


@router.put("/{survey_id}")
async def update_survey(
    survey_id: str,
    data: SurveyUpdate,
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Admin only")
    ok = SurveyService.update_survey(
        db, survey_id, data.model_dump(exclude_unset=True), user.get("user_id")
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = SurveyService.get_survey(db, survey_id)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Survey updated",
        "data": _doc(survey), "statusCode": 200,
    }))


@router.delete("/{survey_id}")
async def delete_survey(
    survey_id: str,
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    if user.get("role") not in ("REPRESENTATIVE", "STAFF"):
        raise HTTPException(status_code=403, detail="Admin only")
    ok = SurveyService.delete_survey(db, survey_id, user.get("user_id"))
    if not ok:
        raise HTTPException(status_code=404, detail="Survey not found")
    return success_response(None, "Survey deleted")


# ------------------------------------------------------------------ #
# Citizen — respond                                                    #
# ------------------------------------------------------------------ #

@router.post("/{survey_id}/respond")
async def submit_response(
    survey_id: str,
    data: SurveyResponseCreate,
    db=Depends(get_tenant_db),
    user: dict = Depends(require_auth),
):
    survey = SurveyService.get_survey(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if survey.get("status") != "ACTIVE":
        raise HTTPException(status_code=400, detail="Survey is not active")

    citizen_id = user.get("user_id")
    if SurveyService.already_responded(db, survey_id, citizen_id):
        raise HTTPException(status_code=409, detail="You have already submitted this survey")

    answers = [a.model_dump() for a in data.answers]
    resp_id = SurveyService.submit_response(db, survey_id, citizen_id, answers)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Response submitted — thank you!",
        "data": {"responseId": resp_id}, "statusCode": 201,
    }), status_code=201)
