# JASPER Email Marketing System

**Purpose:** Lead nurturing, authority building, list management
**Platform:** n8n + Hostinger email (or Brevo free tier)
**Last Updated:** December 2025

---

## Email Strategy Overview

### Philosophy

```
NOT DOING
─────────
✗ Cold outreach
✗ Purchased lists
✗ Hard selling
✗ Frequent emails
✗ Clickbait subject lines

DOING
─────
✓ Permission-based only
✓ Value-first content
✓ Low frequency (monthly max)
✓ Educational focus
✓ Easy unsubscribe
```

### Email Categories

```
1. TRANSACTIONAL     - Client journey emails (automated)
2. NEWSLETTER        - Monthly insights (opt-in)
3. ANNOUNCEMENT      - Major updates (rare)
```

---

## Newsletter System

### Opt-In Strategy

```
WHERE TO CAPTURE
────────────────
1. Website footer: "Monthly DFI insights"
2. After form submission: "Stay updated?"
3. LinkedIn content: "Subscribe for more"

NO POP-UPS
NO FORCED SIGN-UPS
PERMISSION ONLY
```

### Newsletter Form (Tally)

```
DFI INSIGHTS NEWSLETTER
═══════════════════════

Monthly insights on development finance.
No spam. Unsubscribe anytime.

EMAIL *
[Email field]

SECTOR INTEREST
[Checkbox - multiple select]
☐ Agribusiness
☐ Infrastructure
☐ Technology
☐ Manufacturing
☐ All sectors

[Subscribe Button]

CONFIRMATION
────────────
You're subscribed. First email arrives next month.
Unsubscribe anytime via link in any email.
```

### Newsletter Content Strategy

```
MONTHLY NEWSLETTER STRUCTURE
────────────────────────────

Subject Line: [Month] DFI Insights | [Specific Topic]

CONTENT BLOCKS
──────────────

1. INSIGHT OF THE MONTH
   - One deep topic
   - Practical, actionable
   - 300-500 words

   Example topics:
   - "What IFC analysts look for in year 1 cash flows"
   - "The DSCR threshold that kills most applications"
   - "Why your assumptions page matters more than projections"

2. DFI NEWS (optional)
   - 2-3 bullet points
   - Relevant announcements
   - New funding windows

3. JASPER UPDATE (brief)
   - What we've been working on
   - Sector focus this month
   - 2-3 sentences max

4. RESOURCE LINK
   - Link to website article (SEO value)
   - Or useful external resource

5. CTA (soft)
   - "Have a project? models@jasperfinance.org"
   - Not pushy
```

### Newsletter Template

```
Subject: December DFI Insights | The Assumption Document Nobody Reads

─────────────────────────────────────────────────────

[JASPER LOGO]

─────────────────────────────────────────────────────

THE ASSUMPTION DOCUMENT NOBODY READS

Every DFI model I review has the same problem.

The assumptions are buried. Hidden in yellow cells
scattered across 30 sheets. No summary. No source
citations. No way to audit.

DFI analysts have 30 minutes to understand your project.
If they can't trace your revenue to a source in 30 seconds,
you've lost them.

The fix is simple: a dedicated Assumptions sheet that
documents every input with:

• The assumption value
• The source (quote, research, comparable)
• The date captured
• Sensitivity range

One sheet. Total traceability. Instant credibility.

This is why every JASPER model starts with a structured
Assumptions layer. Not because we're pedantic—because
we've seen what happens when assumptions can't be defended.

─────────────────────────────────────────────────────

DFI UPDATES

• IFC launches new $500M Africa climate fund
• AfDB updates project submission portal
• IDC announces Q1 2025 priority sectors

─────────────────────────────────────────────────────

THIS MONTH AT JASPER

Working on two agribusiness projects targeting AfDB
and IDC. Focus: commodity price sensitivity and
smallholder impact metrics.

─────────────────────────────────────────────────────

Have a project? models@jasperfinance.org

Unsubscribe: [link]

─────────────────────────────────────────────────────

JASPER Financial Architecture
jasperfinance.org

© 2025 Gahn Eden (Pty) Ltd
```

---

## List Management

### Subscriber Database

