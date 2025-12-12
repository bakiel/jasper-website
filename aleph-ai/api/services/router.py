"""
ALEPH AI Infrastructure - Task Router
Intelligent routing of requests to appropriate models
"""

from typing import Dict, Any, Optional, List
from enum import Enum

from ..config import VISION_ROUTING, COMPLETION_MODELS


class TaskType(str, Enum):
    """All supported task types."""
    # Vision tasks
    DOCUMENT_OCR = "document_ocr"
    TABLE_EXTRACTION = "table_extraction"
    FORM_PROCESSING = "form_processing"
    PDF_EXTRACTION = "pdf_extraction"
    GENERAL_VISION = "general_vision"
    IMAGE_CAPTION = "image_caption"
    VISUAL_QA = "visual_qa"
    VIDEO_ANALYSIS = "video_analysis"
    DESIGN_DESCRIPTION = "design_description"
    OBJECT_DETECTION = "object_detection"
    COUNTING = "counting"
    LOCALIZATION = "localization"

    # Completion tasks
    CLASSIFICATION = "classification"
    SCORING = "scoring"
    EXTRACTION = "extraction"
    SPAM_DETECTION = "spam_detection"
    CODE_GENERATION = "code_generation"
    EMAIL_DRAFTING = "email_drafting"
    CLIENT_RESPONSE = "client_response"
    PROPOSAL_GENERATION = "proposal_generation"
    BLOG_WRITING = "blog_writing"
    FINANCIAL_REPORT = "financial_report"
    LONG_DOCUMENT = "long_document"


class TaskRouter:
    """
    Route requests to appropriate models based on task type.

    Vision Routing:
    - SmolDocling: Documents, tables, forms
    - SmolVLM: General vision, captions, VQA
    - Moondream: Detection, counting, localization

    Completion Routing:
    - Gemini Flash Lite: Classification, scoring (FREE)
    - Grok Code: Code, emails ($0.15)
    - DeepSeek: Long-form, proposals ($0.27)
    """

    def get_vision_model(self, task: str) -> str:
        """Get vision model for task."""
        return VISION_ROUTING.get(task, "smolvlm")

    def get_completion_model(self, task: str) -> str:
        """Get completion model ID for task."""
        for model_key, config in COMPLETION_MODELS.items():
            if task in config["tasks"]:
                return config["id"]
        return COMPLETION_MODELS["gemini-flash"]["id"]

    def get_completion_cost(self, model_id: str) -> Dict[str, float]:
        """Get cost per million tokens for model."""
        for config in COMPLETION_MODELS.values():
            if config["id"] == model_id:
                return {
                    "input": config["cost_input"],
                    "output": config["cost_output"],
                }
        return {"input": 0, "output": 0}

    def estimate_cost(
        self,
        task: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """Estimate cost for a task."""
        model_id = self.get_completion_model(task)
        costs = self.get_completion_cost(model_id)

        return (
            (input_tokens * costs["input"] / 1_000_000) +
            (output_tokens * costs["output"] / 1_000_000)
        )

    def route_request(
        self,
        content_type: str,
        task_hint: Optional[str] = None,
        has_image: bool = False,
        text_length: int = 0,
    ) -> Dict[str, Any]:
        """
        Automatically route a request to the best model.

        Args:
            content_type: "vision", "completion", "embed"
            task_hint: Optional task type hint
            has_image: Whether request includes images
            text_length: Length of text content

        Returns:
            Routing decision with model and reasoning
        """
        if content_type == "embed":
            return {
                "model": "embedding-gemma",
                "layer": "local",
                "cost": 0,
                "reason": "Self-hosted embedding (FREE)",
            }

        if content_type == "vision" or has_image:
            if task_hint:
                model = self.get_vision_model(task_hint)
            elif text_length > 1000:
                model = "smoldocling"  # Document-heavy
            else:
                model = "smolvlm"  # General vision

            return {
                "model": model,
                "layer": "local",
                "cost": 0,
                "reason": f"Self-hosted vision ({model})",
            }

        if content_type == "completion":
            if task_hint:
                model_id = self.get_completion_model(task_hint)
            elif text_length > 2000:
                model_id = COMPLETION_MODELS["deepseek"]["id"]
            else:
                model_id = COMPLETION_MODELS["gemini-flash-lite"]["id"]

            costs = self.get_completion_cost(model_id)
            is_free = costs["input"] == 0 and costs["output"] == 0

            return {
                "model": model_id,
                "layer": "openrouter",
                "cost": costs,
                "reason": f"OpenRouter completion ({'FREE' if is_free else 'paid'})",
            }

        return {
            "model": "unknown",
            "layer": "unknown",
            "cost": 0,
            "reason": "Unknown content type",
        }

    def get_model_info(self, model_key: str) -> Dict[str, Any]:
        """Get detailed model information."""
        if model_key in COMPLETION_MODELS:
            config = COMPLETION_MODELS[model_key]
            return {
                "key": model_key,
                "id": config["id"],
                "cost_input": config["cost_input"],
                "cost_output": config["cost_output"],
                "context": config["context"],
                "tasks": config["tasks"],
                "usage_percent": config["usage_percent"],
            }

        vision_models = {
            "smoldocling": {
                "key": "smoldocling",
                "id": "ds4sd/SmolDocling-256M-preview",
                "params": "256M",
                "ram": "500MB",
                "tasks": ["document_ocr", "table_extraction", "form_processing"],
                "cost": 0,
            },
            "smolvlm": {
                "key": "smolvlm",
                "id": "HuggingFaceTB/SmolVLM-500M-Instruct",
                "params": "500M",
                "ram": "1.2GB",
                "tasks": ["general_vision", "image_caption", "visual_qa"],
                "cost": 0,
            },
            "moondream": {
                "key": "moondream",
                "id": "vikhyatk/moondream2",
                "params": "1.86B",
                "ram": "4GB",
                "tasks": ["object_detection", "counting", "localization"],
                "cost": 0,
                "on_demand": True,
            },
        }

        return vision_models.get(model_key, {"error": "Unknown model"})


# Singleton instance
task_router = TaskRouter()
