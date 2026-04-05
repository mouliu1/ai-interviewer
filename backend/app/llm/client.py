from collections.abc import Mapping
from copy import deepcopy

from app.config import Settings
from app.prompts.templates import PROMPT_NAMES


_FAKE_RESPONSES = {
    "resume_parse": {
        "candidate_name": "Demo Candidate",
        "skills": ["Python", "RAG"],
        "projects": [
            {
                "name": "RAG Interview Coach",
                "keywords": ["Python", "RAG", "Prompt"],
                "highlights": ["built retrieval pipeline"],
                "risk_points": ["missing evaluation metrics"],
            }
        ],
        "experience_summary": "Built LLM application features.",
    },
    "jd_parse": {
        "target_role": "AI Application Engineer",
        "required_skills": ["Python", "RAG"],
        "preferred_skills": ["FastAPI"],
        "business_context": "LLM product team",
        "interview_focus": ["RAG", "evaluation"],
    },
    "question_plan": {
        "focus_areas": ["RAG", "evaluation"],
        "questions": [
            {
                "id": "q1",
                "prompt": "Walk me through the retrieval pipeline you built.",
            },
            {
                "id": "q2",
                "prompt": "How did you evaluate answer quality?",
            },
        ],
    },
    "turn_evaluate": {
        "score": 4,
        "strengths": ["clear system design"],
        "gaps": ["limited evaluation detail"],
        "next_action": "ask about metrics",
    },
    "final_review": {
        "summary": "Strong applied LLM experience with one evaluation gap.",
        "strengths": ["retrieval", "prompting"],
        "risks": ["unclear offline evaluation"],
        "recommendation": "proceed",
    },
}


class FakeLLMClient:
    def complete_json(self, prompt_name: str, payload: Mapping[str, object]) -> dict:
        if prompt_name not in PROMPT_NAMES:
            raise ValueError(f"Unknown prompt: {prompt_name}")
        return deepcopy(_FAKE_RESPONSES[prompt_name])


def build_llm_client(settings: Settings) -> FakeLLMClient:
    if settings.llm_provider == "fake":
        return FakeLLMClient()
    raise NotImplementedError("Real LLM provider wiring is added in later tasks.")
