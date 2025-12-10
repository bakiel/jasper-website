"""
JASPER Client Portal - Configuration
Design System aligned with existing invoice/proposal templates
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings with design system constants"""

    # App Info
    APP_NAME: str = "JASPER Client Portal"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    # SECRET_KEY MUST be set via environment variable in production
    # Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
    SECRET_KEY: str = ""  # Will fail startup if not set
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MAGIC_LINK_EXPIRE_MINUTES: int = 15
    SESSION_EXPIRE_MINUTES: int = 60  # Absolute session timeout

    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/jasper_portal"

    # Email Settings (from existing iMail system)
    SMTP_HOST: str = "smtp.hostinger.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = "models@jasperfinance.org"
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "models@jasperfinance.org"
    FROM_NAME: str = "JASPER Financial Architecture"

    # Company Info (consistent across all documents)
    COMPANY_NAME: str = "Gahn Eden (Pty) Ltd"
    COMPANY_REG: str = "2015/272887/07"
    COMPANY_ADDRESS: str = "17 Wattle Street, Florida Park, Roodepoort, 1709, South Africa"
    COMPANY_EMAIL: str = "models@jasperfinance.org"
    COMPANY_WEBSITE: str = "jasperfinance.org"

    # Payment Details (same as invoice templates)
    PAYPAL_EMAIL: str = "bakiel7@yahoo.com"
    FNB_ACCOUNT: str = "63180306061"
    FNB_BRANCH: str = "250655"
    FNB_SWIFT: str = "FIRNZAJJ"
    USDT_TRC20: str = "TGuLFWbrNo4n1bYaEjXYJLZo48CqvPj7RJ"
    USDC_ERC20: str = "0xd1c356043fc7875d38f1b29d7fca758b5299ca2d"
    BTC_ADDRESS: str = "12aUK98uqkordBWfmCnhyQdT52sHzXCVCX"
    CRYPTO_DISCOUNT: float = 0.03  # 3% discount

    # File Storage
    UPLOAD_DIR: str = "/var/www/jasper/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {"pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"}

    # Frontend URL for magic links
    FRONTEND_URL: str = "https://portal.jasperfinance.org"

    # AI Integration (OpenRouter) - Per JASPER Model Strategy Docs
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Model Stack (from BLOG_GENERATOR.md & CLIENT_SUBMISSION_PROCESSOR.md)
    AI_MODEL_RESEARCH: str = "deepseek/deepseek-chat"           # Research, analysis, OCR orchestration
    AI_MODEL_WRITING: str = "anthropic/claude-sonnet-4-5"       # Article writing, content polish
    AI_MODEL_OCR: str = "qwen/qwen3-vl-8b-instruct"             # Document extraction
    AI_MODEL_ANALYSIS: str = "qwen/qwen3-vl-30b-a3b-thinking"   # Completeness check, reasoning
    AI_MODEL_EMBEDDING: str = "qwen/qwen3-embedding-0.6b"       # Semantic search, similarity

    # Site info for OpenRouter headers
    AI_SITE_URL: str = "https://jasperfinance.org"
    AI_SITE_NAME: str = "JASPER Portal"

    # Image Generation - Nano Banana Pro (via OpenRouter)
    # Model: google/gemini-3-pro-image-preview
    # Cost: $2/M input, $12/M output
    # Capabilities: 2K/4K output, text rendering, identity preservation, infographics
    AI_MODEL_IMAGE: str = "google/gemini-3-pro-image-preview"

    class Config:
        env_file = ".env"
        case_sensitive = True


