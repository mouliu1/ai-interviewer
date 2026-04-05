def test_start_interview_returns_first_question(client):
    response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-1", "mode": "standard", "planned_round_count": 3},
    )

    assert response.status_code == 200
    assert response.json()["first_question"]
    assert response.json()["session_status"] == "in_progress"


def test_answer_endpoint_can_request_followup(client):
    start_response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-2", "mode": "standard", "planned_round_count": 3},
    )
    session_id = start_response.json()["session_id"]

    answer_response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We improved retrieval quality a lot."},
    )

    assert answer_response.status_code == 200
    assert answer_response.json()["next_action"] == "ask_followup"
    assert answer_response.json()["next_question"] == "What metric or evaluation set proved the retrieval improvement?"
    assert answer_response.json()["session_status"] == "in_progress"


def test_answer_endpoint_persists_next_question_and_round(client):
    start_response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-3", "mode": "standard", "planned_round_count": 3},
    )
    session_id = start_response.json()["session_id"]
    first_question = start_response.json()["first_question"]

    first_answer_response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We improved retrieval quality a lot."},
    )
    from app.api import interview as interview_api

    first_persisted_session = interview_api.build_interview_service().db.get_session(session_id)

    second_answer_response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We used evaluation metrics on a held-out set."},
    )
    second_persisted_session = interview_api.build_interview_service().db.get_session(session_id)

    assert first_answer_response.status_code == 200
    assert first_answer_response.json()["next_action"] == "ask_followup"
    assert first_persisted_session["current_question"] == first_answer_response.json()["next_question"]
    assert first_persisted_session["current_question"] != first_question
    assert first_persisted_session["current_round"] == 2
    assert first_persisted_session["status"] == "in_progress"

    assert second_answer_response.status_code == 200
    assert second_answer_response.json()["next_action"] == "ask_next_main_question"
    assert second_persisted_session["current_question"] == second_answer_response.json()["next_question"]
    assert second_persisted_session["current_question"] != first_persisted_session["current_question"]
    assert second_persisted_session["current_round"] == 3
    assert second_persisted_session["status"] == "in_progress"


def test_answer_endpoint_transitions_to_finish_ready_when_rounds_are_exhausted(client):
    start_response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-4", "mode": "standard", "planned_round_count": 2},
    )
    session_id = start_response.json()["session_id"]

    client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We improved retrieval quality a lot."},
    )
    answer_response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We used evaluation metrics on a held-out set."},
    )

    from app.api import interview as interview_api

    persisted_session = interview_api.build_interview_service().db.get_session(session_id)

    assert answer_response.status_code == 200
    assert answer_response.json()["next_action"] == "finish_ready"
    assert answer_response.json()["next_question"] == ""
    assert answer_response.json()["current_round"] == 2
    assert answer_response.json()["remaining_rounds"] == 0
    assert answer_response.json()["session_status"] == "ready_to_finish"
    assert persisted_session["status"] == "ready_to_finish"


def test_answer_endpoint_rejects_answers_after_finish_ready(client):
    start_response = client.post(
        "/api/v1/interview/start",
        json={"prepare_id": "prepare-5", "mode": "standard", "planned_round_count": 2},
    )
    session_id = start_response.json()["session_id"]

    client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We improved retrieval quality a lot."},
    )
    client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "We used evaluation metrics on a held-out set."},
    )

    response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": session_id, "answer_text": "One more answer after finish."},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Interview session is ready to finish."


def test_answer_endpoint_returns_404_for_unknown_session(client):
    response = client.post(
        "/api/v1/interview/answer",
        json={"session_id": "missing-session", "answer_text": "anything"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found."
