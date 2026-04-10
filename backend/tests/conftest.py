from io import BytesIO

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture(autouse=True)
def force_fake_llm_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    monkeypatch.setenv("LLM_MODEL", "fake-model")


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as test_client:
        yield test_client


@pytest.fixture
async def prepared_id(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> str:
    from app.api import prepare as prepare_api

    monkeypatch.setattr(prepare_api, "extract_pdf_text", lambda _: "Python RAG Prompt project")

    response = await client.post(
        "/api/v1/prepare",
        files={"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")},
        data={"jd_text": "We need an AI application engineer with Python, FastAPI, RAG, and evaluation experience."},
    )
    assert response.status_code == 200
    return response.json()["prepare_id"]