```
TABLE: Newsletter Subscribers
─────────────────────────────────────────────────
Field               Type          Notes
─────────────────────────────────────────────────
email               Email         Primary key
name                Text          Optional
subscribed_date     Date          When joined
source              Select        Website/LinkedIn/Form
sectors             Multi-select  Interest areas
status              Select        Active/Unsubscribed
last_email_date     Date          Tracking
open_rate           Number        Historical avg
─────────────────────────────────────────────────
```

### Unsubscribe Handling

```
ONE-CLICK UNSUBSCRIBE
─────────────────────
Every email includes unsubscribe link
Immediate removal from list
No "are you sure?" friction
Confirmation page: "You're unsubscribed. Sorry to see you go."

COMPLIANCE
──────────
✓ CAN-SPAM compliant
✓ GDPR compliant
✓ POPIA compliant (South Africa)
```

---

## Automated Email Sequences

### Sequence 1: New Subscriber Welcome

```
TRIGGER: Newsletter subscription

DAY 0: Welcome Email
─────────────────────
Subject: Welcome to DFI Insights

Hi [Name/there],

Thanks for subscribing.

WHAT TO EXPECT
──────────────
Monthly insights on development finance modelling.
Practical, actionable, no fluff.

Topics we cover:
• DFI application requirements
• Financial model best practices
• Sector-specific considerations
• Common mistakes and how to avoid them

First email arrives at month end.

Have a project now? Reply to this email.

JASPER Financial Architecture
models@jasperfinance.org
```

### Sequence 2: Post-Inquiry (No Conversion)

```
TRIGGER: Quick contact form, not converted after 30 days

DAY 30: Value Email
───────────────────
Subject: Still thinking about your project?

Hi [Name],

You reached out about [Project Name] last month.

No pressure - timing matters in development finance.

In the meantime, here's something that might help:
[Link to relevant article or resource]

When you're ready, I'm here.

JASPER Financial Architecture
models@jasperfinance.org

---
Don't want to hear from us? [Unsubscribe]
```

### Sequence 3: Post-Delivery (Client Nurture)

```
TRIGGER: Project completed

DAY 7: Survey Request
─────────────────────
[Project close survey - already documented]

DAY 30: Check-In
────────────────
Subject: How's the submission going?

Hi [Name],

It's been a month since we delivered [Project Name].

How's the DFI submission progressing?
Any questions about the model?

If you need adjustments or updates, quarterly model
updates are $2,500 (existing clients).

Just reply if you need anything.

Best,
JASPER

DAY 90: Referral Request (only if feedback was positive)
────────────────────────────────────────────────────────
Subject: Quick request

Hi [Name],

Hope [Project Name] is progressing well.

Quick request: if you know anyone preparing a DFI
application, I'd appreciate an introduction.

No pressure - only if it's a natural fit.

Thanks for working with us.

Best,
JASPER
```

---

## Content Calendar

### Monthly Newsletter Schedule

```
PUBLICATION: Last Thursday of each month
PREPARATION: Week before

MONTHLY TASKS
─────────────
Week 1: Topic research
Week 2: Draft content
Week 3: Review and edit
Week 4 (Thu): Send newsletter

TOPIC ROTATION
──────────────
Month 1: DFI requirements
Month 2: Model best practices
Month 3: Sector focus
Month 4: Case study / lessons learned
[Repeat cycle]
```

### Sample 6-Month Calendar

```
JANUARY 2025
───────────────────────────────────────
Topic: "IFC's 2025 priority sectors - what it means for your model"
Sector: All
CTA: Start your project

FEBRUARY 2025
───────────────────────────────────────
Topic: "The 3 ratios every DFI analyst checks first"
Sector: All
CTA: Methodology page

MARCH 2025
───────────────────────────────────────
Topic: "Agribusiness: modelling commodity price volatility"
Sector: Agribusiness
CTA: Sectors page

APRIL 2025
───────────────────────────────────────
Topic: "Why your 5-year projections are probably wrong"
Sector: All
CTA: FAQ page

MAY 2025
───────────────────────────────────────
Topic: "Infrastructure: construction period cash flows"
Sector: Infrastructure
CTA: Packages page

JUNE 2025
───────────────────────────────────────
Topic: "The assumption book that saved a $50M deal"
Sector: All
CTA: Contact page
```

---

## Email Technical Setup

### Option 1: Hostinger Email + n8n

