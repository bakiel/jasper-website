# JASPER Portal Architecture Diagram

**Last Updated:** December 11, 2025
**Version:** 1.0

---

## HIGH-LEVEL OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              JASPER FINANCIAL ARCHITECTURE                               │
│                                   System Overview                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   USERS     │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
           ┌───────────────┐     ┌───────────────┐      ┌───────────────┐
           │  Public Site  │     │ Admin Portal  │      │ Client Portal │
           │  (Marketing)  │     │   (CRM/Ops)   │      │   (Future)    │
           └───────┬───────┘     └───────┬───────┘      └───────────────┘
                   │                     │
                   │    ┌────────────────┘
                   │    │
                   ▼    ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                         VERCEL EDGE                              │
        │  ┌─────────────────┐              ┌─────────────────────────┐   │
        │  │ jasperfinance   │              │ portal.jasperfinance    │   │
        │  │ .org            │              │ .org                    │   │
        │  │ (Main Website)  │              │ (Admin Portal)          │   │
        │  └────────┬────────┘              └───────────┬─────────────┘   │
        │           │                                   │                  │
        │           │         ┌─────────────────────────┘                  │
        │           │         │                                            │
        │           ▼         ▼                                            │
        │  ┌──────────────────────────────────────────────────────────┐   │
        │  │              api.jasperfinance.org                        │   │
        │  │                  (Vercel Serverless)                      │   │
        │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
        │  │  │  /contact  │ │ /admin/auth│ │ /crm/leads │            │   │
        │  │  │  /imail    │ │ /crm/intake│ │ /invoices  │            │   │
        │  │  └────────────┘ └────────────┘ └────────────┘            │   │
        │  └──────────────────────────┬───────────────────────────────┘   │
        └─────────────────────────────┼───────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
          │   VPS Backend   │ │   Google    │ │   Hostinger     │
          │  72.61.201.237  │ │   OAuth     │ │   SMTP          │
          │   (PostgreSQL)  │ │             │ │                 │
          └─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## DETAILED FRONTEND ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           JASPER ADMIN PORTAL (Frontend)                                 │
