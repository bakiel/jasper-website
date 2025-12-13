# JASPER Migration Checklist
## Hostinger VPS Deployment Plan

**Created:** December 2025
**Target:** Hostinger VPS 72.61.201.237
**Domain:** jasperfinance.org
**CDN:** Cloudflare

---

## 1. INVENTORY OF LOCAL ASSETS

### 1.1 Core Applications (Need VPS Deployment)

| Component | Location | Status | Priority | Notes |
|-----------|----------|--------|----------|-------|
| **jasper-api** | `/jasper-api/` | Ready | HIGH | FastAPI backend - currently on Vercel |
| **jasper-portal-frontend** | `/jasper-portal-frontend/` | Ready | HIGH | Next.js frontend - needs VPS or Vercel |
| **jasper-client-portal** | `/jasper-client-portal/` | Ready | MEDIUM | Client portal (Next.js) |
| **jasper-crm** | `/jasper-crm/` | Ready | MEDIUM | CRM system |
| **jasper-imail** | `/jasper-imail---nextgen/` | Ready | LOW | Email platform |

### 1.2 Lead Gen System (NEW - Per Deployment Doc)

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **DFI Monitor Bot** | To Build | HIGH | RSS feed monitoring, AI analysis |
| **Cold Email Bot** | To Build | HIGH | Apollo.io + Hunter.io integration |
| **LinkedIn Auto-Post** | To Build | MEDIUM | Thought leadership automation |
| **WhatsApp Gateway** | To Build | HIGH | whatsapp-web.js on Node.js |
| **Telegram Notifications** | To Build | HIGH | Real-time alerts |

### 1.3 Static Assets & Materials

| Asset | Location | Deployment Target |
|-------|----------|-------------------|
| **Branding/Logos** | `/branding/logos/` | Hostinger file hosting or CDN |
| **Client PDFs** | `/client-materials/pdfs/` | Hostinger file hosting |
| **LaTeX Sources** | `/client-materials/latex/` | Keep local (source files) |
| **Images** | `/client-materials/images/` | Hostinger or CDN |

### 1.4 Documentation (Reference Only)

| Doc | Location | Notes |
|-----|----------|-------|
| **CLAUDE.md** | `/CLAUDE.md` | Project instructions |
| **Methodology Docs** | `/docs/` | Reference documents |
| **Knowledge Base** | `/knowledge-base/` | AI training data |

---

## 2. DEPLOYMENT ARCHITECTURE

