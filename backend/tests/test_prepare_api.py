from io import BytesIO


def test_prepare_returns_resume_and_jd_preview(client, monkeypatch):
    from app.api import prepare as prepare_api

    monkeypatch.setattr(prepare_api, "extract_pdf_text", lambda _: "Python RAG Prompt project")

    files = {"resume_file": ("resume.pdf", BytesIO(b"%PDF-demo"), "application/pdf")}
    data = {"jd_text": "We need an AI application engineer with Python and RAG experience."}

    response = client.post("/api/v1/prepare", files=files, data=data)

    assert response.status_code == 200
    body = response.json()
    assert body["prepare_id"]
    assert body["resume_summary_preview"] == "Built LLM application features."
    assert body["jd_summary_preview"] == "RAG, evaluation"
    assert "Python" in body["candidate_profile"]["skills"]
    assert body["jd_profile"]["target_role"] == "AI Application Engineer"
    assert len(body["fit_focus_preview"]) >= 1
