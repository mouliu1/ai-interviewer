from app.llm import client as llm_client_module
from app.config import Settings
from app.llm.client import (
    FakeLLMClient,
    QwenLLMClient,
    build_llm_client,
    normalize_completion,
    parse_json_response,
)
from app.prompts.templates import PROMPT_NAMES


def test_settings_accepts_legacy_env_names(monkeypatch):
    monkeypatch.setenv("LLM_BASE_URL", "http://example.test/v1")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./legacy.db")
    monkeypatch.setenv("DASHSCOPE_API_KEY", "dashscope-test-key")

    settings = Settings()

    assert settings.llm_base_url == "http://example.test/v1"
    assert settings.database_url == "sqlite:///./legacy.db"
    assert settings.llm_api_key == "dashscope-test-key"


def test_settings_auto_switches_to_qwen_when_dashscope_key_is_present(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setenv("DASHSCOPE_API_KEY", "dashscope-test-key")

    settings = Settings()

    assert settings.llm_provider == "qwen"
    assert settings.llm_model == "qwen3-32b"
    assert settings.llm_base_url == "https://dashscope.aliyuncs.com/compatible-mode/v1"


def test_settings_normalizes_chat_completion_suffix_in_base_url():
    settings = Settings(
        llm_provider="qwen",
        llm_model="qwen3-32b",
        llm_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        llm_api_key="test-key",
    )

    assert settings.llm_base_url == "https://dashscope.aliyuncs.com/compatible-mode/v1"


def test_build_llm_client_returns_fake_client():
    settings = Settings(llm_provider="fake", llm_model="test-model")

    client = build_llm_client(settings)

    assert isinstance(client, FakeLLMClient)


def test_build_llm_client_returns_qwen_client():
    settings = Settings(
        llm_provider="qwen",
        llm_model="qwen3-32b",
        llm_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        llm_api_key="test-key",
    )

    client = build_llm_client(settings)

    assert isinstance(client, QwenLLMClient)


def test_fake_client_returns_structured_payload():
    settings = Settings(llm_provider="fake", llm_model="test-model")
    client = build_llm_client(settings)

    result = client.complete_json(
        prompt_name="resume_parse",
        payload={"resume_text": "Python RAG project"},
    )

    assert result == {
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
    }


def test_fake_client_supports_registry_prompts():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    for prompt_name in PROMPT_NAMES:
        payload = {"answer_text": "We used evaluation metrics."} if prompt_name == "turn_evaluate" else {}
        result = client.complete_json(prompt_name=prompt_name, payload=payload)

        assert isinstance(result, dict)
        assert result


def test_fake_client_uses_prompt_builder(monkeypatch):
    calls = []
    original_build_prompt = llm_client_module.build_prompt

    def tracking_build_prompt(prompt_name, payload):
        calls.append((prompt_name, dict(payload)))
        return original_build_prompt(prompt_name, payload)

    monkeypatch.setattr(llm_client_module, "build_prompt", tracking_build_prompt)

    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))
    result = client.complete_json(prompt_name="question_plan", payload={"prepare_id": "prepare-1"})

    assert calls == [("question_plan", {"prepare_id": "prepare-1"})]
    assert result == {
        "opening_questions": [
            "请围绕 你的核心项目，完整介绍一次最能体现你岗位匹配度的实现。",
            "如果 核心链路 的效果不稳定，你会如何定位问题？",
            "你用什么指标或实验来证明这次方案调整带来了真实提升？",
        ],
        "focus_dimensions": ["technical_accuracy", "depth", "evidence"],
    }


def test_fake_client_can_stream_json_tokens_and_final_result():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    events = list(client.stream_json("jd_parse", {"jd_text": "Python RAG"}))

    assert events[0]["type"] == "token"
    assert all(event["type"] == "token" for event in events[:-1])
    assert events[-1] == {
        "type": "result",
        "payload": {
            "target_role": "AI 应用工程师",
            "required_skills": ["Python", "RAG"],
            "preferred_skills": ["FastAPI"],
            "business_context": "面向大模型产品与业务落地团队",
            "interview_focus": ["RAG", "效果评估"],
        },
    }


