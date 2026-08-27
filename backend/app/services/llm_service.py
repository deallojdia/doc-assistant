from google import genai

from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def get_embedding(text: str) -> list[float]:
    response = client.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=text,
    )
    return response.embeddings[0].values


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    embeddings = []
    for text in texts:
        response = client.models.embed_content(
            model=settings.EMBEDDING_MODEL,
            contents=text,
        )
        embeddings.append(response.embeddings[0].values)
    return embeddings


async def generate_answer(question: str, context_chunks: list[dict]) -> str:
    context_parts = []
    for chunk in context_chunks:
        context_parts.append(
            f"--- Source: {chunk['document_name']} "
            f"(Version {chunk['version']}, uploaded {chunk['upload_date']}) ---\n"
            f"{chunk['chunk_text']}\n"
        )
    context_text = "\n".join(context_parts)

    system_instruction = (
        "You are a document assistant. Answer the user's question using ONLY "
        "the provided context from internal documents.\n\n"
        "Rules:\n"
        "- Base your answer strictly on the provided context. Do not use outside knowledge.\n"
        "- For each claim, cite the source document in brackets like [Document Name, v1].\n"
        "- If the context does not contain enough information to answer, say so explicitly.\n"
        "- If sources provide conflicting information, present both perspectives and note the disagreement.\n"
        "- Be concise and professional."
    )

    response = client.models.generate_content(
        model=settings.LLM_MODEL,
        contents=f"CONTEXT:\n{context_text}\n\nQUESTION: {question}",
        config=genai.types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.1,
        ),
    )
    return response.text or ""


async def check_api_health() -> bool:
    try:
        client.models.get(model=settings.LLM_MODEL)
        return True
    except Exception:
        return False