```
SETUP
─────
Email: models@jasperfinance.org (existing)
SMTP: Hostinger SMTP settings
Rate limit: ~100 emails/hour

n8n CONFIGURATION
─────────────────
Node: Email Send
SMTP Host: smtp.hostinger.com
Port: 587
User: models@jasperfinance.org
Auth: App password

PROS
────
✓ No additional cost
✓ Uses existing email
✓ Full control

CONS
────
✗ Manual list management
✗ No built-in analytics
✗ Deliverability may vary
```

### Option 2: Brevo (Sendinblue) Free Tier

```
SETUP
─────
Free tier: 300 emails/day
Integration: n8n Brevo node

FEATURES
────────
✓ Email templates
✓ List management
✓ Open/click tracking
✓ Unsubscribe handling
✓ SMTP and API

PROS
────
✓ Professional deliverability
✓ Built-in analytics
✓ Easy unsubscribe management
✓ Free for our volume

CONFIGURATION
─────────────
From: models@jasperfinance.org
Reply-To: models@jasperfinance.org
Domain: jasperfinance.org (verify)
```

### Recommended: Brevo Free Tier

```
WHY BREVO
─────────
1. 300 emails/day is plenty for our volume
2. Professional deliverability
3. Easy n8n integration
4. Unsubscribe handling built-in
5. Analytics without setup
6. Free forever at our scale

SETUP STEPS
───────────
1. Create Brevo account
2. Verify jasperfinance.org domain
3. Configure n8n Brevo node
4. Import newsletter form to Brevo
5. Create email templates
```

---

## Analytics & Tracking

### Metrics to Track

```
NEWSLETTER METRICS
──────────────────
• Subscribers (total)
• Open rate (target: >30%)
• Click rate (target: >5%)
• Unsubscribe rate (target: <1%)
• Growth rate (monthly)

LEAD METRICS
────────────
• Newsletter → Inquiry rate
• Source tracking (where subscribers convert)
```

### Monthly Review

```
MONTHLY ANALYTICS CHECK
───────────────────────
☐ Review open rates
☐ Review click rates
☐ Check unsubscribe reasons (if any)
☐ Note high-performing topics
☐ Adjust content strategy if needed
```

---

## Compliance

### Legal Requirements

```
CAN-SPAM (US)
─────────────
✓ Physical address in footer
✓ Clear unsubscribe link
✓ Accurate subject lines
✓ Identify as advertisement

GDPR (EU)
─────────
✓ Consent before sending
✓ Easy unsubscribe
✓ Data access on request
✓ Right to deletion

POPIA (South Africa)
────────────────────
✓ Consent required
✓ Purpose specification
✓ Security measures
✓ Right to access/correction
```

### Footer Requirements

```
REQUIRED IN EVERY EMAIL
───────────────────────
Gahn Eden (Pty) Ltd
17 Wattle Street, Florida Park
Roodepoort, 1709, South Africa

Unsubscribe: [one-click link]
```

---

## No-Go List

```
NEVER EMAIL
───────────
✗ Purchased lists
✗ Scraped contacts
✗ Business cards from events (without permission)
✗ LinkedIn connections (without opt-in)
✗ Anyone who unsubscribed
✗ Bounced addresses

NEVER SEND
──────────
✗ Promotional-only emails
✗ High-frequency campaigns
✗ Clickbait subject lines
✗ Emails without unsubscribe
✗ Attachments (use links)
```

---

## n8n Email Workflows

### Workflow: `send-newsletter`

```
TRIGGER: Manual (monthly)
    │
    ▼
STEP 1: Get Subscriber List
    - Query Brevo or database
    - Filter: Active subscribers only
    │
    ▼
STEP 2: Prepare Content
    - Load newsletter template
    - Insert monthly content
    │
    ▼
STEP 3: Send via Brevo
    - Batch send
    - Track delivery
    │
    ▼
STEP 4: Log Send
    - Record date
    - Note topic
```

### Workflow: `newsletter-signup`

```
TRIGGER: Tally webhook (newsletter form)
    │
    ▼
STEP 1: Add to Brevo List
    - Create contact if new
    - Add to newsletter list
    │
    ▼
STEP 2: Send Welcome Email
    - Template: welcome-subscriber
    │
    ▼
STEP 3: Log Subscription
    - Database record
    - Source tracking
```

---

*Email marketing system v1.0 - December 2025*
