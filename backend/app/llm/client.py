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
        "opening_questions": [
            "Walk me through the RAG system you built and how you validated quality."
        ]
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
        if prompt_name == "turn_evaluate":
            answer_text = str(payload["answer_text"])
            wants_followup = "metric" not in answer_text.lower() and "evaluation" not in answer_text.lower()
            return {
                "dimension_scores": {
                    "technical_accuracy": 4,
                    "relevance": 4,
                    "depth": 3,
                    "evidence": 2 if wants_followup else 4,
                    "clarity": 4,
                },
                "strengths": ["Answer stays on the project topic."],
                "weaknesses": ["Missing quantitative evidence."] if wants_followup else [],
                "followup_needed": wants_followup,
                "followup_type": "evidence_missing" if wants_followup else "none",
                "followup_question": (
                    "What metric or evaluation set proved the retrieval improvement?"
                    if wants_followup
                    else ""
                ),
            }
        return deepcopy(_FAKE_RESPONSES[prompt_name])


def build_llm_client(settings: Settings) -> FakeLLMClient:
    if settings.llm_provider == "fake":
        return FakeLLMClient()
    raise NotImplementedError("Real LLM provider wiring is added in later tasks.")
