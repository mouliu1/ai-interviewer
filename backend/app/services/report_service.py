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
        session = self.db.get_session(session_id)
        if session["status"] != "ready_to_finish":
            raise ValueError("Interview session is not ready to finish.")
        session_context = session["prepare_payload"]
        prepare_payload = session_context["prepare"]
        turns = self.db.list_turns(session_id)
        topics = load_topics(Path(self.settings.rag_data_path))
        query_terms = list(prepare_payload.get("fit_focus_preview", []))
        query_terms.extend(prepare_payload["jd_profile"].get("required_skills", []))
        query_terms.extend(prepare_payload["candidate_profile"].get("skills", []))
        retrieved = retrieve_topics(topics, query_terms)
        review = self.llm_client.complete_json(
            "final_review",
            {
                "session_id": session_id,
                "candidate_profile": prepare_payload["candidate_profile"],
                "jd_profile": prepare_payload["jd_profile"],
                "fit_focus_preview": prepare_payload.get("fit_focus_preview", []),
                "retrieved": retrieved,
                "transcript": turns,
            },
        )
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
        self.db.update_session_status(session_id, "finished")
        return report

    def stream_build_report(self, session_id: str):
        session = self.db.get_session(session_id)
        if session["status"] != "ready_to_finish":
            raise ValueError("Interview session is not ready to finish.")
        session_context = session["prepare_payload"]
        prepare_payload = session_context["prepare"]
        turns = self.db.list_turns(session_id)
        topics = load_topics(Path(self.settings.rag_data_path))
        query_terms = list(prepare_payload.get("fit_focus_preview", []))
        query_terms.extend(prepare_payload["jd_profile"].get("required_skills", []))
        query_terms.extend(prepare_payload["candidate_profile"].get("skills", []))
        retrieved = retrieve_topics(topics, query_terms)

        yield {"event": "status", "data": {"stage": "final_review", "message": "正在生成复盘报告"}}
        review = None
        for item in self.llm_client.stream_json(
            "final_review",
            {
                "session_id": session_id,
                "candidate_profile": prepare_payload["candidate_profile"],
                "jd_profile": prepare_payload["jd_profile"],
                "fit_focus_preview": prepare_payload.get("fit_focus_preview", []),
                "retrieved": retrieved,
                "transcript": turns,
            },
        ):
            if item["type"] == "token":
                yield {"event": "token", "data": {"stage": "final_review", "delta": item["delta"]}}
            elif item["type"] == "result":
                review = item["payload"]
                yield {"event": "stage_result", "data": {"stage": "final_review", "payload": review}}

        if review is None:
            raise ValueError("Final review stream did not produce a result.")

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
        self.db.update_session_status(session_id, "finished")
        yield {
            "event": "final",
            "data": {
                "report_id": report["report_header"]["session_id"],
                "overall_score": report["overall_score"],
                "report_summary": report["final_summary"],
                "session_status": "finished",
                "report": report,
            },
        }

    def get_report(self, session_id: str) -> dict:
        self.db.get_session(session_id)
        cached = self.db.get_report(session_id)
        if cached is None:
            raise KeyError(f"missing report: {session_id}")
        return cached
