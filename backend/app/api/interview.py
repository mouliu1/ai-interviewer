from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import Settings
from app.llm.client import build_llm_client
from app.schemas.interview import AnswerRequest, StartInterviewRequest, TurnSummary
from app.services.interview_service import InterviewService
from app.storage import Database

router = APIRouter(prefix="/api/v1/interview")


def _database_path_from_settings(settings: Settings) -> Path:
    return Path(settings.database_url.removeprefix("sqlite:///"))


def build_interview_service() -> InterviewService:
    settings = Settings()
    db = Database(_database_path_from_settings(settings))
    db.init_schema()
    return InterviewService(db, build_llm_client(settings))


@router.post("/start")
def start_interview(request: StartInterviewRequest) -> dict:
    service = build_interview_service()
    return service.start(request.prepare_id, request.planned_round_count)


@router.post("/answer", response_model=TurnSummary)
def answer_interview(request: AnswerRequest) -> TurnSummary:
    service = build_interview_service()
    try:
        return TurnSummary(**service.answer(request.session_id, request.answer_text))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found.") from exc
