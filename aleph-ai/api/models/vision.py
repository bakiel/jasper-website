"""
ALEPH AI Infrastructure - Vision Services
SmolDocling (256M) + SmolVLM-500M + Moondream-2B (on-demand)
"""

import base64
import io
from typing import Dict, Any, List, Optional
from PIL import Image
import torch

from .loader import model_manager


class VisionService:
    """
    Vision service with three specialized models:

    1. SmolDocling (256M) - Document OCR, tables, forms
       - 0.35s per page
       - Outputs structured DocTags

    2. SmolVLM-500M - General vision, captioning, VQA
       - Handles video
       - Multi-image reasoning

    3. Moondream-2B (on-demand) - Object detection, counting
       - detect(), point(), count() methods
       - Returns bounding boxes
    """

    def _decode_image(self, image_data: str) -> Image.Image:
        """Decode base64 image to PIL Image."""
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    async def ocr(
        self,
        image: str,
        output_format: str = "text",
        extract: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Extract text and structure from document using SmolDocling.

        Args:
            image: Base64 encoded image or PDF page
            output_format: "text", "doctags", "markdown", "json"
            extract: What to extract ["text", "tables", "figures", "formulas"]

        Returns:
            Extracted content with metadata
        """
        if model_manager.docling_model is None:
            return {"error": "SmolDocling not available", "text": ""}

        try:
            pil_image = self._decode_image(image)

            # Process with SmolDocling
            inputs = model_manager.docling_processor(
                images=pil_image,
                return_tensors="pt",
            )

            with torch.no_grad():
                outputs = model_manager.docling_model.generate(
                    **inputs,
                    max_new_tokens=4096,
                    do_sample=False,
                )

            result = model_manager.docling_processor.batch_decode(
                outputs,
                skip_special_tokens=True,
            )[0]

            return {
                "text": result,
                "format": output_format,
                "model": "smoldocling-256m",
            }

        except Exception as e:
            return {"error": str(e), "text": ""}

    async def analyze(
        self,
        image: str,
        prompt: str,
        max_tokens: int = 500,
    ) -> Dict[str, Any]:
        """
        Analyze image with SmolVLM-500M.

        Args:
            image: Base64 encoded image
            prompt: What to analyze/describe
            max_tokens: Maximum response length

        Returns:
            Analysis result with description
        """
        if model_manager.smolvlm_model is None:
            return {"error": "SmolVLM not available", "description": ""}

        try:
            pil_image = self._decode_image(image)

            # Format for SmolVLM
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image"},
                        {"type": "text", "text": prompt},
                    ],
                }
            ]

            inputs = model_manager.smolvlm_processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            )

            # Add image
            inputs["pixel_values"] = model_manager.smolvlm_processor(
                images=pil_image,
                return_tensors="pt",
            )["pixel_values"]

            with torch.no_grad():
                outputs = model_manager.smolvlm_model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=False,
                )

            result = model_manager.smolvlm_processor.batch_decode(
                outputs,
                skip_special_tokens=True,
            )[0]

            # Extract just the assistant response
            if "assistant" in result.lower():
                result = result.split("assistant")[-1].strip()

            return {
                "description": result,
                "model": "smolvlm-500m",
            }

        except Exception as e:
            return {"error": str(e), "description": ""}

    async def detect(
        self,
        image: str,
        objects: List[str],
        return_boxes: bool = True,
    ) -> Dict[str, Any]:
        """
        Detect and locate objects using Moondream-2B.

        Args:
            image: Base64 encoded image
            objects: List of objects to detect
            return_boxes: Whether to return bounding boxes

        Returns:
            Detection results with coordinates
        """
        model, tokenizer = await model_manager.get_moondream()

        if model is None:
            return {"error": "Moondream not available", "detections": []}

        try:
            pil_image = self._decode_image(image)

            detections = []
            for obj in objects:
                prompt = f"Detect all {obj} in this image and return their locations."

                # Moondream detection
                enc_image = model.encode_image(pil_image)

                result = model.answer_question(
                    enc_image,
                    prompt,
                    tokenizer,
                )

                detections.append({
                    "object": obj,
                    "description": result,
                })

            return {
                "detections": detections,
                "model": "moondream-2b",
            }

        except Exception as e:
            return {"error": str(e), "detections": []}

    async def caption(
        self,
        image: str,
        style: str = "detailed",
    ) -> Dict[str, Any]:
        """
        Generate image caption using SmolVLM.

        Args:
            image: Base64 encoded image
            style: "brief", "detailed", "artistic"

        Returns:
            Image caption
        """
        prompts = {
            "brief": "Describe this image in one sentence.",
            "detailed": "Provide a detailed description of this image.",
            "artistic": "Describe this image focusing on style, colors, and composition.",
        }

        prompt = prompts.get(style, prompts["detailed"])
        return await self.analyze(image, prompt)

    async def describe_design(
        self,
        image: str,
    ) -> Dict[str, Any]:
        """
        Describe a design's style, colors, and typography.
        Specialized for ALEPH Creative-Hub.
        """
        prompt = """Analyze this design and describe:
1. Overall style (minimalist, vintage, modern, etc.)
2. Color palette (list the main colors)
3. Typography (font style, weight, arrangement)
4. Key visual elements
5. Target audience impression"""

        return await self.analyze(image, prompt, max_tokens=800)


# Singleton instance
vision_service = VisionService()
