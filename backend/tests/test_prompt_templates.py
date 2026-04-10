import pytest

from app.prompts.templates import PROMPT_NAMES, build_prompt, get_prompt_template


def test_prompt_registry_exposes_expected_names():
    assert PROMPT_NAMES == {
        "resume_parse",
        "jd_parse",
        "question_plan",
        "turn_evaluate",
        "final_review",
    }


@pytest.mark.parametrize(
    "prompt_name,payload,expected_snippet",
    [
        (
            "resume_parse",
            {"resume_text": "Built Python services and RAG pipelines."},
            "candidate_name",
        ),
        (
            "jd_parse",
            {"jd_text": "Seeking FastAPI and evaluation experience."},
            "interview_focus",
        ),
        (
            "question_plan",
            {"prepare_id": "prepare-123"},
            "opening_questions",
        ),
        (
            "turn_evaluate",
            {"question": "Tell me about retrieval metrics.", "answer_text": "We used offline evaluation."},
            "followup_question",
        ),
        (
            "final_review",
            {"session_id": "session-123", "retrieved": [{"topic": "rag", "evidence": "offline metrics"}]},
            "overall_score",
        ),
    ],
)
def test_build_prompt_renders_readable_prompt(prompt_name, payload, expected_snippet):
    built = build_prompt(prompt_name, payload)

    template = get_prompt_template(prompt_name)

    assert built["name"] == prompt_name
    assert built["system_text"]
    assert built["user_text"]
    assert expected_snippet in built["user_text"] or expected_snippet in str(built["expected_output_schema"])
    assert built["expected_output_schema"] == template.expected_output_schema
    assert built["expected_output_schema"] is not template.expected_output_schema


def test_build_prompt_rejects_unknown_prompt():
    with pytest.raises(ValueError, match="Unknown prompt: missing_prompt"):
        build_prompt("missing_prompt", {})
