from typing import Literal

from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    prepare_id: str
    mode: Literal["standard"] = "standard"
    planned_round_count: int = Field(default=3, ge=1)


class AnswerRequest(BaseModel):
    session_id: str
    answer_text: str


class FinishInterviewRequest(BaseModel):
    session_id: str


class TurnSummary(BaseModel):
    next_action: str
    next_question: str
    turn_score_summary: dict
    turn_feedback: list[str]
    current_round: int
    remaining_rounds: int
    session_status: str
