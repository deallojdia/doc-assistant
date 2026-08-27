import chromadb

from app.config import settings


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        document_id: int,
        chunks: list[dict],
        embeddings: list[list[float]],
        document_name: str,
        upload_date: str,
        version: int,
    ) -> None:
        ids = [f"doc_{document_id}_chunk_{c['chunk_index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "document_name": document_name,
                "upload_date": upload_date,
                "version": version,
                "chunk_index": c["chunk_index"],
            }
            for c in chunks
        ]
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

    def query(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        exclude_doc_ids: list[int] | None = None,
    ) -> dict:
        where_filter = None
        if exclude_doc_ids:
            where_filter = {"document_id": {"$nin": exclude_doc_ids}}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def delete_by_document_id(self, document_id: int) -> None:
        self.collection.delete(where={"document_id": document_id})

    def get_count(self) -> int:
        return self.collection.count()


vector_store = VectorStore()
