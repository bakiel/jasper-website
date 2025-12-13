# JASPER Client Portal - Complete Development Plan

## Overview

A full-featured client portal for JASPER Financial Architecture that provides clients with:
- Secure authentication (Email/Password + OAuth)
- Email verification before access
- Onboarding experience for new clients
- Project tracking and management
- Document sharing and collaboration
- Messaging with JASPER team
- Invoice management
- Real-time notifications

---

## Phase 1: Authentication & Verification System

### 1.1 Authentication Methods
```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN OPTIONS                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Google OAuth   │  │ LinkedIn OAuth  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ─────────────── OR ───────────────                        │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │  Email: [_____________________]     │                   │
│  │  Password: [__________________]     │                   │
│  │                                     │                   │
│  │  [Sign In]  [Forgot Password?]      │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Don't have an account? [Register]                         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Registration Flow
```
Step 1: Register
├── Full Name
├── Email Address
├── Company Name
├── Password (min 8 chars, 1 uppercase, 1 number)
├── Confirm Password
└── Accept Terms & Privacy Policy

Step 2: Email Verification
├── Send verification email with 6-digit code
├── Code expires in 15 minutes
├── Resend option after 60 seconds
└── 3 attempts before lockout

Step 3: Account Pending
├── "Your account is pending approval"
├── Admin receives notification
├── Admin approves/rejects
└── Client notified of approval

Step 4: First Login → Onboarding
```

### 1.3 Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### 1.4 Security Features
- Rate limiting (5 attempts, then 15-min lockout)
- Session management (JWT with refresh tokens)
- Password reset via email
- Two-factor authentication (optional, Phase 2)
- Audit logging for all auth events

---

## Phase 2: Database Schema

### 2.1 Core Tables

```sql
-- Users table (clients)
CREATE TABLE client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL if OAuth-only
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,

    -- Auth providers
    google_id VARCHAR(255) UNIQUE,
    linkedin_id VARCHAR(255) UNIQUE,

    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,

    -- Account status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, active, suspended
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMP,

    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,

    -- Metadata
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client companies
CREATE TABLE client_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Link users to companies (many-to-many)
CREATE TABLE client_company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES client_users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES client_companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- Projects
CREATE TABLE client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,  -- PRJ-2024-001
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id UUID REFERENCES client_companies(id),

    -- Project details
    project_type VARCHAR(100),  -- feasibility, valuation, forecast, etc.
    status VARCHAR(50) DEFAULT 'intake',
    -- intake, scoping, active, review, revision, complete, on_hold

    priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent

    -- Timeline
    start_date DATE,
    target_date DATE,
    completed_date DATE,

    -- Progress
    progress_percent INTEGER DEFAULT 0,
    current_milestone VARCHAR(255),

    -- Assignment
    lead_consultant_id UUID,  -- References admin_users

    -- Financial
    quoted_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'ZAR',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project team members (which clients can view project)
CREATE TABLE project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES client_users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer',  -- owner, collaborator, viewer
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, in_progress, completed
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Document type
    category VARCHAR(50),  -- deliverable, reference, input, contract
    version INTEGER DEFAULT 1,

    -- Access
    visibility VARCHAR(50) DEFAULT 'team',  -- team, client, public

    -- Uploaded by
    uploaded_by UUID,  -- Can be client or admin
    uploaded_by_type VARCHAR(20),  -- 'client' or 'admin'

    created_at TIMESTAMP DEFAULT NOW()
);

-- Document versions (for version history)
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES client_documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages/Comments
CREATE TABLE project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES project_messages(id),  -- For threads

    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL,  -- 'client' or 'admin'

    content TEXT NOT NULL,

    -- Attachments stored separately
    has_attachments BOOLEAN DEFAULT FALSE,

    -- Read status tracked per user
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Message read status
CREATE TABLE message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES project_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, user_type)
);

