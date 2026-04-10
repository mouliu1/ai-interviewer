from io import BytesIO

import pytest


@pytest.mark.anyio
async def test_prepare_returns_resume_and_jd_preview(client, monkeypatch):
    from app.api import prepare as prepare_api

    monkeypatch.setattr(prepare_api, "extract_pdf_text", lambda _: "Python RAG Prompt project")

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}
    data = {"jd_text": "We need an AI application engineer with Python and RAG experience."}

    response = await client.post("/api/v1/prepare", files=files, data=data)

    assert response.status_code == 200
    body = response.json()
    assert body["prepare_id"]
    assert body["resume_summary_preview"] == "具备 AI 应用项目落地经验，做过 RAG 与 Prompt 相关系统。"
    assert body["jd_summary_preview"] == "RAG, 效果评估"
    assert "Python" in body["candidate_profile"]["skills"]
    assert body["jd_profile"]["target_role"] == "AI 应用工程师"
    assert len(body["fit_focus_preview"]) >= 1


@pytest.mark.anyio
async def test_prepare_accepts_target_role_instead_of_full_jd_text(client, monkeypatch):
    from app.api import prepare as prepare_api

    monkeypatch.setattr(prepare_api, "extract_pdf_text", lambda _: "Python RAG Prompt project")

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}
    data = {"target_role": "AI 应用工程师"}

    response = await client.post("/api/v1/prepare", files=files, data=data)

    assert response.status_code == 200
    body = response.json()
    assert body["jd_profile"]["target_role"] == "AI 应用工程师"
    assert len(body["fit_focus_preview"]) >= 1


@pytest.mark.anyio
async def test_prepare_rejects_when_target_role_and_jd_text_are_both_missing(client, monkeypatch):
    from app.api import prepare as prepare_api

    monkeypatch.setattr(prepare_api, "extract_pdf_text", lambda _: "Python RAG Prompt project")

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}

    response = await client.post("/api/v1/prepare", files=files, data={})

    assert response.status_code == 422
    assert response.json()["detail"] == "Target role is required."


@pytest.mark.anyio
async def test_prepare_rejects_empty_resume_extraction(client, monkeypatch):
    from app.api import prepare as prepare_api

    def fail(_):
        raise ValueError("Resume PDF could not be extracted.")

    monkeypatch.setattr(prepare_api, "extract_pdf_text", fail)

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}
    data = {"jd_text": "We need an AI application engineer with Python and RAG experience."}

    response = await client.post("/api/v1/prepare", files=files, data=data)

    assert response.status_code == 422
    assert response.json()["detail"] == "Resume PDF could not be extracted."


@pytest.mark.anyio
async def test_prepare_allows_unexpected_extraction_failures_to_surface(client, monkeypatch):
    from app.api import prepare as prepare_api
    from app.main import app
    from httpx import ASGITransport, AsyncClient

    def explode(_):
        raise RuntimeError("boom")

    monkeypatch.setattr(prepare_api, "extract_pdf_text", explode)

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}
    data = {"jd_text": "We need an AI application engineer with Python and RAG experience."}

    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://testserver",
    ) as test_client:
        response = await test_client.post("/api/v1/prepare", files=files, data=data)

    assert response.status_code == 500