def test_fake_question_plan_reflects_project_name_and_fit_focus():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    result = client.complete_json(
        "question_plan",
        {
            "prepare": {
                "fit_focus_preview": ["RAG", "效果评估"],
                "candidate_profile": {
                    "projects": [
                        {
                            "name": "多轮 RAG 面试官",
                        }
                    ]
                },
            }
        },
    )

    assert result["opening_questions"][0] == "请围绕 多轮 RAG 面试官，完整介绍一次最能体现你岗位匹配度的实现。"
    assert "RAG, 效果评估" in result["opening_questions"][1]


def test_fake_client_returns_jd_parse_payload():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    result = client.complete_json(prompt_name="jd_parse", payload={"job_text": "Python RAG"})

    assert result == {
        "target_role": "AI 应用工程师",
        "required_skills": ["Python", "RAG"],
        "preferred_skills": ["FastAPI"],
        "business_context": "面向大模型产品与业务落地团队",
        "interview_focus": ["RAG", "效果评估"],
    }


def test_fake_client_rejects_unknown_prompt():
    client = build_llm_client(Settings(llm_provider="fake", llm_model="test-model"))

    try:
        client.complete_json(prompt_name="unknown_prompt", payload={})
    except ValueError as exc:
        assert "Unknown prompt: unknown_prompt" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_build_llm_client_rejects_unsupported_provider():
    settings = Settings(llm_provider="real", llm_model="test-model")

    try:
        build_llm_client(settings)
    except NotImplementedError as exc:
        assert "Unsupported LLM provider" in str(exc)
    else:
        raise AssertionError("expected NotImplementedError")


def test_parse_json_response_accepts_plain_json():
    payload = parse_json_response('{"skills":["Python"],"experience_summary":"done"}')

    assert payload == {"skills": ["Python"], "experience_summary": "done"}


def test_parse_json_response_accepts_fenced_json():
    payload = parse_json_response('```json\n{"target_role":"AI Application Engineer"}\n```')

    assert payload == {"target_role": "AI Application Engineer"}


def test_parse_json_response_accepts_inline_fenced_json():
    payload = parse_json_response('```json{"opening_questions":["请介绍你的项目。"]}```')

    assert payload == {"opening_questions": ["请介绍你的项目。"]}


def test_parse_json_response_extracts_json_from_wrapped_text():
    payload = parse_json_response(
        '下面是结果：\n```json\n{"opening_questions":["请介绍你的项目。"]}\n```\n请查收。'
    )

    assert payload == {"opening_questions": ["请介绍你的项目。"]}


def test_qwen_client_uses_openai_compatible_chat_completion(monkeypatch):
    captured = {}

    class FakeCompletions:
        def create(self, **kwargs):
            captured.update(kwargs)
            return type(
                "FakeCompletion",
                (),
                {
                    "choices": [
                        type(
                            "FakeChoice",
                            (),
                            {
                                "message": type(
                                    "FakeMessage",
                                    (),
                                    {"content": '{"opening_questions":["请介绍一下你做过的 RAG 项目。"]}'},
                                )()
                            },
                        )()
                    ]
                },
            )()

    class FakeChat:
        def __init__(self):
            self.completions = FakeCompletions()

    class FakeOpenAIClient:
        def __init__(self, *, api_key, base_url):
            captured["api_key"] = api_key
            captured["base_url"] = base_url
            self.chat = FakeChat()

    monkeypatch.setattr(llm_client_module, "OpenAI", FakeOpenAIClient)

    client = QwenLLMClient(
        Settings(
            llm_provider="qwen",
            llm_model="qwen3-32b",
            llm_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            llm_api_key="test-key",
        )
    )

    result = client.complete_json("question_plan", {"prepare_id": "prepare-1"})

    assert result == {
        "opening_questions": ["请介绍一下你做过的 RAG 项目。"],
        "focus_dimensions": ["technical_accuracy", "depth", "evidence"],
    }
    assert captured["api_key"] == "test-key"
    assert captured["base_url"] == "https://dashscope.aliyuncs.com/compatible-mode/v1"
    assert captured["model"] == "qwen3-32b"
    assert captured["extra_body"] == {"enable_thinking": False}
    assert captured["messages"][0]["role"] == "system"
    assert captured["messages"][1]["role"] == "user"


