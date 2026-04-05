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
            conn.execute(
                """
                create table if not exists reports (
                  report_id text primary key,
                  session_id text not null,
                  payload text not null
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
        if row is None:
            raise KeyError(f"missing session: {session_id}")
        return {
            "session_id": row[0],
            "current_question": row[1],
            "planned_round_count": row[2],
            "current_round": row[3],
            "status": row[4],
        }

    def update_session(self, session_id: str, current_question: str, current_round: int, status: str) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                update sessions
                set current_question = ?, current_round = ?, status = ?
                where session_id = ?
                """,
                (current_question, current_round, status, session_id),
            )

    def update_session_status(self, session_id: str, status: str) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                update sessions
                set status = ?
                where session_id = ?
                """,
                (status, session_id),
            )

    def save_report(self, session_id: str, payload: dict) -> str:
        report_id = session_id
        with self.connect() as conn:
            conn.execute(
                """
                insert or replace into reports(report_id, session_id, payload)
                values (?, ?, ?)
                """,
                (report_id, session_id, json.dumps(payload)),
            )
        return report_id

    def get_report(self, session_id: str) -> dict | None:
        with self.connect() as conn:
            row = conn.execute("select payload from reports where session_id = ?", (session_id,)).fetchone()
        return json.loads(row[0]) if row else None
