"""
ALEPH AI Infrastructure - Model Loader
Intelligent model loading with memory management
"""

import gc
import time
import asyncio
from typing import Optional, Any
import torch

from ..config import settings


class ModelManager:
    """
    Intelligent model loading with memory management.

    Always Loaded (~2.1GB):
    - EmbeddingGemma (200MB)
    - SmolDocling (500MB)
    - SmolVLM-500M (1.2GB)

    On-Demand (~4GB):
    - Moondream-2B (loaded when needed, unloaded after 5 min idle)
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, '_initialized'):
            # Always loaded (lightweight)
            self.embedding_model = None
            self.embedding_tokenizer = None
            self.docling_model = None
            self.docling_processor = None
            self.smolvlm_model = None
            self.smolvlm_processor = None

            # Chat model (SmolLM2-360M)
            self.chat_model = None
            self.chat_tokenizer = None

            # On-demand (heavy)
            self.moondream_model = None
            self.moondream_tokenizer = None
            self.moondream_last_used = None
            self.moondream_timeout = 300  # Unload after 5 min idle

            self._initialized = True
            self._startup_complete = False

    async def startup(self):
        """Load core models on startup."""
        if self._startup_complete:
            return

        print("=" * 50)
        print("ALEPH AI - Loading Core Models")
        print("=" * 50)

        # Load embedding model
        await self._load_embedding_model()

        # Load vision models
        await self._load_docling_model()
        await self._load_smolvlm_model()

        self._startup_complete = True
        print("=" * 50)
        print("ALEPH AI - All Core Models Loaded")
        print(f"Memory Usage: {self._get_memory_mb():.0f}MB")
        print("=" * 50)

    async def _load_embedding_model(self):
        """Load GTE-Large (1024 dims) - MTEB top-10 model."""
        print(f"Loading embedding model: {settings.embedding_model}")

        try:
            from sentence_transformers import SentenceTransformer

            self.embedding_model = SentenceTransformer(
                settings.embedding_model,
                device="cpu",
                trust_remote_code=True,
            )

            dims = self.embedding_model.get_sentence_embedding_dimension()
            print(f"Embedding model loaded - {dims} dimensions")

        except Exception as e:
            print(f"Warning: Primary embedding model not available: {e}")
            print("Falling back to all-MiniLM-L6-v2...")

            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer(
                "sentence-transformers/all-MiniLM-L6-v2",
                device="cpu",
            )
            print("Fallback: all-MiniLM-L6-v2 loaded (384 dims)")

    async def _load_docling_model(self):
        """Load SmolDocling (256M) for document OCR."""
        print(f"Loading OCR model: {settings.ocr_model}")

        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq

            self.docling_processor = AutoProcessor.from_pretrained(
                settings.ocr_model,
                trust_remote_code=True,
            )
            self.docling_model = AutoModelForVision2Seq.from_pretrained(
                settings.ocr_model,
                trust_remote_code=True,
                torch_dtype=torch.float32,
            )
            self.docling_model.eval()

            print("SmolDocling loaded - Document OCR ready")

        except Exception as e:
            print(f"Warning: SmolDocling not available: {e}")
            self.docling_model = None
            self.docling_processor = None

    async def _load_smolvlm_model(self):
        """Load SmolVLM-500M for general vision."""
        print(f"Loading vision model: {settings.vision_model}")

        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq

            self.smolvlm_processor = AutoProcessor.from_pretrained(
                settings.vision_model,
                trust_remote_code=True,
            )
            self.smolvlm_model = AutoModelForVision2Seq.from_pretrained(
                settings.vision_model,
                trust_remote_code=True,
                torch_dtype=torch.float32,
            )
            self.smolvlm_model.eval()

            print("SmolVLM-500M loaded - Vision analysis ready")

        except Exception as e:
            print(f"Warning: SmolVLM not available: {e}")
            self.smolvlm_model = None
            self.smolvlm_processor = None

    async def get_moondream(self):
        """Load Moondream-2B on-demand, unload after timeout."""
        if self.moondream_model is None:
            print("Loading Moondream-2B on-demand...")

            try:
                from transformers import AutoModelForCausalLM, AutoTokenizer

                self.moondream_tokenizer = AutoTokenizer.from_pretrained(
                    settings.detection_model,
                    trust_remote_code=True,
                )
                self.moondream_model = AutoModelForCausalLM.from_pretrained(
                    settings.detection_model,
                    trust_remote_code=True,
                    torch_dtype=torch.float32,
                )
                self.moondream_model.eval()

                print("Moondream-2B loaded for detection")

            except Exception as e:
                print(f"Error loading Moondream: {e}")
                return None, None

        self.moondream_last_used = time.time()
        return self.moondream_model, self.moondream_tokenizer

    async def cleanup_loop(self):
        """Background task to unload idle heavy models."""
        while True:
            await asyncio.sleep(60)

            if self.moondream_model is not None:
                if (time.time() - self.moondream_last_used) > self.moondream_timeout:
                    print("Unloading idle Moondream-2B...")
                    del self.moondream_model
                    del self.moondream_tokenizer
                    self.moondream_model = None
                    self.moondream_tokenizer = None
                    gc.collect()
                    torch.cuda.empty_cache() if torch.cuda.is_available() else None
                    print(f"Moondream unloaded. Memory: {self._get_memory_mb():.0f}MB")

    def _get_memory_mb(self) -> float:
        """Get current memory usage in MB."""
        import psutil
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024

    @property
    def is_ready(self) -> bool:
        """Check if core models are loaded."""
        return self._startup_complete and self.embedding_model is not None

    def get_status(self) -> dict:
        """Get status of all models."""
        return {
            "embedding": self.embedding_model is not None,
            "embedding_model": settings.embedding_model if self.embedding_model else None,
            "smoldocling": self.docling_model is not None,
            "smolvlm": self.smolvlm_model is not None,
            "moondream": self.moondream_model is not None,
            "moondream_idle_seconds": (
                int(time.time() - self.moondream_last_used)
                if self.moondream_last_used else None
            ),
            "memory_mb": self._get_memory_mb(),
        }


# Singleton instance
model_manager = ModelManager()
