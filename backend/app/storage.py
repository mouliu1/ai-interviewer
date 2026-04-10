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
                create table if not exists prepares (
                  prepare_id text primary key,
                  payload text not null
                )
                """
            )
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
                create table if not exists turns (
                  turn_id integer primary key autoincrement,
                  session_id text not null,
                  round_index integer not null,
                  question text not null,
                  answer text not null,
                  evaluation_payload text not null
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

    def save_prepare(self, payload: dict) -> str:
        prepare_id = payload["prepare_id"]
        with self.connect() as conn:
            conn.execute(
                """
                insert or replace into prepares(prepare_id, payload)
                values (?, ?)
                """,
                (prepare_id, json.dumps(payload)),
            )
        return prepare_id

    def get_prepare(self, prepare_id: str) -> dict:
        with self.connect() as conn:
            row = conn.execute("select payload from prepares where prepare_id = ?", (prepare_id,)).fetchone()
        if row is None:
            raise KeyError(f"missing prepare: {prepare_id}")
        return json.loads(row[0])

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
                select session_id, current_question, planned_round_count, current_round, status, prepare_payload
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
            "prepare_payload": json.loads(row[5]),
        }

    def save_turn(self, session_id: str, round_index: int, question: str, answer: str, evaluation_payload: dict) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                insert into turns(session_id, round_index, question, answer, evaluation_payload)
                values (?, ?, ?, ?, ?)
                """,
                (session_id, round_index, question, answer, json.dumps(evaluation_payload)),
            )

    def list_turns(self, session_id: str) -> list[dict]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                select round_index, question, answer, evaluation_payload
                from turns
                where session_id = ?
                order by turn_id asc
                """,
                (session_id,),
            ).fetchall()
        return [
            {
                "round_index": row[0],
                "question": row[1],
                "answer": row[2],
                "evaluation_payload": json.loads(row[3]),
            }
            for row in rows
        ]

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
