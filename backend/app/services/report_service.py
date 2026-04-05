from pathlib import Path

from app.config import Settings
from app.llm.client import build_llm_client
from app.rag.loader import load_topics
from app.rag.retriever import retrieve_topics
from app.storage import Database


class ReportService:
    def __init__(self, db: Database):
        self.db = db
        self.settings = Settings()
        self.llm_client = build_llm_client(self.settings)

    def build_report(self, session_id: str) -> dict:
        topics = load_topics(Path(self.settings.rag_data_path))
        retrieved = retrieve_topics(topics, ["rag", "evaluation"])
        review = self.llm_client.complete_json("final_review", {"session_id": session_id, "retrieved": retrieved})
        report = {
            "report_header": {"session_id": session_id, "title": "AI Interview Review"},
            "dimension_breakdown": review["dimension_breakdown"],
            "strength_cards": review["key_strengths"],
            "gap_cards": review["major_gaps"],
            "action_items": review["action_items"],
            "recommended_questions": review["recommended_practice_questions"],
            "final_summary": review["overall_summary"],
            "overall_score": review["overall_score"],
        }
        self.db.save_report(session_id, report)
        return report

    def get_report(self, session_id: str) -> dict:
        cached = self.db.get_report(session_id)
        return cached or self.build_report(session_id)
