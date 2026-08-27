from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import chat, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Document Assistant",
    description="RAG-based assistant over internal documents",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health")
async def health_check():
    from app.services.llm_service import check_api_health
    from app.services.vector_store import vector_store

    gemini_ok = await check_api_health()
    vector_count = vector_store.get_count()

    return {
        "status": "healthy" if gemini_ok else "degraded",
        "gemini": "connected" if gemini_ok else "disconnected",
        "vector_store_chunks": vector_count,
    }
