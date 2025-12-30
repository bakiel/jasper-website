# JASPER Platform - Features

## Overview

JASPER is an AI-powered financial modeling consultancy platform with automated lead generation, content marketing, and CRM capabilities.

**Live URLs:**
- Marketing: https://jasperfinance.org
- API: https://api.jasperfinance.org
- Portal: https://portal.jasperfinance.org

---

## Core Features

### 1. Marketing Website
| Feature | Description |
|---------|-------------|
| Landing Pages | Service pages for JASPER financial modeling tiers |
| Insights Blog | 30+ SEO-optimized articles on DFI funding |
| Site Search | Cmd+K instant search across all content |
| Email Capture | Scroll-triggered popup with category-aware messaging |
| Contact Form | Integrated with CRM for AI-powered response |

### 2. CRM System
| Feature | Description |
|---------|-------------|
| Lead Management | Track prospects through sales pipeline |
| Contact Forms | Webhook intake → automatic lead creation |
| Email Sequences | Automated drip campaigns via Brevo |
| WhatsApp Integration | AI responses via Twilio |
| AgenticBrain | DeepSeek V3 orchestrator for auto-responses |

### 3. Content Pipeline
| Feature | Description |
|---------|-------------|
| Article Generation | AI-powered blog post creation |
| News Monitor | RSS feeds from IFC, AfDB, WorldBank, SA Gov |
| Trending Topics | Auto-select topics based on keyword gaps |
| Content Scheduler | Queue and publish articles |

---

## SEO Enhancement Suite (Dec 2024)

### Citation Service
- Gemini-grounded source discovery
- Academic footnote generation
- Chicago-style formatting
- Max 5 citations per article

### Link Builder Service
- TF-IDF article matching
- Internal link injection (3-5 per article)
- External authoritative links (1-2 per article)
- Blocked domains: medium.com, linkedin.com/pulse, wikipedia.org
- Preferred: ifc.org, afdb.org, worldbank.org

### A/B Title Service
- Generate 3 title variants per article
- CTR tracking
- Automatic winner selection

### Competitor Analysis
- Track competitor content
- Gap analysis
- Keyword opportunities

### Search Service
- Full-text search index
- Real-time updates
- Public API endpoint

---

## AI Infrastructure

### Model Routing (ai_router.py)
| Task | Model | Cost |
|------|-------|------|
| Article Generation | DeepSeek V3 | $0.001/article |
| Citations | Gemini Flash | $0.0005/article |
| Quick Responses | DeepSeek V3 | $0.0002/response |
| Complex Analysis | Claude Sonnet | $0.01/request |

### Agents
| Agent | Purpose |
|-------|---------|
| AgenticBrain | Main orchestrator |
| CommsAgent | WhatsApp/Email responses |
| SupervisorAgent | Content quality control |
| EditorInChief | Article health scoring |

---

## API Endpoints

### Public
```
GET  /health                    # Basic health check
GET  /health/detailed           # Service status
GET  /health/system             # Disk, backups
GET  /status                    # Overall status
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

## Infrastructure

### Services (systemd)
```
jasper-crm.service           # FastAPI backend (port 8001)
jasper-celery-worker.service # Async task processing
jasper-celery-beat.service   # Scheduled tasks
jasper-main-site.service     # Marketing site (port 3005)
jasper-memory.service        # Vector memory (port 8002)
jasper-social.service        # Social media API (port 8003)
```

### Stack
- **Backend:** Python 3.12, FastAPI, Celery
- **Frontend:** React, Vite, TypeScript
- **Portal:** Next.js 14
- **Cache:** Redis
- **Storage:** JSON files (PostgreSQL ready)
- **VPS:** Hostinger KVM 2 (2 vCPU, 8GB RAM, 100GB NVMe)

---

## Data Assets

| Asset | Size | Records |
|-------|------|---------|
| Blog Posts | 484KB | 30 articles |
| Blog Revisions | 2.5MB | Full history |
| Keyword Data | ~100KB | 500+ keywords |
| Competitor Data | 73KB | Tracked competitors |
| Search Index | 32KB | All content indexed |

---

## Monitoring

- **UptimeRobot:** 3 monitors (site, API, portal)
- **Health Endpoints:** /health, /status
- **Logs:** journalctl + logrotate (14 days)
- **Backups:** Automated with 14-day retention

---

## Security

- SSL: Let's Encrypt (auto-renew)
- Auth: JWT tokens
- CORS: Configured for allowed origins
- Rate Limiting: Redis-based
- Secrets: Environment variables

---

## Roadmap

### Completed ✅
- [x] Marketing website
- [x] CRM with lead management
- [x] AI-powered content generation
- [x] SEO enhancement suite
- [x] Email capture system
- [x] Production monitoring
- [x] Automated backups
- [x] CI/CD pipeline

### Planned
- [ ] PostgreSQL migration
- [ ] Multi-user authentication
- [ ] Client portal
- [ ] Invoice generation
- [ ] Financial model templates API
- [ ] WhatsApp bot improvements

---

## Quick Commands

```bash
# Deploy
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/deploy.sh'

# Run tests
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'

# Check health
curl https://api.jasperfinance.org/status

# View logs
ssh root@72.61.201.237 'journalctl -u jasper-crm -f'

# Manual backup
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/backup_all.sh'
```

---

*Last Updated: December 30, 2024*
