"""
JASPER Memory - Configuration
Shared Vector Memory Service for all Kutlwano Holdings apps
"""

import os
from pathlib import Path

# Service Info
SERVICE_NAME = "jasper-memory"
SERVICE_VERSION = "1.0.0"

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
MILVUS_DIR = DATA_DIR / "milvus"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
MILVUS_DIR.mkdir(exist_ok=True)

# Embedding Model (CPU-friendly, no flash_attn required)
# all-MiniLM-L6-v2: Fast, lightweight, 384 dims - perfect for VPS
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_DIMENSIONS = 384  # MiniLM outputs 384 dims

# Milvus Config
MILVUS_DB_PATH = str(MILVUS_DIR / "jasper_memory.db")

# Collections (one per app/domain)
COLLECTIONS = {
    "jasper_leads": {
        "description": "JASPER CRM lead data and client submissions",
        "dimension": 384,
    },
    "jasper_projects": {
        "description": "Past JASPER projects for similarity matching",
        "dimension": 384,
    },
    "jasper_dfis": {
        "description": "DFI requirements and criteria for matching",
        "dimension": 384,
    },
    "jasper_templates": {
        "description": "Financial model templates and components",
        "dimension": 384,
    },
    "jasper_content": {
        "description": "Blog posts, articles, documentation",
        "dimension": 384,
    },
    "aleph_knowledge": {
        "description": "Aleph app knowledge base (future)",
        "dimension": 384,
    },
}

# API Keys (for external apps to authenticate)
API_KEYS = {
    "jasper-crm": os.getenv("JASPER_CRM_API_KEY", "jcrm_sk_live_xxxxx"),
    "jasper-portal": os.getenv("JASPER_PORTAL_API_KEY", "jportal_sk_live_xxxxx"),
    "aleph": os.getenv("ALEPH_API_KEY", "aleph_sk_live_xxxxx"),
}

# Rate Limits
RATE_LIMIT_REQUESTS = 100  # per minute per API key
RATE_LIMIT_EMBEDDINGS = 1000  # embeddings per minute