class DesignSystem:
    """
    JASPER Design System - Aligned with JASPER_BRAND_GUIDE.md
    Use these constants for all UI components

    NOTE: PDF templates (invoice/proposal) use Montserrat for print compatibility.
    Web/portal uses Poppins as per brand guide.
    """

    # Brand Colors (from JASPER_BRAND_GUIDE.md)
    COLORS = {
        # Primary Colors
        "navy": "#0F2A3C",            # Primary background, text on light
        "emerald": "#2C8A5B",         # Primary accent, CTAs, highlights
        "carbon_black": "#0F172A",    # Deep backgrounds, premium sections

        # Secondary Colors
        "navy_light": "#1A3A4C",      # Card backgrounds, hover states
        "navy_dark": "#0B1E2B",       # Deep backgrounds
        "graphite": "#1B2430",        # Secondary dark

        # Neutral Colors
        "white": "#FFFFFF",           # Text on dark, backgrounds
        "gray": "#94A3B8",            # Body text, secondary text
        "gray_light": "#CBD5E1",      # Borders, dividers

        # Aliases for backward compatibility (used in invoice templates)
        "dark_navy": "#0F172A",       # Alias for carbon_black
        "gray_600": "#94A3B8",        # Alias for gray
        "gray_400": "#94A3B8",        # Alias for gray
        "gray_200": "#CBD5E1",        # Alias for gray_light
        "gray_100": "#F1F5F9",        # Light backgrounds
        "emerald_dark": "#1E6B45",    # Darker emerald for hover states

        # System Colors
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#3B82F6",
    }

    # Typography (Poppins per brand guide - web)
    # Note: PDFs use Montserrat for print compatibility
    FONTS = {
        "primary": "Poppins",
        "pdf_font": "Montserrat",     # For PDF generation only
        "fallback": "system-ui, -apple-system, sans-serif",
        "weights": {
            "light": 300,
            "regular": 400,
            "medium": 500,
            "semibold": 600,
            "bold": 700,
        },
        "sizes": {
            "caption": "0.75rem",  # 12px
            "small": "0.875rem",   # 14px
            "body": "1rem",        # 16px
            "h4": "1.125rem",      # 18px
            "h3": "1.5rem",        # 24px
            "h2": "2.25rem",       # 36px
            "h1": "3rem",          # 48px
        }
    }

    # Spacing (consistent with PDF margins)
    SPACING = {
        "xs": "0.25rem",   # 4px
        "sm": "0.5rem",    # 8px
        "md": "1rem",      # 16px
        "lg": "1.5rem",    # 24px
        "xl": "2rem",      # 32px
        "2xl": "3rem",     # 48px
    }

    # Border Radius
    RADIUS = {
        "sm": "0.25rem",   # 4px
        "md": "0.375rem",  # 6px
        "lg": "0.5rem",    # 8px
        "xl": "0.75rem",   # 12px
        "full": "9999px",
    }

    # Shadows
    SHADOWS = {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    }

    # Component Styles (reusable across portal)
    COMPONENTS = {
        "button_primary": {
            "bg": "#2C8A5B",
            "bg_hover": "#1E6B45",
            "text": "#FFFFFF",
            "border_radius": "0.375rem",
            "padding": "0.75rem 1.5rem",
        },
        "button_secondary": {
            "bg": "#F1F5F9",
            "bg_hover": "#E2E8F0",
            "text": "#0F172A",
            "border_radius": "0.375rem",
            "padding": "0.75rem 1.5rem",
        },
        "input": {
            "border": "#E2E8F0",
            "border_focus": "#2C8A5B",
            "bg": "#FFFFFF",
            "text": "#0F172A",
            "placeholder": "#94A3B8",
            "border_radius": "0.375rem",
            "padding": "0.75rem 1rem",
        },
        "card": {
            "bg": "#FFFFFF",
            "border": "#E2E8F0",
            "border_radius": "0.5rem",
            "padding": "1.5rem",
            "shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        "header": {
            "bg": "#0F172A",
            "text": "#FFFFFF",
            "accent": "#2C8A5B",
        },
        "sidebar": {
            "bg": "#F1F5F9",
            "text": "#475569",
            "active_bg": "#2C8A5B",
            "active_text": "#FFFFFF",
        }
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Export design system as singleton
design = DesignSystem()