```
CLOUDFLARE (CDN + SSL)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                HOSTINGER VPS (72.61.201.237)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   NGINX (80)    │  │  PostgreSQL     │                  │
│  │   Reverse Proxy │  │  (5432)         │                  │
│  └────────┬────────┘  └─────────────────┘                  │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  FastAPI (8000) │  │  Redis (6379)   │                  │
│  │  jasper-api     │  │  Celery Broker  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               CELERY WORKERS                         │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │DFI Monitor │ │Cold Email  │ │LinkedIn    │       │   │
│  │  │Bot         │ │Bot         │ │Bot         │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐                                       │
│  │ WhatsApp Gateway│  (Node.js - Port 3001)                │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. MIGRATION PHASES

### PHASE 1: Infrastructure Setup (Day 1)
**Estimated Time:** 2 hours

- [ ] SSH into VPS: `ssh root@72.61.201.237`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] Install Python 3.12
- [ ] Install Node.js 18+
- [ ] Install PostgreSQL
- [ ] Install Redis
- [ ] Install Nginx
- [ ] Install Supervisor
- [ ] Install Chromium (for WhatsApp)
- [ ] Create application directories:
  - `/app/jasper-leads/` (Lead Gen system)
  - `/app/jasper-api/` (Backend API)
  - `/app/whatsapp-gateway/` (WhatsApp)
  - `/var/log/jasper/` (Logs)

### PHASE 2: Database Setup (Day 1)
**Estimated Time:** 30 minutes

- [ ] Create PostgreSQL user `jasper`
- [ ] Create database `jasper_leads`
- [ ] Grant privileges
- [ ] Enable services on boot
- [ ] Test database connection

### PHASE 3: Cloudflare Configuration (Day 1)
**Estimated Time:** 30 minutes

- [ ] Add jasperfinance.org to Cloudflare
- [ ] Update nameservers at registrar
- [ ] Wait for DNS propagation (can take up to 48hrs)
- [ ] Configure A record → 72.61.201.237
- [ ] Configure www CNAME → jasperfinance.org
- [ ] Configure api subdomain
- [ ] Enable SSL (Full mode)
- [ ] Enable "Always Use HTTPS"
- [ ] Configure caching

### PHASE 4: Lead Gen System Deployment (Day 2)
**Estimated Time:** 3 hours

- [ ] Upload Lead Gen code to `/app/jasper-leads/`
- [ ] Create Python virtual environment
- [ ] Install requirements.txt
- [ ] Create `.env` file with credentials
- [ ] Run database migrations (Alembic)
- [ ] Configure Celery worker
- [ ] Configure Celery beat (scheduler)
- [ ] Test DFI Monitor bot (dry run)
- [ ] Test Cold Email bot (dry run)
- [ ] Test LinkedIn bot (dry run)

### PHASE 5: WhatsApp Gateway Setup (Day 2)
**Estimated Time:** 1 hour

- [ ] Initialize Node.js project in `/app/whatsapp-gateway/`
- [ ] Install dependencies (whatsapp-web.js, express, qrcode-terminal)
- [ ] Create gateway server
- [ ] Start server and scan QR code
- [ ] Test message sending

### PHASE 6: Notification System (Day 2)
**Estimated Time:** 30 minutes

- [ ] Create Telegram bot via @BotFather
- [ ] Get bot token and chat ID
- [ ] Configure in `.env`
- [ ] Test Telegram notifications
- [ ] Test WhatsApp notifications

### PHASE 7: Process Management (Day 2)
**Estimated Time:** 30 minutes

- [ ] Create Supervisor configs for:
  - Celery worker
  - Celery beat
  - FastAPI (Uvicorn)
  - WhatsApp gateway
- [ ] Configure log rotation
- [ ] Start all services
- [ ] Verify all running: `supervisorctl status`

### PHASE 8: Nginx Configuration (Day 2)
**Estimated Time:** 30 minutes

- [ ] Create site config for jasperfinance.org
- [ ] Configure reverse proxy to FastAPI
- [ ] Enable site
- [ ] Test configuration: `nginx -t`
- [ ] Reload Nginx

### PHASE 9: Testing & Validation (Day 3)
**Estimated Time:** 2 hours

- [ ] Website loads via https://jasperfinance.org
- [ ] SSL certificate valid (green padlock)
- [ ] Cloudflare headers present (`cf-ray`)
- [ ] API health check responding
- [ ] DFI Monitor fetching RSS feeds
- [ ] Cold Email generating (not sending) test emails
- [ ] LinkedIn generating test posts
- [ ] Telegram alerts working
- [ ] WhatsApp alerts working
- [ ] Database storing records

---

## 4. CREDENTIALS CHECKLIST

### ✅ All Credentials Ready
All credentials have been collected and stored securely.

**Secure Location:** `~/.jasper-secrets/CREDENTIALS.env`
- File permissions: 600 (owner read/write only)
- NOT in git repository
- Contains all API keys, tokens, and passwords

### Credentials Collected:
- [x] Hostinger VPS (72.61.201.237)
- [x] Cloudflare API Token
- [x] OpenRouter API Key
- [x] Admin Login
- [x] SMTP (Hostinger)
- [x] Google OAuth
- [x] iMail API Key
- [x] PostgreSQL password
- [x] LinkedIn OAuth (Client ID, Secret, Company ID: 110475040)
- [x] Telegram Bot Token + Chat ID
- [x] Apollo.io API Key
- [x] Hunter.io API Key
- [x] WhatsApp Alert Number

### Email Aliases (All Active):
- [x] models@jasperfinance.org (primary mailbox)
- [x] info@jasperfinance.org (alias → models@)
- [x] support@jasperfinance.org (alias → models@)
- [x] outreach@jasperfinance.org (alias → models@ - for cold email bot)

### For Deployment:
```bash
# Copy credentials to VPS
scp ~/.jasper-secrets/CREDENTIALS.env root@72.61.201.237:/app/jasper-leads/.env

