# JASPER SEO Enhancement Project

## Current Mission
Build 3 missing SEO services with stop hooks for autonomous operation.

## Project Structure
```
jasper-financial-architecture/
├── jasper-crm/              # Python FastAPI backend
│   ├── services/            # Business logic (CREATE SERVICES HERE)
│   ├── routes/              # API endpoints
│   ├── db/                  # Database layer
│   └── data/blog_posts.json # 30 articles
├── docs/
│   └── INTERNAL_LINK_BUILDER_PLAN.md  # FULL SPEC - READ THIS FIRST
└── TODO.md                  # Progress tracker
```

## Services to Create

### 1. citation_service.py
Academic footnotes with source attribution.
- Max 5 citations per article
- Chicago-style format
- Use Gemini for source discovery

### 2. link_builder_service.py  
Internal + external SEO links.
- 3-5 internal links per article (TF-IDF matching)
- 1-2 external authoritative links
- BLOCKED: medium.com, linkedin.com, wikipedia.org
- PREFERRED: ifc.org, afdb.org, worldbank.org

### 3. ab_title_service.py
A/B testing for article titles.
- 3 variants per article
- CTR tracking

## Existing Services (Don't Recreate)
- news_monitor.py ✅ - RSS feeds working
- keyword_service.py ✅ - gap_analysis() working
- enhancement_orchestrator.py ✅ - Needs imports fixed
- ai_router.py ✅ - DeepSeek/Gemini routing

## AI Model Usage
```python
from services.ai_router import AIRouter, AITask

ai_router = AIRouter()
result = await ai_router.route(
    AITask.CONTENT_EDITING,
    prompt=your_prompt,
    max_tokens=4000
)
```

## VPS Deployment
```bash
scp jasper-crm/services/*.py root@72.61.201.237:/opt/jasper-crm/services/
ssh root@72.61.201.237 'systemctl restart jasper-crm'
```

## Stop Hook
This project has stop hooks configured. Keep working until:
- All 3 services created
- Tests pass
- TODO.md contains SWARM_COMPLETE marker

## Read First
1. docs/INTERNAL_LINK_BUILDER_PLAN.md - Full specifications
2. jasper-crm/services/enhancement_orchestrator.py - See what's missing
3. jasper-crm/services/keyword_service.py - Reference implementation