def test_qwen_client_can_stream_tokens_and_normalized_final_result(monkeypatch):
    captured = {}

    class FakeStreamChunk:
        def __init__(self, content):
            self.choices = [
                type(
                    "FakeChoice",
                    (),
                    {"delta": type("FakeDelta", (), {"content": content})()},
                )()
            ]

    class FakeCompletions:
        def create(self, **kwargs):
            captured.update(kwargs)
            if kwargs.get("stream"):
                return iter(
                    [
                        FakeStreamChunk('{"opening_questions":'),
                        FakeStreamChunk('[{"question":"请介绍你的项目。"}]}'),
                    ]
                )
            raise AssertionError("expected stream=True")

    class FakeChat:
        def __init__(self):
            self.completions = FakeCompletions()

    class FakeOpenAIClient:
        def __init__(self, *, api_key, base_url):
            self.chat = FakeChat()

    monkeypatch.setattr(llm_client_module, "OpenAI", FakeOpenAIClient)

    client = QwenLLMClient(
        Settings(
            llm_provider="qwen",
            llm_model="qwen3-32b",
            llm_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            llm_api_key="test-key",
        )
    )

    events = list(client.stream_json("question_plan", {"prepare_id": "prepare-1"}))

    assert captured["stream"] is True
    assert events[0]["type"] == "token"
    assert events[1]["type"] == "token"
    assert events[-1] == {
        "type": "result",
        "payload": {
            "opening_questions": ["请介绍你的项目。"],
            "focus_dimensions": ["technical_accuracy", "depth", "evidence"],
        },
    }


def test_normalize_completion_coerces_nested_question_objects_to_text():
    result = normalize_completion(
        "question_plan",
        {
            "opening_questions": [
                {"question": "请介绍你做过的 RAG 项目。"},
                {"content": "如果效果不稳定，你会如何定位问题？"},
            ],
            "focus_dimensions": ["depth"],
        },
    )

    assert result == {
        "opening_questions": [
            "请介绍你做过的 RAG 项目。",
            "如果效果不稳定，你会如何定位问题？",
        ],
        "focus_dimensions": ["depth"],
    }


def test_normalize_completion_coerces_string_boolean_followup_flags():
    result = normalize_completion(
        "turn_evaluate",
        {
            "dimension_scores": {"evidence": "2"},
            "strengths": ["能说明方案方向"],
            "weaknesses": ["缺少指标"],
            "followup_needed": "true",
            "followup_type": "evidence_missing",
            "followup_question": {"text": "你是如何验证效果提升的？"},
        },
    )

    assert result["followup_needed"] is True
    assert result["followup_question"] == "你是如何验证效果提升的？"


def test_normalize_completion_maps_dimension_score_aliases_to_expected_keys():
    result = normalize_completion(
        "turn_evaluate",
        {
            "dimension_scores": {
                "技术准确性": 5,
                "相关性": 4,
                "depth_score": 2,
                "证据": 1,
                "表达清晰度": 4,
            },
            "strengths": ["有项目背景"],
            "weaknesses": ["证据不足"],
            "followup_needed": False,
            "followup_question": "",
        },
    )

    assert result["dimension_scores"] == {
        "technical_accuracy": 5,
        "relevance": 4,
        "depth": 2,
        "evidence": 1,
        "clarity": 4,
    }


def test_normalize_completion_extracts_resume_fields_from_messy_payload():
    result = normalize_completion(
        "resume_parse",
        {
            "candidate_name": {"text": "刘某"},
            "skills": "Python, RAG\nFastAPI",
            "projects": [
                {
                    "name": {"title": "AI 面试官"},
                    "keywords": "Python, Prompt",
                    "highlights": [{"text": "完成了前后端闭环"}],
                    "risk_points": [{"summary": "量化指标不足"}],
                }
            ],
            "experience_summary": {"summary": "做过 AI 应用项目"},
        },
    )

    assert result == {
        "candidate_name": "刘某",
        "skills": ["Python", "RAG", "FastAPI"],
        "projects": [
            {
                "name": "AI 面试官",
                "keywords": ["Python", "Prompt"],
                "highlights": ["完成了前后端闭环"],
                "risk_points": ["量化指标不足"],
            }
        ],
        "experience_summary": "做过 AI 应用项目",
    }
