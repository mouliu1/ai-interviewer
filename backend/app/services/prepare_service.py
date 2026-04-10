import uuid
from typing import Protocol

from app.storage import Database


class CompleteJsonClient(Protocol):
    def complete_json(self, prompt_name: str, payload: dict) -> dict:
        ...

    def stream_json(self, prompt_name: str, payload: dict):
        ...


class PrepareService:
    def __init__(self, llm_client: CompleteJsonClient, db: Database | None = None):
        self.llm_client = llm_client
        self.db = db

    @staticmethod
    def _build_prepare_payload(candidate_profile: dict, jd_profile: dict) -> dict:
        fit_focus = sorted(set(candidate_profile["skills"]) & set(jd_profile["required_skills"]))
        return {
            "prepare_id": str(uuid.uuid4()),
            "resume_summary_preview": candidate_profile["experience_summary"],
            "jd_summary_preview": ", ".join(jd_profile["interview_focus"]),
            "candidate_profile": candidate_profile,
            "jd_profile": jd_profile,
            "fit_focus_preview": fit_focus or jd_profile["required_skills"][:2],
        }

    def prepare(self, resume_text: str, jd_text: str) -> dict:
        candidate_profile = self.llm_client.complete_json("resume_parse", {"resume_text": resume_text})
        jd_profile = self.llm_client.complete_json("jd_parse", {"jd_text": jd_text})
        payload = self._build_prepare_payload(candidate_profile, jd_profile)
        if self.db is not None:
            self.db.save_prepare(payload)
        return payload

    def stream_prepare(self, resume_text: str, jd_text: str):
        yield {"event": "status", "data": {"stage": "resume_parse", "message": "正在解析简历内容"}}
        candidate_profile = None
        for item in self.llm_client.stream_json("resume_parse", {"resume_text": resume_text}):
            if item["type"] == "token":
                yield {"event": "token", "data": {"stage": "resume_parse", "delta": item["delta"]}}
            elif item["type"] == "result":
                candidate_profile = item["payload"]
                yield {"event": "stage_result", "data": {"stage": "resume_parse", "payload": candidate_profile}}

        yield {"event": "status", "data": {"stage": "jd_parse", "message": "正在分析岗位要求"}}
        jd_profile = None
        for item in self.llm_client.stream_json("jd_parse", {"jd_text": jd_text}):
            if item["type"] == "token":
                yield {"event": "token", "data": {"stage": "jd_parse", "delta": item["delta"]}}
            elif item["type"] == "result":
                jd_profile = item["payload"]
                yield {"event": "stage_result", "data": {"stage": "jd_parse", "payload": jd_profile}}

        if candidate_profile is None or jd_profile is None:
            raise ValueError("Prepare stream did not produce complete candidate or JD profiles.")

        payload = self._build_prepare_payload(candidate_profile, jd_profile)
        if self.db is not None:
            self.db.save_prepare(payload)
        yield {"event": "final", "data": payload}
