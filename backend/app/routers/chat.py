from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document
from app.schemas import ChatRequest, ChatResponse, SourceChunk
from app.services.conflict_detector import detect_conflicts
from app.services.llm_service import check_api_health, generate_answer, get_embedding
from app.services.vector_store import vector_store

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def ask_question(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    if not await check_api_health():
        raise HTTPException(
            status_code=503,
            detail="Gemini API is not reachable. Check your GEMINI_API_KEY in .env.",
        )

    # Get outdated document IDs to exclude
    result = await db.execute(
        select(Document.id).where(Document.is_outdated == True)  # noqa: E712
    )
    exclude_ids = [row[0] for row in result.all()]

    # Embed the question
    query_embedding = await get_embedding(request.question)

    # Retrieve relevant chunks
    results = vector_store.query(
        query_embedding=query_embedding,
        top_k=request.top_k,
        exclude_doc_ids=exclude_ids if exclude_ids else None,
    )

    if not results["documents"] or not results["documents"][0]:
        return ChatResponse(
            answer="No relevant documents found. Please upload documents first.",
            sources=[],
            has_conflict=False,
        )

    # Build source chunks
    sources: list[SourceChunk] = []
    context_chunks: list[dict] = []

    for i, (doc_text, metadata, distance) in enumerate(
        zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ):
        relevance = max(0.0, 1.0 - distance)
        source = SourceChunk(
            document_name=metadata["document_name"],
            chunk_text=doc_text,
            chunk_index=metadata["chunk_index"],
            upload_date=metadata["upload_date"],
            version=metadata["version"],
            relevance_score=round(relevance, 3),
        )
        sources.append(source)
        context_chunks.append(
            {
                "document_name": metadata["document_name"],
                "chunk_text": doc_text,
                "version": metadata["version"],
                "upload_date": metadata["upload_date"],
            }
        )

    # Generate answer
    answer = await generate_answer(request.question, context_chunks)

    # Detect conflicts
    conflict = await detect_conflicts(request.question, sources)

    return ChatResponse(
        answer=answer,
        sources=sources,
        has_conflict=conflict is not None,
        conflict=conflict,
    )