-- Invoices
CREATE TABLE client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,  -- INV-2024-001
    project_id UUID REFERENCES client_projects(id),
    company_id UUID REFERENCES client_companies(id),

    -- Invoice details
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    -- draft, sent, viewed, paid, overdue, cancelled

    -- Payment
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),

    -- PDF
    pdf_url TEXT,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES client_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Notifications
CREATE TABLE client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES client_users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    -- project_update, document_uploaded, message_received,
    -- invoice_sent, milestone_completed, etc.

    title VARCHAR(255) NOT NULL,
    message TEXT,

    -- Link to related entity
    entity_type VARCHAR(50),
    entity_id UUID,

    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE client_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES client_users(id),

    action VARCHAR(100) NOT NULL,
    -- login, logout, view_project, download_document, etc.

    entity_type VARCHAR(50),
    entity_id UUID,

    ip_address INET,
    user_agent TEXT,

    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE client_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES client_users(id) ON DELETE CASCADE UNIQUE,

    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    email_project_updates BOOLEAN DEFAULT TRUE,
    email_messages BOOLEAN DEFAULT TRUE,
    email_invoices BOOLEAN DEFAULT TRUE,

    -- UI preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',

    updated_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding progress
CREATE TABLE client_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES client_users(id) ON DELETE CASCADE UNIQUE,

    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,

    -- Steps completed
    step_welcome BOOLEAN DEFAULT FALSE,
    step_profile BOOLEAN DEFAULT FALSE,
    step_company BOOLEAN DEFAULT FALSE,
    step_tour BOOLEAN DEFAULT FALSE,
    step_preferences BOOLEAN DEFAULT FALSE,

    current_step INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Indexes for Performance

```sql
-- Frequently queried fields
CREATE INDEX idx_client_users_email ON client_users(email);
CREATE INDEX idx_client_users_status ON client_users(status);
CREATE INDEX idx_client_projects_company ON client_projects(company_id);
CREATE INDEX idx_client_projects_status ON client_projects(status);
CREATE INDEX idx_project_messages_project ON project_messages(project_id);
CREATE INDEX idx_client_notifications_user ON client_notifications(user_id, read);
CREATE INDEX idx_client_documents_project ON client_documents(project_id);
```

---

## Phase 3: Onboarding Flow

### 3.1 Onboarding Steps

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: WELCOME                                            │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  [JASPER Logo Animation]                                    │
│                                                             │
│  Welcome to JASPER, {firstName}!                           │
│                                                             │
│  We're thrilled to have you on board. This portal is       │
│  your central hub for tracking projects, accessing         │
│  documents, and communicating with your team.              │
│                                                             │
│  Let's get you set up in just a few minutes.               │
│                                                             │
│  [Get Started →]                                            │
│                                                             │
│  Progress: ○ ○ ○ ○ ○                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 2: COMPLETE YOUR PROFILE                              │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  [Avatar Upload - Click to add photo]                       │
│                                                             │
│  Full Name: [Already filled from registration]              │
│  Job Title: [_________________________]                     │
│  Phone: [_________________________]                         │
│  LinkedIn: [_________________________] (optional)           │
│                                                             │
│  [← Back]                    [Continue →]                   │
│                                                             │
│  Progress: ● ○ ○ ○ ○                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 3: COMPANY DETAILS                                    │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Company Name: [Already filled]                             │
│  Industry: [Dropdown ▼]                                     │
│  Company Size: [Dropdown ▼]                                 │
│  Website: [_________________________]                       │
│  Address: [_________________________]                       │
│  City: [___________]  Country: [Dropdown ▼]                │
│                                                             │
│  [Upload Company Logo]                                      │
│                                                             │
│  [← Back]                    [Continue →]                   │
│                                                             │
│  Progress: ● ● ○ ○ ○                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 4: QUICK TOUR                                         │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  [Interactive tour showing key features]                    │
│                                                             │
│  Highlight 1: Dashboard - Your project overview             │
│  Highlight 2: Projects - Track progress & milestones        │
│  Highlight 3: Documents - Access all your files             │
│  Highlight 4: Messages - Communicate with your team         │
│  Highlight 5: Invoices - View and pay invoices              │
│                                                             │
│  [Skip Tour]                 [Next →]                       │
│                                                             │
│  Progress: ● ● ● ○ ○                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 5: NOTIFICATION PREFERENCES                           │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  How would you like to be notified?                         │
│                                                             │
│  Email Notifications                                        │
│  [✓] Project updates                                        │
│  [✓] New messages                                           │
│  [✓] Document uploads                                       │
│  [✓] Invoice reminders                                      │
│                                                             │
│  Timezone: [Africa/Johannesburg ▼]                         │
│                                                             │
│  [← Back]                    [Finish Setup →]               │
│                                                             │
│  Progress: ● ● ● ● ○                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STEP 6: ALL SET!                                           │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  [Celebration Animation/Confetti]                           │
│                                                             │
│  You're all set, {firstName}!                              │
│                                                             │
│  Your portal is ready. Here's what you can do next:         │
│                                                             │
│  [View Your Projects →]                                     │
│  [Browse Documents →]                                       │
│  [Contact Your Team →]                                      │
│                                                             │
│  Or go to your [Dashboard]                                  │
│                                                             │
│  Progress: ● ● ● ● ●                                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Onboarding Features
- Progress saved at each step (can resume later)
- Skip option for non-essential steps
- Contextual help tooltips
- Mobile-responsive design
- Animated transitions between steps

