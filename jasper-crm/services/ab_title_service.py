"""
JASPER CRM - A/B Title Testing Service

Generates and tracks multiple title variants for articles to optimize CTR.
Uses AI (DeepSeek/Gemini) to generate creative alternatives.
Tracks impressions, clicks, and calculates statistical significance.
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import math

logger = logging.getLogger(__name__)


class TestStatus(str, Enum):
    """A/B test status"""
    RUNNING = "running"
    COMPLETED = "completed"
    PAUSED = "paused"


@dataclass
class TitleVariant:
    """Single title variant in an A/B test"""
    variant_id: str
    title: str
    impressions: int = 0
    clicks: int = 0
    ctr: float = 0.0
    created_at: str = ""
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        self.update_ctr()
    
    def update_ctr(self):
        """Calculate click-through rate"""
        self.ctr = (self.clicks / self.impressions * 100) if self.impressions > 0 else 0.0


@dataclass
class ABTest:
    """A/B test for article title variants"""
    article_slug: str
    original_title: str
    variants: List[TitleVariant]
    status: TestStatus = TestStatus.RUNNING
    winner_variant_id: Optional[str] = None
    confidence_level: float = 0.0
    created_at: str = ""
    completed_at: Optional[str] = None
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()


class ABTitleService:
    """Service for managing A/B title testing"""
    
    def __init__(self, data_dir: str = "/opt/jasper-crm/data"):
        self.data_dir = Path(data_dir)
        self.data_file = self.data_dir / "ab_tests.json"
        self.tests: Dict[str, ABTest] = {}
        self._load_tests()
    
    def _load_tests(self):
        """Load A/B tests from JSON file"""
        try:
            if self.data_file.exists():
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for slug, test_data in data.items():
                        variants = [TitleVariant(**v) for v in test_data['variants']]
                        test_data['variants'] = variants
                        test_data['status'] = TestStatus(test_data['status'])
                        self.tests[slug] = ABTest(**test_data)
                logger.info(f"Loaded {len(self.tests)} A/B tests")
            else:
                logger.info("No existing A/B tests found, starting fresh")
        except Exception as e:
            logger.error(f"Error loading A/B tests: {e}")
            self.tests = {}
    
    def _save_tests(self):
        """Save A/B tests to JSON file"""
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            data = {}
            for slug, test in self.tests.items():
                test_dict = asdict(test)
                test_dict['status'] = test.status.value
                data[slug] = test_dict
            
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved {len(self.tests)} A/B tests")
        except Exception as e:
            logger.error(f"Error saving A/B tests: {e}")
            raise
    
    async def generate_variants(
        self, 
        article_slug: str, 
        original_title: str,
        num_variants: int = 2,
        ai_model: str = "deepseek"
    ) -> ABTest:
        """Generate title variants using AI"""
        from services.ai_router import ai_router, AITask
        
        # Check if test already exists
        if article_slug in self.tests:
            logger.warning(f"A/B test already exists for {article_slug}")
            return self.tests[article_slug]
        
        # Generate variants using AI
        prompt = f"""Generate {num_variants} alternative titles for this article.

Original title: "{original_title}"

Requirements:
- Each variant should be compelling and click-worthy
- Maintain the core message and accuracy
- Vary the approach (curiosity, benefit-driven, question-based)
- Keep length similar to original
- Output ONLY the titles, one per line, numbered 1-{num_variants}

