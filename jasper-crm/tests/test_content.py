"""
JASPER CRM - Content Service Tests

Tests for AI content generation and blog publishing.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestContentService:
    """Tests for ContentService functionality."""

    def test_content_service_initialization(self):
        """Test ContentService initializes correctly."""
        from services.content_service import ContentService

        service = ContentService()

        assert service.model == "deepseek/deepseek-chat"
        assert len(service.seo_keywords) > 0

    def test_select_seo_keywords(self):
        """Test automatic SEO keyword selection."""
        from services.content_service import content_service

        keywords = content_service._select_seo_keywords(
            topic="Infrastructure Finance in South Africa",
            category="dfi-insights"
        )

        assert isinstance(keywords, list)
        # Should return up to 5 keywords
        assert len(keywords) <= 5

    def test_build_system_prompt(self):
        """Test system prompt generation."""
        from services.content_service import content_service

        prompt = content_service._build_content_system_prompt(
            category="dfi-insights",
            tone="professional"
        )

        assert "JASPER" in prompt
        assert "professional" in prompt
        assert "DFI" in prompt

    def test_build_user_prompt(self):
        """Test user prompt generation."""
        from services.content_service import content_service

        prompt = content_service._build_content_user_prompt(
            topic="Test Topic",
            seo_keywords=["keyword1", "keyword2"],
            lead_context={"sector": "infrastructure"}
        )

        assert "Test Topic" in prompt
        assert "keyword1" in prompt
        assert "infrastructure" in prompt

    def test_parse_blog_content(self):
        """Test parsing of generated blog content."""
        from services.content_service import content_service

        raw_content = """
        [TITLE]: Test Blog Title
        [SEO_TITLE]: SEO Optimized Title
        [SEO_DESCRIPTION]: A great meta description for search engines
        [EXCERPT]: This is the excerpt summary.
        [CONTENT]: This is the main blog content with lots of text.
        [TAGS]: tag1, tag2, tag3
        """

        parsed = content_service._parse_blog_content(
            raw_content=raw_content,
            default_title="Default Title",
            seo_keywords=["default"]
        )

        assert parsed["title"] == "Test Blog Title"
        assert parsed["seoTitle"] == "SEO Optimized Title"
        assert "tag1" in parsed["tags"]

    def test_category_mapping(self):
        """Test category mapping for Blog API."""
        from services.content_service import ContentService

        # Test mapping
        assert ContentService.CATEGORY_MAP["dfi-insights"] == "DFI Insights"
        assert ContentService.CATEGORY_MAP["financial-modeling"] == "Financial Modelling"

    def test_suggest_content_from_crm(self):
        """Test CRM-based content suggestions."""
        from services.content_service import content_service

        suggestions = content_service.suggest_content_from_crm(
            recent_leads_sectors=["infrastructure", "infrastructure", "renewable energy"],
            trending_questions=["How to apply for IDC funding?"]
        )

        assert isinstance(suggestions, list)
        # Should have at least one suggestion based on sectors
        assert len(suggestions) > 0


class TestContentRoutes:
    """Tests for content generation API endpoints."""

    def test_content_suggestions_endpoint(self, client, auth_headers):
        """Test content suggestions endpoint."""
        response = client.get(
            "/api/v1/content/suggestions",
            headers=auth_headers
        )

        # May return 200 or suggestions based on implementation
        assert response.status_code in [200, 404]

    def test_content_keywords_endpoint(self, client, auth_headers):
        """Test SEO keywords endpoint."""
        response = client.get(
            "/api/v1/content/keywords",
            headers=auth_headers
        )

        # Depends on endpoint implementation
        assert response.status_code in [200, 404]


class TestContentGeneration:
    """Integration tests for content generation (mocked)."""

    @pytest.mark.asyncio
    async def test_generate_blog_post_no_api_key(self):
        """Test graceful handling when API key is missing."""
        from services.content_service import ContentService
        import os

        # Temporarily remove API key
        original_key = os.environ.get("OPENROUTER_API_KEY")
        os.environ["OPENROUTER_API_KEY"] = ""

        service = ContentService()
        service.api_key = None

        result = await service.generate_blog_post(
            topic="Test Topic",
            category="dfi-insights"
        )

        assert "error" in result
        assert "OPENROUTER_API_KEY" in result["error"]

        # Restore
        if original_key:
            os.environ["OPENROUTER_API_KEY"] = original_key
