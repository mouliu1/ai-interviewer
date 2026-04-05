from pydantic import BaseModel


class ReportResponse(BaseModel):
    report_header: dict
    dimension_breakdown: dict
    strength_cards: list[str]
    gap_cards: list[str]
    action_items: list[str]
    recommended_questions: list[str]
    final_summary: str