Format:
1. First Alternative Title
2. Second Alternative Title"""

        try:
            response = await ai_router.route(
                task=AITask.CHAT,
                prompt=prompt,
                max_tokens=200,
                temperature=0.8
            )
            
            # Extract text from response
            response_text = response.get('content', '')
            if not response_text:
                raise ValueError("AI returned empty response")
            
            # Parse titles
            variant_titles = self._parse_variant_titles(response_text, num_variants)
            
            # Create variants
            variants = [TitleVariant(variant_id="original", title=original_title)]
            
            for i, title in enumerate(variant_titles):
                variants.append(TitleVariant(variant_id=f"variant_{i+1}", title=title))
            
            # Create test
            test = ABTest(
                article_slug=article_slug,
                original_title=original_title,
                variants=variants
            )
            
            self.tests[article_slug] = test
            self._save_tests()
            
            logger.info(f"Created A/B test for {article_slug} with {len(variants)} variants")
            return test
            
        except Exception as e:
            logger.error(f"Error generating variants: {e}")
            raise
    
    def _parse_variant_titles(self, ai_response: str, expected_count: int) -> List[str]:
        """Parse AI response to extract variant titles"""
        lines = [line.strip() for line in ai_response.strip().split('\n') if line.strip()]
        titles = []
        
        for line in lines:
            # Remove numbering
            cleaned = line.lstrip('0123456789.)\ ').strip()
            if cleaned and len(cleaned) > 10:
                titles.append(cleaned)
        
        return titles[:expected_count]
    
    def get_test(self, article_slug: str) -> Optional[ABTest]:
        """Get A/B test by article slug"""
        return self.tests.get(article_slug)
    
    def get_variant_for_user(self, article_slug: str) -> Optional[TitleVariant]:
        """Get variant to show (round-robin distribution)"""
        test = self.tests.get(article_slug)
        if not test or test.status != TestStatus.RUNNING:
            return None
        
        return min(test.variants, key=lambda v: v.impressions)
    
    def record_impression(self, article_slug: str, variant_id: str) -> bool:
        """Record impression"""
        test = self.tests.get(article_slug)
        if not test:
            return False
        
        for variant in test.variants:
            if variant.variant_id == variant_id:
                variant.impressions += 1
                variant.update_ctr()
                self._save_tests()
                return True
        return False
    
    def record_click(self, article_slug: str, variant_id: str) -> bool:
        """Record click"""
        test = self.tests.get(article_slug)
        if not test:
            return False
        
        for variant in test.variants:
            if variant.variant_id == variant_id:
                variant.clicks += 1
                variant.update_ctr()
                self._save_tests()
                self._check_for_winner(test)
                return True
        return False
    
    def get_stats(self, article_slug: str) -> Optional[Dict[str, Any]]:
        """Get test statistics"""
        test = self.tests.get(article_slug)
        if not test:
            return None
        
        total_impressions = sum(v.impressions for v in test.variants)
        total_clicks = sum(v.clicks for v in test.variants)
        overall_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
        
        variant_stats = [{
            "variant_id": v.variant_id,
            "title": v.title,
            "impressions": v.impressions,
            "clicks": v.clicks,
            "ctr": round(v.ctr, 2),
            "is_winner": v.variant_id == test.winner_variant_id
        } for v in test.variants]
        
        return {
            "article_slug": article_slug,
            "original_title": test.original_title,
            "status": test.status.value,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "overall_ctr": round(overall_ctr, 2),
            "variants": variant_stats,
            "winner_variant_id": test.winner_variant_id,
            "confidence_level": round(test.confidence_level, 2),
            "created_at": test.created_at,
            "completed_at": test.completed_at
        }
    
    def _check_for_winner(self, test: ABTest):
        """Check if we can declare statistical winner"""
        MIN_IMPRESSIONS = 100
        CONFIDENCE_THRESHOLD = 0.95
        
        variants_with_data = [v for v in test.variants if v.impressions >= MIN_IMPRESSIONS]
        if len(variants_with_data) < 2:
            return
        
        best_variant = max(test.variants, key=lambda v: v.ctr)
        max_confidence = 0.0
        
        for variant in test.variants:
            if variant.variant_id == best_variant.variant_id:
                continue
            
            confidence = self._calculate_statistical_significance(
                best_variant.clicks, best_variant.impressions,
                variant.clicks, variant.impressions
            )
            max_confidence = max(max_confidence, confidence)
        
        if max_confidence >= CONFIDENCE_THRESHOLD:
            test.winner_variant_id = best_variant.variant_id
            test.confidence_level = max_confidence * 100
            test.status = TestStatus.COMPLETED
            test.completed_at = datetime.utcnow().isoformat()
            logger.info(f"Winner: {test.article_slug}/{best_variant.variant_id}")
    
    def _calculate_statistical_significance(
        self, clicks_a: int, impressions_a: int,
        clicks_b: int, impressions_b: int
    ) -> float:
        """Calculate significance using two-proportion z-test"""
        if impressions_a == 0 or impressions_b == 0:
            return 0.0
        
        p_a = clicks_a / impressions_a
        p_b = clicks_b / impressions_b
        p_pool = (clicks_a + clicks_b) / (impressions_a + impressions_b)
        se = math.sqrt(p_pool * (1 - p_pool) * (1/impressions_a + 1/impressions_b))
        
        if se == 0:
            return 0.0
        
        z = abs(p_a - p_b) / se
        
        if z >= 1.96:
            return 0.95
        elif z >= 1.645:
            return 0.90
        elif z >= 1.28:
            return 0.80
        else:
            return min(z / 1.96 * 0.95, 0.79)
    
    def list_all_tests(self) -> List[Dict[str, Any]]:
        """List all tests"""
        return [self.get_stats(slug) for slug in self.tests.keys()]


# Singleton
ab_title_service = ABTitleService()
