from typing import Protocol

from app.rag.loader import load_topics
from app.rag.retriever import retrieve_topics
from app.services.scoring import weighted_score
from app.storage import Database
from pathlib import Path


class CompleteJsonClient(Protocol):
    def complete_json(self, prompt_name: str, payload: dict) -> dict:
        ...

    def stream_json(self, prompt_name: str, payload: dict):
        ...


class InterviewSessionStateError(ValueError):
    pass


class InterviewService:
    def __init__(self, db: Database, llm_client: CompleteJsonClient):
        self.db = db
        self.llm_client = llm_client

    @staticmethod
    def _collect_query_terms(prepare_payload: dict) -> list[str]:
        candidate_profile = prepare_payload["candidate_profile"]
        jd_profile = prepare_payload["jd_profile"]
        terms = list(prepare_payload.get("fit_focus_preview", []))
        terms.extend(candidate_profile.get("skills", []))
        terms.extend(jd_profile.get("required_skills", []))
        return [term for term in terms if isinstance(term, str) and term]

    def start(self, prepare_id: str, planned_round_count: int) -> dict:
        prepare_payload = self.db.get_prepare(prepare_id)
        topics = load_topics(Path("app/rag/data/interview_topics.json"))
        retrieval_context = retrieve_topics(topics, self._collect_query_terms(prepare_payload))
        plan = self.llm_client.complete_json(
            "question_plan",
            {
                "prepare": prepare_payload,
                "retrieval_context": retrieval_context,
                "planned_round_count": planned_round_count,
            },
        )
        planned_questions = plan["opening_questions"][:planned_round_count]
        first_question = planned_questions[0]
        session_id = self.db.create_session(
            {
                "prepare": prepare_payload,
                "question_plan": planned_questions,
                "retrieval_context": retrieval_context,
            },
            first_question,
            planned_round_count,
        )
        return {
            "session_id": session_id,
            "first_question": first_question,
            "planned_round_count": planned_round_count,
            "focus_dimensions": plan.get("focus_dimensions", ["technical_accuracy", "depth", "evidence"]),
            "session_status": "in_progress",
        }

    def stream_start(self, prepare_id: str, planned_round_count: int):
        prepare_payload = self.db.get_prepare(prepare_id)
        topics = load_topics(Path("app/rag/data/interview_topics.json"))
        retrieval_context = retrieve_topics(topics, self._collect_query_terms(prepare_payload))
        yield {"event": "status", "data": {"stage": "question_plan", "message": "正在生成开场问题"}}
        plan = None
        for item in self.llm_client.stream_json(
            "question_plan",
            {
                "prepare": prepare_payload,
                "retrieval_context": retrieval_context,
                "planned_round_count": planned_round_count,
            },
        ):
            if item["type"] == "token":
                yield {"event": "token", "data": {"stage": "question_plan", "delta": item["delta"]}}
            elif item["type"] == "result":
                plan = item["payload"]
                yield {"event": "stage_result", "data": {"stage": "question_plan", "payload": plan}}

        if plan is None:
            raise ValueError("Question plan stream did not produce a result.")

        planned_questions = plan["opening_questions"][:planned_round_count]
        first_question = planned_questions[0]
        session_id = self.db.create_session(
            {
                "prepare": prepare_payload,
                "question_plan": planned_questions,
                "retrieval_context": retrieval_context,
            },
            first_question,
            planned_round_count,
        )
        yield {
            "event": "final",
            "data": {
                "session_id": session_id,
                "first_question": first_question,
                "planned_round_count": planned_round_count,
                "focus_dimensions": plan.get("focus_dimensions", ["technical_accuracy", "depth", "evidence"]),
                "session_status": "in_progress",
            },
        }

    def answer(self, session_id: str, answer_text: str) -> dict:
        session = self.db.get_session(session_id)
        session_context = session["prepare_payload"]
        prepare_payload = session_context["prepare"]
        if session["status"] == "ready_to_finish":
            raise InterviewSessionStateError("Interview session is ready to finish.")
        if session["status"] == "finished":
            raise InterviewSessionStateError("Interview session is already finished.")
        evaluation = self.llm_client.complete_json(
            "turn_evaluate",
            {
                "question": session["current_question"],
                "answer_text": answer_text,
                "candidate_profile": prepare_payload["candidate_profile"],
                "jd_profile": prepare_payload["jd_profile"],
                "fit_focus_preview": prepare_payload.get("fit_focus_preview", []),
                "retrieval_context": session_context.get("retrieval_context", []),
                "round_index": session["current_round"],
            },
        )
        self.db.save_turn(
            session_id=session_id,
            round_index=session["current_round"],
            question=session["current_question"],
            answer=answer_text,
            evaluation_payload=evaluation,
        )
        total_score = weighted_score(evaluation["dimension_scores"])
        is_final_round = session["current_round"] >= session["planned_round_count"]
        if is_final_round:
            next_action = "finish_ready"
            next_question = ""
            next_round = session["planned_round_count"]
            session_status = "ready_to_finish"
        else:
            next_action = "ask_followup" if evaluation["followup_needed"] else "ask_next_main_question"
            planned_questions = session_context.get("question_plan", [])
            next_main_question = ""
            if len(planned_questions) > session["current_round"]:
                next_main_question = planned_questions[session["current_round"]]
            next_question = evaluation["followup_question"] or next_main_question or "请继续说明一个关键设计取舍。"
            next_round = session["current_round"] + 1
            session_status = "in_progress"
        self.db.update_session(session_id, next_question, next_round, session_status)
        return {
            "next_action": next_action,
            "next_question": next_question,
            "turn_score_summary": {
                "score": total_score,
                "dimension_scores": evaluation["dimension_scores"],
            },
            "strengths": evaluation["strengths"],
            "weaknesses": evaluation["weaknesses"],
            "turn_feedback": evaluation["strengths"] + evaluation["weaknesses"],
            "current_round": next_round,
            "remaining_rounds": max(session["planned_round_count"] - next_round, 0),
            "session_status": session_status,
        }

    def stream_answer(self, session_id: str, answer_text: str):
        session = self.db.get_session(session_id)
        session_context = session["prepare_payload"]
        prepare_payload = session_context["prepare"]
        if session["status"] == "ready_to_finish":
            raise InterviewSessionStateError("Interview session is ready to finish.")
        if session["status"] == "finished":
            raise InterviewSessionStateError("Interview session is already finished.")

        yield {"event": "status", "data": {"stage": "turn_evaluate", "message": "正在分析本轮回答"}}
        evaluation = None
        for item in self.llm_client.stream_json(
            "turn_evaluate",
            {
                "question": session["current_question"],
                "answer_text": answer_text,
                "candidate_profile": prepare_payload["candidate_profile"],
                "jd_profile": prepare_payload["jd_profile"],
                "fit_focus_preview": prepare_payload.get("fit_focus_preview", []),
                "retrieval_context": session_context.get("retrieval_context", []),
                "round_index": session["current_round"],
            },
        ):
            if item["type"] == "token":
                yield {"event": "token", "data": {"stage": "turn_evaluate", "delta": item["delta"]}}
            elif item["type"] == "result":
                evaluation = item["payload"]
                yield {"event": "stage_result", "data": {"stage": "turn_evaluate", "payload": evaluation}}

        if evaluation is None:
            raise ValueError("Turn evaluation stream did not produce a result.")

        self.db.save_turn(
            session_id=session_id,
            round_index=session["current_round"],
            question=session["current_question"],
            answer=answer_text,
            evaluation_payload=evaluation,
        )
        total_score = weighted_score(evaluation["dimension_scores"])
        is_final_round = session["current_round"] >= session["planned_round_count"]
        if is_final_round:
            next_action = "finish_ready"
            next_question = ""
            next_round = session["planned_round_count"]
            session_status = "ready_to_finish"
        else:
            next_action = "ask_followup" if evaluation["followup_needed"] else "ask_next_main_question"
            planned_questions = session_context.get("question_plan", [])
            next_main_question = ""
            if len(planned_questions) > session["current_round"]:
                next_main_question = planned_questions[session["current_round"]]
            next_question = evaluation["followup_question"] or next_main_question or "请继续说明一个关键设计取舍。"
            next_round = session["current_round"] + 1
            session_status = "in_progress"
        self.db.update_session(session_id, next_question, next_round, session_status)
        yield {
            "event": "final",
            "data": {
                "next_action": next_action,
                "next_question": next_question,
                "turn_score_summary": {
                    "score": total_score,
                    "dimension_scores": evaluation["dimension_scores"],
                },
                "strengths": evaluation["strengths"],
                "weaknesses": evaluation["weaknesses"],
                "turn_feedback": evaluation["strengths"] + evaluation["weaknesses"],
                "current_round": next_round,
                "remaining_rounds": max(session["planned_round_count"] - next_round, 0),
                "session_status": session_status,
            },
        }
