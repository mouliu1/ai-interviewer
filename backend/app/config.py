from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "fake"
    llm_model: str = "fake-model"
    llm_base_url: str = Field(
        default="http://localhost:11434/v1",
        validation_alias=AliasChoices("llm_base_url", "LLM_BASE_URL"),
    )
    llm_api_key: str = "dev-token"
    database_url: str = Field(
        default="sqlite:///./ai_interviewer.db",
        validation_alias=AliasChoices("database_url", "DATABASE_URL"),
    )
    rag_data_path: str = "app/rag/data/interview_topics.json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
