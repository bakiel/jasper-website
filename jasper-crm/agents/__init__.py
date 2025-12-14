"""
JASPER CRM - AI Agents

All agents use DeepSeek model family:
- ResearchAgent: DeepSeek R1 for web search + reasoning
- DocumentProcessor: DeepSeek VL for vision/OCR tasks
- SEO Agents: R1 (research) + V3.2 (optimization)
"""

from .research_agent import research_agent, ResearchAgent
from .document_processor import document_processor, DocumentProcessor, DocumentType
from .seo_agent import (
    keyword_research_agent,
    content_optimizer,
    technical_seo_agent,
    KeywordResearchAgent,
    ContentOptimizer,
    TechnicalSEOAgent,
    SEOScore,
)

__all__ = [
    # Research Agent (R1)
    "research_agent",
    "ResearchAgent",
    # Document Processor (VL)
    "document_processor",
    "DocumentProcessor",
    "DocumentType",
    # SEO Agents (R1 + V3.2)
    "keyword_research_agent",
    "content_optimizer",
    "technical_seo_agent",
    "KeywordResearchAgent",
    "ContentOptimizer",
    "TechnicalSEOAgent",
    "SEOScore",
]
