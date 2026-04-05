def test_finish_generates_report_and_get_report_returns_it(client):
    start_response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-3", "mode": "standard", "planned_round_count": 3},
    )
    session_id = start_response.json()["session_id"]

    finish_response = client.post(f"/api/v1/interview/finish", json={"session_id": session_id})
    assert finish_response.status_code == 200
    assert finish_response.json()["overall_score"] >= 0

    report_response = client.get(f"/api/v1/report/{session_id}")
    assert report_response.status_code == 200
    assert report_response.json()["report_header"]["session_id"] == session_id
    assert len(report_response.json()["action_items"]) >= 1
