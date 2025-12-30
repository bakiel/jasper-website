"""
JASPER CRM - Competitor Content Gap Analysis Service
Uses Gemini with Google Search grounding to analyze competitor content and find gaps
"""

import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple

from models.competitor import (
    CompetitorSource,
    PriorityLevel,
    TopicSuggestion,
    ContentGap,
    CompetitorInsight,
    CompetitorAnalysisResult,
)
from services.ai_router import AIRouter, AITask

logger = logging.getLogger(__name__)


class CompetitorAnalysisService:
    """
    Competitor content gap analysis service
    
    Features:
    - Analyze competitor content using Google Search grounding
    - Identify content gaps and opportunities
    - Generate prioritized topic suggestions
    - Score topics by volume, competition, and relevance
    - Cache results for 7 days
    """
    
    # Competitor domain mapping
    COMPETITOR_DOMAINS = {
        CompetitorSource.DELOITTE_AFRICA: "www2.deloitte.com/za/en/pages/about-deloitte/topics/africa.html",
        CompetitorSource.MCKINSEY_AFRICA: "www.mckinsey.com/featured-insights/africa",
        CompetitorSource.PWC_AFRICA: "www.pwc.co.za/en/insights.html",
        CompetitorSource.KPMG_AFRICA: "kpmg.com/africa/en/home/insights.html",
        CompetitorSource.IFC_BLOG: "www.ifc.org/en/insights-reports/2024",
        CompetitorSource.AFDB_NEWS: "www.afdb.org/en/news-and-events",
    }
    
    # Competitor names
    COMPETITOR_NAMES = {
        CompetitorSource.DELOITTE_AFRICA: "Deloitte Africa",
        CompetitorSource.MCKINSEY_AFRICA: "McKinsey Africa",
        CompetitorSource.PWC_AFRICA: "PwC Africa",
        CompetitorSource.KPMG_AFRICA: "KPMG Africa",
        CompetitorSource.IFC_BLOG: "IFC Blog",
        CompetitorSource.AFDB_NEWS: "AfDB News",
    }
    
    def __init__(self, data_dir: str = "/opt/jasper-crm/data"):
        self.data_dir = Path(data_dir)
        self.data_file = self.data_dir / "competitor_analysis.json"
        self.ai_router = AIRouter()
        
        # Ensure data directory exists
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Load existing analyses
        self.analyses = self._load_analyses()
        
        logger.info("CompetitorAnalysisService initialized")
    
    def _load_analyses(self) -> Dict[str, Any]:
        """Load analyses from JSON file"""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    # Parse datetime strings
                    from datetime import datetime
                    for analysis_id, analysis in data.items():
                        for date_field in ['analyzed_at', 'cache_expires_at']:
                            if date_field in analysis and isinstance(analysis[date_field], str):
                                analysis[date_field] = datetime.fromisoformat(analysis[date_field].replace(' ', 'T'))
                    return data
            except Exception as e:
                logger.error(f"Error loading analyses: {e}")
                return {}
        return {}
    
    def _save_analyses(self):
        """Save analyses to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.analyses, f, indent=2, default=lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x))
        except Exception as e:
            logger.error(f"Error saving analyses: {e}")
    
    def _generate_analysis_id(self, keyword: str) -> str:
        """Generate unique analysis ID"""
        timestamp = datetime.now().strftime("%Y%m%d")
        hash_str = hashlib.md5(f"{keyword}{datetime.now().isoformat()}".encode()).hexdigest()[:8]
        return f"comp_{timestamp}_{hash_str}"
    
    def _get_cached_analysis(self, keyword: str) -> Optional[CompetitorAnalysisResult]:
        """Get cached analysis if not expired (7 days)"""
        for analysis_id, analysis_data in self.analyses.items():
            if analysis_data.get("keyword", "").lower() == keyword.lower():
                cache_expires = datetime.fromisoformat(analysis_data.get("cache_expires_at"))
                if datetime.now() < cache_expires:
                    logger.info(f"Cache hit for keyword: {keyword}")
                    return CompetitorAnalysisResult(**analysis_data)
        return None
    
    async def analyze_competitors(
        self,
        keyword: str,
        competitors: Optional[List[CompetitorSource]] = None,
        max_results: int = 10,
        include_search_data: bool = True
    ) -> CompetitorAnalysisResult:
        """
        Analyze competitors for a keyword/topic and identify content gaps
        
        Args:
            keyword: Topic or keyword to analyze
            competitors: Specific competitors to analyze (default: all)
            max_results: Max topic suggestions to return
            include_search_data: Include Google Search grounding
            
        Returns:
            CompetitorAnalysisResult with gaps and suggestions
        """
        # Check cache first
        cached = self._get_cached_analysis(keyword)
        if cached:
            return cached
        
        # Default to all competitors
        if not competitors:
            competitors = list(CompetitorSource)
            competitors = [c for c in competitors if c != CompetitorSource.OTHER]
        
        logger.info(f"Analyzing {len(competitors)} competitors for keyword: {keyword}")
        
        # Step 1: Analyze each competitor
        competitor_insights = []
        for comp in competitors:
            insight = await self._analyze_single_competitor(keyword, comp, include_search_data)
            if insight:
                competitor_insights.append(insight)
        
        # Step 2: Identify content gaps
        content_gaps = await self._identify_content_gaps(keyword, competitor_insights)
        
        # Step 3: Generate topic suggestions
        topic_suggestions = await self._generate_topic_suggestions(
            keyword,
            competitor_insights,
            content_gaps,
            max_results
        )
        
        # Step 4: Generate summary
        summary = await self._generate_summary(keyword, competitor_insights, content_gaps, topic_suggestions)
        
        # Create result
        analysis_id = self._generate_analysis_id(keyword)
        result = CompetitorAnalysisResult(
            id=analysis_id,
            keyword=keyword,
            analyzed_at=datetime.now(),
            competitors_analyzed=competitor_insights,
            content_gaps=content_gaps,
            topic_suggestions=topic_suggestions,
            summary=summary,
            cache_expires_at=datetime.now() + timedelta(days=7)
        )
        
        # Save to cache
        self.analyses[analysis_id] = result.dict()
        self._save_analyses()
        
        logger.info(f"Analysis complete: {len(content_gaps)} gaps, {len(topic_suggestions)} suggestions")
        
        return result
    
    async def _analyze_single_competitor(
        self,
        keyword: str,
        competitor: CompetitorSource,
        include_search_data: bool
    ) -> Optional[CompetitorInsight]:
        """Analyze a single competitor using Google Search grounding"""
        try:
            competitor_name = self.COMPETITOR_NAMES.get(competitor, str(competitor))
            domain = self.COMPETITOR_DOMAINS.get(competitor)
            
            # Build search query
            search_query = f"{keyword} site:{domain}" if domain else f"{keyword} {competitor_name}"
            
            # Use Gemini with Google Search grounding
            prompt = f"""