---

## Phase 4: Portal Pages & Features

### 4.1 Page Structure

```
/login                    - Login page (Email/Password + OAuth)
/register                 - Registration page
/verify-email             - Email verification
/forgot-password          - Password reset request
/reset-password           - Password reset form
/pending-approval         - Account pending approval

/onboarding               - Onboarding flow (5 steps)
/onboarding/welcome
/onboarding/profile
/onboarding/company
/onboarding/tour
/onboarding/preferences

/                         - Dashboard (home)
/projects                 - Projects list
/projects/[id]            - Project detail
/projects/[id]/documents  - Project documents
/projects/[id]/messages   - Project messages
/projects/[id]/milestones - Project milestones

/documents                - All documents
/documents/[id]           - Document viewer

/messages                 - All messages / Inbox
/messages/[projectId]     - Project conversation

/invoices                 - Invoices list
/invoices/[id]            - Invoice detail

/notifications            - All notifications

/settings                 - Settings overview
/settings/profile         - Profile settings
/settings/company         - Company settings
/settings/security        - Security (password, 2FA)
/settings/notifications   - Notification preferences

/help                     - Help center
/help/guides              - User guides
/help/faq                 - FAQ
/help/contact             - Contact support
```

### 4.2 Dashboard Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Sidebar]                    DASHBOARD                      [🔔] [👤]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Good morning, Keletso!                                                │
│  Here's what's happening with your projects                            │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 📁 Active    │ │ 💬 Unread   │ │ 📄 Documents │ │ 📅 Next      │  │
│  │ Projects     │ │ Messages    │ │              │ │ Milestone    │  │
│  │     3        │ │     5       │ │     12       │ │   Dec 20     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  YOUR PROJECTS                                          [View All →]   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ PRJ-2024-001  Solar Farm Feasibility Model                      │  │
│  │ [████████░░░░░░░] 65%  |  In Progress  |  Updated 2 days ago    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ PRJ-2024-002  Series A Financial Projections                    │  │
│  │ [█████████████░░] 90%  |  Under Review |  Updated 5 hours ago   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  RECENT ACTIVITY                              UPCOMING MILESTONES      │
│  ┌─────────────────────────────┐              ┌────────────────────┐  │
│  │ 📄 Revenue Model v2 uploaded│              │ Dec 20 - Phase 2   │  │
│  │    2 hours ago              │              │ Dec 28 - Draft     │  │
│  │ 💬 New comment on Solar...  │              │ Jan 5  - Review    │  │
│  │    5 hours ago              │              │                    │  │
│  │ ✓ Milestone completed       │              │                    │  │
│  │    1 day ago                │              │                    │  │
│  └─────────────────────────────┘              └────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Projects List Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MY PROJECTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Search projects...]           [Filter ▼]  [Sort: Recent ▼]           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  PRJ-2024-001                                    [In Progress]   │  │
│  │  Solar Farm Feasibility Model                                    │  │
│  │                                                                   │  │
│  │  Lead: Sarah Johnson                                             │  │
│  │  Started: Nov 15, 2024  |  Target: Jan 15, 2025                 │  │
│  │                                                                   │  │
│  │  [████████░░░░░░░░░░] 65%                                        │  │
│  │                                                                   │  │
│  │  📄 8 Documents  💬 12 Messages  📅 3 Milestones                 │  │
│  │                                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  PRJ-2024-002                                    [Under Review]  │  │
│  │  Series A Financial Projections                                  │  │
│  │  ...                                                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Project Detail Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Projects                                                     │
│                                                                         │
│  PRJ-2024-001                                                          │
│  Solar Farm Feasibility Model                        [In Progress]     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  [Overview]  [Documents]  [Messages]  [Milestones]  [Activity]         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PROJECT OVERVIEW                                                       │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐     │
│  │ Progress                    │  │ Timeline                     │     │
│  │ [████████░░░░░░░░░░] 65%    │  │ Started: Nov 15, 2024       │     │
│  │                             │  │ Target:  Jan 15, 2025       │     │
│  │ Current Phase:              │  │ Days Left: 34               │     │
│  │ Financial Modelling         │  │                             │     │
│  └─────────────────────────────┘  └─────────────────────────────┘     │
│                                                                         │
│  YOUR TEAM                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ [👤] Sarah Johnson          Lead Consultant                      │  │
│  │ [👤] Michael Chen           Financial Analyst                    │  │
│  │ [👤] Emma Williams          Project Coordinator                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  RECENT UPDATES                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Sarah uploaded "Revenue Model v2.xlsx"         2 hours ago   │  │
│  │ 💬 Michael commented on assumptions               5 hours ago   │  │
│  │ ✓ Milestone "Data Collection" completed           1 day ago     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Messages Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MESSAGES                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ CONVERSATIONS       │  │ Solar Farm Feasibility Model            │ │
│  │                     │  │ PRJ-2024-001                            │ │
│  │ ┌─────────────────┐ │  ├─────────────────────────────────────────┤ │
│  │ │ 🟢 Solar Farm   │ │  │                                         │ │
│  │ │ Sarah: The rev..│ │  │ [Sarah Johnson]           Nov 28, 10:30 │ │
│  │ │ 2 hours ago     │ │  │ Hi Keletso, I've uploaded the updated   │ │
│  │ └─────────────────┘ │  │ revenue model. Please review when you   │ │
│  │                     │  │ get a chance.                           │ │
│  │ ┌─────────────────┐ │  │                                         │ │
│  │ │ Series A        │ │  │ [You]                     Nov 28, 11:45 │ │
│  │ │ Michael: Thanks.│ │  │ Thanks Sarah! I'll take a look today.   │ │
│  │ │ Yesterday       │ │  │ Quick question - did you use the Q3     │ │
│  │ └─────────────────┘ │  │ actuals or projections?                 │ │
│  │                     │  │                                         │ │
│  │                     │  │ [Sarah Johnson]           Nov 28, 14:20 │ │
│  │                     │  │ Used Q3 actuals. The model now shows... │ │
│  │                     │  │                                         │ │
│  │                     │  ├─────────────────────────────────────────┤ │
│  │                     │  │ [Type your message...]        [📎] [➤] │ │
│  └─────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Documents Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENTS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Search documents...]     [Filter by Project ▼]  [Filter by Type ▼]   │
│                                                                         │
│  RECENT DOCUMENTS                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Revenue Model v2.xlsx                                         │  │
│  │    Solar Farm Feasibility  |  Deliverable  |  2.4 MB            │  │
│  │    Uploaded by Sarah Johnson  |  2 hours ago                    │  │
│  │    [View] [Download] [History]                                   │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 📄 Project Brief.pdf                                             │  │
│  │    Series A Projections  |  Reference  |  856 KB                │  │
│  │    Uploaded by Michael Chen  |  3 days ago                      │  │
│  │    [View] [Download] [History]                                   │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 📑 Financial Assumptions.docx                                    │  │
│  │    Solar Farm Feasibility  |  Input  |  124 KB                  │  │
│  │    Uploaded by You  |  1 week ago                               │  │
│  │    [View] [Download] [History]                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Upload Document ↑]                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Invoices Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INVOICES                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SUMMARY                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│  │ Outstanding  │ │ Paid (YTD)   │ │ Overdue      │                   │
│  │ R 125,000    │ │ R 450,000    │ │ R 0          │                   │
│  └──────────────┘ └──────────────┘ └──────────────┘                   │
│                                                                         │
│  ALL INVOICES                                     [Filter: All ▼]      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ INV-2024-015                                           [SENT]   │  │
│  │ Solar Farm Feasibility - Phase 2                                │  │
│  │ Issued: Dec 1, 2024  |  Due: Dec 15, 2024                      │  │
│  │ Amount: R 75,000.00                                             │  │
│  │ [View Invoice] [Pay Now]                                        │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ INV-2024-012                                           [PAID]   │  │
│  │ Solar Farm Feasibility - Phase 1                                │  │
│  │ Issued: Nov 1, 2024  |  Paid: Nov 10, 2024                     │  │
│  │ Amount: R 50,000.00                                             │  │
│  │ [View Invoice] [Download Receipt]                               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: API Endpoints

