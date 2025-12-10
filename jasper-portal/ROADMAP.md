# JASPER Business System Roadmap

**Goal**: Complete CRM + Project Management + Invoicing system for JASPER Financial Architecture

---

## Current State

**Phase 1 & 4 COMPLETE** - Database models, CRM service, and financial document generation built.

### Completed
- [x] SQLAlchemy models for all entities (Company, Contact, Project, Invoice, Document, Milestone, Interaction, MagicLink)
- [x] Alembic migrations setup
- [x] CRM service layer with full CRUD operations
- [x] Auth API with database-backed magic links
- [x] Clients API with real database queries
- [x] AI service aligned with model strategy docs (Nano Banana Pro via OpenRouter)
- [x] Email templates (design-aligned)
- [x] Design system rules document
- [x] Document generation service (app/services/documents.py)
- [x] Invoice PDF generation with V3 templates
- [x] Proposal PDF generation with package pricing
- [x] Crypto payment page PDF generation
- [x] Invoices API with database integration
- [x] Proposals API with package pricing
- [x] Media generation guide for AI (MEDIA_GENERATION_GUIDE.md)

### In Progress
- [ ] Connect to PostgreSQL and run migrations

### Next Up
- [ ] Connect to actual PostgreSQL database
- [ ] Run first migration
- [ ] Test with sample data

---

## Phase 1: Foundation (Database + Core Models) ✅ COMPLETE
**Priority: CRITICAL - Nothing works without this**

### 1.1 Database Setup
- [x] PostgreSQL database configuration (in config.py)
- [x] SQLAlchemy models for all entities (app/models/)
- [x] Alembic migrations setup (alembic/)
- [x] Connection pooling (in base.py)

### 1.2 Core Data Models