Analyze {competitor_name}'s content coverage for the topic: "{keyword}"

Based on search results, provide a JSON response with:
{{
  "topics_covered": [list of specific topics they cover],
  "content_strengths": [what they do well - be specific],
  "content_weaknesses": [gaps, weaknesses, or areas they miss],
  "estimated_authority": "high/medium/low"
}}

Focus on:
1. What specific aspects of "{keyword}" they cover
2. Quality and depth of their coverage
3. Practical vs theoretical approach
4. African market focus (critical for JASPER)
5. What they DON'T cover that would be valuable
"""
            
            response_dict = await self.ai_router.route(
                task=AITask.RESEARCH,
                prompt=prompt,
                enable_search=True,
                max_tokens=2000
            )
            response = response_dict.get("content", "")
            
            # Parse JSON response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                
                return CompetitorInsight(
                    competitor_name=competitor_name,
                    competitor_source=competitor,
                    topics_covered=data.get("topics_covered", []),
                    content_strengths=data.get("content_strengths", []),
                    content_weaknesses=data.get("content_weaknesses", []),
                    estimated_authority=data.get("estimated_authority", "medium")
                )
            
            logger.warning(f"Could not parse competitor analysis for {competitor_name}")
            return None
            
        except Exception as e:
            logger.error(f"Error analyzing competitor {competitor}: {e}")
            return None
    
    async def _identify_content_gaps(
        self,
        keyword: str,
        competitor_insights: List[CompetitorInsight]
    ) -> List[ContentGap]:
        """Identify content gaps based on competitor analysis"""
        try:
            # Build context from competitor insights
            competitor_summary = "\n\n".join([
                f"{insight.competitor_name}:\n"
                f"- Topics: {', '.join(insight.topics_covered[:5])}\n"
                f"- Strengths: {', '.join(insight.content_strengths[:3])}\n"
                f"- Weaknesses: {', '.join(insight.content_weaknesses[:3])}"
                for insight in competitor_insights
            ])
            
            prompt = f"""
Based on competitor analysis for "{keyword}", identify content gaps for JASPER Financial Architecture.

COMPETITORS:
{competitor_summary}

JASPER CONTEXT:
- DFI funding advisory in Africa
- Focus: Practical, actionable guidance
- Target: African businesses seeking development finance
- USP: Demystifying complex DFI processes

