"""
JASPER Memory - Vector Store (Milvus Lite)
Self-hosted vector database for semantic search
"""

from pymilvus import MilvusClient, DataType, CollectionSchema, FieldSchema
from typing import List, Dict, Any, Optional
import json
import hashlib

from .config import MILVUS_DB_PATH, COLLECTIONS, EMBEDDING_DIMENSIONS


def string_to_int64(s: str) -> int:
    """Convert string ID to int64 using hash"""
    return int(hashlib.sha256(s.encode()).hexdigest()[:15], 16)


class VectorStore:
    """
    Milvus Lite vector store for all Kutlwano Holdings apps.
    Embedded mode - no separate server needed.
    """

    _instance = None
    _client = None
    _id_mapping = {}  # Store string_id -> int64_id mapping

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._connect()
            self._ensure_collections()

    def _connect(self):
        """Connect to Milvus Lite (embedded mode)"""
        print(f"Connecting to Milvus Lite: {MILVUS_DB_PATH}")
        self._client = MilvusClient(uri=MILVUS_DB_PATH)
        print("Milvus Lite connected")

    def _ensure_collections(self):
        """Create collections if they don't exist"""
        existing = set(self._client.list_collections())

        for name, config in COLLECTIONS.items():
            if name not in existing:
                print(f"Creating collection: {name}")
                # Use simple create_collection - stores string_id in metadata
                self._client.create_collection(
                    collection_name=name,
                    dimension=config["dimension"],
                    metric_type="COSINE",
                    auto_id=True,  # Let Milvus generate int64 IDs
                )
                print(f"Collection '{name}' created")

    def insert(
        self,
        collection: str,
        id: str,
        embedding: List[float],
        metadata: Dict[str, Any],
        text: Optional[str] = None,
    ) -> bool:
        """
        Insert a vector with metadata.

        Args:
            collection: Collection name
            id: Unique identifier (string - stored in metadata)
            embedding: Vector embedding
            metadata: Associated metadata
            text: Original text (stored for reference)

        Returns:
            Success status
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        # Store string ID in metadata since Milvus uses auto int64 IDs
        metadata_with_id = {**metadata, "_string_id": id}

        data = {
            "vector": embedding,
            "metadata": json.dumps(metadata_with_id),
        }

        if text:
            data["text"] = text[:10000]  # Limit text storage

        self._client.insert(
            collection_name=collection,
            data=[data],
        )
        return True

    def insert_batch(
        self,
        collection: str,
        items: List[Dict[str, Any]],
    ) -> int:
        """
        Insert multiple vectors.

        Args:
            collection: Collection name
            items: List of {id, embedding, metadata, text?}

        Returns:
            Number of items inserted
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        data = []
        for item in items:
            # Store string ID in metadata
            metadata = item.get("metadata", {})
            metadata["_string_id"] = item["id"]
            entry = {
                "vector": item["embedding"],
                "metadata": json.dumps(metadata),
            }
            if "text" in item:
                entry["text"] = item["text"][:10000]
            data.append(entry)

        self._client.insert(
            collection_name=collection,
            data=data,
        )
        return len(data)

    def search(
        self,
        collection: str,
        query_embedding: List[float],
        limit: int = 10,
        filter_expr: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search in collection.

        Args:
            collection: Collection name
            query_embedding: Query vector
            limit: Max results
            filter_expr: Optional filter expression

        Returns:
            List of matches with scores
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        results = self._client.search(
            collection_name=collection,
            data=[query_embedding],
            limit=limit,
            output_fields=["metadata", "text"],
            filter=filter_expr,
        )

        matches = []
        for hit in results[0]:
            metadata = json.loads(hit["entity"].get("metadata", "{}"))
            # Extract string ID from metadata
            string_id = metadata.pop("_string_id", str(hit["id"]))
            match = {
                "id": string_id,
                "score": hit["distance"],
                "metadata": metadata,
            }
            if "text" in hit["entity"]:
                match["text"] = hit["entity"]["text"]
            matches.append(match)

        return matches

    def get(self, collection: str, id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific item by string ID.

        Args:
            collection: Collection name
            id: Item string ID

        Returns:
            Item data or None
        """
        # Query by string ID stored in metadata
        # Note: Milvus Lite filter on JSON fields is limited,
        # so we do a full scan and filter
        results = self._client.query(
            collection_name=collection,
            filter="",
            output_fields=["id", "metadata", "text"],
            limit=10000,  # Get all and filter
        )

        for item in results:
            metadata = json.loads(item.get("metadata", "{}"))
            if metadata.get("_string_id") == id:
                string_id = metadata.pop("_string_id", str(item["id"]))
                return {
                    "id": string_id,
                    "_internal_id": item["id"],
                    "metadata": metadata,
                    "text": item.get("text"),
                }
        return None

    def delete(self, collection: str, ids: List[str]) -> int:
        """
        Delete items by string IDs.

        Args:
            collection: Collection name
            ids: List of string IDs to delete

        Returns:
            Number of items deleted
        """
        # Find internal IDs for the string IDs
        internal_ids = []
        for string_id in ids:
            item = self.get(collection, string_id)
            if item and "_internal_id" in item:
                internal_ids.append(item["_internal_id"])

        if internal_ids:
            self._client.delete(
                collection_name=collection,
                ids=internal_ids,
            )
        return len(internal_ids)

    def count(self, collection: str) -> int:
        """Get item count in collection"""
        stats = self._client.get_collection_stats(collection)
        return stats.get("row_count", 0)

    def list_collections(self) -> List[str]:
        """List all collections"""
        return self._client.list_collections()

    def collection_info(self, collection: str) -> Dict[str, Any]:
        """Get collection info"""
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        stats = self._client.get_collection_stats(collection)
        return {
            "name": collection,
            "description": COLLECTIONS[collection]["description"],
            "dimension": COLLECTIONS[collection]["dimension"],
            "count": stats.get("row_count", 0),
        }


# Singleton instance
vector_store = VectorStore()
