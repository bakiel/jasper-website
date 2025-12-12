"""
ALEPH AI Infrastructure - Milvus Vector Store
Per-business collection isolation with semantic search
"""

from pymilvus import MilvusClient
from typing import List, Dict, Any, Optional
import json

from ..config import settings, COLLECTIONS, MILVUS_DIR


class MilvusService:
    """
    Milvus Lite vector store with per-business isolation.

    Collections:
    - jasper_*: JASPER Financial collections
    - aleph_*: ALEPH Creative collections
    - gahn_*: Gahn Eden collections
    - paji_*: Paji E-commerce collections
    - ubuntu_*: Ubuntu Agricultural collections
    """

    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._connect()
            self._ensure_collections()

    def _connect(self):
        """Connect to Milvus Lite."""
        db_path = str(MILVUS_DIR / "aleph.db")
        print(f"Connecting to Milvus Lite: {db_path}")
        self._client = MilvusClient(uri=db_path)
        print("Milvus Lite connected")

    def _ensure_collections(self):
        """Create all collections if they don't exist."""
        existing = set(self._client.list_collections())

        for name, config in COLLECTIONS.items():
            if name not in existing:
                print(f"Creating collection: {name}")
                self._client.create_collection(
                    collection_name=name,
                    dimension=config["dimension"],
                    metric_type="COSINE",
                    auto_id=True,
                )
                print(f"  -> {config['description']}")

    def insert(
        self,
        collection: str,
        id: str,
        vector: List[float],
        metadata: Dict[str, Any],
        text: Optional[str] = None,
    ) -> bool:
        """
        Insert a vector with metadata.

        Args:
            collection: Collection name (e.g., "jasper_dfi_profiles")
            id: String identifier (stored in metadata)
            vector: Embedding vector
            metadata: Associated metadata
            text: Original text for retrieval

        Returns:
            Success status
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        # Store string ID in metadata
        metadata_with_id = {**metadata, "_string_id": id}

        data = {
            "vector": vector,
            "metadata": json.dumps(metadata_with_id),
        }

        if text:
            data["text"] = text[:10000]

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
            items: List of {id, vector, metadata, text?}

        Returns:
            Number of items inserted
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        data = []
        for item in items:
            metadata = item.get("metadata", {})
            metadata["_string_id"] = item["id"]

            entry = {
                "vector": item["vector"],
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
        vector: List[float],
        top_k: int = 10,
        threshold: float = 0.0,
        filter_expr: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search in collection.

        Args:
            collection: Collection name
            vector: Query vector
            top_k: Maximum results
            threshold: Minimum similarity score (0-1)
            filter_expr: Optional Milvus filter expression

        Returns:
            List of matches with scores
        """
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        results = self._client.search(
            collection_name=collection,
            data=[vector],
            limit=top_k,
            output_fields=["metadata", "text"],
            filter=filter_expr,
        )

        matches = []
        for hit in results[0]:
            score = hit["distance"]

            # Filter by threshold
            if score < threshold:
                continue

            metadata = json.loads(hit["entity"].get("metadata", "{}"))
            string_id = metadata.pop("_string_id", str(hit["id"]))

            match = {
                "id": string_id,
                "score": score,
                "metadata": metadata,
            }
            if "text" in hit["entity"]:
                match["text"] = hit["entity"]["text"]

            matches.append(match)

        return matches

    def search_multi(
        self,
        collections: List[str],
        vector: List[float],
        top_k: int = 10,
        threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Search across multiple collections.

        Args:
            collections: List of collection names
            vector: Query vector
            top_k: Maximum results per collection
            threshold: Minimum similarity score

        Returns:
            Combined results sorted by score
        """
        all_results = []

        for collection in collections:
            if collection not in COLLECTIONS:
                continue

            results = self.search(
                collection=collection,
                vector=vector,
                top_k=top_k,
                threshold=threshold,
            )

            for r in results:
                r["collection"] = collection
            all_results.extend(results)

        # Sort by score descending
        all_results.sort(key=lambda x: x["score"], reverse=True)

        return all_results[:top_k]

    def get(
        self,
        collection: str,
        id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get item by string ID."""
        results = self._client.query(
            collection_name=collection,
            filter="",
            output_fields=["id", "metadata", "text"],
            limit=10000,
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

    def delete(
        self,
        collection: str,
        ids: List[str],
    ) -> int:
        """Delete items by string IDs."""
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
        """Get item count in collection."""
        stats = self._client.get_collection_stats(collection)
        return stats.get("row_count", 0)

    def list_collections(self) -> List[str]:
        """List all collections."""
        return self._client.list_collections()

    def get_business_collections(self, business: str) -> List[Dict[str, Any]]:
        """Get collections for a specific business."""
        return [
            {
                "name": name,
                "description": config["description"],
                "count": self.count(name),
            }
            for name, config in COLLECTIONS.items()
            if config["business"] == business
        ]

    def collection_info(self, collection: str) -> Dict[str, Any]:
        """Get collection info."""
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")

        config = COLLECTIONS[collection]
        return {
            "name": collection,
            "description": config["description"],
            "dimension": config["dimension"],
            "business": config["business"],
            "count": self.count(collection),
        }

    async def ping(self) -> bool:
        """Check if Milvus is responsive."""
        try:
            self._client.list_collections()
            return True
        except:
            return False


# Singleton instance
milvus_service = MilvusService()
