# JASPER Client Portal - Comprehensive Implementation Plan

## Executive Summary

Build a dedicated **Client Portal** at `client.jasperfinance.org` that provides clients with:
- Project visibility and tracking
- Document sharing and downloads
- Secure messaging with JASPER team
- Invoice viewing and payment status
- Model revision requests

This is **separate from** the Admin Portal (`portal.jasperfinance.org`) which is for internal staff.

---

## Current State Analysis

### What Exists Today

| Component | Status | Notes |
|-----------|--------|-------|
| **Intake Form** | ✅ Live | 6-step questionnaire at `portal.jasperfinance.org/intake` |
| **CRM API** | ✅ Live | Routes to VPS CRM at `72.61.201.237:8001` |
| **Admin Portal** | ✅ Live | `portal.jasperfinance.org` - internal staff only |
| **API Backend** | ✅ Live | `api.jasperfinance.org` - Vercel serverless |
| **Main Website** | ✅ Live | `jasperfinance.org` - marketing site |

### What's Missing for Clients

1. **Client Login** - Clients cannot log in to see their projects
2. **Project Dashboard** - No visibility into project status
3. **Document Hub** - No secure document sharing
4. **Messaging System** - No direct communication channel
5. **Invoice Portal** - No invoice viewing/payment

---

## Client Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────┘

1. DISCOVERY
   └─> jasperfinance.org (marketing site)
       └─> "Get Started" / "Request Quote"

2. INTAKE (Public - No Login Required)
   └─> portal.jasperfinance.org/intake
       └─> 6-step questionnaire
       └─> Submits to CRM API
       └─> Gets reference number (e.g., LEAD-M4XK2-A9B3)

3. QUALIFICATION (Admin Side)
   └─> Admin reviews in portal.jasperfinance.org
       └─> Qualifies lead → Creates Client Account
       └─> System sends welcome email with login credentials

4. CLIENT ONBOARDING (New Portal)
   └─> client.jasperfinance.org/login
       └─> Client sets password (first login)
       └─> Completes profile (optional)
       └─> Accepts terms of service

5. PROJECT LIFECYCLE
   └─> client.jasperfinance.org/dashboard
       ├─> View project status
       ├─> Upload documents
       ├─> Download deliverables
       ├─> Message JASPER team
       ├─> View invoices
       └─> Request revisions

6. PROJECT COMPLETION
   └─> Final model delivered
       └─> Client provides feedback
       └─> Invoice marked paid
       └─> Project archived (still accessible)
```

---

## Technical Architecture

### Domain Structure

| Domain | Purpose | Tech Stack |
|--------|---------|------------|
| `jasperfinance.org` | Marketing site | Vite/React (existing) |
| `portal.jasperfinance.org` | Admin Portal | Next.js (existing) |
| `client.jasperfinance.org` | **Client Portal** | Next.js (NEW) |
| `api.jasperfinance.org` | API Backend | Vercel Serverless (existing) |

### Database Schema (PostgreSQL)

```sql
-- Clients table (extends from CRM leads)
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) UNIQUE,          -- Links to CRM lead
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),          -- Bcrypt hashed
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  -- Profile fields
  job_title VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
  avatar_url VARCHAR(500)
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL, -- e.g., PRJ-2024-001
  client_id INTEGER REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sector VARCHAR(100),
  package VARCHAR(50),                 -- foundation, professional, enterprise
  status VARCHAR(50) DEFAULT 'intake', -- intake, scoping, active, review, complete
  progress INTEGER DEFAULT 0,          -- 0-100

  -- Financial
  quoted_amount DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Timeline
  target_delivery DATE,
  actual_delivery DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project milestones
CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, complete
  due_date DATE,
  completed_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  uploaded_by INTEGER,                  -- client_id or admin user
  uploaded_by_type VARCHAR(20),         -- 'client' or 'admin'
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_url VARCHAR(500),             -- S3/Cloudflare R2 URL
  category VARCHAR(50),                 -- input, deliverable, contract, invoice
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT TRUE,       -- visible to client
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages (secure chat)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  sender_id INTEGER NOT NULL,
  sender_type VARCHAR(20) NOT NULL,     -- 'client' or 'admin'
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  client_id INTEGER REFERENCES clients(id),
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'draft',   -- draft, sent, paid, overdue, cancelled
  due_date DATE,
  paid_at TIMESTAMP,
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  actor_id INTEGER,
  actor_type VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Client Portal Features

### 1. Dashboard (`/`)
- Active projects overview with status cards
- Recent activity feed
- Upcoming milestones
- Unread messages count
- Outstanding invoices

