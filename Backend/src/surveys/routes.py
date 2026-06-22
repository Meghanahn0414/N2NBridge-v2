"""
Survey Routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from auth.routes import get_current_user
from surveys.model import SurveyCreate, SurveyUpdate, SurveyResponseCreate
from surveys.service import SurveyService
from utils.helper import Helper
from utils.response import success_response

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
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ADMIN", "MLA"):
        raise HTTPException(status_code=403, detail="Admin only")
    survey_id = SurveyService.create_survey(
        data.model_dump(), current_user["user_id"]
    )
    survey = SurveyService.get_survey(survey_id)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Survey created",
        "data": _doc(survey), "statusCode": 201,
    }), status_code=201)


@router.get("/analytics")
async def survey_analytics(
    days: int = Query(90, ge=7, le=365),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ADMIN", "MLA"):
        raise HTTPException(status_code=403, detail="Admin/MLA only")
    data = SurveyService.get_analytics(days)
    return JSONResponse(content=jsonable_encoder(
        {"success": True, "message": "Analytics retrieved", "data": data, "statusCode": 200}
    ))


@router.get("")
async def list_surveys(
    status: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    surveys = SurveyService.list_surveys(status)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Surveys retrieved",
        "data": [_doc(s) for s in surveys], "statusCode": 200,
    }))


@router.get("/{survey_id}")
async def get_survey(
    survey_id: str,
    current_user: dict = Depends(get_current_user),
):
    survey = SurveyService.get_survey(survey_id)
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
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ADMIN", "MLA"):
        raise HTTPException(status_code=403, detail="Admin only")
    ok = SurveyService.update_survey(
        survey_id, data.model_dump(exclude_unset=True), current_user["user_id"]
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Survey not found")
    survey = SurveyService.get_survey(survey_id)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Survey updated",
        "data": _doc(survey), "statusCode": 200,
    }))


@router.delete("/{survey_id}")
async def delete_survey(
    survey_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ADMIN", "MLA"):
        raise HTTPException(status_code=403, detail="Admin only")
    ok = SurveyService.delete_survey(survey_id, current_user["user_id"])
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
    current_user: dict = Depends(get_current_user),
):
    survey = SurveyService.get_survey(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if survey.get("status") != "ACTIVE":
        raise HTTPException(status_code=400, detail="Survey is not active")

    citizen_id = current_user["user_id"]
    if SurveyService.already_responded(survey_id, citizen_id):
        raise HTTPException(status_code=409, detail="You have already submitted this survey")

    answers = [a.model_dump() for a in data.answers]
    resp_id = SurveyService.submit_response(survey_id, citizen_id, answers)
    return JSONResponse(content=jsonable_encoder({
        "success": True, "message": "Response submitted — thank you!",
        "data": {"responseId": resp_id}, "statusCode": 201,
    }), status_code=201)