# Or reference during Claude Code session:
cat ~/.jasper-secrets/CREDENTIALS.env
```

---

## 5. ASSETS TO UPLOAD

### 5.1 Lead Gen System (Build First)
The Lead Gen system code needs to be built per `/Users/mac/Downloads/JASPER_CLAUDE_CODE_DEPLOYMENT.md`.

Files to create:
```
/app/jasper-leads/
├── .env
├── requirements.txt
├── alembic.ini
├── alembic/versions/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── db.py
│   ├── models.py
│   ├── main.py
│   ├── celery_app.py
│   ├── bots/
│   │   ├── dfi_monitor.py
│   │   ├── cold_email.py
│   │   └── linkedin.py
│   └── utils/
│       ├── ai.py
│       ├── notifications.py
│       └── email.py
└── scripts/
    └── deploy.sh
```

### 5.2 Static Assets to Upload
```
From: /branding/logos/
To:   VPS /var/www/jasperfinance.org/static/logos/

From: /client-materials/pdfs/
To:   VPS /var/www/jasperfinance.org/static/pdfs/

From: /client-materials/images/
To:   VPS /var/www/jasperfinance.org/static/images/
```

### 5.3 Frontend Options

**Option A: Keep on Vercel (Recommended for now)**
- jasper-portal-frontend already deployed on Vercel
- Free hosting, automatic SSL, edge deployment
- Update DNS to point to Vercel

**Option B: Move to VPS**
- Build static files: `npm run build`
- Upload to `/var/www/jasperfinance.org/`
- Serve via Nginx

---

## 6. POST-DEPLOYMENT MONITORING

### Daily Checks:
- [ ] `supervisorctl status` - All services running
- [ ] Check `/var/log/jasper/` for errors
- [ ] Verify Telegram daily summary received

### Weekly Checks:
- [ ] Review leads detected in database
- [ ] Check email deliverability
- [ ] Review LinkedIn engagement

### Monthly Checks:
- [ ] Review VPS resource usage
- [ ] Update dependencies if needed
- [ ] Backup database

---

## 7. COST SUMMARY

| Service | Monthly Cost |
|---------|-------------|
| Hostinger VPS | $6.00 |
| OpenRouter (DeepSeek) | ~$5.00 |
| Cloudflare | FREE |
| Telegram | FREE |
| WhatsApp (self-hosted) | FREE |
| Apollo.io (free tier) | FREE |
| Hunter.io (free tier) | FREE |
| **TOTAL** | **~$11/month** |

---

## 10. NEXT STEPS (In Order)

### ✅ CREDENTIALS COMPLETE - Ready for Deployment!

1. **Execute Phase 1-3** (Infrastructure + Cloudflare)
   - SSH into VPS
   - Install all dependencies
   - Configure Cloudflare DNS

2. **Execute Phase 4-7** (Application deployment)
   - Deploy Lead Gen system
   - Set up WhatsApp gateway
   - Configure notifications

3. **Execute Phase 8-9** (Nginx + Testing)
   - Configure reverse proxy
   - Test all endpoints
   - Verify alerts working

4. **Go live and monitor**

### DEPLOYMENT COMMAND FOR CLAUDE CODE:
```
Give Claude Code:
1. This document: JASPER_MIGRATION_CHECKLIST.md
2. The deployment doc: JASPER_CLAUDE_CODE_DEPLOYMENT.md
3. Say: "Deploy JASPER Lead Gen system to VPS 72.61.201.237"
```

---

## 11. ROLLBACK PLAN

If deployment fails:
1. Keep current Vercel deployment as fallback
2. Cloudflare can switch DNS back instantly
3. VPS can be rebuilt from scratch (documented process)

---

**Document Status:** Ready for execution
**Last Updated:** December 2025
**Owner:** JASPER Financial Architecture
