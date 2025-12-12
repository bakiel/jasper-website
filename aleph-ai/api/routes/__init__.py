from .embed import router as embed_router
from .vision import router as vision_router
from .search import router as search_router
from .complete import router as complete_router
from .ingest import router as ingest_router
from .rag import router as rag_router
from .crm import router as crm_router

__all__ = [
    "embed_router",
    "vision_router",
    "search_router",
    "complete_router",
    "ingest_router",
    "rag_router",
    "crm_router",
]
