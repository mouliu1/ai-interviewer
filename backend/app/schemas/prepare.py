from pydantic import BaseModel


class PrepareResponse(BaseModel):
    prepare_id: str
    resume_summary_preview: str
    jd_summary_preview: str
    candidate_profile: dict
    jd_profile: dict
    fit_focus_preview: list[str]
