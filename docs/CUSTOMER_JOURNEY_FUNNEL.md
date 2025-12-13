# JASPER Financial Architecture - Customer Journey & Sales Funnel

## Overview

This document maps the complete customer journey from first contact to active project delivery, including AI integration points powered by ALEPH AI on Hostinger VPS.

---

## Infrastructure Reference

### ALEPH AI Platform (Hostinger VPS)
- **Location**: VPS on Hostinger Cloud
- **API Base**: `http://[VPS_IP]:8000`
- **Models**:
  - **Embeddings**: GTE-Large (1024 dims, self-hosted)
  - **Vision OCR**: SmolDocling (document extraction)
  - **Vision General**: SmolVLM-500M (image understanding)
  - **Completions**: OpenRouter (DeepSeek, Grok, Gemini FREE)
  - **Premium**: Claude Sonnet 4 (via Anthropic direct)

---

## Complete Customer Journey Funnel

```
                         JASPER CUSTOMER JOURNEY FUNNEL
                         ==============================

    ┌─────────────────────────────────────────────────────────────────────┐
    │                         1. AWARENESS                                │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Entry Points:                                                      │
    │  • Website (jasperfinance.org)                                      │
    │  • Referrals from DFIs/Partners                                     │
    │  • LinkedIn/Social Media                                            │
    │  • Industry Events/Conferences                                      │
    │  • Word of Mouth                                                    │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                      2. INTEREST / INTAKE                           │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Public Intake Form: portal.jasperfinance.org/intake                │
    │                                                                     │
    │  Data Collected:                                                    │
    │  • Full Name, Email, Company, Phone                                 │
    │  • Industry Sector (Renewable Energy, Data Centres, Agri, etc.)     │
    │  • Funding Stage (Seed, Series A/B, Growth, Established)            │
    │  • Funding Amount Sought (R1M - R500M+)                             │
    │  • Project Description (min 50 chars)                               │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #1                                  │    │
    │  │ ALEPH AI: Auto Lead Scoring                                 │    │
    │  │ POST /v1/crm/leads/score                                    │    │
    │  │ • Compares to won/lost deal patterns                        │    │
    │  │ • Calculates win probability (0-100%)                       │    │
    │  │ • Suggests package tier (Starter/Professional/Enterprise)   │    │
    │  │ • Matches suitable DFIs (IFC, AfDB, IFAD, etc.)             │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  Output: Lead ID (LEAD-{timestamp}-{random})                        │
    │  Destination: VPS CRM at 72.61.201.237:8001                         │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    3. QUALIFICATION (Sales Team)                    │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Admin Portal: Admin reviews intake submissions                     │
    │                                                                     │
    │  Qualification Criteria:                                            │
    │  • Budget alignment with JASPER packages                            │
    │  • Project complexity assessment                                    │
    │  • DFI eligibility check                                            │
    │  • Timeline feasibility                                             │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #2                                  │    │
    │  │ ALEPH AI: Meeting Preparation                               │    │
    │  │ POST /v1/crm/meetings/prepare                               │    │
    │  │ • Generates executive brief for discovery call              │    │
    │  │ • Retrieves relevant email history                          │    │
    │  │ • Surfaces similar past deals for reference                 │    │
    │  │ • Suggests discussion points & objection responses          │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  Actions:                                                           │
    │  • Discovery call scheduled                                         │
    │  • Invite sent to create Client Portal account                      │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │              4. CLIENT PORTAL REGISTRATION                          │
    │  ─────────────────────────────────────────────────────────────────  │
    │  URL: client.jasperfinance.org/register                             │
    │                                                                     │
    │  Registration Options:                                              │
    │  • Email/Password (with verification)                               │
    │  • Google OAuth (auto-verifies email)                               │
    │  • LinkedIn OAuth (auto-verifies email)                             │
    │                                                                     │
    │  Data Collected:                                                    │
    │  • Full Name                                                        │
    │  • Email Address                                                    │
    │  • Company Name (optional)                                          │
    │  • Password (8+ chars, uppercase, lowercase, number, special)       │
    │                                                                     │
    │  Status: pending_verification                                       │
    │  Database: client_users, client_onboarding tables created           │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    5. EMAIL VERIFICATION                            │
    │  ─────────────────────────────────────────────────────────────────  │
    │  URL: client.jasperfinance.org/verify-email                         │
    │                                                                     │
    │  Process:                                                           │
    │  • 6-digit verification code sent to email                          │
    │  • 15-minute expiry window                                          │
    │  • Rate limit: 5 attempts per 15 minutes                            │
    │  • Resend option: 1 per minute                                      │
    │                                                                     │
    │  On Success:                                                        │
    │  • Status changes: pending_verification → pending_approval          │
    │  • Admin notification email triggered                               │
    │  • Client redirected to /pending-approval page                      │
    │                                                                     │
    │  OAuth Note: Google/LinkedIn auto-verify, skip this step            │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                 6. ADMIN APPROVAL (GATE)                            │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Admin Portal: jasperfinance.org/admin/clients                      │
    │                                                                     │
    │  Admin Actions:                                                     │
    │  • Review registration details                                      │
    │  • Cross-reference with CRM intake data                             │
    │  • Verify company legitimacy                                        │
    │  • Approve or Reject registration                                   │
    │                                                                     │
    │  Client View: /pending-approval page                                │
    │  • "Account Pending Approval" message                               │
    │  • 3-step "What happens next" guide                                 │
    │  • Typical wait: < 24 hours                                         │
    │                                                                     │
    │  On Approval:                                                       │
    │  • Status: pending_approval → active                                │
    │  • Approval email sent to client                                    │
    │  • Client can now log in                                            │
    │                                                                     │
    │  ⚠️  MISSING COMPONENT IDENTIFIED:                                  │
    │  • No automated document request at this stage                      │
    │  • Should trigger: "Upload supporting documents" request            │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    7. FIRST LOGIN & ONBOARDING                      │
    │  ─────────────────────────────────────────────────────────────────  │
    │  URL: client.jasperfinance.org/ (dashboard)                         │
    │                                                                     │
    │  Onboarding Tour (5 Steps):                                         │
    │  1. Welcome to JASPER - Personalized greeting                       │
    │  2. Track Your Projects - Real-time updates                         │
    │  3. Access Your Documents - Secure file sharing                     │
    │  4. Stay Connected - Direct messaging                               │
    │  5. Your Data is Secure - Security features                         │
    │                                                                     │
    │  Database: client_onboarding.completed = TRUE                       │
    │                                                                     │
    │  ⚠️  MISSING COMPONENT IDENTIFIED:                                  │
    │  • No document upload prompt during onboarding                      │
    │  • Should include: "Upload your financials" step                    │
    │  • Should trigger AI document analysis                              │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │              8. DOCUMENT COLLECTION & ANALYSIS                      │
    │  ─────────────────────────────────────────────────────────────────  │
    │  URL: client.jasperfinance.org/documents (Coming Soon page)         │
    │                                                                     │
    │  Required Documents (Typical):                                      │
    │  • Financial Statements (3 years if available)                      │
    │  • Project Proposal/Business Plan                                   │
    │  • Company Registration Documents                                   │
    │  • Existing MOUs/Letters of Interest                                │
    │  • Technical Feasibility Studies                                    │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #3 - KEY ONBOARDING AI              │    │
    │  │ ALEPH AI: Document Analysis                                 │    │
    │  │ POST /v1/crm/documents/analyze                              │    │
    │  │                                                             │    │
    │  │ Pipeline:                                                   │    │
    │  │ 1. OCR extraction (SmolDocling) - tables, text              │    │
    │  │ 2. AI Analysis (DeepSeek) for structured insights           │    │
    │  │                                                             │    │
    │  │ For Financial Statements:                                   │    │
    │  │ • Revenue trend analysis                                    │    │
    │  │ • Financial health assessment                               │    │
    │  │ • Key ratios (debt-to-equity, current ratio)                │    │
    │  │ • Red flags identification                                  │    │
    │  │ • Strengths highlighting                                    │    │
    │  │ • Package recommendation                                    │    │
    │  │ • DFI matching suggestions                                  │    │
    │  │                                                             │    │
    │  │ For Proposals:                                              │    │
    │  │ • Project summary extraction                                │    │
    │  │ • Funding requirement identification                        │    │
    │  │ • Risk assessment                                           │    │
    │  │ • DFI alignment scoring (1-10)                              │    │
    │  │ • Missing information flags                                 │    │
    │  │                                                             │    │
    │  │ Output stored in: crm_documents vector collection           │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  ⚠️  CURRENT STATUS: /documents page is "Coming Soon"               │
    │  ⚠️  MISSING: Document upload UI & AI integration                   │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                   9. PROJECT CREATION                               │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Admin Action: Create project in system                             │
    │                                                                     │
    │  Project Details:                                                   │
    │  • Project name & description                                       │
    │  • Package tier (Starter/Professional/Enterprise)                   │
    │  • Target DFIs                                                      │
    │  • Timeline & milestones                                            │
    │  • Team assignment                                                  │
    │  • Deliverables list                                                │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #4                                  │    │
    │  │ ALEPH AI: Deal Tracking                                     │    │
    │  │ POST /v1/crm/deals/ingest                                   │    │
    │  │ • Stores deal for pattern matching                          │    │
    │  │ • Enables future lead scoring improvement                   │    │
    │  │ • Tracks win/loss outcomes                                  │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  Client Notification:                                               │
    │  • Email: "Your JASPER project has been created"                    │
    │  • Portal: Project appears in /projects page                        │
    │                                                                     │
    │  ⚠️  CURRENT STATUS: /projects page is "Coming Soon"                │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                   10. ACTIVE PROJECT DELIVERY                       │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Client Portal Features (Active):                                   │
    │                                                                     │
    │  /projects - Track progress, milestones, deliverables               │
    │  /documents - Access models, reports, download deliverables         │
    │  /messages - Communicate with JASPER team                           │
    │  /invoices - View billing, payment history                          │
    │  /settings - Manage profile, notifications                          │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #5                                  │    │
    │  │ ALEPH AI: Communication & Task Management                   │    │
    │  │                                                             │    │
    │  │ Email Drafting: POST /v1/crm/emails/draft                   │    │
    │  │ • Context-aware email generation                            │    │
    │  │ • Matches your writing style                                │    │
    │  │ • Suggests subject lines                                    │    │
    │  │                                                             │    │
    │  │ Task Prioritization: POST /v1/crm/tasks/prioritize          │    │
    │  │ • Eisenhower Matrix + Deal Value weighting                  │    │
    │  │ • Quick wins identification                                 │    │
    │  │ • Suggested daily schedule                                  │    │
    │  │                                                             │    │
    │  │ Weekly Analytics: GET /v1/crm/analytics/weekly              │    │
    │  │ • Pipeline health metrics                                   │    │
    │  │ • AI-generated insights                                     │    │
    │  │ • Performance recommendations                               │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  ⚠️  CURRENT STATUS: All feature pages are "Coming Soon"            │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    11. PROJECT COMPLETION                           │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Deliverables:                                                      │
    │  • Financial Model (Excel)                                          │
    │  • Supporting Documentation                                         │
    │  • DFI Application Package                                          │
    │  • Presentation Materials                                           │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #6                                  │    │
    │  │ ALEPH AI: Deal Outcome Tracking                             │    │
    │  │ POST /v1/crm/webhook (deal_won / deal_lost)                 │    │
    │  │ • Updates deal status                                       │    │
    │  │ • Captures outcome reason                                   │    │
    │  │ • Improves future lead scoring                              │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    │  Client Actions:                                                    │
    │  • Download final deliverables                                      │
    │  • Submit to DFIs                                                   │
    │  • Provide feedback                                                 │
    └────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    12. POST-PROJECT / RETENTION                     │
    │  ─────────────────────────────────────────────────────────────────  │
    │  Ongoing Relationship:                                              │
    │  • Access to past documents remains                                 │
    │  • Referral opportunities                                           │
    │  • Future project discussions                                       │
    │  • DFI funding success tracking                                     │
    │                                                                     │
    │  ┌─────────────────────────────────────────────────────────────┐    │
    │  │ 🤖 AI INTEGRATION POINT #7                                  │    │
    │  │ ALEPH AI: Automated Nurturing                               │    │
    │  │ POST /v1/crm/automation/trigger                             │    │
    │  │ • send_reminders: Follow-up on stale contacts               │    │
    │  │ • stale_deal_alert: Identify inactive opportunities         │    │
    │  │ • weekly_digest: Performance summaries                      │    │
    │  └─────────────────────────────────────────────────────────────┘    │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## Identified Gaps & Missing Components

### Critical Missing Components

| # | Gap | Current State | Required Action | Priority |
|---|-----|---------------|-----------------|----------|
| 1 | **Document Upload UI** | /documents is "Coming Soon" | Build document upload interface with AI integration | HIGH |
| 2 | **Onboarding Document Request** | No prompt during onboarding | Add step 6: "Upload Your Documents" | HIGH |
| 3 | **AI Document Analysis Integration** | API exists but not connected | Connect `/v1/crm/documents/analyze` to client portal | HIGH |
| 4 | **Projects Page** | "Coming Soon" placeholder | Build project tracking dashboard | MEDIUM |
| 5 | **Messages Page** | "Coming Soon" placeholder | Build messaging system | MEDIUM |
| 6 | **Invoices Page** | "Coming Soon" placeholder | Build billing/invoice viewer | MEDIUM |
| 7 | **Settings Page** | "Coming Soon" placeholder | Build settings/preferences UI | LOW |

### AI Integration Status

| AI Endpoint | Status | Connected To |
|------------|--------|--------------|
| `/v1/crm/leads/score` | Ready | Not integrated (manual scoring) |
| `/v1/crm/documents/analyze` | Ready | Not integrated (no upload UI) |
| `/v1/crm/emails/draft` | Ready | Not integrated |
| `/v1/crm/meetings/prepare` | Ready | Not integrated |
| `/v1/crm/tasks/prioritize` | Ready | Not integrated |
| `/v1/crm/webhook` | Ready | Not integrated |
| `/v1/crm/analytics/weekly` | Ready | Not integrated |

---

## Recommended Implementation Order

### Phase 1: Document Collection (Critical for Onboarding)
1. Build `/documents` page with file upload capability
2. Connect to ALEPH AI `/v1/crm/documents/analyze`
3. Add "Upload Documents" step to onboarding flow
4. Show AI analysis results to admin

### Phase 2: Project Tracking
1. Build `/projects` page with milestone tracking
2. Connect project creation to deal ingestion
3. Real-time status updates

### Phase 3: Communication
1. Build `/messages` page
2. Integrate email drafting AI
3. Notification system

### Phase 4: Analytics & Automation
1. Admin dashboard with AI analytics
2. Automated lead scoring on intake
3. Automated follow-up reminders

---

## API Endpoints Reference

### ALEPH AI (Hostinger VPS)

```
Base URL: http://[VPS_IP]:8000
Header: X-API-Key: jasper_sk_live_xxxxx

