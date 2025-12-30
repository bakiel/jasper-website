"""
JASPER CRM - Image Validator
==============================
Validates image uniqueness before assignment.
Prevents image reuse across articles.

Usage in blog_service.py:
    from services.image_validator import validate_image_assignment
    
    # Before assigning image
    validated_image = validate_image_assignment(hero_image, article_slug)
"""

import json
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / 'data'
REGISTRY_FILE = DATA_DIR / 'image_registry.json'


def _load_registry() -> dict:
    """Load image registry."""
    if REGISTRY_FILE.exists():
        with open(REGISTRY_FILE, 'r') as f:
            return json.load(f)
    return {'assignments': {}, 'article_images': {}}


def _save_registry(registry: dict):
    """Save image registry."""
    from datetime import datetime
    registry['updated_at'] = datetime.now().isoformat()
    with open(REGISTRY_FILE, 'w') as f:
        json.dump(registry, f, indent=2)


def is_image_available(image_path: str, exclude_slug: Optional[str] = None) -> bool:
    """
    Check if image is available for assignment.
    
    Args:
        image_path: Path to check
        exclude_slug: Article slug to exclude (for updates)
    
    Returns:
        True if available, False if already assigned
    """
    if not image_path or image_path == '/images/blog/default.jpg':
        return True  # Default is always available (but not recommended)
    
    registry = _load_registry()
    owner = registry.get('assignments', {}).get(image_path)
    
    if owner is None:
        return True
    if exclude_slug and owner == exclude_slug:
        return True  # Same article can keep its image
    
    return False


def get_image_owner(image_path: str) -> Optional[str]:
    """Get the article slug that owns this image."""
    registry = _load_registry()
    return registry.get('assignments', {}).get(image_path)


def validate_image_assignment(image_path: str, article_slug: str) -> str:
    """
    Validate and register image assignment.
    
    Args:
        image_path: Image to assign
        article_slug: Article to assign to
    
    Returns:
        The validated image path
    
    Raises:
        ValueError: If image is already assigned to another article
    """
    if not image_path or image_path == '/images/blog/default.jpg':
        logger.warning(f'Article {article_slug} using default image - recommend generating unique')
        return image_path
    
    registry = _load_registry()
    assignments = registry.get('assignments', {})
    article_images = registry.get('article_images', {})
    
    # Check if image is already assigned elsewhere
    existing_owner = assignments.get(image_path)
    if existing_owner and existing_owner != article_slug:
        raise ValueError(
            f'IMAGE REUSE BLOCKED: "{image_path}" is already assigned to "{existing_owner}". '
            f'Each article must have a unique image. Generate a new image for "{article_slug}".'
        )
    
    # Release old image if article is getting a new one
    old_image = article_images.get(article_slug)
    if old_image and old_image != image_path:
        logger.info(f'Releasing old image {old_image} from {article_slug}')
        if old_image in assignments:
            del assignments[old_image]
    
    # Register new assignment
    assignments[image_path] = article_slug
    article_images[article_slug] = image_path
    
    registry['assignments'] = assignments
    registry['article_images'] = article_images
    _save_registry(registry)
    
    logger.info(f'Image {image_path} assigned to {article_slug}')
    return image_path


def release_image(article_slug: str) -> Optional[str]:
    """Release image when article is deleted."""
    registry = _load_registry()
    assignments = registry.get('assignments', {})
    article_images = registry.get('article_images', {})
    
    image_path = article_images.pop(article_slug, None)
    if image_path and image_path in assignments:
        del assignments[image_path]
        registry['assignments'] = assignments
        registry['article_images'] = article_images
        _save_registry(registry)
        logger.info(f'Released image {image_path} from deleted article {article_slug}')
    
    return image_path


def get_registry_stats() -> dict:
    """Get registry statistics."""
    registry = _load_registry()
    return {
        'total_assignments': len(registry.get('assignments', {})),
        'total_articles': len(registry.get('article_images', {})),
        'last_updated': registry.get('updated_at')
    }
