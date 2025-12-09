# JASPER Client Onboarding System

**Purpose:** End-to-end client journey automation
**Platform:** n8n (self-hosted) + Tally + Email
**Last Updated:** December 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        JASPER CLIENT JOURNEY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ INQUIRY  │───▶│ QUALIFY  │───▶│  INTAKE  │───▶│ PROPOSAL │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │               │                  │
│       ▼               ▼               ▼               ▼                  │
│   Quick Form      Manual         Full Form       Auto-generate          │
│   → n8n           Review         → n8n           → Send                 │
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ DEPOSIT  │───▶│PRODUCTION│───▶│  DRAFT   │───▶│  FINAL   │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │               │                  │
│       ▼               ▼               ▼               ▼                  │
│   Invoice         Milestones      Feedback        Delivery              │
│   → Kickoff       → Updates       → Revisions     → Survey              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Inquiry

### Trigger
- Quick Contact form submitted on website

### n8n Workflow: `inquiry-received`

```
TRIGGER: Tally Webhook (quick-contact form)
    │
    ▼
STEP 1: Parse Form Data
    - Extract: name, email, project_name, funding_amount, sector
    │
    ▼
STEP 2: Create Record in Database
    - Add to Notion/Airtable/Google Sheets
    - Status: "New Inquiry"
    - Date received
    │
    ▼
STEP 3: Send Internal Notification
    - Email to models@jasperfinance.org
    - Subject: "New Inquiry: [Project Name]"
    - Body: Full form data
    │
    ▼
STEP 4: Send Client Auto-Response
    - Template: "inquiry-received"
    - Confirms 48-hour response time
    │
    ▼
STEP 5: Set Reminder
    - Create task: "Review [Project Name] inquiry"
    - Due: 24 hours
```

### Auto-Response Email

```
Subject: We've received your inquiry - [Project Name]

Hi [Name],

Thanks for reaching out about [Project Name].

We've received your inquiry and will review it within 48 hours.

WHAT HAPPENS NEXT
─────────────────
If your project is potentially a fit:
→ You'll receive our detailed intake form

If it's not the right fit:
→ We'll let you know honestly (no ghosting)

No sales calls. No spam. Just a direct response.

JASPER Financial Architecture
models@jasperfinance.org
```

---

## Stage 2: Qualification

### Trigger
- Manual review complete

### Actions (Manual)

```
QUALIFIED → Send intake form link
NOT QUALIFIED → Send decline email
NEED INFO → Send clarification email
```

### n8n Workflow: `send-intake`

```
TRIGGER: Manual (button in database)
    │
    ▼
STEP 1: Update Database
    - Status: "Intake Sent"
    - Date sent
    │
    ▼
STEP 2: Generate Unique Intake Link
    - Tally prefilled with project name
    │
    ▼
STEP 3: Send Intake Email
    - Template: "intake-invitation"
    - Include personalized link
    │
    ▼
STEP 4: Set Follow-up Reminder
    - If no submission in 5 days → reminder
```

---

## Stage 3: Intake

### Trigger
- Full intake form submitted

### n8n Workflow: `intake-received`

```
TRIGGER: Tally Webhook (full-intake form)
    │
    ▼
STEP 1: Parse Form Data
    - Extract all fields
    - Download attached files
    │
    ▼
STEP 2: Update Database
    - Status: "Intake Complete"
    - Store all data
    - Link attachments
    │
    ▼
STEP 3: Create Project Folder
    - Google Drive or local
    - Structure:
      /[ProjectName]
        /01_Intake
        /02_Working
        /03_Drafts
        /04_Final
    │
    ▼
STEP 4: Move Attachments
    - Upload to /01_Intake folder
    │
    ▼
STEP 5: Send Internal Notification
    - Email with summary
    - Link to full data
    │
    ▼
STEP 6: Send Client Confirmation
    - Template: "intake-received"
    │
    ▼
STEP 7: Create Proposal Task
    - Due: 48 hours
```

---

## Stage 4: Proposal

### Trigger
- Manual proposal creation

### n8n Workflow: `send-proposal`

```
TRIGGER: Manual (proposal PDF uploaded)
    │
    ▼
STEP 1: Update Database
    - Status: "Proposal Sent"
    - Proposal amount
    - Valid until date
    │
    ▼
STEP 2: Send Proposal Email
    - Template: "proposal-delivery"
    - Attach PDF
    │
    ▼
STEP 3: Set Expiry Reminder
    - 7 days: gentle reminder if no response
    - 13 days: final reminder before expiry
```

### n8n Workflow: `proposal-followup`