│                         portal.jasperfinance.org | Vercel                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              Next.js 14 (App Router)
                              React 18 + TypeScript
                              Tailwind CSS + Recharts

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ROUTES                                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   PUBLIC ROUTES (No Auth)              PROTECTED ROUTES (JWT Required)                  │
│   ┌─────────────────────┐              ┌─────────────────────────────────────────────┐  │
│   │                     │              │                                             │  │
│   │  /login             │              │  /              Dashboard (Stats, Pipeline) │  │
│   │  ├─ Email/Password  │              │  /clients       CRM Client List             │  │
│   │  └─ Google OAuth    │              │  /clients/[id]  Client Detail + Contacts    │  │
│   │                     │              │  /projects      Project Tracking            │  │
│   │  /intake            │              │  /projects/[id] Project Detail + Milestones │  │
│   │  └─ Lead Form       │              │  /invoices      Invoice Management          │  │
│   │    (Multi-section)  │              │  /invoices/[id] Invoice Detail              │  │
│   │                     │              │  /messages      Internal Messaging          │  │
│   └─────────────────────┘              │  /settings      User Preferences            │  │
│                                        │  /help          Support & FAQ               │  │
│                                        └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               COMPONENT STRUCTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   src/                                                                                   │
│   ├── app/                          # Next.js App Router Pages                          │
│   │   ├── layout.tsx               # Root: AuthProvider + QueryProvider                 │
│   │   ├── page.tsx                 # Dashboard                                          │
│   │   ├── (public)/intake/         # Public intake form                                 │
│   │   ├── login/                   # Auth page                                          │
│   │   ├── clients/                 # CRM pages                                          │
│   │   ├── projects/                # Project pages                                      │
│   │   └── invoices/                # Invoice pages                                      │
│   │                                                                                      │
│   ├── components/                                                                        │
│   │   ├── layout/                                                                        │
│   │   │   ├── AuthenticatedLayout.tsx   # Sidebar + Header wrapper                      │
│   │   │   ├── Sidebar.tsx               # Navigation                                    │
│   │   │   ├── Header.tsx                # Top bar                                       │
│   │   │   └── NotificationCenter.tsx    # Alerts                                        │
│   │   ├── ui/                           # Reusable: Skeleton, EmptyState, Search        │
│   │   ├── activity/                     # ActivityLog                                   │
│   │   ├── documents/                    # DocumentManager                               │
│   │   └── questionnaire/                # IntakeQuestionnaireModal                      │
│   │                                                                                      │
│   ├── lib/                                                                               │
│   │   ├── api.ts                   # API client + all endpoints                         │
│   │   ├── auth-context.tsx         # Auth state + JWT management                        │
│   │   ├── query-client.tsx         # React Query config                                 │
│   │   ├── csrf.ts                  # CSRF protection                                    │
│   │   ├── rate-limit.ts            # Client-side rate limiting                          │
│   │   └── sanitize.ts              # Input validation                                   │
│   │                                                                                      │
│   ├── hooks/                                                                             │
│   │   ├── use-queries.ts           # React Query hooks                                  │
│   │   └── use-form-validation.ts   # Form validation                                    │
│   │                                                                                      │
│   └── types/                                                                             │
│       └── index.ts                 # TypeScript interfaces                              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## API ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              JASPER API (Backend)                                        │
│                         api.jasperfinance.org | Vercel Serverless                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              Node.js Serverless Functions
                              JWT Auth (jose library)
                              Nodemailer (Email)

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ENDPOINT MAP                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   AUTHENTICATION (/api/v1/admin/auth/*)                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  POST /login              Email/password → JWT (8hr)                            │   │
│   │  POST /google             Google ID token → JWT (8hr)                           │   │
│   │  GET  /google/client-id   Returns Google OAuth client ID                        │   │
│   │  GET  /me                 Verify JWT, return current user                       │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   CRM/LEADS (/api/v1/crm/*)                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  GET  /leads              List leads (paginated, filterable)                    │   │
│   │  POST /leads              Create new lead                                       │   │
│   │  GET  /intake             Get intake form config (sectors, DFIs, etc.)          │   │
│   │  POST /intake             Submit intake questionnaire                           │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   CONTACT (/api/v1/*)                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  POST /contact            Public contact form → CRM + Email                     │   │
│   │  GET  /health             Health check endpoint                                 │   │
│   │  GET  /notifications      User notifications (auth required)                    │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   EMAIL SERVICE (/imail/*)                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │  POST /send               Send transactional email (API key auth)               │   │
│   │  POST /verify             Verify email delivery                                 │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                FILE STRUCTURE                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   jasper-api/                                                                            │
│   ├── api/                                                                               │
│   │   ├── admin/                                                                         │
│   │   │   └── auth/                                                                      │
│   │   │       ├── login.js         # Email/password auth                                │
│   │   │       ├── google.js        # Google OAuth                                       │
│   │   │       ├── client-id.js     # Google client ID                                   │
│   │   │       └── me.js            # Token verification                                 │
│   │   ├── crm/                                                                           │
│   │   │   ├── leads.js             # Lead CRUD                                          │
│   │   │   └── intake.js            # Intake form                                        │
│   │   ├── imail/                                                                         │
│   │   │   ├── send.js              # Email sending                                      │
│   │   │   └── verify.js            # Email verification                                 │
│   │   ├── contact.js               # Contact form handler                               │
│   │   ├── health.js                # Health check                                       │
│   │   └── notifications/                                                                 │
│   │       └── index.js             # Notifications                                      │
│   ├── vercel.json                  # Route rewrites                                     │
│   └── package.json                                                                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOWS                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

EMAIL/PASSWORD LOGIN
────────────────────

┌──────────┐      ┌───────────────┐      ┌─────────────────┐      ┌──────────────┐
│  User    │      │  Login Page   │      │  Vercel API     │      │  localStorage│
│          │      │  /login       │      │  /admin/auth    │      │              │
└────┬─────┘      └───────┬───────┘      └────────┬────────┘      └──────┬───────┘
     │                    │                       │                       │
     │ Enter credentials  │                       │                       │
     │───────────────────>│                       │                       │
     │                    │                       │                       │
     │                    │ POST /login           │                       │
     │                    │ {email, password}     │                       │
     │                    │──────────────────────>│                       │
     │                    │                       │                       │
     │                    │                       │ Validate credentials  │
     │                    │                       │ Generate JWT (8hr)    │
     │                    │                       │                       │
     │                    │ {access_token, user}  │                       │
     │                    │<──────────────────────│                       │
     │                    │                       │                       │
     │                    │ Store token + user    │                       │
     │                    │───────────────────────────────────────────────>│
     │                    │                       │                       │
     │ Redirect to /      │                       │                       │
     │<───────────────────│                       │                       │
     │                    │                       │                       │


GOOGLE OAUTH LOGIN
──────────────────

┌──────────┐      ┌───────────────┐      ┌─────────────────┐      ┌──────────────┐
│  User    │      │  Login Page   │      │  Google OAuth   │      │  Vercel API  │
└────┬─────┘      └───────┬───────┘      └────────┬────────┘      └──────┬───────┘
     │                    │                       │                       │
     │ Click Google btn   │                       │                       │
     │───────────────────>│                       │                       │
     │                    │                       │                       │
     │                    │ Load GSI script       │                       │
     │                    │──────────────────────>│                       │
     │                    │                       │                       │
     │                    │ Google Sign-In popup  │                       │
     │                    │<──────────────────────│                       │
     │                    │                       │                       │
     │ Select account     │                       │                       │
     │───────────────────>│                       │                       │
     │                    │                       │                       │
     │                    │ ID Token (credential) │                       │
     │                    │<──────────────────────│                       │
     │                    │                       │                       │
     │                    │ POST /admin/auth/google                       │
     │                    │ {credential}          │                       │
     │                    │──────────────────────────────────────────────>│
     │                    │                       │                       │
     │                    │                       │       Verify w/Google │
     │                    │                       │<──────────────────────│
     │                    │                       │                       │
     │                    │                       │       Generate JWT    │
     │                    │                       │──────────────────────>│
     │                    │                       │                       │
     │                    │ {access_token, user}  │                       │
     │                    │<──────────────────────────────────────────────│
     │                    │                       │                       │


TOKEN VERIFICATION (On Page Load)
─────────────────────────────────

┌──────────────┐      ┌───────────────┐      ┌─────────────────┐
│ localStorage │      │  AuthContext  │      │  Vercel API     │
│              │      │               │      │  /admin/auth/me │
└──────┬───────┘      └───────┬───────┘      └────────┬────────┘
       │                      │                       │
       │ Read admin_token     │                       │
       │<─────────────────────│                       │
       │                      │                       │
       │ Return token         │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │                      │ GET /me               │
       │                      │ Authorization: Bearer │
       │                      │──────────────────────>│
       │                      │                       │
       │                      │                       │ Verify JWT signature
       │                      │                       │ Check expiration
       │                      │                       │
       │                      │ {user} or 401         │
       │                      │<──────────────────────│
       │                      │                       │
       │                      │ If 401: logout()      │
       │                      │ Clear storage         │
       │<─────────────────────│                       │
       │                      │                       │
```

---

## DATA FLOW: LEAD INTAKE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           LEAD INTAKE FLOW                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  User    │   │ /intake page │   │ Vercel API   │   │  VPS CRM     │   │ SMTP Email   │
│ (Public) │   │              │   │ /crm/intake  │   │ 72.61.201.237│   │ Hostinger    │
└────┬─────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
     │                │                  │                  │                  │
     │ Fill form      │                  │                  │                  │
     │ (multi-section)│                  │                  │                  │
     │───────────────>│                  │                  │                  │
     │                │                  │                  │                  │
     │                │ Validate input   │                  │                  │
     │                │ Sanitize HTML    │                  │                  │
     │                │                  │                  │                  │
     │                │ POST /crm/intake │                  │                  │
     │                │ {formData}       │                  │                  │
     │                │─────────────────>│                  │                  │
     │                │                  │                  │                  │
     │                │                  │ Rate limit check │                  │
     │                │                  │ (3/hr per IP)    │                  │
     │                │                  │                  │                  │
     │                │                  │ POST /webhooks/  │                  │
     │                │                  │ contact-form     │                  │
     │                │                  │─────────────────>│                  │
     │                │                  │                  │                  │
     │                │                  │                  │ Create Lead      │
     │                │                  │                  │ in PostgreSQL    │
     │                │                  │                  │                  │
     │                │                  │ {lead_id}        │                  │
     │                │                  │<─────────────────│                  │
     │                │                  │                  │                  │
     │                │                  │ Send admin email │                  │
     │                │                  │─────────────────────────────────────>│
     │                │                  │                  │                  │
     │                │                  │ Send client email│                  │
     │                │                  │─────────────────────────────────────>│
     │                │                  │                  │                  │
     │                │ {success, ref}   │                  │                  │
     │                │<─────────────────│                  │                  │
     │                │                  │                  │                  │
     │ Show success   │                  │                  │                  │
     │ Reference: JSP-│                  │                  │                  │
     │<───────────────│                  │                  │                  │
     │                │                  │                  │                  │
```

---

## CRM DATA MODEL

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CRM DATA MODEL                                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐          │
│   │    COMPANY      │         │    CONTACT      │         │    PROJECT      │          │
│   ├─────────────────┤         ├─────────────────┤         ├─────────────────┤          │
│   │ id              │         │ id              │         │ id              │          │
│   │ name            │◄────────│ company_id (FK) │         │ reference       │          │
│   │ status          │   1:N   │ first_name      │         │ company_id (FK) │─────────►│
│   │ country         │         │ last_name       │         │ contact_id (FK) │          │
│   │ email           │         │ email           │         │ name            │          │
│   │ phone           │         │ phone           │         │ description     │          │
│   │ website         │         │ job_title       │         │ stage           │          │
│   │ industry        │         │ is_primary      │         │ package         │          │
│   │ lead_source     │         │ is_decision_mkr │         │ value           │          │
│   │ dfi_targets[]   │         │ created_at      │         │ currency        │          │
│   │ project_value   │         └─────────────────┘         │ progress_%      │          │
│   │ total_revenue   │                                     │ sector          │          │
│   │ outstanding_bal │                                     │ target_dfis[]   │          │
│   │ created_at      │                                     │ created_at      │          │
│   │ updated_at      │                                     │ updated_at      │          │
│   └─────────────────┘                                     └────────┬────────┘          │
│                                                                    │                    │
│           ┌────────────────────────────────────────────────────────┼───────────┐       │
│           │                                                        │           │       │
│           ▼                                                        ▼           ▼       │
│   ┌─────────────────┐                                     ┌─────────────────┐         │
│   │    INVOICE      │                                     │   MILESTONE     │         │
│   ├─────────────────┤                                     ├─────────────────┤         │
│   │ id              │                                     │ id              │         │
│   │ invoice_number  │                                     │ project_id (FK) │         │
│   │ project_id (FK) │                                     │ name            │         │
│   │ company_id (FK) │                                     │ order           │         │
│   │ invoice_type    │                                     │ due_date        │         │
│   │ status          │                                     │ completed       │         │
│   │ subtotal        │                                     │ completed_date  │         │
│   │ discount_%      │                                     │ description     │         │
│   │ tax_%           │                                     └─────────────────┘         │
│   │ total           │                                                                  │
│   │ currency        │         ┌─────────────────┐                                     │
│   │ issue_date      │         │   DOCUMENT      │                                     │
│   │ due_date        │         ├─────────────────┤                                     │
│   │ paid_date       │         │ id              │                                     │
│   │ payment_method  │         │ project_id (FK) │                                     │
│   │ payment_ref     │         │ filename        │                                     │
│   │ created_at      │         │ file_type       │                                     │
│   └─────────────────┘         │ file_size       │                                     │
│                               │ uploaded_by     │                                     │
│                               │ version         │                                     │
│                               │ created_at      │                                     │
│                               └─────────────────┘                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

STATUS ENUMS
────────────

Company.status:    lead → prospect → qualified → proposal_sent → negotiation → client → inactive | lost

Project.stage:     inquiry → proposal → negotiation → contracted → discovery → in_progress → review → revision → completed

Invoice.status:    draft → sent → viewed → paid → overdue | cancelled

Project.package:   starter | growth | scale | enterprise | custom

Invoice.type:      deposit | milestone | final | retainer | custom

PaymentMethod:     bank_eft | paypal | usdt | usdc | bitcoin | crypto_other | cash | other
```

---

## EXTERNAL INTEGRATIONS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL INTEGRATIONS                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              VERCEL (Deployment)                                 │   │
│   │                                                                                  │   │
│   │   Frontend: portal.jasperfinance.org (Next.js SSR)                              │   │
│   │   API: api.jasperfinance.org (Serverless Functions)                             │   │
│   │   Edge: CDN + SSL + DDoS Protection                                             │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              GOOGLE (OAuth)                                      │   │
│   │                                                                                  │   │
│   │   Client ID: 283886701147-hp7qosrs7a9mlgm74b2380ff1fe6662h                       │   │
│   │   Status: TEST MODE (Add test users in Google Cloud Console)                    │   │
│   │   Scope: openid, email, profile                                                 │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              HOSTINGER (Email)                                   │   │
│   │                                                                                  │   │
│   │   SMTP Server: smtp.hostinger.com:587 (TLS)                                     │   │
│   │   From: models@jasperfinance.org                                                │   │
│   │   Uses: Nodemailer                                                              │   │
│   │   Purpose: Transactional emails (contact confirmation, invoices)                │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              VPS (CRM Backend)                                   │   │
│   │                                                                                  │   │
│   │   IP: 72.61.201.237                                                             │   │
│   │   OS: Ubuntu 24.04                                                              │   │
│   │   Port: 8001 (CRM API)                                                          │   │
│   │   Database: PostgreSQL 16                                                       │   │
│   │   Webhook: /api/v1/webhooks/contact-form                                        │   │
│   │                                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

         REQUEST FLOW
         ─────────────

         ┌─────────────────┐
         │   Client/User   │
         └────────┬────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   1. HTTPS (TLS 1.3)        │  Vercel Edge
    │      SSL Certificate        │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   2. CORS Headers           │  api.jasperfinance.org
    │      Access-Control-*       │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   3. Rate Limiting          │  Per endpoint
    │      - Contact: 5/15min     │
    │      - Intake: 3/hr         │
    │      - iMail: 10/min        │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   4. Input Sanitization     │  Server-side
    │      - HTML stripping       │
    │      - Email validation     │
    │      - URL validation       │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   5. JWT Authentication     │  Protected routes
    │      - HS256 signing        │
    │      - 8-hour expiry        │
    │      - Signature verify     │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   6. CSRF Protection        │  Mutation requests
    │      - Custom headers       │
    │      - Token validation     │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   7. API Handler            │  Business logic
    │      Process request        │
    └─────────────────────────────┘
```

---

## ENVIRONMENT VARIABLES

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           ENVIRONMENT VARIABLES                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

FRONTEND (jasper-portal-frontend/.env.local)
────────────────────────────────────────────

NEXT_PUBLIC_API_BASE=/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=283886701147-hp7qosrs7a9mlgm74b2380ff1fe6662h.apps.googleusercontent.com


API (jasper-api/.env.local)
───────────────────────────

# Authentication
SECRET_KEY=<32+ character string for JWT signing>
ADMIN_EMAIL=admin@jasperfinance.org
ADMIN_PASSWORD=Admin123!
GOOGLE_CLIENT_ID=283886701147-hp7qosrs7a9mlgm74b2380ff1fe6662h.apps.googleusercontent.com

# Email (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=models@jasperfinance.org
SMTP_PASS=<smtp password>

# VPS CRM Integration
CRM_API_URL=http://72.61.201.237:8001
WEBHOOK_SECRET=<webhook authentication token>

# iMail Service
IMAIL_API_KEY=<email service API key>
```

---

## DEPLOYMENT URLS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION URLS                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┬───────────────────────────────────────────────────────────────┐
│ Service                │ URL                                                           │
├────────────────────────┼───────────────────────────────────────────────────────────────┤
│ Marketing Website      │ https://jasperfinance.org                                     │
│ Admin Portal           │ https://portal.jasperfinance.org                              │
│ API Gateway            │ https://api.jasperfinance.org                                 │
│ Lead Intake Form       │ https://portal.jasperfinance.org/intake                       │
│ VPS Backend (Internal) │ http://72.61.201.237:8001                                     │
└────────────────────────┴───────────────────────────────────────────────────────────────┘

API Endpoints (api.jasperfinance.org)
─────────────────────────────────────
POST   /api/v1/admin/auth/login           Email/password login
POST   /api/v1/admin/auth/google          Google OAuth login
GET    /api/v1/admin/auth/me              Verify token
GET    /api/v1/admin/auth/google/client-id Get Google client ID
POST   /contact                            Contact form submission
GET    /api/v1/crm/intake                  Intake form config
POST   /api/v1/crm/intake                  Intake form submission
GET    /api/v1/crm/leads                   List leads
POST   /api/v1/crm/leads                   Create lead
GET    /health                             Health check
```

---

## QUICK REFERENCE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              QUICK REFERENCE CARD                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Tech Stack
──────────
Frontend:  Next.js 14 + React 18 + TypeScript + Tailwind
Backend:   Vercel Serverless (Node.js)
Database:  PostgreSQL (VPS) + In-memory (dev)
Auth:      JWT (jose) + Google OAuth
Email:     Nodemailer + Hostinger SMTP

Default Credentials
───────────────────
Email:     admin@jasperfinance.org
Password:  Admin123!
(Any @jasperfinance.org email also works with Admin123!)

Key Ports
─────────
Frontend (local):   3000
API (local):        8000
VPS CRM:            8001
PostgreSQL (VPS):   5432

Repository Structure
────────────────────
jasper-financial-architecture/
├── jasper-portal-frontend/   # Next.js admin portal
├── jasper-api/               # Vercel serverless API
├── docs/                     # Documentation
└── branding/                 # Brand assets
```

---

*Document generated: December 11, 2025*