### 5.1 Authentication Endpoints

```
POST   /api/client/auth/register          - Register new client
POST   /api/client/auth/verify-email      - Verify email with code
POST   /api/client/auth/resend-code       - Resend verification code
POST   /api/client/auth/login             - Email/password login
POST   /api/client/auth/google            - Google OAuth login
POST   /api/client/auth/linkedin          - LinkedIn OAuth login
POST   /api/client/auth/forgot-password   - Request password reset
POST   /api/client/auth/reset-password    - Reset password with token
POST   /api/client/auth/logout            - Logout (invalidate token)
POST   /api/client/auth/refresh           - Refresh access token
GET    /api/client/auth/me                - Get current user
```

### 5.2 User & Profile Endpoints

```
GET    /api/client/profile                - Get user profile
PATCH  /api/client/profile                - Update profile
POST   /api/client/profile/avatar         - Upload avatar
DELETE /api/client/profile/avatar         - Remove avatar
PATCH  /api/client/profile/password       - Change password
GET    /api/client/preferences            - Get preferences
PATCH  /api/client/preferences            - Update preferences
```

### 5.3 Onboarding Endpoints

```
GET    /api/client/onboarding             - Get onboarding status
PATCH  /api/client/onboarding             - Update onboarding progress
POST   /api/client/onboarding/complete    - Mark onboarding complete
POST   /api/client/onboarding/skip        - Skip onboarding
```

