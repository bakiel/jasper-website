# JASPER System Architecture

## Overview

JASPER is a multi-service platform for financial modeling consulting, comprising:
- Marketing website (lead generation)
- CRM API (backend automation)
- Admin portal (content management)
- Background workers (async tasks)

---

## Infrastructure

```
                                    ┌─────────────────────────────────────┐
                                    │         Cloudflare CDN              │
                                    │     (DNS, SSL, DDoS Protection)     │
                                    └──────────────┬──────────────────────┘
                                                   │
                                    ┌──────────────▼──────────────────────┐
                                    │     Hostinger VPS (72.61.201.237)   │
                                    │     Ubuntu 24.04 | 2 vCPU | 8GB RAM │
                                    └──────────────┬──────────────────────┘
                                                   │
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
              ┌──────────▼──────────┐   ┌─────────▼─────────┐   ┌──────────▼──────────┐
              │   Nginx Reverse     │   │   Nginx Reverse   │   │   Nginx Reverse     │
              │   Proxy :443        │   │   Proxy :443      │   │   Proxy :443        │
              └──────────┬──────────┘   └─────────┬─────────┘   └──────────┬──────────┘
                         │                        │                         │
              ┌──────────▼──────────┐   ┌─────────▼─────────┐   ┌──────────▼──────────┐
              │  jasperfinance.org  │   │ api.jasperfinance │   │ portal.jasperfinance│
              │  Marketing Site     │   │     CRM API       │   │   Admin Portal      │
              │  (Vite/React)       │   │   (FastAPI)       │   │   (Next.js)         │
              │  Port 3005          │   │   Port 8001       │   │   Port 3000         │
              └─────────────────────┘   └─────────┬─────────┘   └─────────────────────┘
                                                  │
                         ┌────────────────────────┼────────────────────────┐
                         │                        │                        │
              ┌──────────▼──────────┐  ┌─────────▼─────────┐  ┌───────────▼───────────┐
              │   Redis Cache       │  │  Celery Workers   │  │   JSON File Storage   │
              │   Port 6379         │  │  (Background)     │  │   /opt/jasper-crm/    │
              │                     │  │                   │  │   data/*.json         │
              └─────────────────────┘  └───────────────────┘  └───────────────────────┘
```

---

## Services

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| jasper-main-site | 3005 | Vite/React | Marketing website |
| jasper-crm | 8001 | FastAPI | CRM API backend |
| jasper-portal | 3000 | Next.js | Admin dashboard |
| jasper-celery-worker | - | Celery | Async task processing |
| jasper-celery-beat | - | Celery Beat | Scheduled tasks |
| jasper-memory | 8002 | FastAPI | Vector memory service |
| jasper-social | 8003 | FastAPI | Social media API |

---

## Data Flow

```
User Visit                 Contact Form              Blog/Content
    │                          │                         │
    ▼                          ▼                         ▼
┌─────────┐             ┌─────────────┐           ┌───────────┐
│Marketing│────────────▶│  Webhook    │           │  CMS API  │
│  Site   │             │  Endpoint   │           │ Endpoints │
└─────────┘             └──────┬──────┘           └─────┬─────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────┐          ┌───────────┐
                        │ Lead Created│          │blog_posts │
                        │ leads.json  │          │  .json    │
                        └──────┬──────┘          └───────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │AgenticBrain │
                        │  (DeepSeek) │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │CommsAgent│    │EmailQueue│    │ WhatsApp │
        │(Response)│    │ (Brevo)  │    │(Twilio)  │
        └──────────┘    └──────────┘    └──────────┘
```

---

## API Structure

```
/api/v1/
├── blog/                 # Blog CRUD
│   ├── posts            # List/create posts
│   └── posts/{slug}     # Single post
├── leads/               # Lead management
├── content/             # Content generation
│   ├── enhance          # SEO enhancement
│   └── trending         # Trending topics
├── keywords/            # Keyword research
├── webhooks/            # External integrations
│   └── contact-form     # Form submissions
├── news/                # News monitoring
├── seo/                 # SEO tools
└── auth/                # Authentication
```

---

## Background Tasks (Celery)

| Task | Schedule | Purpose |
|------|----------|---------|
| backup_all | 6am, 6pm | Full data backup |
| news_scan | Daily | DFI news monitoring |
| keyword_refresh | Weekly | Update keyword data |
| email_sequences | Every minute | Drip campaign checks |

---

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| OpenRouter | AI routing (DeepSeek, Claude, Gemini) | OPENROUTER_API_KEY |
| Brevo | Email sending | BREVO_API_KEY |
| Twilio | WhatsApp messaging | TWILIO_* |
| Cloudflare | DNS, CDN | Via dashboard |
| Google | Search Console, Analytics | OAuth |

---

## Security

- SSL: Lets Encrypt (auto-renew)
- Firewall: UFW (ports 22, 80, 443)
- Auth: JWT tokens for API
- Secrets: Environment variables in .env
- Backups: Encrypted, 14-day retention

---

## Scaling Considerations

Current architecture handles ~1000 daily requests. For scaling:

1. **Database Migration**: Move JSON to PostgreSQL
2. **Caching**: Expand Redis usage
3. **CDN**: Serve static assets via Cloudflare
4. **Horizontal**: Add more Celery workers
5. **Separation**: Split services to multiple VPS

---

## File Structure

```
/opt/jasper-crm/
├── app/
│   └── main.py           # FastAPI app entry
├── routes/               # API endpoints
├── services/             # Business logic
├── agents/               # AI agents
├── data/                 # JSON storage
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── tests/                # Test suite
└── venv/                 # Python environment

/opt/jasper-main-site/
├── dist/                 # Built static files
└── src/                  # Source code

/root/backups/
└── jasper-data-*.tar.gz  # Backup archives
```
