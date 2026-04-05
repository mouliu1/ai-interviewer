PROMPT_NAMES = {
    "resume_parse",
    "jd_parse",
    "question_plan",
    "turn_evaluate",
    "final_review",
}


def build_prompt_payload(prompt_name: str, payload: dict) -> dict:
    if prompt_name not in PROMPT_NAMES:
        raise ValueError(f"Unknown prompt: {prompt_name}")
    return {"prompt_name": prompt_name, "payload": payload}
