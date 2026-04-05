try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover - fallback for the stripped-down test env
    from dataclasses import dataclass

    class SettingsConfigDict(dict):
        pass

    @dataclass(slots=True)
    class Settings:
        llm_provider: str = "fake"
        llm_model: str = "fake-model"
        llm_base_url: str = "http://localhost:11434/v1"
        llm_api_key: str = "dev-token"
        database_url: str = "sqlite:///./ai_interviewer.db"
        rag_data_path: str = "app/rag/data/interview_topics.json"

        model_config = SettingsConfigDict(env_file=".env", extra="ignore")
else:

    class Settings(BaseSettings):
        llm_provider: str = "fake"
        llm_model: str = "fake-model"
        llm_base_url: str = "http://localhost:11434/v1"
        llm_api_key: str = "dev-token"
        database_url: str = "sqlite:///./ai_interviewer.db"
        rag_data_path: str = "app/rag/data/interview_topics.json"

        model_config = SettingsConfigDict(env_file=".env", extra="ignore")
