import re

import pdfplumber
import tiktoken

from app.config import settings
from app.services.llm_service import get_embeddings_batch
from app.services.vector_store import vector_store

encoding = tiktoken.get_encoding("cl100k_base")


def extract_text_from_pdf(file_path: str) -> str:
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n\n".join(pages)


def extract_text_from_markdown(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Strip YAML frontmatter
    content = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    return content.strip()


def extract_text(file_path: str, file_type: str) -> str:
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "md":
        return extract_text_from_markdown(file_path)
    raise ValueError(f"Unsupported file type: {file_type}")


def count_tokens(text: str) -> int:
    return len(encoding.encode(text))


def chunk_text(
    text: str,
    chunk_size: int = settings.CHUNK_SIZE,
    overlap: int = settings.CHUNK_OVERLAP,
) -> list[dict]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current_paragraphs: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = count_tokens(para)

        # If a single paragraph exceeds chunk_size, split it by sentences
        if para_tokens > chunk_size:
            if current_paragraphs:
                chunks.append(
                    {
                        "text": "\n\n".join(current_paragraphs),
                        "chunk_index": len(chunks),
                        "token_count": current_tokens,
                    }
                )
                current_paragraphs = []
                current_tokens = 0

            sentences = re.split(r"(?<=[.!?])\s+", para)
            sent_buffer: list[str] = []
            sent_tokens = 0
            for sent in sentences:
                st = count_tokens(sent)
                if sent_tokens + st > chunk_size and sent_buffer:
                    chunks.append(
                        {
                            "text": " ".join(sent_buffer),
                            "chunk_index": len(chunks),
                            "token_count": sent_tokens,
                        }
                    )
                    # Overlap: keep last sentences up to overlap tokens
                    overlap_buffer: list[str] = []
                    overlap_tokens = 0
                    for s in reversed(sent_buffer):
                        s_tokens = count_tokens(s)
                        if overlap_tokens + s_tokens > overlap:
                            break
                        overlap_buffer.insert(0, s)
                        overlap_tokens += s_tokens
                    sent_buffer = overlap_buffer
                    sent_tokens = overlap_tokens
                sent_buffer.append(sent)
                sent_tokens += st

            if sent_buffer:
                chunks.append(
                    {
                        "text": " ".join(sent_buffer),
                        "chunk_index": len(chunks),
                        "token_count": sent_tokens,
                    }
                )
            continue

        # Check if adding this paragraph exceeds chunk_size
        if current_tokens + para_tokens > chunk_size and current_paragraphs:
            chunks.append(
                {
                    "text": "\n\n".join(current_paragraphs),
                    "chunk_index": len(chunks),
                    "token_count": current_tokens,
                }
            )
            # Overlap: keep last paragraphs up to overlap tokens
            overlap_paras: list[str] = []
            overlap_tokens = 0
            for p in reversed(current_paragraphs):
                p_tokens = count_tokens(p)
                if overlap_tokens + p_tokens > overlap:
                    break
                overlap_paras.insert(0, p)
                overlap_tokens += p_tokens
            current_paragraphs = overlap_paras
            current_tokens = overlap_tokens

        current_paragraphs.append(para)
        current_tokens += para_tokens

    # Final chunk
    if current_paragraphs:
        chunks.append(
            {
                "text": "\n\n".join(current_paragraphs),
                "chunk_index": len(chunks),
                "token_count": current_tokens,
            }
        )

    return chunks


async def process_document(
    file_path: str,
    file_type: str,
    document_id: int,
    filename: str,
    version: int,
    upload_date: str,
) -> int:
    text = extract_text(file_path, file_type)
    if not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    chunk_texts = [c["text"] for c in chunks]
    embeddings = await get_embeddings_batch(chunk_texts)

    vector_store.add_chunks(
        document_id=document_id,
        chunks=chunks,
        embeddings=embeddings,
        document_name=filename,
        upload_date=upload_date,
        version=version,
    )

    return len(chunks)
