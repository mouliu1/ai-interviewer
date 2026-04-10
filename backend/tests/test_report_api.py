import pytest


@pytest.mark.anyio
async def test_finish_generates_report_and_get_report_returns_it(client, prepared_id):
    start_response = await client.post(
        "/api/v1/interview/start",
        json={"prepare_id": prepared_id, "mode": "standard", "planned_round_count": 2},
    )
    session_id = start_response.json()["session_id"]

    await client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We improved retrieval quality a lot."},
    )
    ready_response = await client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We used evaluation metrics on a held-out set."},
    )

    assert ready_response.status_code == 200
    assert ready_response.json()["session_status"] == "ready_to_finish"

    finish_response = await client.post("/api/v1/interview/finish", json={"session_id": session_id})
    assert finish_response.status_code == 200
    assert finish_response.json()["overall_score"] >= 0
    assert finish_response.json()["session_status"] == "finished"

    from app.api import interview as interview_api

    persisted_session = interview_api.build_interview_service().db.get_session(session_id)
    assert persisted_session["status"] == "finished"

    report_response = await client.get(f"/api/v1/report/{session_id}")
    assert report_response.status_code == 200
    assert report_response.json()["report_header"]["session_id"] == session_id
    assert len(report_response.json()["action_items"]) >= 1

    answer_after_finish_response = await client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "One more answer after finish."},
    )
    assert answer_after_finish_response.status_code == 409


@pytest.mark.anyio
async def test_finish_rejects_session_that_is_not_ready(client, prepared_id):
    start_response = await client.post(
        "/api/v1/interview/start",
        json={"prepare_id": prepared_id, "mode": "standard", "planned_round_count": 3},
    )
    session_id = start_response.json()["session_id"]

    finish_response = await client.post("/api/v1/interview/finish", json={"session_id": session_id})

    assert finish_response.status_code == 409


@pytest.mark.anyio
async def test_finish_and_report_reject_unknown_session(client):
    finish_response = await client.post("/api/v1/interview/finish", json={"session_id": "missing-session"})
    report_response = await client.get("/api/v1/report/missing-session")

    assert finish_response.status_code == 404
    assert report_response.status_code == 404
