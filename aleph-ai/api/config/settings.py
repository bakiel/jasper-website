"""
ALEPH AI Infrastructure - Configuration
Self-Hosted AI Platform for Kutlwano Holdings
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Dict, List


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Database
    database_url: str = "postgresql://aleph:password@localhost:5432/aleph_ai"

    # OpenRouter API
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Anthropic API (Direct)
    anthropic_api_key: str = ""

    # Model Configuration
    embedding_model: str = "Alibaba-NLP/gte-large-en-v1.5"  # 1024 dims, MTEB top-10
    vision_model: str = "HuggingFaceTB/SmolVLM-500M-Instruct"
    ocr_model: str = "ds4sd/SmolDocling-256M-preview"
    detection_model: str = "vikhyatk/moondream2"  # On-demand

    # Milvus
    milvus_path: str = "/opt/aleph-ai/data/milvus/aleph.db"

    # API Keys (per business)
    jasper_api_key: str = "jasper_sk_live_xxxxx"
    aleph_api_key: str = "aleph_sk_live_xxxxx"
    gahn_api_key: str = "gahn_sk_live_xxxxx"
    paji_api_key: str = "paji_sk_live_xxxxx"
    ubuntu_api_key: str = "ubuntu_sk_live_xxxxx"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Paths
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MILVUS_DIR = DATA_DIR / "milvus"
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
MILVUS_DIR.mkdir(exist_ok=True)

# Embedding dimensions
EMBEDDING_DIMENSIONS = 1024  # GTE-Large outputs 1024 dims


# Vector Collections - Per Business Isolation
COLLECTIONS = {
    # JASPER Collections
    "jasper_dfi_profiles": {
        "description": "50+ DFI requirements and criteria",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "jasper_proposals": {
        "description": "Past proposal templates and successes",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "jasper_client_docs": {
        "description": "Client uploaded documents",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "jasper_knowledge": {
        "description": "Bakiel's 21 years expertise encoded",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "jasper_templates": {
        "description": "Financial model templates",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },

    # JASPER CRM Collections
    "crm_contacts": {
        "description": "Contact profiles and interaction summaries",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "crm_emails": {
        "description": "Email content for semantic search",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "crm_documents": {
        "description": "Client documents (financials, proposals, MOUs)",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "crm_deals": {
        "description": "Deal profiles for win/loss pattern matching",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },
    "crm_meetings": {
        "description": "Meeting transcripts and notes",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "jasper",
    },

    # ALEPH Collections
    "aleph_projects": {
        "description": "Creative project descriptions",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "aleph",
    },
    "aleph_brand_guides": {
        "description": "Client brand guidelines",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "aleph",
    },
    "aleph_style_library": {
        "description": "Style references and assets",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "aleph",
    },

    # Gahn Eden Collections
    "gahn_recipes": {
        "description": "Vegan recipe database",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "gahn",
    },
    "gahn_ingredients": {
        "description": "Ingredient knowledge",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "gahn",
    },

    # Paji Collections
    "paji_products": {
        "description": "Product catalog",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "paji",
    },
    "paji_suppliers": {
        "description": "Supplier information",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "paji",
    },

    # Ubuntu Collections
    "ubuntu_crop_knowledge": {
        "description": "Agricultural best practices",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "ubuntu",
    },
    "ubuntu_disease_library": {
        "description": "Pest and disease identification",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "ubuntu",
    },
    "ubuntu_farmer_profiles": {
        "description": "Farmer project data",
        "dimension": EMBEDDING_DIMENSIONS,
        "business": "ubuntu",
    },
}


# API Key to Business Mapping
API_KEY_BUSINESS_MAP: Dict[str, str] = {}  # Populated from settings


# Completion Model Routing (OpenRouter + Anthropic Direct)
COMPLETION_MODELS = {
    # PREMIUM - Claude Sonnet 4.5 (Best Quality)
    "sonnet": {
        "id": "anthropic/claude-sonnet-4",
        "provider": "anthropic",  # Direct API
        "cost_input": 3.00,  # $3/M input
        "cost_output": 15.00,  # $15/M output
        "context": 200000,
        "tasks": ["complex_analysis", "strategic_advice", "high_stakes", "final_review"],
    },
    "sonnet-openrouter": {
        "id": "anthropic/claude-sonnet-4",
        "provider": "openrouter",
        "cost_input": 3.00,
        "cost_output": 15.00,
        "context": 200000,
        "tasks": ["complex_analysis", "strategic_advice"],
    },

    # COST-EFFECTIVE - DeepSeek (Great Quality, Low Cost)
    "deepseek": {
        "id": "deepseek/deepseek-chat",
        "provider": "openrouter",
        "cost_input": 0.14,
        "cost_output": 0.28,
        "context": 64000,
        "usage_percent": 50,
        "tasks": ["proposal_generation", "blog_writing", "financial_report", "long_document", "email_drafting"],
    },

    # FAST - Grok (Code & Quick Responses)
    "grok": {
        "id": "x-ai/grok-3-mini-beta",
        "provider": "openrouter",
        "cost_input": 0.30,
        "cost_output": 0.50,
        "context": 131000,
        "usage_percent": 20,
        "tasks": ["code_generation", "client_response", "quick_analysis"],
    },

    # FREE - Gemini Flash (Classification & Simple Tasks)
    "gemini": {
        "id": "google/gemini-2.0-flash-exp:free",
        "provider": "openrouter",
        "cost_input": 0,
        "cost_output": 0,
        "context": 1000000,
        "usage_percent": 30,
        "tasks": ["classification", "scoring", "extraction", "spam_detection", "fallback"],
    },
}


# Vision Model Routing
VISION_ROUTING = {
    "document_ocr": "smoldocling",
    "table_extraction": "smoldocling",
    "form_processing": "smoldocling",
    "pdf_extraction": "smoldocling",

    "general_vision": "smolvlm",
    "image_caption": "smolvlm",
    "visual_qa": "smolvlm",
    "video_analysis": "smolvlm",
    "design_description": "smolvlm",

    "object_detection": "moondream",
    "counting": "moondream",
    "localization": "moondream",
    "bounding_boxes": "moondream",
}


# Rate Limits per Business
RATE_LIMITS = {
    "jasper": {"requests_per_min": 100, "requests_per_day": 10000},
    "aleph": {"requests_per_min": 100, "requests_per_day": 10000},
    "gahn": {"requests_per_min": 50, "requests_per_day": 5000},
    "paji": {"requests_per_min": 50, "requests_per_day": 5000},
    "ubuntu": {"requests_per_min": 200, "requests_per_day": 50000},
}


# Initialize settings
settings = Settings()
