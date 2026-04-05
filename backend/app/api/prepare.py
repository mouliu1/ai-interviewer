from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import Settings
from app.llm.client import build_llm_client
from app.schemas.prepare import PrepareResponse
from app.services.pdf_extract import extract_pdf_text
from app.services.prepare_service import PrepareService

router = APIRouter(prefix="/api/v1")


@router.post("/prepare", response_model=PrepareResponse)
async def prepare(resume_file: UploadFile = File(...), jd_text: str = Form(...)) -> PrepareResponse:
    if not jd_text.strip():
        raise HTTPException(status_code=422, detail="JD text is required.")

    file_bytes = await resume_file.read()
    try:
        resume_text = extract_pdf_text(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Resume PDF could not be extracted.") from exc
    service = PrepareService(build_llm_client(Settings()))
    return PrepareResponse(**service.prepare(resume_text, jd_text))