# Document Analysis (KEY for Onboarding)
POST /v1/crm/documents/analyze
Body: {
  "document": "<base64 encoded file>",
  "contact_id": "uuid",
  "document_type": "financial_statement|proposal|mou|other",
  "filename": "financials.pdf"
}
Returns: Analysis with red flags, strengths, package recommendation, DFI matches

# Lead Scoring
POST /v1/crm/leads/score
Body: {
  "company": "Client Company",
  "industry": "Renewable Energy",
  "project_description": "Solar farm project...",
  "budget_range": "R10-50M",
  "timeline": "6 months"
}
Returns: Score (0-100), win probability, similar deals, recommendations

# Email Context
POST /v1/crm/emails/context
Body: {
  "contact_id": "uuid",
  "new_situation": "Follow up on proposal"
}
Returns: Summary, key points, tone recommendation, relevant emails

# Meeting Prep
POST /v1/crm/meetings/prepare
Body: {
  "contact_id": "uuid",
  "meeting_purpose": "Discovery call for solar project"
}
Returns: Brief, quick stats, key documents, recent emails
```

---

## Database Schema Reference

### Client Portal Tables

```sql
-- Core user account
client_users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  full_name VARCHAR,
  company_name VARCHAR,
  status VARCHAR -- pending_verification, pending_approval, active, suspended
  email_verified BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMP
)

