# JASPER iMail EMV Platform

## Enterprise Email Marketing & CRM with AI Intelligence

**Version:** 1.0.0
**Total Codebase:** 11,182 lines of Python
**Monthly Operating Cost:** R0 (self-hosted)
**Built by:** JASPER Financial Architecture / Kutlwano Holdings

---

## Executive Summary

JASPER iMail EMV is a complete, self-hosted email marketing and CRM platform that combines enterprise-grade features with cutting-edge AI capabilities. Unlike Mailchimp, Salesforce, or HubSpot, this system runs entirely on your own infrastructure with ZERO monthly fees.

### Key Differentiators

| Feature | JASPER iMail EMV | Mailchimp | Salesforce |
|---------|------------------|-----------|------------|
| Monthly Cost | R0 | R1,500-R15,000 | R5,000-R50,000+ |
| AI Personalization | Local + Cloud | Basic | Add-on |
| Semantic Lead Search | Yes (Vector DB) | No | No |
| Learning from Wins | Yes (RAG) | No | Limited |
| Data Ownership | 100% Yours | Theirs | Theirs |
| Email Sequences | 8 Types | 3 Types | Varies |
| Reply Classification | AI-Powered | Manual | Manual |

---

## Platform Components

### 1. JASPER CRM Core (4,125 lines)

```
/opt/jasper-crm/
├── app/                    # FastAPI application
├── db/                     # PostgreSQL models & migrations
│   ├── database.py         # Connection management
│   └── tables.py           # SQLAlchemy ORM models
├── models/                 # Pydantic schemas
│   ├── lead.py             # Lead data models
│   ├── notification.py     # Notification system
│   └── email_sequence.py   # Sequence definitions
├── routes/                 # API endpoints
│   ├── leads.py            # Lead management
│   ├── sequences.py        # Sequence control
│   └── notifications.py    # Alert system
└── services/               # Business logic
    ├── ai_router.py        # Multi-model AI routing
    ├── aleph_client.py     # ALEPH AI integration
    ├── email_generator.py  # AI email personalization
    ├── email_sender.py     # SMTP delivery
    └── sequence_scheduler.py # Automation engine
```

### 2. ALEPH AI Infrastructure (7,057 lines)

```
/opt/aleph-ai/
├── api/                    # FastAPI endpoints
│   ├── main.py             # Core API
│   ├── embed.py            # Embedding endpoints
│   ├── search.py           # Vector search
│   ├── ingest.py           # Document ingestion
│   └── rag.py              # RAG pipeline
├── models/                 # AI model management
│   ├── gte_large.py        # GTE-Large embeddings
│   ├── smoldocling.py      # Document OCR
│   └── smolvlm.py          # Vision processing
└── data/
    └── milvus/             # Vector database (20 collections)
```

---

## Feature Breakdown

### Email Sequence Types

| Sequence | Steps | Trigger | AI Personalization |
|----------|-------|---------|-------------------|
| Welcome | 3 | New lead created | Yes |
| Nurture | 5 | Manual / Score-based | Yes |
| Proposal Follow-up | 4 | Proposal sent | Yes |
| Post-Win Onboarding | 3 | Deal won | Yes |
| Re-engagement | 4 | 30 days inactive | Yes |
| Referral Request | 2 | 60 days post-win | Yes |
| Event Follow-up | 3 | Event attendance | Yes |
| Post-Loss Recovery | 3 | Deal lost | Yes |

### AI Model Routing (Cost-Optimised)

| Task Type | Model | Cost per 1M Tokens | Usage % |
|-----------|-------|-------------------|---------|
| Classification | GPT-5 Nano | $0.05/$0.40 | 55-70% |
| Precision | GPT-5.1-Codex-Mini | $0.25/$2.00 | 15% |
| Research | Kimi-K2 | $0.45/$2.35 | 10% |
| Long-form | DeepSeek V3 | $0.27/$0.40 | 15-20% |
| Budget | DeepSeek-R1-Qwen-8B | $0.02/$0.10 | 5% |
| Fallback | Gemini Flash | FREE | Backup |