### 5.4 Project Endpoints

```
GET    /api/client/projects               - List user's projects
GET    /api/client/projects/:id           - Get project details
GET    /api/client/projects/:id/team      - Get project team
GET    /api/client/projects/:id/milestones - Get milestones
GET    /api/client/projects/:id/activity  - Get activity log
```

### 5.5 Document Endpoints

```
GET    /api/client/documents              - List all documents
GET    /api/client/documents/:id          - Get document details
GET    /api/client/documents/:id/download - Download document
GET    /api/client/documents/:id/versions - Get version history
POST   /api/client/projects/:id/documents - Upload document
DELETE /api/client/documents/:id          - Delete document (if owner)
```

### 5.6 Message Endpoints

```
GET    /api/client/messages               - List conversations
GET    /api/client/messages/:projectId    - Get project messages
POST   /api/client/messages/:projectId    - Send message
PATCH  /api/client/messages/:id/read      - Mark as read
GET    /api/client/messages/unread-count  - Get unread count
```

### 5.7 Invoice Endpoints

```
GET    /api/client/invoices               - List invoices
GET    /api/client/invoices/:id           - Get invoice details
GET    /api/client/invoices/:id/pdf       - Download invoice PDF
GET    /api/client/invoices/summary       - Get invoice summary
```

