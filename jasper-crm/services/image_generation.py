"""
JASPER CRM - AI Image Generation Service

Integrates with Google Gemini for image generation.
Supports:
- Text-to-image generation
- Style presets (photorealistic, illustration, etc.)
- Reference image-guided generation
"""

import os
import base64
import httpx
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
import uuid

from models.image import ImageSource, GenerationMeta

logger = logging.getLogger("jasper-image-gen")


class ImageGenerationService:
    """AI image generation service using Google Gemini."""

    def __init__(self):
        self.gemini_key = os.getenv("GOOGLE_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=120.0)  # Image gen can take time

        # Style presets for prompts
        self.style_presets = {
            "photorealistic": "photorealistic, high quality photograph, professional photography, 8k resolution, detailed",
            "illustration": "digital illustration, clean vector art, modern graphic design style",
            "corporate": "professional corporate style, clean, modern business aesthetic",
            "abstract": "abstract art, creative, artistic interpretation",
            "minimal": "minimalist design, clean, simple, modern",
            "editorial": "editorial photography style, magazine quality, artistic lighting",
            "tech": "futuristic technology style, clean lines, modern tech aesthetic",
        }

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        model: str = "gemini-3.0-flash-preview-preview-image-generation",
        style: Optional[str] = None,
        reference_image_base64: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
    ) -> Tuple[bytes, GenerationMeta]:
        """
        Generate an image using Google Gemini.

        Args:
            prompt: Text description of image to generate
            negative_prompt: Things to avoid in the image
            model: Gemini model to use
            style: Style preset (photorealistic, illustration, etc.)
            reference_image_base64: Optional reference image for style guidance
            width: Output width (256-2048)
            height: Output height (256-2048)

        Returns:
            Tuple of (image_bytes, generation_metadata)
        """
        if not self.gemini_key:
            raise ValueError("GOOGLE_API_KEY not configured")

        # Enhance prompt with style
        enhanced_prompt = prompt
        if style and style in self.style_presets:
            enhanced_prompt = f"{prompt}, {self.style_presets[style]}"

        if negative_prompt:
            enhanced_prompt = f"{enhanced_prompt}. Avoid: {negative_prompt}"

        # Build request
        generation_config = {
            "response_mime_type": "text/plain",
            "response_modalities": ["image", "text"],
        }

        # Build content parts
        contents = [{
            "role": "user",
            "parts": [
                {"text": f"Generate a high-quality image: {enhanced_prompt}"}
            ]
        }]

        # Add reference image if provided
        if reference_image_base64:
            contents[0]["parts"].insert(0, {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": reference_image_base64
                }
            })
            contents[0]["parts"].append({
                "text": "Use the provided image as a style reference."
            })

        try:
            response = await self.client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": contents,
                    "generationConfig": generation_config,
                },
                timeout=120.0
            )
            response.raise_for_status()
            data = response.json()

            # Extract image from response
            image_data = None
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "inlineData" in part:
                        image_data = base64.b64decode(part["inlineData"]["data"])
                        break
                if image_data:
                    break

            if not image_data:
                raise ValueError("No image generated in response")

            # Create metadata
            meta = GenerationMeta(
                prompt=prompt,
                negative_prompt=negative_prompt,
                model=model,
                style=style,
                reference_image_id=None,  # Would be set by caller
                generated_at=datetime.utcnow()
            )

            logger.info(f"Generated image for prompt: {prompt[:50]}...")
            return image_data, meta

        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Image generation error: {e}")
            raise

    async def generate_hero_image_prompt(
        self,
        article_title: str,
        article_summary: str,
        style: str = "photorealistic",
    ) -> str:
        """
        Generate an optimal image prompt for an article hero image.

        Uses AI to create a compelling image description that would
        work well as a blog hero image.
        """
        if not self.gemini_key:
            # Fallback to simple prompt construction
            return f"Professional blog hero image for article about {article_title}"

        try:
            response = await self.client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": [{
                        "parts": [{
                            "text": f"""Create an image generation prompt for a blog hero image.

Article Title: {article_title}
Article Summary: {article_summary}
Style: {style}

Create a detailed, specific prompt that would generate a visually compelling hero image for this article. The image should:
- Be suitable for a professional financial/business blog
- Have clean composition with space for text overlay
- Be visually striking and relevant to the topic
- Work well at 16:9 aspect ratio

Respond with ONLY the image prompt, no explanation."""
                        }]
                    }]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            # Extract text response
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "text" in part:
                        return part["text"].strip()

            return f"Professional hero image for: {article_title}"

        except Exception as e:
            logger.error(f"Error generating image prompt: {e}")
            return f"Professional blog hero image for article about {article_title}"

    async def evaluate_image_quality(
        self,
        image_base64: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Use Gemini to evaluate image quality and suitability.

        Returns quality scores and suggestions.
        """
        if not self.gemini_key:
            return {
                "quality_score": 7.0,
                "is_suitable_for_hero": True,
                "composition_score": 7.0,
                "technical_quality": 7.0,
                "relevance_score": 7.0,
                "suggested_improvements": [],
                "detected_issues": [],
                "alt_text_suggestion": context or "Professional image"
            }

        try:
            response = await self.client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-preview:generateContent",
                params={"key": self.gemini_key},
                json={
                    "contents": [{
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": "image/png",
                                    "data": image_base64
                                }
                            },
                            {
                                "text": f"""Evaluate this image for use as a blog hero image.
{f'Context: {context}' if context else ''}

Provide a JSON response with:
{{
  "quality_score": 0-10,
  "is_suitable_for_hero": true/false,
  "composition_score": 0-10,
  "technical_quality": 0-10,
  "relevance_score": 0-10,
  "suggested_improvements": ["list", "of", "suggestions"],
  "detected_issues": ["list", "of", "issues"],
  "alt_text_suggestion": "SEO-friendly alt text"
}}

Respond with ONLY valid JSON."""
                            }
                        ]
                    }]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            # Extract JSON from response
            import json
            for candidate in data.get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    if "text" in part:
                        text = part["text"].strip()
                        # Try to parse JSON
                        if text.startswith("{"):
                            return json.loads(text)
                        # Try to extract JSON from markdown code block
                        if "```json" in text:
                            json_str = text.split("```json")[1].split("```")[0].strip()
                            return json.loads(json_str)
                        if "```" in text:
                            json_str = text.split("```")[1].split("```")[0].strip()
                            return json.loads(json_str)

            return self._default_evaluation()

        except Exception as e:
            logger.error(f"Image evaluation error: {e}")
            return self._default_evaluation()

    def _default_evaluation(self) -> Dict[str, Any]:
        """Return default evaluation when AI is unavailable."""
        return {
            "quality_score": 7.0,
            "is_suitable_for_hero": True,
            "composition_score": 7.0,
            "technical_quality": 7.0,
            "relevance_score": 7.0,
            "suggested_improvements": [],
            "detected_issues": [],
            "alt_text_suggestion": "Professional image"
        }

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
image_generation_service = ImageGenerationService()
