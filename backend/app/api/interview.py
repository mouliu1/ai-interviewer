from pathlib import Path

from fastapi import APIRouter

from app.config import Settings
from app.llm.client import build_llm_client
from app.schemas.interview import AnswerRequest, StartInterviewRequest, TurnSummary
from app.services.interview_service import InterviewService
from app.storage import Database

router = APIRouter(prefix="/api/v1/interview")
db = Database(Path("ai_interviewer.db"))
db.init_schema()
service = InterviewService(db, build_llm_client(Settings()))


@router.post("/start")
def start_interview(request: StartInterviewRequest) -> dict:
    return service.start(request.prepare_id, request.planned_round_count)


@router.post("/answer", response_model=TurnSummary)
def answer_interview(request: AnswerRequest) -> TurnSummary:
    return TurnSummary(**service.answer(request.session_id, request.answer_text))
