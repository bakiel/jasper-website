"""
ALEPH AI Infrastructure - Embedding Service
EmbeddingGemma (308M) - Best-in-class under 500M params
"""

from typing import List, Optional
import numpy as np

from .loader import model_manager


class EmbeddingService:
    """
    Embedding service using EmbeddingGemma or fallback.

    Features:
    - 768 dimensions (or 384 with fallback)
    - 2,048 token context (or 256 with fallback)
    - 100+ languages
    - Matryoshka dimensions (can truncate to 128/256/512)
    - <15ms per embedding
    """

    def embed_text(
        self,
        text: str,
        dimensions: Optional[int] = None,
        normalize: bool = True,
    ) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed
            dimensions: Optional dimension truncation (128, 256, 512, 768)
            normalize: Whether to L2 normalize

        Returns:
            Embedding vector as list of floats
        """
        if model_manager.embedding_model is None:
            raise RuntimeError("Embedding model not loaded")

        embedding = model_manager.embedding_model.encode(
            text,
            normalize_embeddings=normalize,
            show_progress_bar=False,
        )

        # Truncate to desired dimensions (Matryoshka)
        if dimensions and dimensions < len(embedding):
            embedding = embedding[:dimensions]
            # Re-normalize after truncation
            if normalize:
                norm = np.linalg.norm(embedding)
                if norm > 0:
                    embedding = embedding / norm

        return embedding.tolist()

    def embed_texts(
        self,
        texts: List[str],
        dimensions: Optional[int] = None,
        normalize: bool = True,
        batch_size: int = 32,
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            dimensions: Optional dimension truncation
            normalize: Whether to L2 normalize
            batch_size: Batch size for processing

        Returns:
            List of embedding vectors
        """
        if model_manager.embedding_model is None:
            raise RuntimeError("Embedding model not loaded")

        embeddings = model_manager.embedding_model.encode(
            texts,
            normalize_embeddings=normalize,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
        )

        # Truncate to desired dimensions
        if dimensions and dimensions < embeddings.shape[1]:
            embeddings = embeddings[:, :dimensions]
            # Re-normalize after truncation
            if normalize:
                norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                norms = np.where(norms > 0, norms, 1)
                embeddings = embeddings / norms

        return embeddings.tolist()

    def embed_with_instruction(
        self,
        text: str,
        instruction: str = "Represent this document for retrieval:",
        dimensions: Optional[int] = None,
    ) -> List[float]:
        """
        Generate instruction-aware embedding.

        Useful for different retrieval tasks:
        - "Represent this query for searching documents:"
        - "Represent this document for retrieval:"
        - "Represent this sentence for similarity matching:"
        """
        formatted = f"{instruction} {text}"
        return self.embed_text(formatted, dimensions=dimensions)

    def similarity(
        self,
        embedding1: List[float],
        embedding2: List[float],
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Returns:
            Similarity score (0-1 for normalized vectors)
        """
        e1 = np.array(embedding1)
        e2 = np.array(embedding2)

        dot = np.dot(e1, e2)
        norm1 = np.linalg.norm(e1)
        norm2 = np.linalg.norm(e2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot / (norm1 * norm2))

    @property
    def dimensions(self) -> int:
        """Get embedding dimensions."""
        if model_manager.embedding_model is None:
            return 768  # Default for EmbeddingGemma
        return model_manager.embedding_model.get_sentence_embedding_dimension()

    @property
    def model_name(self) -> str:
        """Get model name."""
        if model_manager.embedding_model is None:
            return "not_loaded"
        return str(model_manager.embedding_model._first_module().__class__.__name__)


# Singleton instance
embedding_service = EmbeddingService()
