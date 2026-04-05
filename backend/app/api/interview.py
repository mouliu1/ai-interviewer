from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import Settings
from app.llm.client import build_llm_client
from app.schemas.interview import AnswerRequest, FinishInterviewRequest, StartInterviewRequest, TurnSummary
from app.services.interview_service import InterviewService, InterviewSessionStateError
from app.services.report_service import ReportService
from app.storage import Database

router = APIRouter(prefix="/api/v1")


def build_database() -> Database:
    settings = Settings()
    db = Database(Path(settings.database_url.removeprefix("sqlite:///")))
    db.init_schema()
    return db


def build_interview_service() -> InterviewService:
    settings = Settings()
    return InterviewService(build_database(), build_llm_client(settings))


def build_report_service() -> ReportService:
    return ReportService(build_database())


@router.post("/interview/start")
def start_interview(request: StartInterviewRequest) -> dict:
    service = build_interview_service()
    return service.start(request.prepare_id, request.planned_round_count)


@router.post("/interview/answer", response_model=TurnSummary)
def answer_interview(request: AnswerRequest) -> TurnSummary:
    service = build_interview_service()
    try:
        return TurnSummary(**service.answer(request.session_id, request.answer_text))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found.") from exc
    except InterviewSessionStateError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/interview/finish")
def finish_interview(request: FinishInterviewRequest) -> dict:
    try:
        report = build_report_service().build_report(request.session_id)
        return {
            "report_id": report["report_header"]["session_id"],
            "overall_score": report["overall_score"],
            "report_summary": report["final_summary"],
            "session_status": "finished",
        }
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/report/{session_id}")
def get_report(session_id: str) -> dict:
    try:
        return build_report_service().get_report(session_id)
    except KeyError as exc:
        detail = "Session not found." if "missing session" in str(exc) else "Report not found."
        raise HTTPException(status_code=404, detail=detail) from exc
