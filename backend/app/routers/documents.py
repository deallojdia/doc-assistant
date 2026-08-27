import hashlib
import os
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Document
from app.schemas import DocumentResponse, DocumentUpdateRequest
from app.services.document_processor import process_document
from app.services.vector_store import vector_store

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "md"}


def get_file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


async def background_process_document(
    file_path: str,
    file_type: str,
    document_id: int,
    filename: str,
    version: int,
    upload_date: str,
    db_url: str,
):
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    engine = create_async_engine(db_url)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as session:
            doc = await session.get(Document, document_id)
            if not doc:
                return
            doc.processing_status = "processing"
            await session.commit()

            chunk_count = await process_document(
                file_path, file_type, document_id, filename, version, upload_date
            )

            doc.chunk_count = chunk_count
            doc.processing_status = "completed"
            await session.commit()
    except Exception:
        async with session_factory() as session:
            doc = await session.get(Document, document_id)
            if doc:
                doc.processing_status = "failed"
                await session.commit()
    finally:
        await engine.dispose()


@router.post("/upload", response_model=DocumentResponse, status_code=202)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    # Check for existing document with same filename
    result = await db.execute(
        select(Document).where(Document.filename == file.filename)
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.file_hash == file_hash:
            raise HTTPException(status_code=409, detail="Duplicate file (identical content)")

        # New version: increment version, delete old vectors, replace file
        vector_store.delete_by_document_id(existing.id)
        existing.version += 1
        existing.file_hash = file_hash
        existing.processing_status = "pending"
        existing.chunk_count = 0

        # Overwrite file
        with open(existing.file_path, "wb") as f:
            f.write(content)

        await db.commit()
        await db.refresh(existing)

        background_tasks.add_task(
            background_process_document,
            existing.file_path,
            ext,
            existing.id,
            existing.filename,
            existing.version,
            existing.upload_date.isoformat(),
            settings.DATABASE_URL,
        )
        return existing

    # New document
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = file.filename.replace("/", "_").replace("\\", "_")
    file_path = str(Path(settings.UPLOAD_DIR) / f"{file_hash[:8]}_{safe_filename}")

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        filename=file.filename,
        file_path=file_path,
        file_type=ext,
        file_hash=file_hash,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(
        background_process_document,
        file_path,
        ext,
        doc.id,
        doc.filename,
        doc.version,
        doc.upload_date.isoformat(),
        settings.DATABASE_URL,
    )
    return doc


@router.get("", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).order_by(Document.upload_date.desc())
    )
    return result.scalars().all()


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    update: DocumentUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.is_outdated = update.is_outdated
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    vector_store.delete_by_document_id(document_id)

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)
    await db.commit()
