import pytest

from app.storage import Database


def test_database_initializes_and_persists_session(tmp_path):
    db_path = tmp_path / "test.db"
    db = Database(db_path)
    db.init_schema()

    session_id = db.create_session(
        prepare_payload={"candidate_name": "Demo"},
        first_question="Tell me about your RAG project.",
        planned_round_count=3,
    )

    session = db.get_session(session_id)

    assert session["session_id"] == session_id
    assert session["current_question"] == "Tell me about your RAG project."
    assert session["planned_round_count"] == 3
    assert session["current_round"] == 1
    assert session["status"] == "in_progress"
    assert session["prepare_payload"] == {"candidate_name": "Demo"}


def test_database_persists_prepare_and_turn_history(tmp_path):
    db_path = tmp_path / "test.db"
    db = Database(db_path)
    db.init_schema()

    prepare_payload = {
        "prepare_id": "prepare-1",
        "candidate_profile": {"skills": ["Python", "RAG"]},
        "jd_profile": {"required_skills": ["Python", "RAG"]},
    }
    db.save_prepare(prepare_payload)
    loaded_prepare = db.get_prepare("prepare-1")

    session_id = db.create_session(
        prepare_payload={"prepare_id": "prepare-1"},
        first_question="Tell me about your RAG project.",
        planned_round_count=3,
    )
    db.save_turn(
        session_id=session_id,
        round_index=1,
        question="Tell me about your RAG project.",
        answer="I built retrieval and evaluation flows.",
        evaluation_payload={"dimension_scores": {"relevance": 4}},
    )

    turns = db.list_turns(session_id)

    assert loaded_prepare == prepare_payload
    assert turns == [
        {
            "round_index": 1,
            "question": "Tell me about your RAG project.",
            "answer": "I built retrieval and evaluation flows.",
            "evaluation_payload": {"dimension_scores": {"relevance": 4}},
        }
    ]


def test_get_session_raises_for_unknown_session(tmp_path):
    db_path = tmp_path / "test.db"
    db = Database(db_path)
    db.init_schema()

    with pytest.raises(KeyError, match="missing session"):
        db.get_session("missing-session-id")
