# JASPER Feature Index

**Purpose:** Master index of all feature documentation. READ THIS FIRST when restoring lost features.

**Baseline Commit:** `3f9815914` (December 30, 2025)

---

## Quick Links

| System | Documentation | Location |
|--------|---------------|----------|
| **Portal Frontend** | [FEATURES.md](../jasper-portal-frontend/FEATURES.md) | BlockNote editor, Images page, Content hub |
| **Content Pipeline** | [CONTENT_GENERATION_FEATURES.md](./CONTENT_GENERATION_FEATURES.md) | 4-stage article generation, AI images |
| **Content Enhancement** | [CONTENT_ENHANCEMENT_SYSTEM.md](./CONTENT_ENHANCEMENT_SYSTEM.md) | Citations, A/B titles, competitor analysis, search |
| **Architecture** | [ARCHITECTURE.md](../jasper-crm/docs/ARCHITECTURE.md) | Full system architecture diagram |
| **Operations** | [RUNBOOK.md](../jasper-crm/docs/RUNBOOK.md) | Deploy, backup, troubleshoot |

---

## Live Infrastructure

### URLs
| Service | URL | Status |
|---------|-----|--------|
| Marketing Site | https://jasperfinance.org | ✅ Live |
| CRM API | https://api.jasperfinance.org | ✅ Live |
| Admin Portal | https://portal.jasperfinance.org | ✅ Live |
| Health Check | https://api.jasperfinance.org/health | ✅ Monitored |

### VPS Services (72.61.201.237)
| Service | Port | Manager |
|---------|------|---------|
| jasper-crm | 8001 | systemd |
| jasper-celery-worker | - | systemd |
| jasper-celery-beat | - | systemd |
| jasper-main-site | 3005 | systemd |
| jasper-memory | 8002 | systemd |
| jasper-social | 8003 | systemd |

---

## Critical Systems Overview

### 1. Content Generation Pipeline
**Backend:** `/opt/jasper-crm/services/content_pipeline_v2.py`

| Stage | Model | Purpose |
|-------|-------|---------|
| Research | Gemini 2.0 Flash + Google Search | Grounded facts |
| Draft | DeepSeek V3 | Cost-effective generation |
| Humanize | Gemini 3 Flash Preview | Remove AI-isms |
| SEO | Gemini 2.0 Flash | Keyword optimization |

**Cost:** ~$0.008 per article

### 2. SEO Enhancement Suite (NEW - Dec 2024)
**Backend:** `/opt/jasper-crm/services/`

| Service | File | Purpose |
|---------|------|---------|
| Citation Service | `citation_service.py` (15KB) | Gemini-grounded footnotes |
| Link Builder | `link_builder_service.py` (14KB) | Internal/external links |
| A/B Titles | `ab_title_service.py` (11KB) | Title variant testing |
| Competitor Analysis | `competitor_analysis_service.py` (22KB) | Content gap tracking |
| Site Search | `search_service.py` (11KB) | Full-text search |
| Enhancement Orchestrator | `enhancement_orchestrator.py` (22KB) | Coordinates all services |
| Supervisor Agent | `supervisor_agent.py` (20KB) | Quality control |

### 3. Image Generation
**Backend:** `/opt/jasper-crm/services/ai_image_service.py`

| Component | Model | Purpose |
|-----------|-------|---------|
| Planning | Gemini 3 Flash Preview | Analyze content, plan images |
| Generation | Gemini 3 Pro Image (Nano Banana Pro) | 2K image generation |

**Cost:** ~$0.07-0.13 per image

### 4. AI Infrastructure
**Backend:** `/opt/jasper-crm/services/ai_router.py`

| Task | Model | Cost |
|------|-------|------|
| Article Generation | DeepSeek V3 | $0.001/article |
| Citations | Gemini Flash | $0.0005/article |
| Quick Responses | DeepSeek V3 | $0.0002/response |
| Complex Analysis | Claude Sonnet | $0.01/request |

### 5. Lead Generation & CRM
**Backend:** `/opt/jasper-crm/`

| Feature | Description |
|---------|-------------|
| Contact Form Webhook | Form → Lead → AI Response |
| Email Sequences | Automated drip campaigns (Brevo) |
| WhatsApp Integration | AI responses via Twilio |
| AgenticBrain | DeepSeek V3 orchestrator |
| News Monitor | IFC, AfDB, WorldBank RSS feeds |
| Lead Prospector | Auto-prospect from news |

### 6. BlockNote Rich Text Editor
**Frontend:** `jasper-portal-frontend/src/components/content/`

| Component | Size | Purpose |
|-----------|------|---------|
| BlockNoteEditor.tsx | 29KB | Main editor |
| BlockEditor.tsx | 19KB | Editor wrapper |
| content-serializers.ts | 32KB | Markdown/HTML |

---

## API Endpoints

