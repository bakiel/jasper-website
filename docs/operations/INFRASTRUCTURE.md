# JASPER Infrastructure Setup (Corrected)

**Purpose:** Complete technical infrastructure documentation
**Base:** Hostinger VPS (already owned)
**Last Updated:** December 2025

---

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HOSTINGER VPS (srv1145603)                          │
│                      (ALREADY PAID - 24 MONTHS)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │  PostgreSQL  │◄────►│     n8n      │◄────►│   Hostinger  │          │
│  │   Database   │      │  Workflows   │      │     SMTP     │          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│         ▲                     │                     │                   │
│         │                     │                     ▼                   │
│  ┌──────┴───────┐      ┌──────▼───────┐      ┌──────────────┐          │
│  │    Redis     │      │   Next.js    │      │    Email     │          │
│  │    Cache     │      │   Website    │      │   Delivery   │          │
│  └──────────────┘      └──────────────┘      │   (FREE)     │          │
│                                               │  30K/month   │          │
│                                               └──────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘

EXTERNAL SERVICES (API Calls):
┌────────────────────────────────────────┐
│  OpenRouter ($20-50/month)             │
│  ├─ Gemini 3 Pro (content generation)  │
│  └─ Claude (analysis)                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Higgsfield/Nano Banana Pro            │
│  ├─ UNLIMITED 2K images                │
│  ├─ R5,292/year ($24.50/mo)            │
│  └─ ALREADY PAID ANNUALLY ✅            │
└────────────────────────────────────────┘
```

---

## Core Infrastructure (Already Owned)

### Hostinger VPS

```
SERVER DETAILS
──────────────
Server: srv1145603.hstgr.cloud
IP: 72.61.201.237
Specs:
├─ 2 CPU cores
├─ 8GB RAM
├─ 100GB storage
├─ 8TB bandwidth
├─ Ubuntu 24.04
└─ Cost: $0/month (prepaid for 24 months)

Status: ✅ OWNED - No additional cost
```

### Pre-Installed Services

```
ALREADY AVAILABLE
─────────────────
✅ n8n workflow automation (pre-installed)
✅ Docker (pre-installed)
✅ Hostinger control panel
✅ FREE email (1,000 emails/day per mailbox)
✅ SSH access
✅ Root access
```

### n8n Access

```
URL: https://n8n.srv1145603.hstgr.cloud
Status: ✅ Ready to use
Login: Hostinger credentials
```

---

## Email Infrastructure (FREE)

### Hostinger Email (Included)

```
SMTP SETTINGS
─────────────
Server: smtp.hostinger.com
Port: 587
TLS: Yes

CAPACITY PER MAILBOX
────────────────────
├─ 1,000 emails/day
├─ 30,000 emails/month
└─ Can create 100+ mailboxes

TOTAL CAPACITY
──────────────
└─ 3,000,000 emails/month (100 mailboxes)

JASPER ACTUAL NEEDS
───────────────────
├─ JASPER: ~200 emails/month
└─ Using: 0.7% of ONE mailbox capacity

Cost: $0 (included with VPS) ✅
```

### What We DON'T Need

```
REJECTED SERVICES
─────────────────
❌ Brevo Starter: $122/year - NOT NEEDED
❌ SendGrid: $180/year - NOT NEEDED
❌ Google Workspace: $84/year - NOT NEEDED
❌ Vercel email: NOT NEEDED

Reason: Hostinger gives 100x capacity for FREE
```

---

## Database Layer (FREE)

### PostgreSQL

```
INSTALLATION
────────────
sudo apt update
sudo apt install postgresql postgresql-contrib

DATABASE
────────
Name: jasper_crm
Host: localhost:5432
User: jasper_admin

CAPACITY
────────
├─ Unlimited contacts
├─ Unlimited storage (within 100GB VPS)
└─ No per-contact fees

Cost: $0 (self-hosted)
```

### Redis Cache

```
INSTALLATION
────────────
sudo apt install redis-server

CONFIGURATION
─────────────
Host: localhost:6379
Memory: ~100MB RAM usage

USES
────
├─ Super fast queries
├─ Session management
└─ Caching

Cost: $0 (self-hosted)
```

---

## Website Hosting

### Option 1: Self-Hosted on VPS (Recommended)

```
NEXT.JS ON VPS
──────────────
├─ Deploy directly to Hostinger VPS
├─ Use PM2 for process management
├─ Nginx as reverse proxy
├─ Let's Encrypt for SSL
└─ Cost: $0 (already paid)

SETUP
─────
1. Build Next.js site
2. Upload to VPS
3. Configure Nginx
4. Enable SSL
```

### Option 2: Vercel (Alternative)

```
IF PREFERRED
────────────
├─ Free tier available
├─ Automatic deployments
├─ Custom domain support
└─ But: adds external dependency