### 2. Projects (`/projects`)
- List all projects (active and archived)
- Filter by status
- Search by name

### 3. Project Detail (`/projects/[id]`)
- Project overview and description
- Progress tracker (visual)
- Milestone timeline
- Team members assigned
- Quick actions (message, upload)

### 4. Documents (`/projects/[id]/documents`)
- Upload zone (drag & drop)
- Document categories (inputs, deliverables, contracts)
- Version history
- Preview support (PDF, Excel)
- Bulk download

### 5. Messages (`/projects/[id]/messages` or `/messages`)
- Real-time chat per project
- File attachments
- Message history
- Email notifications for new messages

### 6. Invoices (`/invoices`)
- Invoice list with status
- PDF download
- Payment instructions
- Payment confirmation upload

### 7. Profile (`/settings`)
- Update contact details
- Change password
- Notification preferences
- Timezone settings

---

## Authentication Flow

### Client Registration (Admin-Initiated)

```
1. Admin creates client from qualified lead
   └─> POST /api/admin/clients
       └─> Creates client with status='pending'
       └─> Generates temporary token
       └─> Sends welcome email with setup link

2. Client receives email
   └─> Link: client.jasperfinance.org/setup?token=xxx
       └─> Client sets password
       └─> Client status='active'

3. Future logins
   └─> client.jasperfinance.org/login
       └─> Email + password
       └─> Optional: Google OAuth (if client prefers)
```

### API Endpoints for Client Auth

```
POST   /api/client/auth/setup        - Set initial password
POST   /api/client/auth/login        - Email/password login
POST   /api/client/auth/google       - Google OAuth
GET    /api/client/auth/me           - Get current client
POST   /api/client/auth/logout       - Logout
POST   /api/client/auth/forgot       - Forgot password
POST   /api/client/auth/reset        - Reset password
```

---

## Integration with Existing Systems

### CRM Integration
- When admin converts lead to client → Create client account
- Sync project status updates
- Activity logging

### Admin Portal Integration
- Admins manage projects, upload deliverables
- Messages appear in both portals
- Shared document storage

### Email Integration (JASPER iMail)
- Welcome emails
- Password reset
- New message notifications
- Invoice reminders
- Project status updates

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up `jasper-client-portal` Next.js project
- [ ] Configure Vercel deployment to `client.jasperfinance.org`
- [ ] Database schema creation (PostgreSQL)
- [ ] Client authentication endpoints
- [ ] Basic login/logout flow

### Phase 2: Core Features (Week 2-3)
- [ ] Dashboard page
- [ ] Projects list and detail pages
- [ ] Document upload/download (Cloudflare R2)
- [ ] Basic messaging system

### Phase 3: Admin Integration (Week 3-4)
- [ ] Admin portal: "Convert to Client" action
- [ ] Admin portal: Project management
- [ ] Admin portal: Message responses
- [ ] Shared API endpoints

### Phase 4: Polish (Week 4-5)
- [ ] Email notifications
- [ ] Invoice viewing
- [ ] Mobile responsiveness
- [ ] Activity logging
- [ ] Client feedback system

### Phase 5: Launch (Week 5)
- [ ] Testing with pilot client
- [ ] Documentation
- [ ] Go-live

---

## Security Considerations

1. **Authentication**
   - Bcrypt password hashing (cost factor 12)
   - JWT tokens with short expiry (1 hour)
   - Refresh tokens (7 days)
   - Rate limiting on login attempts

2. **Authorization**
   - Clients can only see their own projects
   - Document access control by project membership
   - Admin-only endpoints protected

3. **Data Protection**
   - HTTPS everywhere
   - Encrypted document storage
   - Audit logging
   - POPIA/GDPR compliance

4. **File Uploads**
   - File type validation
   - Size limits (50MB per file)
   - Virus scanning (optional)
   - Signed URLs for downloads

---

## Cost Estimate

| Item | Monthly Cost |
|------|-------------|
| Vercel Pro (client portal) | $20 |
| PostgreSQL (Supabase/Neon) | $25 |
| Cloudflare R2 (documents) | $5-15 |
| Email (existing iMail) | $0 |
| **Total** | **~$50-60/month** |

---

## Success Metrics

- Client login rate (target: 80% of clients log in)
- Document upload success rate
- Message response time
- Invoice view rate
- Client satisfaction score

---

## Next Steps

1. **Approve this plan**
2. **Set up `jasper-client-portal` repository**
3. **Configure database (recommend Supabase for PostgreSQL + Auth)**
4. **Begin Phase 1 development**

---

*Document created: December 2024*
*Author: Claude (JASPER Development)*