### ALEPH AI Capabilities (All FREE - Local)

| Capability | Model | Performance |
|------------|-------|-------------|
| Text Embeddings | GTE-Large-v1.5 | 1024 dims, <15ms |
| Document OCR | SmolDocling | 0.27B params |
| Vision Analysis | SmolVLM | 2B params |
| Vector Search | Milvus Lite | 20 collections |
| Semantic Matching | Cosine Similarity | Real-time |

---

## How the Integration Works

### Lead Lifecycle with AI

```
1. NEW LEAD CREATED
   ├── Embedded in Milvus (jasper_leads collection)
   ├── AI Qualification Score (1-10)
   ├── Package Recommendation (Foundation/Professional/Enterprise)
   └── Target DFI Suggestions

2. EMAIL SEQUENCE TRIGGERED
   ├── ALEPH finds similar WON leads
   ├── Retrieves sector insights (RAG)
   ├── OpenRouter generates personalised email
   └── SMTP delivers with tracking

3. REPLY RECEIVED
   ├── ALEPH classifies intent (POSITIVE/QUESTION/OBJECTION/etc.)
   ├── Suggested reply generated
   └── Next action recommended

4. DEAL WON/LOST
   ├── Lead re-embedded with outcome
   ├── System learns for future matching
   └── Similar leads benefit from insights
```

### RAG-Enhanced Email Generation

```python
# When generating an email, the system:

1. Builds lead context (company, sector, funding stage)
2. Queries ALEPH for:
   - Similar WON leads (social proof)
   - Winning templates (what worked before)
   - Sector insights (knowledge base)
3. Injects RAG context into AI prompt
4. Generates deeply personalised email
5. Tracks and learns from outcomes
```

---

## Technical Specifications

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4GB | 8GB+ |
| Storage | 20GB SSD | 50GB SSD |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 |
| Python | 3.10+ | 3.12 |

### Database Schema

```sql
-- Core Tables
leads              -- Lead information
email_sequences    -- Active sequences per lead
email_steps        -- Individual emails in sequences
sequence_templates -- Reusable sequence definitions
activity_log       -- All system activity
notifications      -- User alerts

-- Vector Collections (Milvus)
jasper_leads       -- Lead embeddings
jasper_emails      -- Email content embeddings
jasper_templates   -- Template embeddings
jasper_knowledge   -- Knowledge base
jasper_case_studies -- Success stories
```

### API Endpoints

```
# CRM Core
POST   /api/leads                 Create lead
GET    /api/leads                 List leads
GET    /api/leads/{id}           Get lead details
PUT    /api/leads/{id}           Update lead
POST   /api/leads/{id}/qualify   AI qualification

# Email Sequences
POST   /api/sequences/start      Start sequence
POST   /api/sequences/{id}/pause Pause sequence
POST   /api/sequences/{id}/resume Resume sequence
GET    /api/sequences/stats      Get statistics

# ALEPH AI
POST   /v1/embed                  Generate embedding
POST   /v1/embed/batch            Batch embeddings
POST   /v1/search                 Semantic search
POST   /v1/ingest/text            Index document
POST   /v1/rag/query              RAG query
GET    /health                    System status
```

---

## Licensing & Commercial Use

### Can Other Businesses Use This?

**YES** - with the following options:

#### Option 1: White-Label SaaS (Recommended)

JASPER/Kutlwano Holdings can offer this as a white-label solution:

| Tier | Features | Monthly Price |
|------|----------|---------------|
| Starter | 1,000 leads, 5 sequences, Basic AI | R2,500 |
| Growth | 10,000 leads, All sequences, Full AI | R7,500 |
| Enterprise | Unlimited, Custom AI, Priority support | R25,000+ |

**Revenue Potential:**
- 10 Starter clients = R25,000/month
- 5 Growth clients = R37,500/month
- 2 Enterprise clients = R50,000/month
- **Total: R112,500/month passive income**

