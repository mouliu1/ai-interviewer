from collections.abc import Mapping

from app.config import Settings


class FakeLLMClient:
    def complete_json(self, prompt_name: str, payload: Mapping[str, object]) -> dict:
        if prompt_name == "resume_parse":
            return {
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
            }
        if prompt_name == "jd_parse":
            return {
                "target_role": "AI Application Engineer",
                "required_skills": ["Python", "RAG"],
                "preferred_skills": ["FastAPI"],
                "business_context": "LLM product team",
                "interview_focus": ["RAG", "evaluation"],
            }
        raise ValueError(f"Unknown prompt: {prompt_name}")


def build_llm_client(settings: Settings) -> FakeLLMClient:
    if settings.llm_provider == "fake":
        return FakeLLMClient()
    raise NotImplementedError("Real LLM provider wiring is added in later tasks.")