```
TRIGGER: Schedule (daily check)
    │
    ▼
STEP 1: Query Database
    - Find proposals sent 7 days ago, no response
    │
    ▼
STEP 2: Send Reminder
    - Template: "proposal-reminder"
    - Only once per proposal
```

---

## Stage 5: Deposit

### Trigger
- Client accepts proposal (email reply)

### n8n Workflow: `send-deposit-invoice`

```
TRIGGER: Manual (acceptance confirmed)
    │
    ▼
STEP 1: Update Database
    - Status: "Accepted - Awaiting Deposit"
    │
    ▼
STEP 2: Generate Invoice
    - Invoice number: JASPER-YYYY-###
    - Amount: 50% of total
    - Payment details
    │
    ▼
STEP 3: Send Invoice Email
    - Template: "deposit-invoice"
    - Attach PDF
    │
    ▼
STEP 4: Set Payment Reminder
    - 3 days: payment reminder if not received
```

### n8n Workflow: `deposit-received`

```
TRIGGER: Manual (payment confirmed)
    │
    ▼
STEP 1: Update Database
    - Status: "In Production"
    - Payment date
    - Start date
    │
    ▼
STEP 2: Calculate Milestones
    - Based on package timeline
    │
    ▼
STEP 3: Send Kickoff Email
    - Template: "project-kickoff"
    - Milestone dates
    │
    ▼
STEP 4: Create Production Tasks
    - Week 1: Lock assumptions
    - Week 2-3: Build model
    - Week 3-4: Draft delivery
    │
    ▼
STEP 5: Add to Active Projects
    - Dashboard/tracking view
```

---

## Stage 6: Production

### Milestone Updates

```
MILESTONE 1: Assumptions Locked
───────────────────────────────
Trigger: Manual
Email: "assumptions-locked"
Content: Summary of key assumptions, request confirmation

MILESTONE 2: Model Structure Complete
─────────────────────────────────────
Trigger: Manual
Email: "structure-complete"
Content: Progress update, timeline confirmation

MILESTONE 3: Draft Ready
────────────────────────
Trigger: Manual
Workflow: "send-draft"
```

### n8n Workflow: `send-milestone-update`

```
TRIGGER: Manual (select milestone)
    │
    ▼
STEP 1: Update Database
    - Milestone completed date
    │
    ▼
STEP 2: Send Update Email
    - Template based on milestone
    │
    ▼
STEP 3: Update Dashboard
    - Progress indicator
```

---

## Stage 7: Draft Delivery

### n8n Workflow: `send-draft`

```
TRIGGER: Manual (draft files ready)
    │
    ▼
STEP 1: Upload Files
    - To secure file sharing
    - Generate download link
    │
    ▼
STEP 2: Update Database
    - Status: "Draft Delivered"
    - Draft version number
    │
    ▼
STEP 3: Generate Feedback Form Link
    - Tally prefilled with project info
    │
    ▼
STEP 4: Send Draft Email
    - Template: "draft-delivery"
    - Download link
    - Feedback form link
    - Review deadline (5 days)
    │
    ▼
STEP 5: Set Review Reminder
    - 4 days: reminder if no feedback
```

### n8n Workflow: `feedback-received`

```
TRIGGER: Tally Webhook (draft-feedback form)
    │
    ▼
STEP 1: Parse Feedback
    - Extract all changes requested
    │
    ▼
STEP 2: Update Database
    - Status: "Revision in Progress"
    - Feedback received date
    - Revision round number
    │
    ▼
STEP 3: Create Revision Task
    - With all feedback items
    │
    ▼
STEP 4: Send Confirmation
    - Template: "feedback-received"
    - Expected turnaround
```

---

## Stage 8: Final Delivery

### n8n Workflow: `send-balance-invoice`

```
TRIGGER: Manual (final draft approved)
    │
    ▼
STEP 1: Update Database
    - Status: "Awaiting Final Payment"
    │
    ▼
STEP 2: Generate Invoice
    - 50% balance
    │
    ▼
STEP 3: Send Invoice Email
    - Template: "balance-invoice"
```

### n8n Workflow: `final-delivery`

```
TRIGGER: Manual (payment confirmed)
    │
    ▼
STEP 1: Update Database
    - Status: "Delivered"
    - Completion date
    │
    ▼
STEP 2: Prepare Final Files
    - Remove watermarks
    - Final quality check
    │
    ▼
STEP 3: Upload to Secure Sharing
    - Generate download link
    │
    ▼
STEP 4: Send Final Delivery Email
    - Template: "final-delivery"
    - Download link
    - Support period info
    │
    ▼
STEP 5: Schedule Close Survey
    - Send in 7 days
    │
    ▼
STEP 6: Archive Project
    - Move to completed
    - Start retention timer
```

