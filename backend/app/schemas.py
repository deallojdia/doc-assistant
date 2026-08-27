from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    upload_date: datetime
    version: int
    is_outdated: bool
    chunk_count: int
    processing_status: str

    model_config = {"from_attributes": True}


class DocumentUpdateRequest(BaseModel):
    is_outdated: bool


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5


class SourceChunk(BaseModel):
    document_name: str
    chunk_text: str
    chunk_index: int
    upload_date: str
    version: int
    relevance_score: float


class ConflictInfo(BaseModel):
    conflicting_sources: list[SourceChunk]
    explanation: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    has_conflict: bool
    conflict: ConflictInfo | None = None