For simplicity, can use Vercel for website
while keeping everything else on VPS.
```

---

## Domain & DNS

### Current Setup

```
DOMAIN
──────
jasperfinance.org
Registrar: Hostinger
Expires: December 2026
Cost: ~$12/year (~$1/month)
```

### DNS Configuration

```
RECORDS
───────
A       @       72.61.201.237        (VPS IP)
CNAME   www     jasperfinance.org
MX      @       mx1.hostinger.com
TXT     @       SPF record
CNAME   _dkim   DKIM record
TXT     _dmarc  DMARC record
```

---

## AI Services (External APIs)

### OpenRouter (AI Gateway)

```
PURPOSE
───────
Single API for multiple AI models
Cost: $20-50/month (usage-based)

MODELS USED
───────────
┌────────────────────────────────────────────────────────────┐
│ DeepSeek V3.2 - Research & Orchestration                   │
├────────────────────────────────────────────────────────────┤
│ Model: deepseek/deepseek-chat                              │
│ Pricing:                                                   │
│ ├─ Input: $0.028/1M (cache hit) / $0.28/1M (cache miss)   │
│ └─ Output: $0.42/1M tokens                                 │
│ Use: Research, analysis, agentic orchestration             │
│ Features: Native thinking mode, tool-use integration       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Claude Sonnet 4.5 - Writing & Polish                       │
├────────────────────────────────────────────────────────────┤
│ Model: anthropic/claude-sonnet-4-5                         │
│ Pricing:                                                   │
│ ├─ Input: $3.00/1M tokens                                  │
│ └─ Output: $15.00/1M tokens                                │
│ Use: Article writing, content polish, final output         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ DeepSeek-OCR - Document Processing                         │
├────────────────────────────────────────────────────────────┤
│ Model: deepseek/deepseek-ocr                               │
│ Released: October 2025 (open-source)                       │
│ Architecture: 3B parameters (MoE)                          │
│ Compression: 10x (2000-5000 → 200-400 tokens)              │
│ Accuracy: ~97% at 10x compression                          │
│ Capabilities:                                              │
│ ├─ Parse charts, tables, formulas                          │
│ ├─ Extract geometric figures                               │
│ └─ Output structured formats (HTML, SMILES)                │
│ Use: OCR, document parsing, chart extraction               │
│ Note: Nano Banana handles ALL image generation             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ GPT-5 nano - Fast Execution (Optional)                     │
├────────────────────────────────────────────────────────────┤
│ Model: openai/gpt-5-nano                                   │
│ Pricing:                                                   │
│ ├─ Input: $0.05/1M tokens                                  │
│ └─ Output: $0.40/1M tokens                                 │
│ Use: Fast tool execution, simple tasks                     │
│ Note: For two-agent architecture (DeepSeek plans, GPT exec)│
└────────────────────────────────────────────────────────────┘

SETUP
─────
1. Create OpenRouter account
2. Get API key
3. Configure in n8n (HTTP Request node)
4. Base URL: https://openrouter.ai/api/v1
```

### Nano Banana Pro (Already Purchased)

```
PLATFORM: Higgsfield.ai
PLAN: Ultimate Annual
COST: R5,292/year ($24.50/month)

CAPABILITIES
────────────
├─ UNLIMITED 2K image generation
├─ 8 concurrent generations
├─ Perfect text rendering (94% accuracy)
├─ Up to 14 reference images
├─ Multi-language support
├─ 1,200 video credits/month
└─ Commercial rights included

USES FOR JASPER
───────────────
├─ Email marketing images
├─ Proposal visuals
├─ Client deliverables
└─ Marketing materials

Status: ✅ PURCHASED
```

---

## CRM Features

### Contact Management

```
STRUCTURE
─────────
├─ Auto-create from email/forms
├─ AI enrichment via Gemini 3
├─ Unlimited contacts
└─ PostgreSQL database

PIPELINE STAGES
───────────────
JASPER:
├─ Inquiry
├─ Discovery
├─ Proposal Sent
├─ Negotiation
├─ Won / Lost
```

### Automation Workflows

```
n8n WORKFLOWS
─────────────
1. inquiry-received
2. send-intake
3. intake-received
4. send-proposal
5. proposal-followup
6. send-deposit-invoice
7. deposit-received
8. send-milestone-update
9. send-draft
10. feedback-received
11. send-balance-invoice
12. final-delivery
13. send-close-survey
```

---

## Forms

### Tally (Free) or n8n Forms

```
OPTION 1: TALLY
───────────────
├─ Free tier sufficient
├─ Easy embedding
├─ Webhook to n8n

OPTION 2: n8n FORMS
───────────────────
├─ Built into n8n
├─ Direct workflow trigger
├─ No external dependency
├─ Fully self-hosted

