import json

from google import genai

from app.config import settings
from app.schemas import ConflictInfo, SourceChunk

client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def detect_conflicts(
    question: str, chunks: list[SourceChunk]
) -> ConflictInfo | None:
    doc_groups: dict[str, list[SourceChunk]] = {}
    for chunk in chunks:
        doc_groups.setdefault(chunk.document_name, []).append(chunk)

    if len(doc_groups) < 2:
        return None

    excerpts = []
    for doc_name, doc_chunks in doc_groups.items():
        combined = " ".join(c.chunk_text for c in doc_chunks[:2])
        excerpts.append(f"[{doc_name}, v{doc_chunks[0].version}]:\n{combined}\n")

    excerpts_text = "\n".join(excerpts)

    try:
        response = client.models.generate_content(
            model=settings.LLM_MODEL,
            contents=(
                f'Given these excerpts from different documents answering the question: "{question}"\n\n'
                f"{excerpts_text}\n\n"
                "Do these excerpts contain contradictory or conflicting information?\n"
                'Respond ONLY with valid JSON: {"has_conflict": true/false, "explanation": "Brief explanation"}'
            ),
            config=genai.types.GenerateContentConfig(
                system_instruction="You analyze document excerpts for contradictions. Respond ONLY with valid JSON, no markdown.",
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )

        result = json.loads(response.text or "{}")
        if result.get("has_conflict"):
            conflicting = [doc_chunks[0] for doc_chunks in doc_groups.values()]
            return ConflictInfo(
                conflicting_sources=conflicting,
                explanation=result.get("explanation", "Conflict detected between sources."),
            )
    except (json.JSONDecodeError, Exception):
        pass

    return None
