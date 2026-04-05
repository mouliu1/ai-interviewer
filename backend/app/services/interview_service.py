from typing import Protocol

from app.services.scoring import weighted_score
from app.storage import Database


class CompleteJsonClient(Protocol):
    def complete_json(self, prompt_name: str, payload: dict) -> dict:
        ...


class InterviewService:
    def __init__(self, db: Database, llm_client: CompleteJsonClient):
        self.db = db
        self.llm_client = llm_client

    def start(self, prepare_id: str, planned_round_count: int) -> dict:
        plan = self.llm_client.complete_json("question_plan", {"prepare_id": prepare_id})
        first_question = plan["opening_questions"][0]
        session_id = self.db.create_session({"prepare_id": prepare_id}, first_question, planned_round_count)
        return {
            "session_id": session_id,
            "first_question": first_question,
            "planned_round_count": planned_round_count,
            "focus_dimensions": ["technical_accuracy", "depth", "evidence"],
            "session_status": "in_progress",
        }

    def answer(self, session_id: str, answer_text: str) -> dict:
        session = self.db.get_session(session_id)
        evaluation = self.llm_client.complete_json(
            "turn_evaluate",
            {"question": session["current_question"], "answer_text": answer_text},
        )
        total_score = weighted_score(evaluation["dimension_scores"])
        next_action = "ask_followup" if evaluation["followup_needed"] else "ask_next_main_question"
        next_question = evaluation["followup_question"] or "Describe one trade-off you made in that system."
        return {
            "next_action": next_action,
            "next_question": next_question,
            "turn_score_summary": {
                "score": total_score,
                "dimension_scores": evaluation["dimension_scores"],
            },
            "turn_feedback": evaluation["strengths"] + evaluation["weaknesses"],
            "current_round": session["current_round"],
            "remaining_rounds": max(session["planned_round_count"] - session["current_round"], 0),
            "session_status": "in_progress",
        }