#### Option 2: Self-Hosted License

Businesses can license the platform to run on their own infrastructure:

| License | Features | One-Time Price |
|---------|----------|----------------|
| Single Business | 1 installation | R75,000 |
| Agency | 5 installations | R250,000 |
| Unlimited | No restrictions | R750,000 |

#### Option 3: Managed Installation

JASPER provides full installation and management:

| Service | Includes | Price |
|---------|----------|-------|
| Setup | Full installation, configuration | R15,000 |
| Monthly Management | Updates, monitoring, support | R5,000/month |
| Custom Development | New features, integrations | R1,500/hour |

---

## Competitive Analysis

### vs Mailchimp

| Category | JASPER iMail EMV | Mailchimp |
|----------|------------------|-----------|
| 10K contacts/month | R0 | R1,500 |
| 100K contacts/month | R0 | R12,000 |
| AI Personalization | Included | Extra cost |
| Vector Search | Yes | No |
| Learning System | Yes | No |
| Data Location | Your server | USA |
| POPIA Compliance | Full control | Limited |

**Annual Savings:** R18,000 - R144,000+

### vs Salesforce + Marketing Cloud

| Category | JASPER iMail EMV | Salesforce |
|----------|------------------|------------|
| CRM + Email | R0 | R25,000+/month |
| AI Features | Included | Einstein (extra) |
| Setup Time | 1 day | 3-6 months |
| Customization | Full code access | Limited |
| Vendor Lock-in | None | High |

**Annual Savings:** R300,000+

### vs HubSpot

| Category | JASPER iMail EMV | HubSpot |
|----------|------------------|---------|
| Marketing Hub | R0 | R8,000+/month |
| AI Content | Included | Beta |
| Sequences | 8 types | 5 types |
| Lead Scoring | AI-powered | Rules-based |

**Annual Savings:** R96,000+

---

## Target Markets

### Ideal Customers for White-Label

1. **Financial Services**
   - Asset managers
   - Fund administrators
   - Investment advisors

2. **Professional Services**
   - Law firms
   - Accounting practices
   - Consulting firms

3. **B2B Companies**
   - Tech startups
   - Manufacturing
   - Logistics

4. **Real Estate**
   - Property developers
   - Agencies
   - REITs

### Geographic Focus

- **Primary:** South Africa (POPIA compliance advantage)
- **Secondary:** African markets (data sovereignty)
- **Tertiary:** Global (cost-conscious enterprises)

---

## Roadmap

### Phase 1: Current (Complete)
- Core CRM functionality
- 8 email sequence types
- AI personalization via OpenRouter
- ALEPH AI integration (embeddings, RAG, classification)
- SMTP email delivery

### Phase 2: Q1 2025
- Web dashboard (Next.js)
- Real-time analytics
- A/B testing framework
- Multi-tenant architecture

### Phase 3: Q2 2025
- WhatsApp integration
- SMS sequences
- Voice AI (call summaries)
- Mobile app

### Phase 4: Q3 2025
- White-label portal
- Self-service signup
- Stripe/PayStack billing
- Partner program

---

## Getting Started

### For JASPER Internal Use

Already deployed at:
- VPS: 72.61.201.237
- CRM: /opt/jasper-crm
- ALEPH: /opt/aleph-ai
- SMTP: models@jasperfinance.org

### For New Installations

```bash
# Clone repository
git clone https://github.com/kutlwano/jasper-imail-emv.git

# Run installer
./install.sh

# Configure
cp .env.example .env
nano .env

# Start services
systemctl start jasper-crm
systemctl start aleph-ai
```

---

## Support & Contact

**Technical Director:** Bakiel Nxumalo
**Company:** Kutlwano Holdings (Pty) Ltd
**Email:** models@jasperfinance.org
**Website:** jasperfinance.org

---

*Built with Century Gothic. Powered by ALEPH AI. Owned by you.*