Provide JSON array of content gaps:
[
  {{
    "gap_topic": "specific topic area with gap",
    "competitors_covering": ["list of competitors covering this"],
    "jasper_coverage": "none/partial/full",
    "opportunity_type": "new/improve/differentiate",
    "gap_severity": "minor/moderate/major",
    "estimated_traffic_potential": "monthly traffic estimate"
  }}
]

Find 5-10 high-value gaps where JASPER can provide unique African-focused, practical value.
"""
            
            response_dict = await self.ai_router.route(
                task=AITask.RESEARCH,
                prompt=prompt,
                enable_search=False,
                max_tokens=2000
            )
            response = response_dict.get("content", "")
            
            # Parse JSON array
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                gaps_data = json.loads(json_match.group())
                return [ContentGap(**gap) for gap in gaps_data]
            
            return []
            
        except Exception as e:
            logger.error(f"Error identifying content gaps: {e}")
            return []
    
    async def _generate_topic_suggestions(
        self,
        keyword: str,
        competitor_insights: List[CompetitorInsight],
        content_gaps: List[ContentGap],
        max_results: int
    ) -> List[TopicSuggestion]:
        """Generate prioritized topic suggestions based on gaps"""
        try:
            gaps_summary = "\n".join([
                f"- {gap.gap_topic} (Severity: {gap.gap_severity}, Type: {gap.opportunity_type})"
                for gap in content_gaps[:10]
            ])
            
            prompt = f"""
Generate {max_results} high-priority content topic suggestions for JASPER based on these gaps:

KEYWORD: {keyword}

IDENTIFIED GAPS:
{gaps_summary}

For each topic, provide JSON:
{{
  "topic": "specific article/content topic",
  "priority_score": 0-100 (higher = better opportunity),
  "priority_level": "critical/high/medium/low",
  "estimated_search_volume": "1K-10K format",
  "competition_level": "low/medium/high",
  "relevance_to_jasper": 0.0-1.0,
  "gap_rationale": "why this is a gap",
  "suggested_angle": "unique JASPER angle (African focus, practical how-to)",
  "related_keywords": ["keyword1", "keyword2"]
}}

Return JSON array with {max_results} topics, sorted by priority_score DESC.
Focus on topics that:
1. Have search demand (estimated volume)
2. Low-medium competition
3. High relevance to African DFI funding
4. Actionable/practical angles JASPER can own
"""
            
            response_dict = await self.ai_router.route(
                task=AITask.RESEARCH,
                prompt=prompt,
                enable_search=True,
                max_tokens=2000
            )
            response = response_dict.get("content", "")
            
            # Parse JSON array
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                topics_data = json.loads(json_match.group())
                return [TopicSuggestion(**topic) for topic in topics_data[:max_results]]
            
            return []
            
        except Exception as e:
            logger.error(f"Error generating topic suggestions: {e}")
            return []
    
    async def _generate_summary(
        self,
        keyword: str,
        competitor_insights: List[CompetitorInsight],
        content_gaps: List[ContentGap],
        topic_suggestions: List[TopicSuggestion]
    ) -> str:
        """Generate executive summary of analysis"""
        try:
            prompt = f"""
Write a 2-3 sentence executive summary of this competitor content gap analysis:

KEYWORD: {keyword}
COMPETITORS ANALYZED: {len(competitor_insights)}
GAPS FOUND: {len(content_gaps)}
TOPIC SUGGESTIONS: {len(topic_suggestions)}

TOP GAPS:
{chr(10).join([f"- {gap.gap_topic}" for gap in content_gaps[:5]])}

TOP SUGGESTIONS:
{chr(10).join([f"- {sug.topic} (Priority: {sug.priority_level})" for sug in topic_suggestions[:5]])}

