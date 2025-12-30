"""
JASPER CRM - Search Service

Provides search functionality for blog posts with scoring algorithm.
Index is built from blog_posts.json and cached to search_index.json.
"""

import json
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import Counter

logger = logging.getLogger(__name__)


class SearchService:
    """
    Search service for blog posts with intelligent scoring.
    
    Scoring:
    - Title match: 10 points
    - Tag/keyword match: 2 points per tag
    - Content match: 1 point per occurrence
    """
    
    def __init__(self, data_path: Path, index_path: Path):
        self.data_path = data_path
        self.index_path = index_path
        self.index: List[Dict[str, Any]] = []
    
    def strip_markdown(self, text: str) -> str:
        """Strip markdown formatting from text."""
        if not text:
            return ""
        
        # Remove markdown links [text](url)
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        
        # Remove markdown images ![alt](url)
        text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', r'\1', text)
        
        # Remove headers (##, ###, etc)
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        
        # Remove bold/italic (**text**, *text*, __text__, _text_)
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        
        # Remove code blocks ```code```
        text = re.sub(r'```[^`]*```', '', text, flags=re.DOTALL)
        
        # Remove inline code `code`
        text = re.sub(r'`([^`]+)`', r'\1', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        return text.strip()
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract top keywords from text using word frequency."""
        if not text:
            return []
        
        # Strip markdown first
        clean_text = self.strip_markdown(text.lower())
        
        # Common stop words to ignore
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "up", "about", "into", "through", "during",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should", "may", "might",
            "can", "this", "that", "these", "those", "i", "you", "he", "she", "it",
            "we", "they", "what", "which", "who", "when", "where", "why", "how",
            "as", "if", "each", "than", "then", "so", "such", "both", "all", "any"
        }
        
        # Extract words (alphanumeric + hyphen)
        words = re.findall(r'\b[a-z0-9-]+\b', clean_text)
        
        # Filter stop words and short words
        words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Count word frequency
        word_counts = Counter(words)
        
        # Return top N keywords
        return [word for word, _ in word_counts.most_common(top_n)]
    
    def build_index(self) -> Dict[str, Any]:
        """
        Build search index from blog_posts.json.
        
        Returns:
            Dict with success status and message.
        """
        try:
            logger.info(f"Building search index from {self.data_path}")
            
            # Load blog posts (READ ONLY)
            if not self.data_path.exists():
                raise FileNotFoundError(f"Blog posts file not found: {self.data_path}")
            
            with open(self.data_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
            
            if not isinstance(posts, list):
                raise ValueError("blog_posts.json must contain a list of posts")
            
            # Build index
            self.index = []
            for post in posts:
                # Only index published posts
                if post.get('status') != 'published':
                    continue
                
                # Extract first 200 chars for excerpt (strip markdown)
                content = post.get('content', '')
                clean_content = self.strip_markdown(content)
                excerpt = clean_content[:200] + '...' if len(clean_content) > 200 else clean_content
                
                # Content preview (first 500 chars, markdown stripped)
                content_preview = clean_content[:500] + '...' if len(clean_content) > 500 else clean_content
                
                # Extract keywords from content
                keywords = self.extract_keywords(content)
                
                # Build index entry
                index_entry = {
                    'slug': post.get('slug', ''),
                    'title': post.get('title', ''),
                    'excerpt': excerpt,
                    'category': post.get('category', ''),
                    'tags': post.get('tags', []),
                    'keywords': keywords,
                    'content_preview': content_preview,
                    'published_at': post.get('publishedAt', ''),
                    'hero_image': post.get('heroImage', ''),
                    'read_time': post.get('readTime', 5),
                    'featured': post.get('featured', False)
                }
                
                self.index.append(index_entry)
            
            # Save index to file
            self.save_index()
            
            logger.info(f"Search index built successfully: {len(self.index)} articles indexed")
            return {
                'success': True,
                'message': f'Search index built successfully',
                'articles_indexed': len(self.index),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error building search index: {e}")
            raise
    
    def load_index(self) -> bool:
        """
        Load search index from file.
        
        Returns:
            True if index loaded successfully, False otherwise.
        """
        try:
            if not self.index_path.exists():
                logger.warning(f"Search index not found at {self.index_path}, building new index")
                self.build_index()
                return True
            
            with open(self.index_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.index = data.get('index', [])
            logger.info(f"Search index loaded: {len(self.index)} articles")
            return True
            
        except Exception as e:
            logger.error(f"Error loading search index: {e}")
            return False
    
    def save_index(self) -> bool:
        """
        Save search index to file.
        
        Returns:
            True if index saved successfully, False otherwise.
        """
        try:
            # Create directory if it doesn't exist
            self.index_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save index with metadata
            data = {
                'index': self.index,
                'last_updated': datetime.now().isoformat(),
                'total_articles': len(self.index)
            }
            
            with open(self.index_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Search index saved to {self.index_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving search index: {e}")
            return False
    
    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search blog posts using scoring algorithm.
        
        Scoring:
        - Title match: 10 points
        - Tag/keyword match: 2 points per tag
        - Content match: 1 point per occurrence
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
        
        Returns:
            List of matching articles sorted by score (highest first)
        """
        if not self.index:
            self.load_index()
        
        if not query or not query.strip():
            return []
        
        # Normalize query
        query_lower = query.lower().strip()
        query_words = query_lower.split()
        
        # Score each article
        results = []
        for article in self.index:
            score = 0
            
            # Title match (10 points per word match)
            title_lower = article.get('title', '').lower()
            for word in query_words:
                if word in title_lower:
                    score += 10
            
            # Tag match (2 points per tag match)
            tags_lower = [tag.lower() for tag in article.get('tags', [])]
            for tag in tags_lower:
                for word in query_words:
                    if word in tag:
                        score += 2
            
            # Keyword match (2 points per keyword match)
            keywords_lower = [kw.lower() for kw in article.get('keywords', [])]
            for keyword in keywords_lower:
                for word in query_words:
                    if word in keyword:
                        score += 2
            
            # Category match (5 points)
            category_lower = article.get('category', '').lower()
            for word in query_words:
                if word in category_lower:
                    score += 5
            
            # Content match (1 point per occurrence)
            content_lower = article.get('content_preview', '').lower()
            for word in query_words:
                score += content_lower.count(word)
            
            # Add to results if score > 0
            if score > 0:
                result = article.copy()
                result['search_score'] = score
                results.append(result)
        
        # Sort by score (highest first) and limit
        results.sort(key=lambda x: x['search_score'], reverse=True)
        return results[:limit]


# Global instance
_search_service: Optional[SearchService] = None


def get_search_service() -> SearchService:
    """Get or create global search service instance."""
    global _search_service
    
    if _search_service is None:
        # Determine paths
        base_path = Path(__file__).parent.parent
        data_path = base_path / "data" / "blog_posts.json"
        index_path = base_path / "data" / "search_index.json"
        
        _search_service = SearchService(data_path, index_path)
        
        # Load index on first access
        _search_service.load_index()
    
    return _search_service
