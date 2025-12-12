"""
JASPER Memory - Shared Vector Memory Service
"""

from .config import SERVICE_NAME, SERVICE_VERSION
from .embeddings import embedding_service
from .vector_store import vector_store

__all__ = ["SERVICE_NAME", "SERVICE_VERSION", "embedding_service", "vector_store"]