### Public
```
GET  /health                    # Basic health check
GET  /health/detailed           # Service status
GET  /health/system             # Disk, backups, data files
GET  /status                    # Overall system status
GET  /api/v1/blog/posts         # List articles
GET  /api/v1/blog/posts/{slug}  # Single article
GET  /api/v1/blog/search        # Search articles
POST /api/v1/webhooks/contact-form  # Form submission
POST /api/v1/newsletter/subscribe   # Email signup
```

### Protected (JWT)
```
GET  /api/v1/leads              # List leads
POST /api/v1/leads              # Create lead
GET  /api/v1/content/trending   # Trending topics
POST /api/v1/content/enhance    # Enhance article
GET  /api/v1/keywords/gap-analysis  # Keyword gaps
GET  /api/v1/news/scan          # Trigger news scan
POST /api/v1/citations/generate # Generate citations
POST /api/v1/ab-titles/create   # Create title variants
GET  /api/v1/competitor/analysis # Competitor data
```

---

## Background Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Incremental Backup | 6am, 6pm daily | Changed files only |
| Full Backup | Sunday 3am | Complete data backup |
| News Scan | Daily | DFI news monitoring |
| Keyword Refresh | Weekly | Update keyword data |
| Email Sequences | Every minute | Drip campaign checks |

---

## Data Assets

| Asset | Location | Size |
|-------|----------|------|
| Blog Posts | `/opt/jasper-crm/data/blog_posts.json` | 484KB (30 articles) |
| Blog Revisions | `/opt/jasper-crm/data/blog_revisions.json` | 2.5MB |
| Keyword Data | `/opt/jasper-crm/data/keywords.json` | ~100KB |
| Competitor Data | `/opt/jasper-crm/data/competitor_analysis.json` | 73KB |
| Search Index | `/opt/jasper-crm/data/search_index.json` | 32KB |
| A/B Tests | `/opt/jasper-crm/data/ab_tests.json` | Active tests |
| Leads | `/opt/jasper-crm/data/leads.json` | CRM data |

---

## Monitoring & Operations

### Health Monitoring
- **UptimeRobot:** 3 monitors (site, API, portal)
- **Endpoints:** /health, /health/detailed, /health/system, /status

### Backups
- **Location:** `/root/backups/`
- **Retention:** 14 days
- **Schedule:** Incremental 2x daily, Full weekly

### Tests
```bash
# Run all tests (12 passing)
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'
```

### Deploy
```bash
# Full deployment
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/deploy.sh'

# CRM only
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/deploy.sh --service=crm'
```

---

## Restoration Quick Reference

### Frontend Editor Missing
```bash
cd jasper-portal-frontend
git checkout c20bc4585 -- src/components/content/ src/lib/content-serializers.ts
npm install --legacy-peer-deps
npm run build
```

### Backend Service Missing
```bash
ssh root@72.61.201.237
cd /opt/jasper-crm
git log --oneline services/
git checkout <commit> -- services/<file>.py
systemctl restart jasper-crm
```

### Restore from Backup
```bash
cd / && tar -xzf /root/backups/jasper-data-YYYYMMDD_HHMMSS.tar.gz
systemctl restart jasper-crm jasper-celery-worker
```

---

## Environment Variables Required

```bash
# AI Models
DEEPSEEK_API_KEY=sk-xxx          # DeepSeek V3
GOOGLE_API_KEY=xxx               # Gemini models
OPENROUTER_API_KEY=xxx           # Fallback routing

# Communications
BREVO_API_KEY=xxx                # Email sending
TWILIO_ACCOUNT_SID=xxx           # WhatsApp
TWILIO_AUTH_TOKEN=xxx

# Database (future)
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

---

## Red Flags Checklist

| Symptom | Check | Solution |
|---------|-------|----------|
| 502 Bad Gateway | Service down | `systemctl restart jasper-crm` |
| Editor is plain textarea | BlockNote components | Restore from c20bc4585 |
| Articles have no facts | Research stage | Check GOOGLE_API_KEY |
| Articles sound robotic | Humanize stage | Check Gemini 3 Flash access |
| No images generated | Image service | Check ai_image_service.py |
| High API costs | Model routing | Check ai_router.py |
| No backups | Cron job | Check `crontab -l` |
| Health check fails | Multiple services | Check /health/detailed |

---

## Feature Documentation Locations

```
jasper-financial-architecture/
├── docs/
│   ├── FEATURE_INDEX.md              ← You are here
│   ├── CONTENT_GENERATION_FEATURES.md
│   ├── CONTENT_ENHANCEMENT_SYSTEM.md
│   └── ARCHITECTURE_DIAGRAM.md
├── jasper-crm/
│   └── docs/
│       ├── ARCHITECTURE.md           ← System architecture
│       ├── RUNBOOK.md                ← Operations guide
│       ├── CITATION_SERVICE_DOCS.md
│       ├── LINK_BUILDER_API.md
│       ├── AB_TITLE_TESTING.md
│       └── COMPETITOR_ANALYSIS_SERVICE.md
└── jasper-portal-frontend/
    └── FEATURES.md                   ← Frontend features
```

---

*Last Updated: December 30, 2024*
*Baseline Commit: 3f9815914*
