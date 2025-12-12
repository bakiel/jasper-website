# JASPER Financial Architecture - Claude Code Guide

## Quick Reference
- **Business**: JASPER™ DFI Financial Modeling ($45K-$750K packages)
- **Owner**: Bakiel Nxumalo, Technical Director - Kutlwano Holdings
- **VPS**: root@72.61.201.237 (Hostinger, Ubuntu 24.04)
- **Design**: Century Gothic font (MANDATORY), #2C8A5B emerald, #0F172A navy

---

## SEO & KEYWORD RESEARCH

### Autonomous Workflow
When working on marketing, content, or SEO tasks, Claude should:

1. **Determine keywords from context** - Based on:
   - Current project/page being worked on
   - JASPER service offerings (DFI modeling, infrastructure finance, agricultural funding)
   - Target audience (African DFIs, sovereign wealth funds, institutional investors)
   - Content gaps identified in the project

2. **Run research automatically**:
```bash
ssh root@72.61.201.237 "python3 /opt/seo-tools/seo.py 'KEYWORD'"
```

3. **Retrieve results**:
```bash
ssh root@72.61.201.237 "cat /opt/seo-tools/outputs/KEYWORD_keywords.csv"
```

### JASPER Marketing Keywords (Pre-identified)
Research these based on task context:

| Service Area | Seed Keywords |
|-------------|---------------|
| Core Service | financial modeling africa, DFI investment, infrastructure finance |
| Agricultural | agricultural funding africa, farm investment model, agribusiness finance |
| Energy | renewable energy financing africa, solar project funding, IPP investment |
| Target Clients | development finance institution, sovereign wealth fund investment |
| Competitors | financial model template, excel financial model, project finance model |

### Example: Autonomous SEO for Landing Page
```
Task: "Create landing page for JASPER agricultural services"

Claude should:
1. Identify relevant seeds: "agricultural funding africa", "farm financial model", "agribusiness investment"
2. Run: ssh root@72.61.201.237 "python3 /opt/seo-tools/seo.py 'agricultural funding africa'"
3. Analyze top keywords for H1, H2, meta description
4. Incorporate naturally into copy
```

---

## DESIGN SYSTEM (MANDATORY)

### Typography
- **Font**: Century Gothic - USE EVERYWHERE (Never Calibri/Arial)
- **Headings**: Century Gothic Bold
- **Body**: Century Gothic Regular

### Colors
```
Primary:    #2C8A5B (Emerald green)
Secondary:  #0F172A (Dark navy)  
Accent:     #F59E0B (Amber)
Background: #FFFFFF / #F8FAFC
Text:       #1E293B
```

### Excel Standards
- Headers: Century Gothic 11pt Bold, #2C8A5B background, white text
- Data: Century Gothic 10pt, #0F172A text
- Currency: Always with symbol + thousands separator (R 1,234,567)
- Dates: DD-MMM-YYYY format

---

## PROJECT STRUCTURE

```
jasper-financial-architecture/
├── app/                        # Marketing site pages (React/Vite)
├── components/                 # Marketing site components
├── jasper-api/                 # Backend API (Vercel Serverless) → api.jasperfinance.org
├── jasper-portal-frontend/     # Client Portal (Next.js) → portal.jasperfinance.org
├── branding/
│   ├── logos/                  # 3 core logo files (1.2MB)
│   ├── infographics/           # JASPER architecture diagrams (52MB)
│   └── templates/              # Design system templates (26MB)
├── templates/                  # Excel model templates (40MB)
├── docs/                       # Documentation
├── seo/                        # SEO research outputs
└── scripts/                    # Automation scripts
```

**DELETED (redundant):**
- `jasper-portal/` - Old Python backend (replaced by jasper-api)
- `dist/` - Build output (regeneratable)
- `branding/jpeg/` - Duplicate JPEG versions
- Bloated AI-generated logo files (50MB saved)

---

## ARCHITECTURE: Pure Python (Anti-n8n Position)

**Strategic Decision:** Code-first, Pure Python approach for all automation.
*"Clients don't want visual dashboards to fiddle with — they want systems that work."*

See: `/Users/mac/Downloads/PURE_PYTHON_ARCHITECTURE_STRATEGY.md`

### Stack
| Component | Purpose |
|-----------|---------|
| **FastAPI** | REST endpoints, webhooks (async, type-safe) |
| **Pydantic** | Data validation & models |
| **Celery + Redis** | Background tasks, scheduling |
| **PostgreSQL** | Persistent storage |
| **Claude Agent SDK** | AI automation |

### Why Not n8n
- n8n is pre-installed but **intentionally unused**
- Visual workflow ≠ automation — code is more powerful
- Complex JASPER™ calculations don't fit node paradigm
- Claude Code writes Python directly → 100% automation

---

## VPS INFRASTRUCTURE (72.61.201.237)

### Services Status
| Service | Port | URL | Status |
|---------|------|-----|--------|
| jasper-portal | 3000 | https://portal.jasperfinance.org | PM2 |
| jasper-api | 3001 | https://api.jasperfinance.org | PM2 |
| jasper-crm | 8001 | Internal | systemd |
| aleph-ai | 8000 | https://ai.jasperfinance.org | systemd |
| Traefik | 80/443 | Reverse proxy | Docker |