```
┌─────────────────────────────────────────────────────────────────┐
│                        JASPER CRM SCHEMA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPANIES ─────────────┬──────────────── CONTACTS              │
│  • id                   │                • id                   │
│  • name                 │                • first_name           │
│  • industry             │                • last_name            │
│  • country              │                • email                │
│  • website              │                • phone                │
│  • dfi_targets[]        │                • role                 │
│  • created_at           │                • is_primary           │
│                         │                • company_id (FK)      │
│                         │                                       │
│                         ▼                                       │
│  PROJECTS ◄────────────────────────────── INVOICES              │
│  • id                                    • id                   │
│  • company_id (FK)                       • project_id (FK)      │
│  • contact_id (FK)                       • invoice_number       │
│  • name                                  • type (deposit/final) │
│  • package (growth/inst/infra)           • amount               │
│  • stage (8 stages)                      • currency             │
│  • value                                 • status               │
│  • start_date                            • due_date             │
│  • target_completion                     • paid_date            │
│  • created_at                            • payment_method       │
│                                          • crypto_discount      │
│         │                                                       │
│         ▼                                                       │
│  MILESTONES                              DOCUMENTS              │
│  • id                                    • id                   │
│  • project_id (FK)                       • project_id (FK)      │
│  • name                                  • name                 │
│  • due_date                              • type                 │
│  • completed                             • file_path            │
│  • completed_date                        • uploaded_at          │
│                                          • uploaded_by          │
│         │                                                       │
│         ▼                                                       │
│  INTERACTIONS (Activity Log)             MAGIC_LINKS            │
│  • id                                    • id                   │
│  • company_id (FK)                       • contact_id (FK)      │
│  • contact_id (FK)                       • token                │
│  • project_id (FK)                       • expires_at           │
│  • type (email/call/meeting/note)        • used                 │
│  • subject                                                      │
│  • content                                                      │
│  • created_at                                                   │
│  • created_by                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: CRM Core Features

### 2.1 Client/Company Management
- [ ] Create company with contacts
- [ ] Update company details
- [ ] View company history (all interactions)
- [ ] Search/filter companies
- [ ] Tag companies (by DFI target, industry, etc.)

### 2.2 Contact Management
- [ ] Add/edit contacts per company
- [ ] Primary contact designation
- [ ] Contact activity history
- [ ] Email verification

### 2.3 Pipeline Management
- [ ] 8-stage pipeline view
- [ ] Drag-drop stage changes
- [ ] Stage change triggers (emails, tasks)
- [ ] Pipeline analytics (conversion rates)

### 2.4 Interaction Tracking
- [ ] Log emails (auto from SMTP)
- [ ] Log calls/meetings
- [ ] Add notes
- [ ] Activity timeline per client

---

## Phase 3: Project Workflow

### 3.1 Project Creation
- [ ] Create from pipeline (when stage = Deposit Paid)
- [ ] Package selection with auto-pricing
- [ ] Milestone template per package
- [ ] Assign team members

### 3.2 Project Tracking
- [ ] Milestone progress
- [ ] Time tracking (optional)
- [ ] Deliverable checklist
- [ ] Client portal view

### 3.3 Document Management
- [ ] Upload documents per project
- [ ] Version control
- [ ] Client upload portal
- [ ] Document categorisation

---

## Phase 4: Financial System ✅ COMPLETE

### 4.1 Proposal Generation
- [x] Generate from project details (app/api/proposals.py)
- [x] Use existing PDF template style (app/services/documents.py)
- [x] Package pricing auto-fill (PACKAGE_PRICING in models)
- [x] Quick quote endpoint for initial discussions
- [ ] Send via email with tracking

### 4.2 Invoice Generation
- [x] Generate deposit invoice (50%)
- [x] Generate final invoice (50%)
- [x] Use existing invoice_v3 template
- [x] Payment tracking (InvoiceStatus enum)
- [x] 3% crypto discount auto-apply
- [x] Crypto payment page PDF with QR codes

### 4.3 Payment Processing
- [ ] PayPal webhook integration
- [ ] Crypto payment verification
- [ ] Bank transfer confirmation
- [ ] Receipt generation

---

## Phase 5: Email Automation ✅ COMPLETE

### 5.1 Transactional Emails
- [x] Magic link login (app/services/email.py)
- [x] Welcome email
- [x] Proposal sent
- [x] Invoice sent
- [x] Payment confirmation
- [x] Design-aligned HTML templates with JASPER branding

### 5.2 Workflow Triggers
- [x] Proposal email on creation
- [x] Invoice email on creation
- [x] Payment confirmation on mark-paid
- [ ] Stage change notifications
- [ ] Reminder emails (intake incomplete)
- [ ] Project updates
- [ ] Draft ready for review

### 5.3 Email Tracking
- [ ] Open tracking
- [ ] Link click tracking
- [ ] Bounce handling

---

## Phase 6: AI Integration

### 6.1 Client Intake Processing
- [ ] OCR document extraction (Qwen3-VL 8B)
- [ ] Completeness analysis (Qwen3-VL 30B)
- [ ] Auto-populate project details

### 6.2 Content Generation
- [ ] Blog article pipeline
- [ ] Social media posts
- [ ] Email drafts

### 6.3 Analytics/Insights
- [ ] Client similarity matching
- [ ] Revenue forecasting
- [ ] Pipeline health scoring

---

## Phase 7: Admin Dashboard

### 7.1 Overview
- [ ] Active projects count
- [ ] Pipeline value
- [ ] Revenue this month
- [ ] Overdue items

### 7.2 Pipeline Board
- [ ] Kanban view of all stages
- [ ] Quick actions
- [ ] Filters (by package, value, date)

### 7.3 Reports
- [ ] Revenue by month
- [ ] Conversion rates
- [ ] Client acquisition cost
- [ ] Project profitability

---

## Phase 8: Client Portal

### 8.1 Authentication
- [ ] Magic link login (passwordless)
- [ ] Session management
- [ ] Multi-project access

### 8.2 Client Features
- [ ] View project status
- [ ] Download documents
- [ ] Upload requested files
- [ ] View/pay invoices
- [ ] Submit feedback

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Backend | FastAPI + Pydantic |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT + Magic Links |
| Email | aiosmtplib (Hostinger) |
| PDF | ReportLab (existing templates) |
| AI | OpenRouter (multi-model) |
| Storage | Local + S3 (future) |
| Frontend | Next.js (future) |

---

## Package Pricing Reference

| Package | Price | Timeline | Revision Rounds |
|---------|-------|----------|-----------------|
| Growth | $12,000 | 4-6 weeks | 2 |
| Institutional | $25,000 | 6-8 weeks | 3 |
| Infrastructure | $45,000 | 10-12 weeks | 4 |

**Payment Terms**: 50% deposit, 50% on delivery
**Crypto Discount**: 3% off total

---

## Immediate Next Steps

1. **Create SQLAlchemy models** - `app/models/` folder
2. **Setup Alembic** - Database migrations
3. **Build CRUD services** - Business logic layer
4. **Wire up API endpoints** - Connect to real database
5. **Test with sample data** - Verify pipeline works

---

*Last Updated: December 2025*
