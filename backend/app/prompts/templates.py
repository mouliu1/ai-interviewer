from __future__ import annotations

from dataclasses import dataclass
from copy import deepcopy
import json
from typing import Any, Mapping


@dataclass(frozen=True)
class PromptTemplate:
    name: str
    system_text: str
    user_text: str
    expected_output_schema: dict[str, Any]

    def render(self, payload: Mapping[str, object]) -> dict[str, Any]:
        payload_json = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False)
        return {
            "name": self.name,
            "system_text": self.system_text.format(payload_json=payload_json),
            "user_text": self.user_text.format(payload_json=payload_json),
            "expected_output_schema": deepcopy(self.expected_output_schema),
        }


PROMPT_TEMPLATES = {
    "resume_parse": PromptTemplate(
        name="resume_parse",
        system_text=(
            "你是岗位定制 AI 面试系统的简历解析器。"
            "你的任务是从原始简历文本中提取候选人画像。"
            "只能基于输入内容，不允许臆造经历。"
            "输出必须是 JSON 对象，不要输出任何解释。"
        ),
        user_text=(
            "请阅读下面的简历文本，并抽取面试准备所需的结构化字段。\n"
            "要求：\n"
            "1. skills 只保留明确出现过的技术栈\n"
            "2. projects 只保留最值得追问的项目，优先提取技术动作、结果、风险点\n"
            "3. experience_summary 用 1-2 句话总结候选人的 AI 应用相关经验\n\n"
            "简历文本：\n"
            "{payload_json}\n\n"
            "输出字段：candidate_name, skills, projects(name, keywords, highlights, risk_points), experience_summary"
        ),
        expected_output_schema={
            "candidate_name": "string",
            "skills": ["string"],
            "projects": [
                {
                    "name": "string",
                    "keywords": ["string"],
                    "highlights": ["string"],
                    "risk_points": ["string"],
                }
            ],
            "experience_summary": "string",
        },
    ),
    "jd_parse": PromptTemplate(
        name="jd_parse",
        system_text=(
            "你是岗位定制 AI 面试系统的 JD 解析器。"
            "你的任务是从岗位描述中提取会被技术面重点追问的要求。"
            "优先保留明确技能、职责和评估要求。"
            "输出必须是 JSON 对象。"
        ),
        user_text=(
            "请阅读下面的岗位 JD，并抽取最关键的岗位画像。\n"
            "要求：\n"
            "1. required_skills 只保留硬技能\n"
            "2. preferred_skills 放加分项\n"
            "3. interview_focus 只写最值得出题的 3-5 个方向\n\n"
            "岗位 JD：\n"
            "{payload_json}\n\n"
            "输出字段：target_role, required_skills, preferred_skills, business_context, interview_focus"
        ),
        expected_output_schema={
            "target_role": "string",
            "required_skills": ["string"],
            "preferred_skills": ["string"],
            "business_context": "string",
            "interview_focus": ["string"],
        },
    ),
    "question_plan": PromptTemplate(
        name="question_plan",
        system_text=(
            "你是 AI 技术面试官。"
            "你的任务是根据候选人简历、目标 JD 和检索增强上下文，生成一组短轮次主问题。"
            "问题必须贴岗、贴项目、可继续追问。"
            "不要问空泛八股题。"
            "输出必须是 JSON 对象。"
        ),
        user_text=(
            "请根据下面的准备数据，为一场 3-5 轮短面试生成主问题。\n"
            "要求：\n"
            "1. 每个问题都要优先落在候选人的真实项目经历上\n"
            "2. 问题要覆盖岗位要求与项目交集，而不是泛泛聊天\n"
            "3. opening_questions 至少 3 条，且都是字符串\n"
            "4. focus_dimensions 只能从 technical_accuracy, relevance, depth, evidence, clarity 中选择\n\n"
            "准备数据：\n"
            "{payload_json}\n\n"
            "输出字段：opening_questions, focus_dimensions"
        ),
        expected_output_schema={
            "opening_questions": ["string"],
        },
    ),
    "turn_evaluate": PromptTemplate(
        name="turn_evaluate",
        system_text=(
            "你是技术面试中的追问与评分模块。"
            "请基于当前问题、候选人的回答、简历画像和 JD 画像，判断回答质量。"
            "如果回答泛泛而谈、缺指标、缺设计权衡，就生成一个更尖锐的追问。"
            "输出必须是 JSON 对象。"
        ),
        user_text=(
            "请评估下面这一轮回答。\n"
            "要求：\n"
            "1. 5 个维度分数均为 1-5 的整数\n"
            "2. strengths 和 weaknesses 各给 1-3 条\n"
            "3. followup_question 必须是单个字符串，且要基于当前回答继续深挖\n"
            "4. 如果回答已经有指标和证据，可以不追问\n\n"
            "本轮上下文：\n"
            "{payload_json}\n\n"
            "输出字段：dimension_scores, strengths, weaknesses, followup_needed, followup_type, followup_question"
        ),
        expected_output_schema={
            "dimension_scores": {
                "technical_accuracy": "integer",
                "relevance": "integer",
                "depth": "integer",
                "evidence": "integer",
                "clarity": "integer",
            },
            "strengths": ["string"],
            "weaknesses": ["string"],
            "followup_needed": "boolean",
            "followup_type": "string",
            "followup_question": "string",
        },
    ),
    "final_review": PromptTemplate(
        name="final_review",
        system_text=(
            "你是 AI 面试复盘官。"
            "请基于候选人画像、目标 JD、整场问答 transcript 和检索增强提示，输出结构化复盘。"
            "复盘要具体、可执行，不能空泛鼓励。"
            "输出必须是 JSON 对象。"
        ),
        user_text=(
            "请生成一份结构化复盘报告。\n"
            "要求：\n"
            "1. overall_summary 必须点明岗位匹配度和最主要短板\n"
            "2. key_strengths, major_gaps, action_items, recommended_practice_questions 各给 2-4 条\n"
            "3. dimension_breakdown 的分数必须与 transcript 表现一致\n"
            "4. recommended_practice_questions 要贴合当前候选人的项目和短板\n\n"
            "复盘上下文：\n"
            "{payload_json}\n\n"
            "输出字段：overall_score, overall_summary, dimension_breakdown, key_strengths, major_gaps, action_items, recommended_practice_questions"
        ),
        expected_output_schema={
            "overall_score": "integer",
            "overall_summary": "string",
            "dimension_breakdown": {
                "technical_accuracy": "integer",
                "relevance": "integer",
                "depth": "integer",
                "evidence": "integer",
                "clarity": "integer",
            },
            "key_strengths": ["string"],
            "major_gaps": ["string"],
            "action_items": ["string"],
            "recommended_practice_questions": ["string"],
        },
    ),
}

PROMPT_NAMES = set(PROMPT_TEMPLATES)


def get_prompt_template(prompt_name: str) -> PromptTemplate:
    try:
        return PROMPT_TEMPLATES[prompt_name]
    except KeyError as exc:
        raise ValueError(f"Unknown prompt: {prompt_name}") from exc


def build_prompt(prompt_name: str, payload: Mapping[str, object]) -> dict[str, Any]:
    return get_prompt_template(prompt_name).render(payload)


def build_prompt_payload(prompt_name: str, payload: dict) -> dict:
    build_prompt(prompt_name, payload)
    return {"prompt_name": prompt_name, "payload": payload}
