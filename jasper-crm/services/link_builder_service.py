"""
Link Builder Service for JASPER CRM
Pure Python internal linking for blog posts - NO AI required
"""

import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

class LinkBuilderService:
    """Build internal links between related articles using keyword/category matching"""
    
    def __init__(self, blog_posts_path: str = "/opt/jasper-crm/data/blog_posts.json"):
        self.blog_posts_path = blog_posts_path
        self.article_index = []
        
        # Category normalization mapping
        self.category_map = {
            "dfi-insights": "DFI Insights",
            "dfi insights": "DFI Insights",
            "renewable-energy": "Climate Finance",
            "renewable energy": "Climate Finance",
            "climate-finance": "Climate Finance",
            "financial-modelling": "Financial Modelling",
            "financial modelling": "Financial Modelling",
            "project-finance": "Project Finance",
            "project finance": "Project Finance",
        }
        
        # CTA templates by category
        self.cta_templates = {
            "DFI Insights": """
---

## Need Help with DFI Applications?

Our team has direct experience structuring deals for IFC, BII, DFC, and other development finance institutions.

**[Discuss Your Project →](/contact)**
""",
            "Climate Finance": """
---

## Structuring Climate-Aligned Investments?

We specialize in renewable energy and climate adaptation financial models.

**[Get Expert Support →](/contact)**
""",
            "Financial Modelling": """
---

## Building Investment-Grade Financial Models?

JASPER creates bankable financial models that meet institutional investor standards.

**[Schedule a Consultation →](/contact)**
""",
            "Project Finance": """
---

## Need Project Finance Structuring?

We help structure complex infrastructure and energy deals for institutional capital.

**[Discuss Your Requirements →](/contact)**
""",
            "default": """
---

## Ready to Structure Your Investment?

JASPER helps prepare investment-grade financial models for DFI funding.

**[Schedule a Consultation →](/contact)**
"""
        }
    
    def _load_articles(self) -> List[Dict[str, Any]]:
        """Load articles from blog_posts.json"""
        try:
            with open(self.blog_posts_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading articles: {e}")
            return []
    
    def _save_articles(self, articles: List[Dict[str, Any]], backup: bool = True) -> bool:
        """Save articles to blog_posts.json with backup"""
        try:
            # Create backup
            if backup:
                backup_path = self.blog_posts_path + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                with open(self.blog_posts_path, 'r') as f:
                    backup_content = f.read()
                with open(backup_path, 'w') as f:
                    f.write(backup_content)
                print(f"✅ Backup created: {backup_path}")
            
            # Save new content
            with open(self.blog_posts_path, 'w') as f:
                json.dump(articles, f, indent=2)
            
            return True
        except Exception as e:
            print(f"❌ Error saving articles: {e}")
            return False
    
    def normalize_category(self, category: str) -> str:
        """Normalize category names for consistent matching"""
        if not category:
            return "General"
        
        category_lower = category.lower().strip()
        return self.category_map.get(category_lower, category.title())
    
    def extract_keywords(self, article: Dict[str, Any]) -> set:
        """Extract meaningful keywords from article"""
        keywords = set()
        
        # From tags
        if "tags" in article and article["tags"]:
            keywords.update([tag.lower() for tag in article["tags"]])
        
        # From title (extract key terms)
        if "title" in article:
            title_words = re.findall(r'\b\w{4,}\b', article["title"].lower())
            # Filter common words
            stop_words = {"guide", "complete", "comprehensive", "introduction", "overview"}
            keywords.update([w for w in title_words if w not in stop_words])
        
        return keywords
    
    def calculate_relevance(self, article_a: Dict[str, Any], article_b: Dict[str, Any]) -> float:
        """
        Calculate relevance score between two articles
        NO AI - pure Python keyword/category matching
        """
        score = 0.0
        
        # Same category = +3 points
        cat_a = self.normalize_category(article_a.get("category", ""))
        cat_b = self.normalize_category(article_b.get("category", ""))
        
        if cat_a == cat_b:
            score += 3.0
        
        # Common tags = +1.5 per match
        tags_a = set([t.lower() for t in article_a.get("tags", [])])
        tags_b = set([t.lower() for t in article_b.get("tags", [])])
        common_tags = tags_a & tags_b
        score += len(common_tags) * 1.5
        
        # Keyword overlap = +0.5 per match
        keywords_a = self.extract_keywords(article_a)
        keywords_b = self.extract_keywords(article_b)
        common_keywords = keywords_a & keywords_b
        score += len(common_keywords) * 0.5
        
        return score
    
    def build_article_index(self) -> Dict[str, Any]:
        """Index all articles with keywords, tags, category"""
        articles = self._load_articles()
        
        self.article_index = []
        
        for article in articles:
            if article.get("status") == "published":
                indexed = {
                    "slug": article["slug"],
                    "title": article["title"],
                    "category": self.normalize_category(article.get("category", "")),
                    "tags": [t.lower() for t in article.get("tags", [])],
                    "keywords": list(self.extract_keywords(article)),
                    "excerpt": article.get("excerpt", "")[:200]
                }
                self.article_index.append(indexed)
        
        return {
            "indexed_count": len(self.article_index),
            "articles": self.article_index
        }
    
    def find_related_articles(self, slug: str, max_links: int = 5) -> List[Dict[str, Any]]:
        """Find related articles for a given slug"""
        articles = self._load_articles()
        
        # Find target article
        target = None
        for article in articles:
            if article["slug"] == slug:
                target = article
                break
        
        if not target:
            return []
        
        # Calculate relevance scores
        scored_articles = []
        for article in articles:
            if article["slug"] != slug and article.get("status") == "published":
                score = self.calculate_relevance(target, article)
                if score > 0:
                    scored_articles.append({
                        "slug": article["slug"],
                        "title": article["title"],
                        "category": self.normalize_category(article.get("category", "")),
                        "excerpt": article.get("excerpt", "")[:150],
                        "score": score
                    })
        
        # Sort by score and return top N
        scored_articles.sort(key=lambda x: x["score"], reverse=True)
        return scored_articles[:max_links]
    
    def preview_links(self, slug: str) -> Dict[str, Any]:
        """Preview what links would be added (dry run)"""
        related = self.find_related_articles(slug, max_links=5)
        
        return {
            "slug": slug,
            "related_articles": related,
            "preview": self._format_related_links(related)
        }
    
    def _format_related_links(self, related_articles: List[Dict[str, Any]]) -> str:
        """Format related articles as markdown links"""
        if not related_articles:
            return ""
        
        links_md = "\n\n---\n\n## Related Articles\n\n"
        
        for article in related_articles:
            links_md += f"- **[{article['title']}](/{article['slug']})** - {article['excerpt']}\n"
        
        return links_md
    
    def has_cta(self, content: str) -> bool:
        """Check if article already has a CTA"""
        if not content:
            return False
        
        # Check last 500 characters for /contact link
        last_section = content[-500:].lower()
        return "/contact" in last_section or "schedule" in last_section
    
    def get_cta_for_category(self, category: str) -> str:
        """Get appropriate CTA template for category"""
        normalized = self.normalize_category(category)
        return self.cta_templates.get(normalized, self.cta_templates["default"])
    
    def add_cta_to_article(self, slug: str, dry_run: bool = False) -> Dict[str, Any]:
        """Add contact CTA to end of article"""
        articles = self._load_articles()
        
        # Find article
        article_found = False
        for i, article in enumerate(articles):
            if article["slug"] == slug:
                article_found = True
                
                # Check if CTA already exists
                if self.has_cta(article.get("content", "")):
                    return {
                        "success": False,
                        "message": "Article already has a CTA",
                        "slug": slug
                    }
                
                # Get appropriate CTA
                cta = self.get_cta_for_category(article.get("category", ""))
                
                # Preview mode
                if dry_run:
                    return {
                        "success": True,
                        "mode": "preview",
                        "slug": slug,
                        "cta": cta,
                        "category": article.get("category", "")
                    }
                
                # Add CTA to content
                articles[i]["content"] = article["content"] + cta
                articles[i]["updatedAt"] = datetime.now().isoformat() + "Z"
                
                # Save changes
                if self._save_articles(articles):
                    return {
                        "success": True,
                        "message": "CTA added successfully",
                        "slug": slug,
                        "cta_added": cta
                    }
                else:
                    return {
                        "success": False,
                        "message": "Failed to save changes",
                        "slug": slug
                    }
        
        if not article_found:
            return {
                "success": False,
                "message": "Article not found",
                "slug": slug
            }
    
    def add_cta_to_all(self, dry_run: bool = False) -> Dict[str, Any]:
        """Add CTA to all articles missing it"""
        articles = self._load_articles()
        
        results = {
            "total_articles": len(articles),
            "processed": 0,
            "skipped": 0,
            "updated": 0,
            "details": []
        }
        
        modified = False
        
        for i, article in enumerate(articles):
            if article.get("status") != "published":
                results["skipped"] += 1
                continue
            
            results["processed"] += 1
            
            # Check if CTA exists
            if self.has_cta(article.get("content", "")):
                results["skipped"] += 1
                results["details"].append({
                    "slug": article["slug"],
                    "status": "skipped",
                    "reason": "CTA already exists"
                })
                continue
            
            # Get CTA
            cta = self.get_cta_for_category(article.get("category", ""))
            
            if not dry_run:
                articles[i]["content"] = article["content"] + cta
                articles[i]["updatedAt"] = datetime.now().isoformat() + "Z"
                modified = True
            
            results["updated"] += 1
            results["details"].append({
                "slug": article["slug"],
                "status": "updated" if not dry_run else "would_update",
                "category": article.get("category", "")
            })
        
        # Save if modified
        if modified and not dry_run:
            if self._save_articles(articles):
                results["saved"] = True
            else:
                results["saved"] = False
                results["error"] = "Failed to save changes"
        
        results["dry_run"] = dry_run
        return results
    
    def get_cta_report(self) -> Dict[str, Any]:
        """Report of articles with/without CTAs"""
        articles = self._load_articles()
        
        with_cta = []
        without_cta = []
        
        for article in articles:
            if article.get("status") != "published":
                continue
            
            article_info = {
                "slug": article["slug"],
                "title": article["title"],
                "category": article.get("category", "")
            }
            
            if self.has_cta(article.get("content", "")):
                with_cta.append(article_info)
            else:
                without_cta.append(article_info)
        
        return {
            "total_published": len(with_cta) + len(without_cta),
            "with_cta": len(with_cta),
            "without_cta": len(without_cta),
            "coverage_percentage": round(len(with_cta) / (len(with_cta) + len(without_cta)) * 100, 1) if (len(with_cta) + len(without_cta)) > 0 else 0,
            "articles_with_cta": with_cta,
            "articles_without_cta": without_cta
        }
