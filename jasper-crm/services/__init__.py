"""
JASPER CRM - Services

AI Model Routing (DeepSeek Unified):
- ai_router: Main AI task router (V3.2, R1, Coder)
- deepseek_router: Advanced router with VL vision support
- document_report_service: AI document analysis → Admin reports
- keyword_service: SEO keyword database with AI enrichment
"""

from .ai_router import ai_router, AITask, AIRouter, MODEL_ROUTING, DeepSeekModel
from .deepseek_router import deepseek_router, TaskType
from .document_report_service import document_report_service, ReportPriority, ReportStatus
from .keyword_service import keyword_service, KeywordService, KeywordCategory, SearchIntent

__all__ = [
    # Main AI Router
    "ai_router",
    "AITask",
    "AIRouter",
    "MODEL_ROUTING",
    "DeepSeekModel",
    # DeepSeek Advanced Router (VL, Search)
    "deepseek_router",
    "TaskType",
    # Document Report Service
    "document_report_service",
    "ReportPriority",
    "ReportStatus",
    # Keyword Service (SEO)
    "keyword_service",
    "KeywordService",
    "KeywordCategory",
    "SearchIntent",
]
