import uuid
from typing import Protocol


class CompleteJsonClient(Protocol):
    def complete_json(self, prompt_name: str, payload: dict) -> dict:
        ...


class PrepareService:
    def __init__(self, llm_client: CompleteJsonClient):
        self.llm_client = llm_client

    def prepare(self, resume_text: str, jd_text: str) -> dict:
        candidate_profile = self.llm_client.complete_json("resume_parse", {"resume_text": resume_text})
        jd_profile = self.llm_client.complete_json("jd_parse", {"jd_text": jd_text})
        fit_focus = sorted(set(candidate_profile["skills"]) & set(jd_profile["required_skills"]))

        return {
            "prepare_id": str(uuid.uuid4()),
            "resume_summary_preview": candidate_profile["experience_summary"],
            "jd_summary_preview": ", ".join(jd_profile["interview_focus"]),
            "candidate_profile": candidate_profile,
            "jd_profile": jd_profile,
            "fit_focus_preview": fit_focus or jd_profile["required_skills"][:2],
        }
