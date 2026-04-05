from app.config import Settings
from app.llm.client import FakeLLMClient, build_llm_client


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

    assert "skills" in result
    assert "projects" in result
