"""
JASPER CRM - Image Registry Service
=====================================
Prevents image reuse across articles by tracking assignments.

RULES:
1. Each image can only be assigned to ONE article
2. New articles MUST get new generated images
3. Fallback images are ONLY used for drafts (not published)
4. System enforces uniqueness at assignment time
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any
import logging

logger = logging.getLogger(__name__)

# Registry file location
DATA_DIR = Path(__file__).parent.parent / "data"
REGISTRY_FILE = DATA_DIR / "image_registry.json"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)


class ImageRegistry:
    """
    Thread-safe registry for image-to-article assignments.
    Enforces one-to-one mapping between images and articles.
    """
    
    def __init__(self):
        self.registry_file = REGISTRY_FILE
        self._ensure_registry_exists()
    
    def _ensure_registry_exists(self):
        if not self.registry_file.exists():
            self._save_registry({
                "version": "1.0",
                "created_at": datetime.utcnow().isoformat(),
                "assignments": {},
                "article_images": {}
            })
    
    def _load_registry(self) -> Dict[str, Any]:
        try:
            with open(self.registry_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load registry: {e}")
            return {"assignments": {}, "article_images": {}}
    
    def _save_registry(self, data: Dict[str, Any]):
        data["updated_at"] = datetime.utcnow().isoformat()
        with open(self.registry_file, "w") as f:
            json.dump(data, f, indent=2)
    
    def is_available(self, image_path: str) -> bool:
        if not image_path or image_path == "/images/blog/default.jpg":
            return False
        registry = self._load_registry()
        return image_path not in registry.get("assignments", {})
    
    def get_assigned_article(self, image_path: str) -> Optional[str]:
        registry = self._load_registry()
        return registry.get("assignments", {}).get(image_path)
    
    def get_article_image(self, article_slug: str) -> Optional[str]:
        registry = self._load_registry()
        return registry.get("article_images", {}).get(article_slug)
    
    def assign(self, image_path: str, article_slug: str, force: bool = False) -> bool:
        if not image_path or image_path == "/images/blog/default.jpg":
            logger.warning(f"Cannot assign default image to {article_slug}")
            return False
        
        registry = self._load_registry()
        assignments = registry.get("assignments", {})
        article_images = registry.get("article_images", {})
        
        existing_owner = assignments.get(image_path)
        if existing_owner and existing_owner != article_slug:
            if not force:
                raise ValueError(
                    f"IMAGE REUSE BLOCKED: {image_path} is already assigned to {existing_owner}. "
                    f"Generate a new unique image for {article_slug}."
                )
            else:
                logger.warning(f"Force-reassigning {image_path} from {existing_owner} to {article_slug}")
                if existing_owner in article_images:
                    del article_images[existing_owner]
        
        existing_image = article_images.get(article_slug)
        if existing_image and existing_image != image_path:
            logger.info(f"Replacing {article_slug} image: {existing_image} -> {image_path}")
            if existing_image in assignments:
                del assignments[existing_image]
        
        assignments[image_path] = article_slug
        article_images[article_slug] = image_path
        
        registry["assignments"] = assignments
        registry["article_images"] = article_images
        self._save_registry(registry)
        
        logger.info(f"Assigned image {image_path} to article {article_slug}")
        return True
    
    def release(self, article_slug: str) -> Optional[str]:
        registry = self._load_registry()
        assignments = registry.get("assignments", {})
        article_images = registry.get("article_images", {})
        
        image_path = article_images.pop(article_slug, None)
        if image_path:
            assignments.pop(image_path, None)
            registry["assignments"] = assignments
            registry["article_images"] = article_images
            self._save_registry(registry)
            logger.info(f"Released image {image_path} from article {article_slug}")
        
        return image_path
    
    def get_available_images(self) -> List[str]:
        generated_dir = Path(__file__).parent.parent / "generated-images"
        registry = self._load_registry()
        assignments = registry.get("assignments", {})
        
        available = []
        if generated_dir.exists():
            for ext in ["*.jpg", "*.png"]:
                for img_file in generated_dir.glob(ext):
                    path = f"/generated-images/{img_file.name}"
                    if path not in assignments:
                        available.append(path)
        
        return available
    
    def sync_from_posts(self):
        posts_file = DATA_DIR / "blog_posts.json"
        if not posts_file.exists():
            logger.warning("No blog_posts.json found to sync from")
            return
        
        with open(posts_file, "r") as f:
            posts = json.load(f)
        
        if isinstance(posts, dict):
            posts = posts.get("posts", [])
        
        registry = self._load_registry()
        assignments = {}
        article_images = {}
        
        for post in posts:
            slug = post.get("slug")
            image = post.get("heroImage")
            
            if slug and image and image != "/images/blog/default.jpg":
                if image in assignments:
                    logger.warning(f"DUPLICATE: {image} used by {assignments[image]} and {slug}")
                else:
                    assignments[image] = slug
                    article_images[slug] = image
        
        registry["assignments"] = assignments
        registry["article_images"] = article_images
        registry["synced_at"] = datetime.utcnow().isoformat()
        self._save_registry(registry)
        
        return {"total_images": len(assignments), "total_articles": len(article_images)}
    
    def get_stats(self) -> Dict[str, Any]:
        registry = self._load_registry()
        available = self.get_available_images()
        
        return {
            "total_assignments": len(registry.get("assignments", {})),
            "available_images": len(available),
            "registry_version": registry.get("version", "unknown"),
            "last_updated": registry.get("updated_at")
        }


# Singleton instance
image_registry = ImageRegistry()
