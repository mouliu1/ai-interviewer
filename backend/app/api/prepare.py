from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.config import Settings
from app.llm.client import build_llm_client
from app.schemas.prepare import PrepareResponse
from app.services.pdf_extract import extract_pdf_text
from app.services.prepare_service import PrepareService
from app.storage import Database
from app.streaming import encode_sse_stream
from pathlib import Path

router = APIRouter(prefix="/api/v1")


def build_database() -> Database:
    settings = Settings()
    db = Database(Path(settings.database_url.removeprefix("sqlite:///")))
    db.init_schema()
    return db


def resolve_role_text(jd_text: str | None, target_role: str | None) -> str:
    if jd_text and jd_text.strip():
        return jd_text.strip()
    if target_role and target_role.strip():
        role = target_role.strip()
        return (
            f"目标岗位：{role}。"
            "请围绕该岗位常见的核心职责、技术要求、项目表达、系统设计、评估方法与工程落地能力生成岗位画像。"
        )
    raise HTTPException(status_code=422, detail="Target role is required.")


@router.post("/prepare", response_model=PrepareResponse)
async def prepare(
    resume_file: UploadFile = File(...),
    jd_text: str | None = Form(default=None),
    target_role: str | None = Form(default=None),
) -> PrepareResponse:
    role_text = resolve_role_text(jd_text, target_role)

    file_bytes = await resume_file.read()
    try:
        resume_text = extract_pdf_text(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Resume PDF could not be extracted.") from exc
    service = PrepareService(build_llm_client(Settings()), build_database())
    return PrepareResponse(**service.prepare(resume_text, role_text))


@router.post("/prepare/stream")
async def prepare_stream(
    resume_file: UploadFile = File(...),
    jd_text: str | None = Form(default=None),
    target_role: str | None = Form(default=None),
) -> StreamingResponse:
    role_text = resolve_role_text(jd_text, target_role)

    file_bytes = await resume_file.read()
    try:
        resume_text = extract_pdf_text(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Resume PDF could not be extracted.") from exc

    service = PrepareService(build_llm_client(Settings()), build_database())

    def event_stream():
        try:
            yield from encode_sse_stream(service.stream_prepare(resume_text, role_text))
        except Exception as exc:  # pragma: no cover - runtime safety for stream clients
            yield from encode_sse_stream(
                [
                    {
                        "event": "error",
                        "data": {"message": str(exc)},
                    }
                ]
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")
