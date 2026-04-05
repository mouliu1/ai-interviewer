from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    prepare_id: str
    mode: str = "standard"
    planned_round_count: int = 3


class AnswerRequest(BaseModel):
    session_id: str
    answer_text: str


class TurnSummary(BaseModel):
    next_action: str
    next_question: str
    turn_score_summary: dict
    turn_feedback: list[str]
    current_round: int
    remaining_rounds: int
    session_status: str