### 5.8 Notification Endpoints

```
GET    /api/client/notifications          - List notifications
PATCH  /api/client/notifications/:id/read - Mark as read
PATCH  /api/client/notifications/read-all - Mark all as read
DELETE /api/client/notifications/:id      - Delete notification
GET    /api/client/notifications/unread-count - Get unread count
```

---

## Phase 6: Implementation Timeline

### Sprint 1 (Week 1-2): Authentication & Database
- [ ] Set up PostgreSQL database with schema
- [ ] Implement email/password registration
- [ ] Implement email verification flow
- [ ] Implement password reset flow
- [ ] Add rate limiting and security measures
- [ ] Admin approval workflow
- [ ] Integrate with existing OAuth (Google/LinkedIn)

### Sprint 2 (Week 3-4): Onboarding & Core UI
- [ ] Build onboarding flow (5 steps)
- [ ] Complete profile settings page
- [ ] Company settings page
- [ ] Notification preferences
- [ ] Help center structure

### Sprint 3 (Week 5-6): Projects & Documents
- [ ] Projects list page
- [ ] Project detail page with tabs
- [ ] Project milestones view
- [ ] Documents list page
- [ ] Document upload functionality
- [ ] Document viewer
- [ ] Version history

### Sprint 4 (Week 7-8): Messaging & Notifications
- [ ] Messages/inbox page
- [ ] Project conversation threads
- [ ] Real-time messaging (WebSocket)
- [ ] Notification center
- [ ] Email notifications
- [ ] Activity feed

### Sprint 5 (Week 9-10): Invoices & Polish
- [ ] Invoices list page
- [ ] Invoice detail view
- [ ] Payment integration (optional)
- [ ] Dashboard refinements
- [ ] Mobile responsiveness
- [ ] Performance optimization

### Sprint 6 (Week 11-12): Testing & Launch
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation
- [ ] Production deployment
- [ ] Client onboarding

---

## Phase 7: Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Real-time**: Socket.io client

### Backend
- **Framework**: FastAPI (Python) - extends existing portal backend
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Auth**: JWT + OAuth2
- **Email**: SendGrid / AWS SES
- **File Storage**: AWS S3 / Cloudflare R2
- **Real-time**: Socket.io / WebSockets

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / AWS
- **Database**: Neon / Supabase / AWS RDS
- **CDN**: Cloudflare
- **Monitoring**: Sentry

---

## Security Considerations

1. **Authentication**
   - JWT with short expiry (15 min) + refresh tokens
   - Secure HTTP-only cookies
   - CSRF protection
   - Rate limiting on auth endpoints

2. **Authorization**
   - Row-level security (users only see their data)
   - Project-based access control
   - Admin approval for new accounts

3. **Data Protection**
   - Encrypted connections (TLS)
   - Password hashing (bcrypt)
   - Sensitive data encryption at rest
   - Audit logging

4. **File Security**
   - Signed URLs for document access
   - Virus scanning on uploads
   - File type validation

---

## Next Steps

1. **Approve this plan**
2. **Set up database** (PostgreSQL with schema)
3. **Implement authentication** (Phase 1)
4. **Build onboarding** (Phase 3)
5. **Develop pages iteratively** (Phase 4)

Ready to proceed with implementation?
