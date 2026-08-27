from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    LLM_MODEL: str = "gemini-3.6-flash"
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    UPLOAD_DIR: str = "./uploads"
    DATABASE_URL: str = "sqlite+aiosqlite:///./doc_assistant.db"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    TOP_K: int = 5

    model_config = {"env_file": ".env"}

# krijon objekt per pjes te tjera backend
settings = Settings()