### Commands
```bash
# Check PM2 services
ssh root@72.61.201.237 "pm2 status"

# View logs
ssh root@72.61.201.237 "pm2 logs jasper-api --lines 50"

# Restart services
ssh root@72.61.201.237 "pm2 restart all"

# Check systemd services
ssh root@72.61.201.237 "systemctl status jasper-crm aleph-ai"

# Run backup
ssh root@72.61.201.237 "/opt/scripts/backup.sh"

# Check backup status
ssh root@72.61.201.237 "/opt/scripts/status.sh"
```

### SEO Research
```bash
# Research keywords
ssh root@72.61.201.237 "python3 /opt/seo-tools/seo.py 'your keyword'"

# View results
ssh root@72.61.201.237 "cat /opt/seo-tools/outputs/your_keyword_keywords.csv"
```

---

## AI MODEL ROUTING (OpenRouter)

| Task | Model | Use Case |
|------|-------|----------|
| Classification | GPT-5 Nano | Lead scoring, email sorting (60%) |
| Code/Drafts | GPT-5.1-Codex-Mini | Client emails, code gen (15%) |
| Long-form | DeepSeek V3.2 | Proposals, reports (20%) |
| Fallback | Gemini Flash | Simple queries (5% - FREE) |

---

## PAYMENT TERMS

- **South Africa**: FNB (Gahn Eden account)
- **International**: 5% discount for USDT TRC-20/ERC-20 (Binance)
- **Standard**: 50% upfront, 50% on delivery

---

## DO / DON'T

### DO
- Use Century Gothic for ALL text outputs
- Run SEO research for any content/marketing task
- Use emerald (#2C8A5B) as primary brand color
- Include R currency symbol with formatting
- Deploy to VPS via SSH commands

### DON'T
- Use Calibri, Arial, or system fonts
- Create content without keyword research
- Hardcode API keys (use .env)
- Skip the design system

---

## KEY URLs

- **Main Site**: https://jasperfinance.org (Vercel)
- **Client Portal**: https://portal.jasperfinance.org (VPS)
- **API**: https://api.jasperfinance.org (VPS)
- **ALEPH AI**: https://ai.jasperfinance.org (VPS)
- **VPS IP**: 72.61.201.237

### Credentials (Store Securely)
```
Admin Login:
  Email: admin@jasperfinance.org
  Password: I0y2Q7418LnCPTvjJZH7cb6j
```

---

## COMPLETED WORK LOG

### 2025-12-11: Security Hardening & VPS Deployment

**Security Fixes (17 vulnerabilities resolved):**
| Issue | Severity | Fix |
|-------|----------|-----|
| Google OAuth email_verified | CRITICAL | Handles boolean + string |
| Wildcard CORS | HIGH | Origin whitelist applied |
| Fallback password auth | CRITICAL | Removed completely |
| CRM unprotected | CRITICAL | JWT authentication added |
| Traefik dashboard exposed | HIGH | Disabled --api.insecure |
| Weak admin password | HIGH | Strong password generated |

**Infrastructure Updates:**
- Portal & API deployed to VPS via PM2
- Traefik reverse proxy configured (SSL auto-renewal)
- DNS updated: portal, api, ai subdomains → VPS
- n8n stopped (Pure Python architecture adopted)
- B2 backup system installed (daily incremental)
- Backup script fixed for B2 CLI v4

**Files Modified:**
- `jasper-api/api/admin/auth/google.js` - email_verified fix
- `jasper-api/api/admin/auth/login.js` - Removed fallback auth
- `jasper-api/api/crm/leads.js` - Added JWT auth

### 2025-12-10: UX Improvements (Session)
All 6 UX enhancements completed and deployed:

| Feature | File(s) | Description |
|---------|---------|-------------|
| Empty States | `components/ui/EmptyState.tsx` | Type-based variants (projects, clients, invoices, messages, search) with icons and CTAs |
| Skeleton Loaders | `components/ui/Skeleton.tsx` | SkeletonTable, SkeletonGrid, SkeletonCard with pulse animations |
| Mobile Responsive | `components/layout/Sidebar.tsx`, `AuthenticatedLayout.tsx` | Hamburger menu, slide-out drawer, proper margins |
| Breadcrumbs | `components/ui/Breadcrumbs.tsx` | Presets for Client, Project, Invoice detail pages |
| Bulk Actions | `app/invoices/page.tsx` | Multi-select checkboxes, bulk export CSV, selection highlighting |
| Global Search | `components/ui/GlobalSearch.tsx` | Cmd+K shortcut, searches clients/projects/invoices/pages |

### 2025-12-10: Templates & Cleanup
- Invoice template ready: `templates/invoice.pdf` (JASPER branded, crypto/bank/PayPal)
- Proposal template ready: `templates/proposal.pdf` (JASPER branded)
- Generator script: `templates/generate_invoice.py`
- Deleted old v2 versions and samples

### 2025-12-10: Dashboard Duplicate Fix
- Removed duplicate "Pending Payments" card from dashboard
- Renamed "Recent Inquiries" to "Recent Activity" for clarity
- Dashboard now has: Stats grid → Pipeline + Activity → Projects + Invoices → Activity Log

### Previous Session: Security & Infrastructure
- CSRF protection middleware
- Rate limiting on API endpoints
- Real-time form validation
- Error boundary components
- Google OAuth authentication
- DNS configured on Hostinger (portal, api, www subdomains → Vercel)
