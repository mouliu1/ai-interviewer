from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_FAKE_PROVIDER = "fake"
DEFAULT_FAKE_MODEL = "fake-model"
DEFAULT_FAKE_BASE_URL = "http://localhost:11434/v1"
DEFAULT_QWEN_MODEL = "qwen3-32b"
DEFAULT_QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


class Settings(BaseSettings):
    llm_provider: str = Field(
        default=DEFAULT_FAKE_PROVIDER,
        validation_alias=AliasChoices("llm_provider", "LLM_PROVIDER"),
    )
    llm_model: str = Field(
        default=DEFAULT_FAKE_MODEL,
        validation_alias=AliasChoices("llm_model", "LLM_MODEL"),
    )
    llm_base_url: str = Field(
        default=DEFAULT_FAKE_BASE_URL,
        validation_alias=AliasChoices("llm_base_url", "LLM_BASE_URL"),
    )
    llm_api_key: str = Field(
        default="dev-token",
        validation_alias=AliasChoices("llm_api_key", "LLM_API_KEY", "DASHSCOPE_API_KEY"),
    )
    database_url: str = Field(
        default="sqlite:///./ai_interviewer.db",
        validation_alias=AliasChoices("database_url", "DATABASE_URL"),
    )
    rag_data_path: str = "app/rag/data/interview_topics.json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("llm_base_url", mode="before")
    @classmethod
    def normalize_llm_base_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        normalized = value.strip().rstrip("/")
        if normalized.endswith("/chat/completions"):
            normalized = normalized.removesuffix("/chat/completions")
        return normalized

    @model_validator(mode="after")
    def apply_provider_defaults(self) -> "Settings":
        has_real_api_key = bool(self.llm_api_key and self.llm_api_key != "dev-token")

        if (
            self.llm_provider == DEFAULT_FAKE_PROVIDER
            and self.llm_model == DEFAULT_FAKE_MODEL
            and self.llm_base_url == DEFAULT_FAKE_BASE_URL
            and has_real_api_key
        ):
            self.llm_provider = "qwen"
            self.llm_model = DEFAULT_QWEN_MODEL
            self.llm_base_url = DEFAULT_QWEN_BASE_URL
            return self

        if self.llm_provider == "qwen":
            if self.llm_model == DEFAULT_FAKE_MODEL:
                self.llm_model = DEFAULT_QWEN_MODEL
            if self.llm_base_url == DEFAULT_FAKE_BASE_URL:
                self.llm_base_url = DEFAULT_QWEN_BASE_URL

        return self