Summary should highlight:
1. Overall opportunity size
2. Key gap areas
3. Recommended focus
"""
            
            response_dict = await self.ai_router.route(
                task=AITask.SUMMARY,
                prompt=prompt,
                enable_search=False,
                max_tokens=500
            )
            response = response_dict.get("content", "")
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"Analysis of {len(competitor_insights)} competitors for '{keyword}' identified {len(content_gaps)} content gaps and generated {len(topic_suggestions)} topic suggestions."
    
    def get_gaps(self, analysis_id: Optional[str] = None) -> List[ContentGap]:
        """Get content gaps from an analysis"""
        if analysis_id:
            analysis_data = self.analyses.get(analysis_id)
            if analysis_data:
                return [ContentGap(**gap) for gap in analysis_data.get("content_gaps", [])]
        else:
            # Return gaps from most recent analysis
            if self.analyses:
                latest = max(self.analyses.items(), key=lambda x: x[1].get("analyzed_at", "1970-01-01T00:00:00"))
                return [ContentGap(**gap) for gap in latest[1].get("content_gaps", [])]
        return []
    
    def get_topic_suggestions(
        self,
        analysis_id: Optional[str] = None,
        min_priority_score: float = 0.0
    ) -> List[TopicSuggestion]:
        """Get topic suggestions from an analysis"""
        if analysis_id:
            analysis_data = self.analyses.get(analysis_id)
            if analysis_data:
                suggestions = [TopicSuggestion(**sug) for sug in analysis_data.get("topic_suggestions", [])]
                return [s for s in suggestions if s.priority_score >= min_priority_score]
        else:
            # Return suggestions from most recent analysis
            if self.analyses:
                latest = max(self.analyses.items(), key=lambda x: x[1].get("analyzed_at", "1970-01-01T00:00:00"))
                suggestions = [TopicSuggestion(**sug) for sug in latest[1].get("topic_suggestions", [])]
                return [s for s in suggestions if s.priority_score >= min_priority_score]
        return []
    
    def generate_gap_report(
        self,
        analysis_id: Optional[str] = None,
        include_action_plan: bool = True
    ) -> Dict[str, Any]:
        """Generate comprehensive gap analysis report"""
        if analysis_id:
            analysis_data = self.analyses.get(analysis_id)
        else:
            # Use most recent
            if self.analyses:
                latest = max(self.analyses.items(), key=lambda x: x[1].get("analyzed_at", "1970-01-01T00:00:00"))
                analysis_id = latest[0]
                analysis_data = latest[1]
            else:
                return {"error": "No analyses found"}
        
        if not analysis_data:
            return {"error": "Analysis not found"}
        
        # Parse dates from JSON strings
        from datetime import datetime
        if isinstance(analysis_data.get('analyzed_at'), str):
            analysis_data['analyzed_at'] = datetime.fromisoformat(analysis_data['analyzed_at'])
        if isinstance(analysis_data.get('cache_expires_at'), str):
            analysis_data['cache_expires_at'] = datetime.fromisoformat(analysis_data['cache_expires_at'])
        result = CompetitorAnalysisResult(**analysis_data)
        
        report = {
            "analysis_id": analysis_id,
            "keyword": result.keyword,
            "analyzed_at": str(result.analyzed_at),
            "competitors_analyzed": len(result.competitors_analyzed),
            "total_gaps": len(result.content_gaps),
            "total_suggestions": len(result.topic_suggestions),
            "summary": result.summary,
            "competitor_breakdown": [
                {
                    "name": comp.competitor_name,
                    "topics_count": len(comp.topics_covered),
                    "authority": comp.estimated_authority,
                    "key_strengths": comp.content_strengths[:3],
                    "key_weaknesses": comp.content_weaknesses[:3]
                }
                for comp in result.competitors_analyzed
            ],
            "top_gaps": [
                {
                    "topic": gap.gap_topic,
                    "severity": gap.gap_severity,
                    "opportunity": gap.opportunity_type,
                    "traffic_potential": gap.estimated_traffic_potential
                }
                for gap in sorted(
                    result.content_gaps,
                    key=lambda x: {"major": 3, "moderate": 2, "minor": 1}.get(x.gap_severity, 0),
                    reverse=True
                )[:10]
            ],
            "priority_topics": [
                {
                    "topic": sug.topic,
                    "priority_score": sug.priority_score,
                    "priority_level": sug.priority_level,
                    "angle": sug.suggested_angle,
                    "keywords": sug.related_keywords[:5]
                }
                for sug in sorted(result.topic_suggestions, key=lambda x: x.priority_score, reverse=True)[:10]
            ]
        }
        
        if include_action_plan:
            report["action_plan"] = self._generate_action_plan(result)
        
        return report
    
    def _generate_action_plan(self, result: CompetitorAnalysisResult) -> Dict[str, Any]:
        """Generate recommended action plan"""
        critical_topics = [s for s in result.topic_suggestions if s.priority_level == PriorityLevel.CRITICAL]
        high_topics = [s for s in result.topic_suggestions if s.priority_level == PriorityLevel.HIGH]
        
        return {
            "immediate_actions": [
                f"Create content for: {topic.topic}"
                for topic in critical_topics[:3]
            ],
            "short_term_pipeline": [
                f"{topic.topic} (Est. volume: {topic.estimated_search_volume})"
                for topic in high_topics[:5]
            ],
            "competitive_advantages": [
                "African market focus and practical guidance",
                "DFI relationship expertise",
                "Real case studies and templates"
            ],
            "recommended_content_types": [
                "How-to guides and templates",
                "Case studies from African projects",
                "DFI application walkthrough videos",
                "Sector-specific funding guides"
            ]
        }


# Singleton instance
competitor_analysis_service = CompetitorAnalysisService()
