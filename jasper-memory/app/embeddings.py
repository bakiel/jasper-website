"""
JASPER Memory - Embedding Service
Uses Qwen3-Embedding-0.6B or GTE-Qwen2-1.5B for vector generation
"""

import torch
from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np
from functools import lru_cache

from .config import EMBEDDING_MODEL, EMBEDDING_DIMENSIONS


class EmbeddingService:
    """
    Shared embedding service for all Kutlwano Holdings apps.
    Self-hosted on VPS - zero API costs.
    """

    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._load_model()

    def _load_model(self):
        """Load embedding model (runs on CPU)"""
        print(f"Loading embedding model: {EMBEDDING_MODEL}")

        # Use CPU for VPS deployment
        device = "cuda" if torch.cuda.is_available() else "cpu"

        self._model = SentenceTransformer(
            EMBEDDING_MODEL,
            device=device,
        )

        print(f"Model loaded on {device}")
        print(f"Embedding dimensions: {self._model.get_sentence_embedding_dimension()}")

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: The text to embed

        Returns:
            List of floats (embedding vector)
        """
        embedding = self._model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            batch_size: Batch size for processing

        Returns:
            List of embedding vectors
        """
        embeddings = self._model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
        )
        return embeddings.tolist()

    def embed_with_instruction(
        self,
        text: str,
        instruction: str = "Represent this document for retrieval:"
    ) -> List[float]:
        """
        Generate instruction-aware embedding.
        Useful for different retrieval tasks.

        Args:
            text: The text to embed
            instruction: Task-specific instruction

        Returns:
            Embedding vector
        """
        # Format with instruction prefix
        formatted = f"{instruction} {text}"
        return self.embed_text(formatted)

    def similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score (0-1)
        """
        e1 = np.array(embedding1)
        e2 = np.array(embedding2)
        return float(np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2)))

    @property
    def dimensions(self) -> int:
        """Get embedding dimensions"""
        return self._model.get_sentence_embedding_dimension()

    @property
    def model_name(self) -> str:
        """Get model name"""
        return EMBEDDING_MODEL


# Singleton instance
embedding_service = EmbeddingService()
