from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError


def extract_pdf_text(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
    except PdfReadError as exc:
        raise ValueError("Resume PDF could not be extracted.") from exc

    text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if not text:
        raise ValueError("Resume PDF could not be extracted.")
    return text
