from collections.abc import Mapping
from copy import deepcopy
import json

from app.config import Settings
from app.prompts.templates import build_prompt

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - exercised through provider selection/runtime checks
    OpenAI = None  # type: ignore[assignment]


_FAKE_RESPONSES = {
    "resume_parse": {
        "candidate_name": "演示候选人",
        "skills": ["Python", "RAG"],
        "projects": [
            {
                "name": "岗位定制 AI 面试官",
                "keywords": ["Python", "RAG", "Prompt"],
                "highlights": ["搭建了检索增强问答链路并完成前后端闭环"],
                "risk_points": ["效果评估指标还可以更完整"],
            }
        ],
        "experience_summary": "具备 AI 应用项目落地经验，做过 RAG 与 Prompt 相关系统。",
    },
    "jd_parse": {
        "target_role": "AI 应用工程师",
        "required_skills": ["Python", "RAG"],
        "preferred_skills": ["FastAPI"],
        "business_context": "面向大模型产品与业务落地团队",
        "interview_focus": ["RAG", "效果评估"],
    },
    "question_plan": {
        "opening_questions": [
            "请你结合简历里最相关的项目，完整介绍一次你做过的 RAG 系统设计。",
            "如果召回质量不稳定，你通常会如何定位问题出在召回、重排还是生成阶段？",
            "你在这个项目里是如何验证效果提升不是偶然样本命中的？",
        ],
        "focus_dimensions": ["technical_accuracy", "depth", "evidence"],
    },
    "final_review": {
        "overall_score": 78,
        "overall_summary": "项目相关性较强，但效果验证和量化证据还不够充分。",
        "dimension_breakdown": {
            "technical_accuracy": 4,
            "relevance": 4,
            "depth": 3,
            "evidence": 2,
            "clarity": 4,
        },
        "key_strengths": ["能够讲清主干 RAG 链路。"],
        "major_gaps": ["需要补充更强的指标和实验依据。"],
        "action_items": ["为项目故事补齐召回质量和效果评估指标。"],
        "recommended_practice_questions": ["你如何做 RAG 的离线评估？"],
    },
}


def parse_json_response(content: str) -> dict:
    normalized = content.strip()
    if normalized.startswith("```"):
        normalized = normalized.removeprefix("```")
        normalized = normalized.removeprefix("json")
        normalized = normalized.removeprefix("JSON")
        normalized = normalized.removesuffix("```").strip()

    try:
        parsed = json.loads(normalized)
    except json.JSONDecodeError:
        fenced_start = normalized.find("```")
        if fenced_start != -1:
            fenced_end = normalized.find("```", fenced_start + 3)
            if fenced_end != -1:
                fenced_payload = normalized[fenced_start:fenced_end + 3]
                return parse_json_response(fenced_payload)

        decoder = json.JSONDecoder()
        for index, char in enumerate(normalized):
            if char not in "[{":
                continue
            try:
                parsed, _ = decoder.raw_decode(normalized[index:])
            except json.JSONDecodeError:
                continue
            break
        else:
            raise
    if not isinstance(parsed, dict):
        raise ValueError("LLM response must be a JSON object.")
    return parsed


def _coerce_text(value: object, fallback: str = "") -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, dict):
        for key in ("question", "content", "text", "summary", "title", "name"):
            if key in value:
                return _coerce_text(value[key], fallback)
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        return "；".join(_coerce_text(item) for item in value if _coerce_text(item))
    return fallback


def _coerce_list_of_text(value: object) -> list[str]:
    if isinstance(value, list):
        items = [_coerce_text(item) for item in value]
        return [item for item in items if item]
    if isinstance(value, str):
        return [segment.strip() for segment in value.replace("\n", ",").split(",") if segment.strip()]
    if value is None:
        return []
    coerced = _coerce_text(value)
    return [coerced] if coerced else []


def _coerce_score_map(value: object) -> dict[str, int]:
    defaults = {
        "technical_accuracy": 3,
        "relevance": 3,
        "depth": 3,
        "evidence": 3,
        "clarity": 3,
    }
    if not isinstance(value, dict):
        return defaults

    alias_groups = {
        "technical_accuracy": ["technical_accuracy", "technicalAccuracy", "accuracy", "技术准确性", "技术准确度"],
        "relevance": ["relevance", "相关性", "岗位相关性"],
        "depth": ["depth", "depth_score", "深度", "回答深度"],
        "evidence": ["evidence", "证据", "证据支撑", "量化证据"],
        "clarity": ["clarity", "表达清晰度", "清晰度", "表达"],
    }

    normalized = {}
    for key, fallback in defaults.items():
        raw = fallback
        for alias in alias_groups[key]:
            if alias in value:
                raw = value[alias]
                break
        try:
            score = int(raw)
        except (TypeError, ValueError):
            score = fallback
        normalized[key] = max(1, min(score, 5))
    return normalized


