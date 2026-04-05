from app.config import Settings
from app.llm.client import FakeLLMClient, build_llm_client
from app.prompts.templates import PROMPT_NAMES


def test_settings_accepts_legacy_env_names(monkeypatch):
    monkeypatch.setenv("LLM_BASE_URL", "http://example.test/v1")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./legacy.db")

    settings = Settings()

    assert settings.llm_base_url == "http://example.test/v1"
    assert settings.database_url == "sqlite:///./legacy.db"


def test_build_llm_client_returns_fake_client():
    settings = Settings(llm_provider="fake", llm_model="test-model")

    client = build_llm_client(settings)

    assert isinstance(client, FakeLLMClient)


def test_fake_client_returns_structured_payload():
    settings = Settings(llm_provider="fake", llm_model="test-model")
    client = build_llm_client(settings)

    result = client.complete_json(
        prompt_name="resume_parse",
        payload={"resume_text": "Python RAG project"},
    )

    assert result == {
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


def test_fake_client_supports_registry_prompts():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    for prompt_name in PROMPT_NAMES:
        result = client.complete_json(prompt_name=prompt_name, payload={})

        assert isinstance(result, dict)
        assert result


def test_fake_client_returns_jd_parse_payload():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    result = client.complete_json(prompt_name="jd_parse", payload={"job_text": "Python RAG"})

    assert result == {
        "target_role": "AI Application Engineer",
        "required_skills": ["Python", "RAG"],
        "preferred_skills": ["FastAPI"],
        "business_context": "LLM product team",
        "interview_focus": ["RAG", "evaluation"],
    }


def test_fake_client_rejects_unknown_prompt():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    try:
        client.complete_json(prompt_name="unknown_prompt", payload={})
    except ValueError as exc:
        assert "Unknown prompt: unknown_prompt" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_build_llm_client_rejects_unsupported_provider():
    settings = Settings(llm_provider="real", llm_model="test-model")

    try:
        build_llm_client(settings)
    except NotImplementedError as exc:
        assert "Real LLM provider wiring" in str(exc)
    else:
        raise AssertionError("expected NotImplementedError")