---

## Database Structure

### Recommended: Notion or Airtable

```
TABLE: Projects
───────────────────────────────────────────────────────────────
Field                   Type            Notes
───────────────────────────────────────────────────────────────
project_id              Auto-number     JASPER-YYYY-###
project_name            Text            From intake
client_name             Text            From intake
client_email            Email           From intake
client_company          Text            From intake
sector                  Select          Agri/Infra/Tech/Mfg
funding_amount          Currency        Target funding
target_dfi              Multi-select    IFC, AfDB, etc.
package                 Select          Growth/Inst/Infra
package_price           Currency        Total price
status                  Select          Pipeline stages
───────────────────────────────────────────────────────────────
inquiry_date            Date            When first contacted
intake_date             Date            When intake completed
proposal_date           Date            When proposal sent
proposal_expiry         Date            +14 days
accepted_date           Date            When accepted
deposit_date            Date            When deposit paid
start_date              Date            When work begins
draft_date              Date            When draft delivered
feedback_date           Date            When feedback received
final_date              Date            When final delivered
───────────────────────────────────────────────────────────────
deposit_amount          Currency        50%
deposit_paid            Checkbox
balance_amount          Currency        50%
balance_paid            Checkbox
payment_method          Select          Crypto/Wise/Bank
───────────────────────────────────────────────────────────────
revision_rounds_used    Number          Track usage
revision_rounds_total   Number          Per package
support_end_date        Date            Start + 30/60/90 days
───────────────────────────────────────────────────────────────
notes                   Long text       Internal notes
folder_link             URL             Google Drive link
attachments             Files           Uploaded docs
───────────────────────────────────────────────────────────────

STATUS OPTIONS:
- New Inquiry
- Intake Sent
- Intake Complete
- Proposal Sent
- Accepted - Awaiting Deposit
- In Production
- Draft Delivered
- Revision in Progress
- Awaiting Final Payment
- Delivered
- Completed
- Declined
- Cancelled
```

---

## n8n Setup

### Self-Hosted on Hostinger VPS

```
REQUIREMENTS
────────────
- VPS with Docker support
- 1GB RAM minimum
- Domain: n8n.jasperfinance.org (or internal only)

INSTALLATION
────────────
docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=[secure-password] \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n

WEBHOOK URL
───────────
https://n8n.jasperfinance.org/webhook/[workflow-id]
```

### Required Integrations

```
TALLY → n8n
──────────
Each form sends webhook to n8n
Payload: All form fields + metadata

n8n → EMAIL
───────────
SMTP via Hostinger or external service
From: models@jasperfinance.org

n8n → DATABASE
──────────────
Option 1: Notion API
Option 2: Airtable API
Option 3: Google Sheets API

n8n → FILE STORAGE
──────────────────
Option 1: Google Drive API
Option 2: Local storage with links
```

### Workflow List

```
WORKFLOWS TO CREATE
───────────────────
1. inquiry-received        - New contact form
2. send-intake             - Send intake link
3. intake-received         - Process intake
4. send-proposal           - Deliver proposal
5. proposal-followup       - 7-day reminder
6. send-deposit-invoice    - Invoice after accept
7. deposit-received        - Start project
8. send-milestone-update   - Progress updates
9. send-draft              - Draft delivery
10. feedback-received      - Process revisions
11. send-balance-invoice   - Final invoice
12. final-delivery         - Complete project
13. send-close-survey      - Feedback request
```

---

## File Sharing Setup

### Option 1: Google Drive

```
FOLDER STRUCTURE
────────────────
/JASPER Clients
  /[Year]
    /[ProjectName]
      /01_Intake
      /02_Working
      /03_Drafts
      /04_Final

SHARING
───────
- Individual file links
- View-only for drafts
- Download enabled for final
- Links expire after 30 days
```

### Option 2: Self-Hosted (FileBrowser)

```
SETUP
─────
Docker container on VPS
Password-protected downloads
Custom branding
No external dependencies
```

---

## Backup & Redundancy

```
EMAIL BACKUPS
─────────────
All automated emails BCC to archive@jasperfinance.org

DATABASE BACKUPS
────────────────
Daily export of project database
Store in secure location

FILE BACKUPS
────────────
Weekly backup of all project files
Retain for 2 years after completion
```

---

*Onboarding system v1.0 - December 2025*