def _coerce_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y"}
    if isinstance(value, (int, float)):
        return value != 0
    return False


def normalize_completion(prompt_name: str, payload: dict) -> dict:
    if prompt_name == "resume_parse":
        projects = payload.get("projects", [])
        normalized_projects = []
        if isinstance(projects, list):
            for project in projects:
                if not isinstance(project, dict):
                    continue
                normalized_projects.append(
                    {
                        "name": _coerce_text(project.get("name"), "未命名项目"),
                        "keywords": _coerce_list_of_text(project.get("keywords")),
                        "highlights": _coerce_list_of_text(project.get("highlights")),
                        "risk_points": _coerce_list_of_text(project.get("risk_points")),
                    }
                )
        return {
            "candidate_name": _coerce_text(payload.get("candidate_name"), "候选人"),
            "skills": _coerce_list_of_text(payload.get("skills")),
            "projects": normalized_projects,
            "experience_summary": _coerce_text(payload.get("experience_summary"), "候选人具备相关项目经验。"),
        }
    if prompt_name == "jd_parse":
        return {
            "target_role": _coerce_text(payload.get("target_role"), "目标岗位"),
            "required_skills": _coerce_list_of_text(payload.get("required_skills")),
            "preferred_skills": _coerce_list_of_text(payload.get("preferred_skills")),
            "business_context": _coerce_text(payload.get("business_context")),
            "interview_focus": _coerce_list_of_text(payload.get("interview_focus")),
        }
    if prompt_name == "question_plan":
        opening_questions = _coerce_list_of_text(payload.get("opening_questions") or payload.get("questions"))
        if not opening_questions:
            opening_questions = ["请先介绍你做过的一个最相关项目，并说明核心设计。"]
        return {
            "opening_questions": opening_questions,
            "focus_dimensions": _coerce_list_of_text(payload.get("focus_dimensions"))
            or ["technical_accuracy", "depth", "evidence"],
        }
    if prompt_name == "turn_evaluate":
        followup_needed = _coerce_bool(payload.get("followup_needed"))
        followup_question = _coerce_text(payload.get("followup_question"))
        return {
            "dimension_scores": _coerce_score_map(payload.get("dimension_scores")),
            "strengths": _coerce_list_of_text(payload.get("strengths")),
            "weaknesses": _coerce_list_of_text(payload.get("weaknesses")),
            "followup_needed": followup_needed and bool(followup_question),
            "followup_type": _coerce_text(payload.get("followup_type"), "none"),
            "followup_question": followup_question,
        }
    if prompt_name == "final_review":
        return {
            "overall_score": max(1, min(int(payload.get("overall_score", 70)), 100)),
            "overall_summary": _coerce_text(payload.get("overall_summary"), "整体表现较稳定，但仍有提升空间。"),
            "dimension_breakdown": _coerce_score_map(payload.get("dimension_breakdown")),
            "key_strengths": _coerce_list_of_text(payload.get("key_strengths")),
            "major_gaps": _coerce_list_of_text(payload.get("major_gaps")),
            "action_items": _coerce_list_of_text(payload.get("action_items")),
            "recommended_practice_questions": _coerce_list_of_text(payload.get("recommended_practice_questions")),
        }
    return payload