RECOMMENDED: n8n Forms (keeps everything on VPS)
```

---

## Actual Monthly Costs

### Corrected Cost Breakdown

```
FIXED COSTS (Already Paid)
──────────────────────────
├─ Hostinger VPS: $0/month (prepaid 24 months)
├─ Email: $0/month (included)
├─ n8n: $0/month (self-hosted)
├─ PostgreSQL: $0/month (self-hosted)
├─ Redis: $0/month (self-hosted)
├─ Domain: ~$1/month ($12/year)
└─ Total Fixed: ~$1/month ✅

VARIABLE COSTS (API Usage)
──────────────────────────
├─ OpenRouter (Gemini 3 + Claude): $20-50/month
├─ Nano Banana Pro: $24.50/month (R5,292/year - already paid)
└─ Buffer: $5-10/month

CURRENT TOTAL: ~$50-85/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT YOU'RE REPLACING
─────────────────────
├─ HubSpot: $600-38,400/year ❌
├─ Salesforce: $3,600-43,200/year ❌
├─ Brevo: $122/year ❌
├─ SendGrid: $180/year ❌
└─ Savings: $4,502-81,902/year ✅
```

---

## Setup Checklist

### Phase 1: Foundation (6 hours)

```
□ SSH into VPS (ssh root@72.61.201.237)

□ Install PostgreSQL:
  sudo apt update
  sudo apt install postgresql postgresql-contrib

□ Install Redis:
  sudo apt install redis-server

□ Create CRM database:
  sudo -u postgres createdb jasper_crm

□ Create database schema (contacts, deals, activities)

□ Configure Hostinger SMTP in n8n:
  Server: smtp.hostinger.com
  Port: 587
  TLS: Yes

□ Test email sending (send 5 test emails)

□ Import 10 test contacts

□ Verify all systems working
```

### Phase 2: CRM Build (4 hours)

```
□ Build n8n workflows:
  ├─ Email → Contact creation
  ├─ Form submission → Pipeline entry
  ├─ AI enrichment (OpenRouter/Gemini)
  └─ Automated follow-ups

□ Set up JASPER pipeline stages

□ Configure lead scoring rules

□ Create basic dashboard (n8n UI)
```

### Phase 3: Website (4 hours)

```
□ Build Next.js site from page specs
□ Deploy to VPS (or Vercel)
□ Configure domain DNS
□ Enable SSL (Let's Encrypt)
□ Embed forms
□ Test all pages
```

### Phase 4: Integration (2 hours)

```
□ Integrate Nano Banana Pro with n8n
□ Build image generation workflow
□ Set up email templates
□ Test end-to-end client journey
```

---

## Security Checklist

```
VPS SECURITY
────────────
☐ UFW firewall enabled
☐ SSH key authentication only (disable password)
☐ Fail2ban installed
☐ PostgreSQL: localhost only access
☐ Regular backups to Google Drive
☐ SSL certificates (Let's Encrypt)

API SECURITY
────────────
☐ OpenRouter API key in environment variables
☐ Rate limiting on n8n webhooks
☐ CAPTCHA on public forms
☐ Email verification for new contacts

DATA SECURITY
─────────────
☐ Database encrypted at rest
☐ Backups encrypted
☐ Privacy policy published
☐ Contact opt-out mechanism
```

---

## Backup Strategy

### Google Drive Structure

```
Kutlwano Holdings/
├─ Backups/
│  ├─ Database/ (weekly PostgreSQL dumps)
│  ├─ n8n-workflows/ (workflow exports)
│  └─ Configs/ (system configurations)
│
└─ JASPER/
   ├─ Client-Projects/
   └─ Templates/
```

### Backup Schedule

```
DAILY
─────
├─ Automatic (cloud services)
└─ n8n workflow auto-save

WEEKLY
──────
├─ PostgreSQL database dump
└─ Export to Google Drive

MONTHLY
───────
└─ Full backup verification
```

---

## Access Points

```
JASPER INFRASTRUCTURE
─────────────────────
VPS SSH:     ssh root@72.61.201.237
n8n:         https://n8n.srv1145603.hstgr.cloud
Database:    localhost:5432
Redis:       localhost:6379
Website:     https://jasperfinance.org
Email:       models@jasperfinance.org
```

---

## Quick Reference

```
MONTHLY COSTS SUMMARY
─────────────────────
Infrastructure:  ~$1/month (domain only)
APIs:            $45-75/month (OpenRouter + Nano Banana)
Total:           ~$50-85/month

CAPACITY
────────
Email:     30,000/month per mailbox (FREE)
Database:  Unlimited contacts
Images:    Unlimited (Nano Banana Pro)
Video:     1,200 credits/month
```

---

*Infrastructure v2.0 - Corrected December 2025*
*Based on actual Hostinger VPS ownership*
