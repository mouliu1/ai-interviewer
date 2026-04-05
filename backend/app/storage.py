import json
import sqlite3
import uuid
from pathlib import Path


class Database:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)

    def connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def init_schema(self) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                create table if not exists sessions (
                  session_id text primary key,
                  prepare_payload text not null,
                  current_question text not null,
                  planned_round_count integer not null,
                  current_round integer not null default 1,
                  status text not null
                )
                """
            )

    def create_session(self, prepare_payload: dict, first_question: str, planned_round_count: int) -> str:
        session_id = str(uuid.uuid4())
        with self.connect() as conn:
            conn.execute(
                """
                insert into sessions(session_id, prepare_payload, current_question, planned_round_count, status)
                values (?, ?, ?, ?, ?)
                """,
                (session_id, json.dumps(prepare_payload), first_question, planned_round_count, "in_progress"),
            )
        return session_id

    def get_session(self, session_id: str) -> dict:
        with self.connect() as conn:
            row = conn.execute(
                """
                select session_id, current_question, planned_round_count, current_round, status
                from sessions
                where session_id = ?
                """,
                (session_id,),
            ).fetchone()
        return {
            "session_id": row[0],
            "current_question": row[1],
            "planned_round_count": row[2],
            "current_round": row[3],
            "status": row[4],
        }