class FakeLLMClient:
    def _build_result(self, prompt_name: str, payload: Mapping[str, object]) -> tuple[str, dict]:
        built_prompt = build_prompt(prompt_name, payload)
        validated_prompt_name = built_prompt["name"]
        if validated_prompt_name == "turn_evaluate":
            answer_text = str(payload.get("answer_text", ""))
            wants_followup = "metric" not in answer_text.lower() and "evaluation" not in answer_text.lower()
            result = {
                "dimension_scores": {
                    "technical_accuracy": 4,
                    "relevance": 4,
                    "depth": 3,
                    "evidence": 2 if wants_followup else 4,
                    "clarity": 4,
                },
                "strengths": ["回答能够围绕项目主线展开。"],
                "weaknesses": ["缺少量化证据与验证方式。"] if wants_followup else [],
                "followup_needed": wants_followup,
                "followup_type": "evidence_missing" if wants_followup else "none",
                "followup_question": (
                    "你提到效果有提升，具体是通过什么指标或评估集验证的？"
                    if wants_followup
                    else ""
                ),
            }
            return validated_prompt_name, normalize_completion(validated_prompt_name, result)
        if validated_prompt_name == "question_plan":
            prepare_payload = payload.get("prepare", {}) if isinstance(payload.get("prepare"), dict) else {}
            fit_focus = _coerce_list_of_text(prepare_payload.get("fit_focus_preview"))
            candidate_profile = prepare_payload.get("candidate_profile", {})
            projects = candidate_profile.get("projects", []) if isinstance(candidate_profile, dict) else []
            primary_project = projects[0]["name"] if projects and isinstance(projects[0], dict) else "你的核心项目"
            questions = [
                f"请围绕 {primary_project}，完整介绍一次最能体现你岗位匹配度的实现。",
                f"如果 {', '.join(fit_focus[:2]) or '核心链路'} 的效果不稳定，你会如何定位问题？",
                "你用什么指标或实验来证明这次方案调整带来了真实提升？",
            ]
            return validated_prompt_name, normalize_completion(
                validated_prompt_name,
                {"opening_questions": questions, "focus_dimensions": ["technical_accuracy", "depth", "evidence"]},
            )
        return validated_prompt_name, normalize_completion(validated_prompt_name, deepcopy(_FAKE_RESPONSES[validated_prompt_name]))

    def complete_json(self, prompt_name: str, payload: Mapping[str, object]) -> dict:
        _, result = self._build_result(prompt_name, payload)
        return result

    def stream_json(self, prompt_name: str, payload: Mapping[str, object]):
        _, result = self._build_result(prompt_name, payload)
        serialized = json.dumps(result, ensure_ascii=False)
        for index in range(0, len(serialized), 12):
            yield {"type": "token", "delta": serialized[index : index + 12]}
        yield {"type": "result", "payload": result}


class QwenLLMClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if OpenAI is None:
                raise RuntimeError("The openai package is required for the qwen provider.")
            self._client = OpenAI(api_key=self.settings.llm_api_key, base_url=self.settings.llm_base_url)
        return self._client

    def complete_json(self, prompt_name: str, payload: Mapping[str, object]) -> dict:
        built_prompt = build_prompt(prompt_name, payload)
        completion = self.client.chat.completions.create(
            model=self.settings.llm_model,
            messages=[
                {"role": "system", "content": built_prompt["system_text"]},
                {"role": "user", "content": built_prompt["user_text"]},
            ],
            extra_body={"enable_thinking": False},
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError(f"LLM returned empty content for prompt: {prompt_name}")
        return normalize_completion(prompt_name, parse_json_response(content))

    def stream_json(self, prompt_name: str, payload: Mapping[str, object]):
        built_prompt = build_prompt(prompt_name, payload)
        completion = self.client.chat.completions.create(
            model=self.settings.llm_model,
            messages=[
                {"role": "system", "content": built_prompt["system_text"]},
                {"role": "user", "content": built_prompt["user_text"]},
            ],
            extra_body={"enable_thinking": False},
            stream=True,
        )
        chunks: list[str] = []
        for chunk in completion:
            choices = getattr(chunk, "choices", None) or []
            if not choices:
                continue
            delta = getattr(choices[0], "delta", None)
            content = _coerce_text(getattr(delta, "content", ""))
            if not content:
                continue
            chunks.append(content)
            yield {"type": "token", "delta": content}

        full_content = "".join(chunks).strip()
        if not full_content:
            raise ValueError(f"LLM returned empty streamed content for prompt: {prompt_name}")
        yield {"type": "result", "payload": normalize_completion(prompt_name, parse_json_response(full_content))}


def build_llm_client(settings: Settings) -> FakeLLMClient | QwenLLMClient:
    if settings.llm_provider == "fake":
        return FakeLLMClient()
    if settings.llm_provider == "qwen":
        return QwenLLMClient(settings)
    raise NotImplementedError(f"Unsupported LLM provider: {settings.llm_provider}")
