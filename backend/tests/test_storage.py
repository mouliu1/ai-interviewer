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
    assert session["status"] == "in_progress"
