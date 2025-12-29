# JASPER Content Generation System - Feature Documentation

*Last Updated: 2025-12-29*

This document provides comprehensive documentation of JASPER's automated content and image generation systems.

---

## Table of Contents
1. [Content Pipeline V2](#content-pipeline-v2)
2. [Image Generation System](#image-generation-system)
3. [Image Orchestrator](#image-orchestrator)
4. [Cost Analysis](#cost-analysis)
5. [API Endpoints](#api-endpoints)
6. [Configuration](#configuration)

---

## Content Pipeline V2

**Location:** `/opt/jasper-crm/services/content_pipeline_v2.py`

### Overview
Multi-stage content generation pipeline designed for international DFI and impact investor audiences. Produces human-quality blog content that passes SEO validation.

### Pipeline Stages

| Stage | Model | Purpose | Cost Profile |
|-------|-------|---------|--------------|
| 1. Research | `gemini-2.0-flash` + Google Search | Gather real facts with grounding | Cheap/Fast |
| 2. Draft | DeepSeek V3.2 (`deepseek-chat`) | Generate content with voice guide | Cost-effective |
| 3. Humanize | `gemini-3-flash-preview` | Remove AI-isms, add personality | Reasoning model |
| 4. SEO Optimize | `gemini-2.0-flash` | Ensure keyword placement/structure | Cheap/Fast |

### Stage 1: Research Grounding
```python
# Uses Gemini 2.0 Flash with Google Search grounding
client.models.generate_content(
    model="gemini-2.0-flash",
    contents=research_prompt,
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        temperature=0.3,
    )
)
```

**Research Output Sections:**
- `[MARKET_DATA]` - Market size, growth rates with sources
- `[DFI_ACTIVITY]` - Recent IFC/BII/DFC deals in the space
- `[ESG_SDG_ANGLE]` - SDG alignment and impact metrics
- `[RISK_FACTORS]` - Investor concerns and mitigations

### Stage 2: Draft Generation
```python
# Uses DeepSeek V3.2 for cost-effective long-form generation
async with httpx.AsyncClient(timeout=120.0) as client:
    response = await client.post(
        "https://api.deepseek.com/v1/chat/completions",
        json={
            "model": "deepseek-chat",
            "temperature": 0.7,
            "max_tokens": 4000,
        }
    )
```

**Draft Output Format:**
- `[TITLE]` - Compelling title (max 60 chars)
- `[SEO_TITLE]` - Meta title for search (max 60 chars)
- `[SEO_DESCRIPTION]` - Meta description (max 155 chars)
- `[EXCERPT]` - 2-sentence hook for LinkedIn
- `[CONTENT]` - Full article in markdown (1500-2200 words)
- `[TAGS]` - Comma-separated tags

### Stage 3: Humanization
```python
# Uses Gemini 3 Flash Preview for reasoning-based humanization
client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=humanize_prompt,
)
```

**Humanization Tasks:**
1. Remove banned AI phrases
2. Ensure tone speaks TO investors, not about them
3. Verify USD amounts
4. Balance confidence without being salesy
5. Address risk factors directly
6. Add conversational touches

### Stage 4: SEO Optimization
**SURGICAL approach - only modifies:**
- Title (add keyword)
- SEO Title (ensure length)
- SEO Description (add keyword)
- First paragraph (inject keyword naturally)
- Add external link if missing

Does NOT rewrite the full article.

### Anti-AI-Slop Rules

**Banned Phrases:**
```python
BANNED_PHRASES = [
    "In today's fast-paced world",
    "In today's rapidly evolving",
    "In an era of",
    "In the realm of",
    "As we navigate",
    "It's important to note that",
    "Leverage",
    "Utilize",
    "Synergy",
    "Paradigm shift",
    "Deep dive",
    "Unlock the power",
    "Harness the potential",
    "Navigate the landscape",
    "Embark on a journey",
    "Delve into",
    "Game-changing",
    "Revolutionary",
    "Cutting-edge",
    "World-class",
]
```

### JASPER Voice Guidelines

**Target Audience (Priority Order):**
1. DFI deal teams (IFC, BII, DFC, Proparco, DEG, AfDB, EIB)
2. Impact investors and ESG-focused funds (US/UK/EU based)
3. Family offices and HNWIs in frontier markets
4. International project developers expanding into Africa

**Tone & Style:**
- Speak as a trusted advisor who knows both worlds
- Confident, direct, data-driven
- Reference international frameworks: SDGs, ESG, Paris Agreement
- Use USD for amounts (note local equivalents if relevant)
- Cite real DFIs and recent commitments
- Short sentences. Clear points. No fluff.

**Credibility Signals:**
- G7 DFI $80B Africa commitment
- IFC's $71.7B FY2025 commitments
- BII's 30% climate finance mandate
- Specific deal examples

### Category Contexts

| Category | Focus Area |
|----------|------------|
| `dfi-insights` | IFC, BII, DFC, Proparco, DEG, AfDB mandates and deal structures |
| `financial-modeling` | What DFIs expect in models, sensitivity analysis, currency hedging |
| `infrastructure-finance` | Power, transport, digital infrastructure, PPP structures |
| `agri-processing` | Food security, cold chain, processing facilities, export markets |
| `renewable-energy` | Solar, wind, battery storage, mini-grids, carbon credits |
| `impact-investing` | SDG alignment, ESG metrics, blended finance, first-loss structures |
| `case-studies` | Real deal examples and transaction structures |
| `market-intelligence` | Regulatory changes, currency trends, political risk |

---

## Image Generation System

**Location:** `/opt/jasper-crm/services/ai_image_service.py`

### Overview
AI-powered image generation using Google's Imagen 3 via the Gemini API (internally called "Nano Banana Pro").

### Models Used

| Role | Model | Capabilities |
|------|-------|--------------|
| CEO/Curation | `gemini-3-flash-preview` | Analyze content, plan images |
| Image Generation | `gemini-3-pro-image-preview` | Generate 2K images (Nano Banana Pro) |

### Nano Banana Pro Capabilities
- **BEST text rendering** - Legible, stylized, multilingual
- **Google Search grounding** - Real-time infographics
- **Reference images** - Up to 14 per prompt
- **Resolution:** 2K (1792x1024 for 16:9)
- **Cost:** ~$0.07-0.13 per image

### Image Types

| Type | Dimensions | Purpose |
|------|------------|---------|
| Hero | 1200x630 | Blog post header images |
| Infographic | 800x600 | Data visualization graphics |
| Supporting | 800x450 | In-article images |

### JASPER Brand Configuration

```python
BRAND = {
    "navy": "#0F2A3C",
    "emerald": "#2C8A5B",
    "style": """Premium stock photography style - Getty/Shutterstock quality.
Cinematic color grading with subtle warmth and depth.
African business context - diverse professionals, modern African cities.
Navy and emerald as environmental accents, not filters.
People allowed: silhouettes, backs, blurred, hands - NO clear faces.
Shallow depth of field, beautiful bokeh, professional lighting.
Mood: Aspirational, professional, hopeful, dynamic."""
}
```

### Shot Type Variety

The system rotates through diverse shot types to avoid monotony:

**Realistic People (4 types):**
- Natural Candid - Documentary feel
- Boardroom Meeting - Professional interaction
- Working Professional - Focused on work
- Team Collaboration - Group discussion

**Environmental (3 types):**
- Wide Establishing - Dramatic architecture
- Modern Office Interior - Contemporary design
- Aerial Perspective - Bird's eye infrastructure

**Detail Shots (2 types):**
- Closeup Hands - Professional workspace details
- Desk Scene - Premium surface, shallow DOF

**Mood (1 type):**
- Golden Hour Office - Warm, inviting

### Category-Specific Styles

Each category has 5 unique prompt styles:

**DFI Insights:**
- Johannesburg Sandton skyline at blue hour
- Business professionals in silhouette at windows
- Close-up of hands signing documents
- Over-shoulder view of Africa presentation
- Chess pieces with city reflection

**Climate Finance:**
- Aerial view of solar farm
- Engineer silhouette on wind turbine
- Hands holding seedling
- Rooftop solar on African building

### Image Prompt Templates

**Location:** `/opt/jasper-crm/services/image_prompt_service.py`

Pre-built templates for consistent brand alignment:

| Template | Use Case |
|----------|----------|
| `hero_infrastructure` | Infrastructure development |
| `hero_finance` | Financial/investment topics |
| `hero_agriculture` | Sustainability/farming |
| `hero_construction` | Development projects |
| `hero_renewable_energy` | Clean energy |
| `hero_healthcare` | Medical infrastructure |

---

## Image Orchestrator

**Location:** `/opt/jasper-crm/services/image_orchestrator.py`

### Overview
Autonomous image generation system running on APScheduler (Pure Python Architecture).

### Features
1. Monitors posts without hero images
2. Detects infographic opportunities in content
3. Generates images using Nano Banana Pro
4. Manages image quality and regeneration

### Infographic Detection Patterns

| Pattern Type | Detection Signals | Min Confidence |
|--------------|-------------------|----------------|
| `numbered_list` | "X steps/ways/tips", "top X", "how to in X steps" | 0.7 |
| `comparison` | "vs", "compared to", "pros and cons" | 0.6 |
| `statistics` | Percentages, dollar/rand amounts, millions/billions | 0.5 |
| `process` | "process overview", "workflow", "pipeline", "step X" | 0.6 |
| `timeline` | "timeline", year ranges, "phase X", quarterly refs | 0.6 |

### Infographic Styles

```python
INFOGRAPHIC_STYLES = {
    "numbered_list": "Clean data visualization with numbered items, flat design",
    "statistics": "Financial data viz with charts, navy background, large numbers",
    "comparison": "Side-by-side columns, checkmarks, consulting style",
    "process": "Step-by-step flow diagram with arrows and icons",
    "timeline": "Horizontal timeline with milestones and dates"
}
```

### Scheduler Configuration
```python
# Default: Check every 10 minutes
self.scheduler.add_job(
    self._orchestrate_images,
    trigger=IntervalTrigger(minutes=check_interval_minutes),
    id="image_orchestrator",
    name="Autonomous Image Generation",
)
```

### Orchestrator Status API
```python
def get_status() -> Dict[str, Any]:
    return {
        "running": self._is_running,
        "last_run": self._last_run.isoformat(),
        "stats": {
            "total_runs": int,
            "hero_images_generated": int,
            "infographics_generated": int,
            "errors": int
        },
        "next_run": str
    }
```

---

## Cost Analysis

### Content Generation Costs (Per Article)

| Stage | Model | Estimated Cost |
|-------|-------|----------------|
| Research | Gemini 2.0 Flash | ~$0.001 |
| Draft | DeepSeek V3.2 | ~$0.004 |
| Humanize | Gemini 3 Flash Preview | ~$0.002 |
| SEO | Gemini 2.0 Flash | ~$0.001 |
| **Total** | | **~$0.008/article** |

### Image Generation Costs

| Type | Resolution | Cost |
|------|------------|------|
| Hero Image | 2K (1792x1024) | ~$0.07-0.13 |
| Infographic | 800x600 | ~$0.05-0.10 |

**Google AI Studio Free Tier:** 1,500 images/day

### Cost Summary for Typical Blog Post
- Content: ~$0.008
- Hero Image: ~$0.134
- **Total: ~$0.14/post**

---

## API Endpoints

### Content Generation
```
POST /api/content/generate
{
    "topic": "How blended finance unlocks climate adaptation",
    "category": "dfi-insights",
    "keywords": ["blended finance", "climate adaptation"],
    "skip_research": false,
    "skip_humanize": false,
    "skip_seo": false
}
```

### Image Generation
```
POST /api/images/generate
{
    "article_slug": "blended-finance-climate-2025",
    "image_type": "hero",
    "custom_prompt": null
}
```

### Image Library
```
GET /api/images/library
GET /api/images/library/{image_id}
DELETE /api/images/library/{image_id}
```

### Orchestrator Status
```
GET /api/images/orchestrator/status
POST /api/images/orchestrator/start
POST /api/images/orchestrator/stop
```

---

## Configuration

### Environment Variables

```bash
# Content Pipeline
DEEPSEEK_API_KEY=sk-xxx          # DeepSeek V3.2 for drafting
GOOGLE_API_KEY=xxx               # Gemini models for research/humanize/SEO

# Image Generation
GOOGLE_API_KEY=xxx               # Also used for Nano Banana Pro
```

### File Paths

```
/opt/jasper-crm/
├── services/
│   ├── content_pipeline_v2.py   # Main content pipeline
│   ├── ai_image_service.py      # Image generation
│   ├── image_orchestrator.py    # Autonomous orchestrator
│   └── image_prompt_service.py  # Prompt templates
├── agents/
│   └── content_prompts.py       # Voice guides & banned phrases
└── data/
    ├── blog_posts.json          # Published posts
    ├── image_library.json       # Generated images metadata
    ├── generated_images/        # Actual image files
    └── image_orchestrator_log.json
```

### Quality Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Image Quality Score | 90% | JASPER excellence standard |
| Brand Compliance | 85% | Color/style alignment |
| SEO Score | 80% | Keyword density, meta tags |

---

## Git Recovery Reference

**Content Pipeline Baseline:**
- Check: `git log --oneline services/content_pipeline_v2.py`

**Image Services Baseline:**
- Check: `git log --oneline services/ai_image_service.py`
- Check: `git log --oneline services/image_orchestrator.py`

**View at commit:**
```bash
git show <commit>:/opt/jasper-crm/services/content_pipeline_v2.py
```

---

*Documentation maintained by Claude Code sessions for feature restoration.*
