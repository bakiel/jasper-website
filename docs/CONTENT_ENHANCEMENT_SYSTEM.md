# JASPER Content Enhancement System - Feature Documentation

*Last Updated: 2025-12-29*

This document provides comprehensive documentation of JASPER's content enhancement features built to improve SEO, engagement, and content quality.

---

## Table of Contents
1. [Citation & Footnotes Service](#citation--footnotes-service)
2. [A/B Title Testing Service](#ab-title-testing-service)
3. [Competitor Gap Analysis Service](#competitor-gap-analysis-service)
4. [Email Capture Popup](#email-capture-popup)
5. [Site Search](#site-search)
6. [Internal Link Builder](#internal-link-builder)
7. [API Reference](#api-reference)
8. [Integration Guide](#integration-guide)

---

## Citation & Footnotes Service

**Location:** `/opt/jasper-crm/services/citation_service.py`
**Routes:** `/opt/jasper-crm/routes/citations.py`

### Overview
AI-powered citation management using Gemini with Google Search grounding. Automatically finds credible sources and adds citations to articles.

### Features
- Analyze articles for citation opportunities
- Find authoritative sources using Google Search grounding
- Add inline citations or footnotes
- Maintain source registry with 7-day caching
- Support for multiple citation styles

### Citation Styles

| Style | Format | Example |
|-------|--------|---------|
| `inline` | According to [Source](url)... | "According to [IFC](https://ifc.org/report), climate investments..." |
| `footnote` | claim^[1] with reference list | "Climate investments reached $100B^[1]" |

### Source Registry
The service maintains a registry of trusted sources:
- **DFI Sources:** IFC, BII, AfDB, DFC, Proparco
- **Research:** McKinsey, BCG, Deloitte Africa
- **Data:** World Bank, IMF, UN agencies
- **Media:** Financial Times, Bloomberg, Reuters

### API Endpoints

```bash
# Analyze article for citation opportunities
GET /api/v1/citations/{slug}/analyze

# Add citations to article
POST /api/v1/citations/{slug}/add
{
  "style": "inline",  # or "footnote"
  "max_citations": 5,
  "sources_preference": ["ifc", "afdb", "world_bank"]
}

# Get source registry
GET /api/v1/citations/sources

# Search sources
GET /api/v1/citations/sources/search?q=climate
```

### Usage Example
```python
# Analyze an article
response = await client.get("/api/v1/citations/dfi-climate-smart-agriculture/analyze")
# Returns: opportunities for adding citations

# Add citations
response = await client.post("/api/v1/citations/dfi-climate-smart-agriculture/add", json={
    "style": "inline",
    "max_citations": 5
})
# Returns: updated content with citations
```

---

## A/B Title Testing Service

**Location:** `/opt/jasper-crm/services/ab_title_service.py`
**Routes:** `/opt/jasper-crm/routes/ab_titles.py`
**Data:** `/opt/jasper-crm/data/ab_tests.json`

### Overview
Statistical A/B testing for article titles with automatic variant generation, impression/click tracking, and significance calculation.

### Features
- AI-generated title variants using Gemini
- Multi-variant testing (A, B, C)
- Statistical significance calculation (two-proportion z-test)
- 95% confidence threshold
- Automatic winner selection
- Impression and click tracking

### Test States

| State | Description |
|-------|-------------|
| `active` | Test running, collecting data |
| `completed` | Significance reached, winner selected |
| `insufficient_data` | Not enough impressions yet |

### Statistical Method
- **Algorithm:** Two-proportion z-test
- **Confidence Level:** 95% (z-score > 1.96)
- **Minimum Impressions:** 100 per variant
- **Metrics:** Click-through rate (CTR)

### API Endpoints

```bash
# Generate variants for an article
POST /api/v1/ab-titles/generate/{slug}
{
  "variant_count": 3,
  "optimize_for": "clicks"  # or "engagement"
}

# Get variant for display (randomly selects)
GET /api/v1/ab-titles/variants/{slug}

# Record impression
POST /api/v1/ab-titles/impression
{
  "slug": "article-slug",
  "variant_id": "variant_a"
}

# Record click
POST /api/v1/ab-titles/click
{
  "slug": "article-slug",
  "variant_id": "variant_a"
}

# Get test statistics
GET /api/v1/ab-titles/stats/{slug}

# List all tests
GET /api/v1/ab-titles/tests

# Health check
GET /api/v1/ab-titles/health
```

### Response Example
```json
{
  "status": "healthy",
  "service": "ab-title-testing",
  "total_tests": 2
}
```

### Frontend Integration
```typescript
// Get variant to display
const { variant_id, title } = await fetch('/api/v1/ab-titles/variants/my-article').then(r => r.json());

// Track impression on page load
await fetch('/api/v1/ab-titles/impression', {
  method: 'POST',
  body: JSON.stringify({ slug: 'my-article', variant_id })
});

// Track click on title click
await fetch('/api/v1/ab-titles/click', {
  method: 'POST',
  body: JSON.stringify({ slug: 'my-article', variant_id })
});
```

---

## Competitor Gap Analysis Service

**Location:** `/opt/jasper-crm/services/competitor_analysis_service.py`
**Routes:** `/opt/jasper-crm/routes/competitor_analysis.py`
**Data:** `/opt/jasper-crm/data/competitor_analysis.json`

### Overview
AI-powered competitor content analysis using Gemini with Google Search grounding. Identifies content gaps and generates prioritized topic suggestions.

### Features
- Analyze competitor content coverage
- Identify content gaps and opportunities
- Generate prioritized topic suggestions
- Priority scoring based on volume, competition, relevance
- 7-day caching for expensive analyses
- Action plan generation

### Competitor Sources Analyzed

| Source | Domain |
|--------|--------|
| Deloitte Africa | www2.deloitte.com/za |
| McKinsey Africa | www.mckinsey.com/featured-insights/africa |
| PwC Africa | www.pwc.co.za |
| KPMG Africa | kpmg.com/africa |
| IFC Blog | www.ifc.org |
| AfDB News | www.afdb.org |

### Priority Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| `critical` | 85-100 | High volume, low competition, highly relevant |
| `high` | 70-84 | Good opportunity |
| `medium` | 50-69 | Moderate opportunity |
| `low` | 25-49 | Low opportunity |
| `ignore` | 0-24 | Not worth pursuing |

### API Endpoints

```bash
# Analyze competitors for a keyword
POST /api/v1/competitor/analyze
{
  "keyword": "development finance africa",
  "competitors": ["deloitte_africa", "mckinsey_africa"],
  "max_results": 10,
  "include_search_data": true
}

# Get content gaps from latest analysis
GET /api/v1/competitor/gaps
GET /api/v1/competitor/gaps?analysis_id=comp_20251229_abc123

# Get topic suggestions
POST /api/v1/competitor/suggest-topics?min_priority_score=70

# Get full gap report with action plan
GET /api/v1/competitor/report?include_action_plan=true

# Health check
GET /api/v1/competitor/health
```

### Response Example (Gaps)
```json
{
  "success": true,
  "message": "Retrieved 8 content gaps",
  "total_gaps": 8,
  "gaps": [
    {
      "gap_topic": "Practical Guidance on Navigating DFI Governance and Risk Management",
      "competitors_covering": ["Deloitte Africa", "McKinsey Africa"],
      "jasper_coverage": "none",
      "opportunity_type": "new",
      "gap_severity": "major",
      "estimated_traffic_potential": "500-1000"
    }
  ]
}
```

### Report Output Structure
```json
{
  "analysis_id": "comp_20251229_abc123",
  "keyword": "development finance africa",
  "competitors_analyzed": 6,
  "total_gaps": 8,
  "total_suggestions": 10,
  "summary": "Analysis identified major gaps in practical DFI guidance...",
  "competitor_breakdown": [...],
  "top_gaps": [...],
  "priority_topics": [...],
  "action_plan": {
    "immediate_actions": ["Create content for X", "Create content for Y"],
    "short_term_pipeline": [...],
    "competitive_advantages": [...],
    "recommended_content_types": [...]
  }
}
```

---

## Email Capture Popup

**Location:** `/jasper-marketing/src/components/EmailCapturePopup.tsx`

### Overview
Smart email capture modal that appears when users scroll 60% down an article. Category-aware messaging with CRM integration.

### Features
- Scroll-triggered popup (configurable threshold)
- Category-aware messaging (DFI Insights, Climate Finance, default)
- 7-day LocalStorage cooldown (configurable)
- Integrated with CRM newsletter intake endpoint
- Success animation with confirmation
- Accessible (ARIA labels, ESC to close)
- JASPER brand styling (Navy/Emerald)

### Props Interface
```typescript
interface EmailCapturePopupProps {
  category?: 'dfi-insights' | 'climate-finance' | 'default';
  scrollThreshold?: number;      // Default: 60
  storageKey?: string;           // Default: 'jasper_email_popup'
  cooldownDays?: number;         // Default: 7
  apiEndpoint?: string;          // Default: CRM intake endpoint
}
```

### Category Messaging

| Category | Headline | Subhead |
|----------|----------|---------|
| `dfi-insights` | Get DFI Funding Insights | Weekly analysis of IFC, BII, and AfDB investment trends |
| `climate-finance` | Climate Finance Newsletter | Green funding opportunities and ESG compliance updates |
| `default` | JASPER Insights | Expert analysis on African project finance and DFI funding |

### CRM Integration
```typescript
const DEFAULT_API_ENDPOINT = 'https://api.jasperfinance.org/api/v1/intake/newsletter';

// Submission payload
{
  name: string,
  email: string,
  source_page: string,  // Current URL path
  category: string      // dfi-insights, climate-finance, etc.
}
```

### Usage
```tsx
import { EmailCapturePopup } from '@/components/EmailCapturePopup';

// In article page
<EmailCapturePopup category="dfi-insights" scrollThreshold={60} />
```

---

## Site Search

**Backend:** `/opt/jasper-crm/services/search_service.py`
**Frontend:** `/jasper-marketing/src/components/SiteSearch.tsx`

### Overview
Full-text search across JASPER articles with filtering, suggestions, and analytics.

### Features
- Full-text search across titles, content, excerpts
- Category and tag filtering
- Search suggestions/autocomplete
- Recent searches tracking
- Search analytics

### API Endpoints
```bash
# Search articles
GET /api/v1/search?q=climate&category=dfi-insights&limit=10

# Get search suggestions
GET /api/v1/search/suggestions?q=cli

# Get popular searches
GET /api/v1/search/popular
```

### Frontend Component
```tsx
import { SiteSearch } from '@/components/SiteSearch';

<SiteSearch
  placeholder="Search articles..."
  onResultClick={(article) => router.push(`/insights/${article.slug}`)}
/>
```

---

## Internal Link Builder

**Location:** `/opt/jasper-crm/services/link_builder_service.py`
**Routes:** `/opt/jasper-crm/routes/link_builder.py`

### Overview
AI-powered internal linking suggestions to improve SEO and user engagement.

### Features
- Analyze article content for linking opportunities
- Suggest relevant internal links
- Anchor text optimization
- Link placement recommendations

### API Endpoints
```bash
# Get link suggestions for an article
GET /api/v1/link-builder/suggest?slug=my-article

# Add internal links to article
POST /api/v1/link-builder/add
{
  "slug": "my-article",
  "links": [
    {"anchor": "DFI funding", "target_slug": "dfi-guide"}
  ]
}
```

---

## API Reference

### Base URL
```
Production: https://api.jasperfinance.org
Local: http://localhost:8001
```

### Authentication
Most endpoints require authentication via JWT token:
```bash
Authorization: Bearer <token>
```

### Error Response Format
```json
{
  "detail": "Error message here",
  "status_code": 400
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Integration Guide

### Adding Services to Main App

All services are registered in `/opt/jasper-crm/app/main.py`:

```python
# Import routers
from routes.citations import router as citations_router
from routes.ab_titles import router as ab_titles_router
from routes.competitor_analysis import router as competitor_analysis_router

# Register routers
app.include_router(citations_router)
app.include_router(ab_titles_router)
app.include_router(competitor_analysis_router)
```

### AI Router Pattern

All services use the standard AI Router pattern:

```python
from services.ai_router import AIRouter, AITask

ai_router = AIRouter()

# Make AI request
response = await ai_router.route(
    task=AITask.RESEARCH,      # or CHAT, SUMMARY, etc.
    prompt=prompt,
    enable_search=True,        # Enable Google Search grounding
    max_tokens=2000
)

# Extract content from response
response_text = response.get('content', '')
```

### Data Storage Pattern

Services use JSON file storage:

```python
DATA_DIR = Path("/opt/jasper-crm/data")

# Save data
with open(DATA_DIR / "service_data.json", "w") as f:
    json.dump(data, f, indent=2, default=str)

# Load data
with open(DATA_DIR / "service_data.json", "r") as f:
    data = json.load(f)
```

### Service Health Check Pattern

```python
@router.get("/health")
async def health_check():
    return {
        "service": "service_name",
        "status": "healthy",
        "features": ["feature1", "feature2"]
    }
```

---

## File Structure

```
/opt/jasper-crm/
├── services/
│   ├── citation_service.py         # Citation management
│   ├── ab_title_service.py         # A/B title testing
│   ├── competitor_analysis_service.py  # Competitor analysis
│   ├── search_service.py           # Site search
│   ├── link_builder_service.py     # Internal linking
│   └── ai_router.py                # AI routing (shared)
├── routes/
│   ├── citations.py                # Citation API routes
│   ├── ab_titles.py                # A/B testing routes
│   ├── competitor_analysis.py      # Competitor analysis routes
│   └── link_builder.py             # Link builder routes
├── models/
│   ├── citation.py                 # Citation Pydantic models
│   ├── ab_test.py                  # A/B test models
│   └── competitor.py               # Competitor analysis models
├── data/
│   ├── source_registry.json        # Citation sources (11 sources)
│   ├── ab_tests.json               # Active A/B tests
│   └── competitor_analysis.json    # Cached analyses
└── app/
    └── main.py                     # Router registration
```

---

## Restoration Reference

### Verify Services Running
```bash
ssh root@72.61.201.237 'curl -s http://localhost:8001/api/v1/ab-titles/health'
ssh root@72.61.201.237 'curl -s http://localhost:8001/api/v1/competitor/health'
ssh root@72.61.201.237 'curl -s http://localhost:8001/api/v1/citations/sources | jq .sources | length'
```

### Restart CRM Service
```bash
ssh root@72.61.201.237 'systemctl restart jasper-crm'
ssh root@72.61.201.237 'journalctl -u jasper-crm -n 50 --no-pager'
```

### Check Service Logs
```bash
ssh root@72.61.201.237 'journalctl -u jasper-crm -n 100 --no-pager | grep -E "(citation|ab_title|competitor)"'
```

---

*Documentation maintained by Claude Code sessions for feature restoration.*