-- Onboarding progress
client_onboarding (
  user_id UUID UNIQUE,
  completed BOOLEAN,
  step_welcome BOOLEAN,
  step_profile BOOLEAN,
  step_company BOOLEAN,
  step_tour BOOLEAN,
  step_preferences BOOLEAN,
  current_step INTEGER
)

-- Session management
client_sessions (
  user_id UUID,
  token_hash VARCHAR,
  refresh_token_hash VARCHAR,
  expires_at TIMESTAMP -- 15 minutes
  refresh_expires_at TIMESTAMP -- 7 days
)
```

### ALEPH AI Collections (Milvus)

```
crm_contacts    - Contact profiles (1024-dim embeddings)
crm_emails      - Email content for semantic search
crm_documents   - Analyzed documents with insights
crm_deals       - Deal patterns for lead scoring
crm_meetings    - Meeting notes and summaries
```

---

## Conclusion

The customer journey framework is well-designed with comprehensive AI capabilities ready in ALEPH AI. The primary gap is the **document collection and analysis step** during client onboarding. This is the most critical missing piece as:

1. It's the natural point to trigger AI document analysis
2. Required documents inform project scoping
3. AI insights improve sales qualification
4. DFI matching happens automatically

**Next Steps**: Prioritize building the `/documents` page with AI-powered upload and analysis integration.
