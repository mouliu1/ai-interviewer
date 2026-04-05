from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "fake"
    llm_model: str = "fake-model"
    llm_base_url: str = "http://localhost:11434/v1"
    llm_api_key: str = "dev-token"
    database_url: str = "sqlite:///./ai_interviewer.db"
    rag_data_path: str = "app/rag/data/interview_topics.json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
