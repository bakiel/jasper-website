"""
JASPER CRM - Image Prompt Service

Manages image prompt templates for consistent, brand-aligned image generation.

Based on user-approved image styles:
- Realistic photography (NOT fantasy/AI-looking)
- Professional lighting (golden hour, cinematic)
- Infrastructure/development focus
- Clean typography overlays
- Subtle JASPER branding integration
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# Storage path
DATA_PATH = Path("/opt/jasper-crm/data")
TEMPLATES_FILE = DATA_PATH / "image_prompt_templates.json"


@dataclass
class ImagePromptTemplate:
    """A reusable image prompt template."""
    id: str
    name: str
    category: str  # hero_infrastructure, hero_finance, hero_agriculture, etc.
    prompt_base: str
    style_modifiers: List[str]
    brand_overlay: Optional[str] = None
    negative_prompts: List[str] = None
    resolution: str = "1792x1024"
    aspect_ratio: str = "16:9"
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        now = datetime.utcnow().isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now
        if self.negative_prompts is None:
            self.negative_prompts = []


# ========== Default Templates (User-Approved Styles) ==========

DEFAULT_TEMPLATES = {
    "hero_infrastructure": {
        "id": "hero_infrastructure",
        "name": "Infrastructure Hero",
        "category": "hero_infrastructure",
        "prompt_base": "Cinematic golden hour photograph of modern infrastructure development, professional lighting, clean composition, global aesthetic, 8K quality, realistic photography style",
        "style_modifiers": [
            "warm golden tones",
            "architectural lines",
            "human scale elements",
            "construction cranes visible",
            "professional workers in frame"
        ],
        "brand_overlay": "subtle JASPER emerald accent (#2C8A5B)",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "stock photo generic",
            "too fantastic",
            "oversaturated"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_finance": {
        "id": "hero_finance",
        "name": "Finance/Investment Hero",
        "category": "hero_finance",
        "prompt_base": "Professional photograph of modern financial district, glass towers reflecting golden sunlight, sophisticated mood, realistic photography, 8K quality",
        "style_modifiers": [
            "depth of field",
            "clean lines",
            "premium feel",
            "business professionals",
            "global city aesthetic"
        ],
        "brand_overlay": "navy JASPER tones (#0F172A)",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "stock photo generic"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_agriculture": {
        "id": "hero_agriculture",
        "name": "Agriculture/Sustainability Hero",
        "category": "hero_agriculture",
        "prompt_base": "Aerial photograph of sustainable agricultural project, golden hour, modern farming technology visible, realistic photography, 8K quality",
        "style_modifiers": [
            "green fields",
            "technology integration",
            "hope and growth",
            "irrigation systems",
            "healthy crops"
        ],
        "brand_overlay": "emerald JASPER accent (#2C8A5B)",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "drought",
            "barren"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_construction": {
        "id": "hero_construction",
        "name": "Construction/Development Hero",
        "category": "hero_construction",
        "prompt_base": "Cinematic photograph of construction site at golden hour, cranes and workers, progress and development, realistic photography, 8K quality",
        "style_modifiers": [
            "dynamic angles",
            "human elements",
            "scale and ambition",
            "safety equipment visible",
            "professional lighting"
        ],
        "brand_overlay": "subtle JASPER wireframe overlay",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "abandoned",
            "dangerous"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_renewable_energy": {
        "id": "hero_renewable_energy",
        "name": "Renewable Energy Hero",
        "category": "hero_renewable_energy",
        "prompt_base": "Professional photograph of solar panels or wind turbines at golden hour, clean energy infrastructure, realistic photography, 8K quality",
        "style_modifiers": [
            "dramatic sky",
            "scale perspective",
            "modern technology",
            "sustainable future",
            "professional installation"
        ],
        "brand_overlay": "emerald JASPER accent (#2C8A5B)",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "dirty",
            "broken"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_healthcare": {
        "id": "hero_healthcare",
        "name": "Healthcare Infrastructure Hero",
        "category": "hero_healthcare",
        "prompt_base": "Professional photograph of modern hospital or healthcare facility, clean and well-lit, medical professionals, realistic photography, 8K quality",
        "style_modifiers": [
            "clean whites",
            "modern equipment",
            "caring atmosphere",
            "professional staff",
            "bright natural light"
        ],
        "brand_overlay": "subtle JASPER branding",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "emergency",
            "distressed"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_education": {
        "id": "hero_education",
        "name": "Education Infrastructure Hero",
        "category": "hero_education",
        "prompt_base": "Professional photograph of modern educational facility, students engaged in learning, bright and hopeful atmosphere, realistic photography, 8K quality",
        "style_modifiers": [
            "natural light",
            "modern classrooms",
            "technology integration",
            "diverse students",
            "positive atmosphere"
        ],
        "brand_overlay": "subtle JASPER emerald accent",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "dilapidated",
            "empty"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    },
    "hero_dfi_general": {
        "id": "hero_dfi_general",
        "name": "DFI General Hero",
        "category": "hero_dfi_general",
        "prompt_base": "Professional photograph representing development finance, modern buildings and infrastructure, global perspective, realistic photography, 8K quality",
        "style_modifiers": [
            "international aesthetic",
            "professional mood",
            "development progress",
            "institutional quality",
            "golden hour lighting"
        ],
        "brand_overlay": "navy and emerald JASPER tones",
        "negative_prompts": [
            "fantasy",
            "unrealistic",
            "cartoon",
            "AI-looking",
            "poverty porn",
            "disaster"
        ],
        "resolution": "1792x1024",
        "aspect_ratio": "16:9"
    }
}


# ========== Global Settings ==========

GLOBAL_SETTINGS = {
    "resolution": "1792x1024",
    "aspect_ratio": "16:9",
    "quality": "2K",
    "default_model": "gemini-3-pro-image-preview",  # Nano Banana Pro
    "brand_colors": {
        "navy": "#0F172A",
        "emerald": "#2C8A5B",
        "emerald_dark": "#1E6B45"
    },
    "universal_negative_prompts": [
        "fantasy",
        "unrealistic",
        "cartoon",
        "AI-looking",
        "stock photo generic",
        "too fantastic",
        "oversaturated",
        "HDR artifact"
    ]
}


class ImagePromptService:
    """
    Manages image prompt templates for consistent image generation.

    Stores templates and builds prompts based on article context.
    """

    def __init__(self):
        self.templates_file = TEMPLATES_FILE
        self._ensure_data_files()
        self._templates_cache = None

    def _ensure_data_files(self):
        """Ensure data directory and templates file exist."""
        DATA_PATH.mkdir(parents=True, exist_ok=True)

        if not self.templates_file.exists():
            self._save_templates({
                "templates": DEFAULT_TEMPLATES,
                "global_settings": GLOBAL_SETTINGS,
                "last_updated": datetime.utcnow().isoformat()
            })
            logger.info("Created default image prompt templates")

    def _load_templates(self) -> Dict[str, Any]:
        """Load templates from JSON file."""
        if self._templates_cache is not None:
            return self._templates_cache

        try:
            with open(self.templates_file, 'r') as f:
                self._templates_cache = json.load(f)
                return self._templates_cache
        except (FileNotFoundError, json.JSONDecodeError):
            # Return defaults if file doesn't exist
            return {
                "templates": DEFAULT_TEMPLATES,
                "global_settings": GLOBAL_SETTINGS
            }

    def _save_templates(self, data: Dict[str, Any]):
        """Save templates to JSON file."""
        data["last_updated"] = datetime.utcnow().isoformat()

        with open(self.templates_file, 'w') as f:
            json.dump(data, f, indent=2)

        self._templates_cache = data

    def _invalidate_cache(self):
        """Invalidate the templates cache."""
        self._templates_cache = None

    # ========== Template Operations ==========

    def list_templates(self) -> List[Dict[str, Any]]:
        """List all available templates."""
        data = self._load_templates()
        templates = data.get("templates", {})
        return list(templates.values())

    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific template by ID."""
        data = self._load_templates()
        templates = data.get("templates", {})
        return templates.get(template_id)

    def create_template(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new template."""
        data = self._load_templates()
        templates = data.get("templates", {})

        template_id = template.get("id")
        if not template_id:
            template_id = f"custom_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            template["id"] = template_id

        now = datetime.utcnow().isoformat()
        template["created_at"] = now
        template["updated_at"] = now

        templates[template_id] = template
        data["templates"] = templates
        self._save_templates(data)

        logger.info(f"Created template: {template_id}")
        return template

    def update_template(self, template_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing template."""
        data = self._load_templates()
        templates = data.get("templates", {})

        if template_id not in templates:
            return None

        template = templates[template_id]
        for key, value in updates.items():
            if key not in ["id", "created_at"]:
                template[key] = value

        template["updated_at"] = datetime.utcnow().isoformat()
        templates[template_id] = template
        data["templates"] = templates
        self._save_templates(data)

        logger.info(f"Updated template: {template_id}")
        return template

    def delete_template(self, template_id: str) -> bool:
        """Delete a template."""
        data = self._load_templates()
        templates = data.get("templates", {})

        if template_id not in templates:
            return False

        del templates[template_id]
        data["templates"] = templates
        self._save_templates(data)

        logger.info(f"Deleted template: {template_id}")
        return True

    # ========== Prompt Building ==========

    def build_prompt(
        self,
        template_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build a complete prompt from a template and article context.

        Args:
            template_id: The template to use
            context: Article context including:
                - title: Article title
                - topic: Main topic
                - category: Article category
                - keywords: Key terms to include
                - mood: Desired image mood (optional)

        Returns:
            Dict with:
                - prompt: Complete generation prompt
                - negative_prompt: Things to avoid
                - settings: Resolution, aspect ratio, etc.
        """
        template = self.get_template(template_id)
        if not template:
            # Fall back to DFI general
            template = self.get_template("hero_dfi_general")
            if not template:
                template = DEFAULT_TEMPLATES["hero_dfi_general"]

        data = self._load_templates()
        global_settings = data.get("global_settings", GLOBAL_SETTINGS)

        # Build the prompt
        prompt_parts = [template["prompt_base"]]

        # Add article-specific context
        if context.get("topic"):
            prompt_parts.append(f"Subject: {context['topic']}")

        if context.get("keywords"):
            keywords = context["keywords"]
            if isinstance(keywords, list):
                keywords = ", ".join(keywords[:3])  # Limit to 3 keywords
            prompt_parts.append(f"Including elements of: {keywords}")

        if context.get("mood"):
            prompt_parts.append(f"Mood: {context['mood']}")

        # Add style modifiers
        style_modifiers = template.get("style_modifiers", [])
        if style_modifiers:
            prompt_parts.append(f"Style: {', '.join(style_modifiers)}")

        # Add brand overlay instruction
        if template.get("brand_overlay"):
            prompt_parts.append(template["brand_overlay"])

        # Combine negative prompts
        negative_prompts = list(global_settings.get("universal_negative_prompts", []))
        template_negatives = template.get("negative_prompts", [])
        for neg in template_negatives:
            if neg not in negative_prompts:
                negative_prompts.append(neg)

        return {
            "prompt": ". ".join(prompt_parts),
            "negative_prompt": ", ".join(negative_prompts),
            "settings": {
                "resolution": template.get("resolution", global_settings["resolution"]),
                "aspect_ratio": template.get("aspect_ratio", global_settings["aspect_ratio"]),
                "quality": global_settings.get("quality", "2K"),
                "model": global_settings.get("default_model", "gemini-3-pro-image-preview")
            },
            "template_id": template_id,
            "template_name": template.get("name")
        }

    def get_template_for_category(self, article_category: str) -> str:
        """
        Get the best template ID for an article category.

        Maps article categories to appropriate image templates.
        """
        category_mapping = {
            # Infrastructure categories
            "infrastructure": "hero_infrastructure",
            "infrastructure-development": "hero_infrastructure",
            "development": "hero_infrastructure",

            # Finance categories
            "finance": "hero_finance",
            "investment": "hero_finance",
            "dfi-finance": "hero_finance",
            "blended-finance": "hero_finance",

            # Agriculture categories
            "agriculture": "hero_agriculture",
            "agribusiness": "hero_agriculture",
            "food-security": "hero_agriculture",
            "sustainability": "hero_agriculture",

            # Construction categories
            "construction": "hero_construction",
            "real-estate": "hero_construction",
            "housing": "hero_construction",

            # Energy categories
            "energy": "hero_renewable_energy",
            "renewable-energy": "hero_renewable_energy",
            "clean-energy": "hero_renewable_energy",
            "power": "hero_renewable_energy",

            # Healthcare categories
            "healthcare": "hero_healthcare",
            "health": "hero_healthcare",
            "medical": "hero_healthcare",

            # Education categories
            "education": "hero_education",
            "skills-development": "hero_education",
            "training": "hero_education",

            # DFI general
            "dfi-insights": "hero_dfi_general",
            "dfi": "hero_dfi_general",
            "development-finance": "hero_dfi_general"
        }

        # Normalize category
        normalized = article_category.lower().replace(" ", "-").replace("_", "-")

        return category_mapping.get(normalized, "hero_dfi_general")

    def auto_build_prompt(
        self,
        article_title: str,
        article_category: str,
        article_excerpt: str = "",
        keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        Automatically build a prompt based on article details.

        Selects the best template and builds context automatically.
        """
        template_id = self.get_template_for_category(article_category)

        context = {
            "title": article_title,
            "topic": article_title,
            "category": article_category,
            "keywords": keywords or [],
            "mood": "professional, trustworthy"
        }

        # Extract keywords from excerpt if not provided
        if not keywords and article_excerpt:
            # Simple keyword extraction (first 3 capitalized words)
            words = article_excerpt.split()
            context["keywords"] = [w for w in words if w[0].isupper()][:3]

        return self.build_prompt(template_id, context)

    def get_global_settings(self) -> Dict[str, Any]:
        """Get global image generation settings."""
        data = self._load_templates()
        return data.get("global_settings", GLOBAL_SETTINGS)

    def update_global_settings(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update global image generation settings."""
        data = self._load_templates()
        settings = data.get("global_settings", GLOBAL_SETTINGS.copy())

        for key, value in updates.items():
            settings[key] = value

        data["global_settings"] = settings
        self._save_templates(data)

        return settings


# Singleton instance
image_prompt_service = ImagePromptService()
