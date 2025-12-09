# JASPER User Experience Journeys

**Purpose:** Complete UX flows for diagramming and implementation
**Last Updated:** December 2025

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        JASPER USER JOURNEYS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JOURNEY 1: DISCOVERY → INQUIRY                                         │
│  New visitor explores site and makes initial contact                     │
│                                                                          │
│  JOURNEY 2: INQUIRY → QUALIFIED LEAD                                    │
│  Contact is reviewed and invited to submit full intake                   │
│                                                                          │
│  JOURNEY 3: SUBMISSION → PROPOSAL                                       │
│  Documents uploaded, analysed, proposal delivered                        │
│                                                                          │
│  JOURNEY 4: PROPOSAL → CLIENT                                           │
│  Proposal accepted, deposit paid, project begins                         │
│                                                                          │
│  JOURNEY 5: CLIENT → DELIVERY                                           │
│  Production, drafts, feedback, final delivery                            │
│                                                                          │
│  JOURNEY 6: DELIVERY → ADVOCATE                                         │
│  Project complete, feedback, referrals                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Journey 1: Discovery → Inquiry

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     JOURNEY 1: DISCOVERY → INQUIRY                        │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   ENTRY     │
    │   POINTS    │
    └──────┬──────┘
           │
     ┌─────┴─────┬─────────────┬─────────────┐
     ▼           ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Google  │ │LinkedIn │ │Referral │ │ Direct  │
│ Search  │ │  Post   │ │  Link   │ │   URL   │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │
     └───────────┴─────┬─────┴───────────┘
                       ▼
              ┌────────────────┐
              │   HOME PAGE    │
              │  /             │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ Learn More   │ │ Explore  │ │ Ready to     │
│ (Explore)    │ │ Services │ │ Start        │
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
       │              │              │
       ▼              ▼              │
┌──────────────┐ ┌──────────────┐    │
│ METHODOLOGY  │ │  SERVICES    │    │
│ /methodology │ │  /services   │    │
└──────┬───────┘ └──────┬───────┘    │
       │                │            │
       │    ┌───────────┘            │
       │    │                        │
       ▼    ▼                        ▼
┌─────────────────────────────────────────┐
│              CONTACT PAGE               │
│              /contact                   │
├─────────────────────────────────────────┤
│                                         │
│  Quick Contact Form:                    │
│  ├─ Name                                │
│  ├─ Email                               │
│  ├─ Project Name                        │
│  ├─ Funding Amount                      │
│  └─ Sector                              │
│                                         │
│  CTA: "Start Your Project →"            │
│                                         │
└────────────────────┬────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  CONFIRMATION  │
            │    SCREEN      │
            └────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  AUTO-EMAIL    │
            │  "Received"    │
            └────────────────┘
                     │
                     ▼
              ┌────────────┐
              │   END J1   │
              │  → J2      │
              └────────────┘
```

### Page CTAs for Journey 1

| Page | Primary CTA | Secondary CTA | Destination |
|------|-------------|---------------|-------------|
| Home | "Start Your Project →" | "See How We Work" | /contact |
| Methodology | "Get Started →" | "View Packages" | /contact |
| Services | "Start Your Project →" | "See Our Process" | /contact |
| Process | "Begin Now →" | "View Pricing" | /contact |
| Sectors | "Discuss Your Project →" | - | /contact |
| FAQ | "Ready to Start?" | - | /contact |

### Touchpoints

```
ENTRY → HOME
────────────
User sees: Hero with value proposition
User thinks: "Do they handle my type of project?"
Action: Explore or contact immediately

HOME → METHODOLOGY
──────────────────
User sees: JASPER 28 architecture explanation
User thinks: "This is more sophisticated than competitors"
Action: Understand depth, move to services or contact

HOME → SERVICES
───────────────
User sees: Three packages with clear pricing
User thinks: "Which package fits my project?"
Action: Self-select package, move to contact

ANY PAGE → CONTACT
──────────────────
User sees: Simple 5-field form
User thinks: "Easy, no phone call required"
Action: Submit inquiry

CONTACT → CONFIRMATION
──────────────────────
User sees: "Received, 48-hour response"
User thinks: "Clear expectation set"
Action: Wait for response
```

---

## Journey 2: Inquiry → Qualified Lead

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  JOURNEY 2: INQUIRY → QUALIFIED LEAD                      │
└──────────────────────────────────────────────────────────────────────────┘

              ┌────────────────┐
              │  INQUIRY       │
              │  RECEIVED      │
              │  (from J1)     │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │  n8n WORKFLOW  │
              │  Auto-process  │
              └───────┬────────┘
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
    ┌────────────┐ ┌────────┐ ┌────────────┐
    │ QUALIFIED  │ │ MAYBE  │ │ NOT FIT    │
    │ $5M+ DFI   │ │ Need   │ │ <$1M, visa │
    │            │ │ info   │ │ template   │
    └─────┬──────┘ └───┬────┘ └─────┬──────┘
          │            │            │
          ▼            ▼            ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ SEND       │ │ SEND       │ │ SEND       │
    │ INTAKE     │ │ CLARIFY    │ │ DECLINE    │
    │ INVITE     │ │ EMAIL      │ │ EMAIL      │
    └─────┬──────┘ └─────┬──────┘ └────────────┘
          │              │
          │              │ (if clarified)
          │              └──────┐
          │                     │
          ▼                     ▼
    ┌─────────────────────────────────┐
    │         CLIENT EMAIL            │
    │   "You're invited to submit"    │
    │   [Submit Documents →]          │
    └────────────────┬────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────┐
    │        SUBMISSION PAGE          │
    │        /submit                  │
    ├─────────────────────────────────┤
    │                                 │
    │  Upload Form:                   │
    │  ├─ Contact details             │
    │  ├─ Project details             │
    │  ├─ Target DFI selection        │
    │  └─ Document upload (multi)     │
    │                                 │
    │  CTA: "Submit Documents →"      │
    │                                 │
    └────────────────┬────────────────┘
                     │
                     ▼
              ┌────────────┐
              │   END J2   │
              │   → J3     │
              └────────────┘
```

### Email Templates

```
INTAKE INVITE EMAIL
───────────────────
Subject: Ready to submit your project - [Project Name]

Hi [Name],

Your project looks like a good fit for JASPER.

NEXT STEP
─────────
Submit your project documents:
[Submit Documents →] ← links to /submit

WHAT TO PREPARE
───────────────
☐ Financial model or projections
☐ Feasibility study or concept note
☐ Company registration
☐ Brand assets (logo, colours)

The submission takes 10-15 minutes.
Our AI will analyse your documents immediately.

JASPER Financial Architecture
models@jasperfinance.org


CLARIFICATION EMAIL
───────────────────
Subject: Quick question about [Project Name]

Hi [Name],

Thanks for your inquiry about [Project Name].

Before we proceed, could you clarify:
[Specific question]

Once confirmed, I'll send you the submission link.

JASPER Financial Architecture


DECLINE EMAIL
─────────────
Subject: Re: [Project Name] inquiry

Hi [Name],

Thanks for considering JASPER for [Project Name].

After reviewing your inquiry, this project isn't the
right fit for our services because:
[Reason - e.g., below $1M, bank loan not DFI, etc.]

ALTERNATIVES
────────────
For your needs, you might consider:
├─ [Alternative 1]
└─ [Alternative 2]

We wish you success with your project.

JASPER Financial Architecture
```

---

## Journey 3: Submission → Proposal

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   JOURNEY 3: SUBMISSION → PROPOSAL                        │
└──────────────────────────────────────────────────────────────────────────┘

              ┌────────────────┐
              │  SUBMISSION    │
              │  RECEIVED      │
              │  (from J2)     │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │  CONFIRMATION  │
              │  SCREEN        │
              │  + EMAIL       │
              └───────┬────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │          AI PROCESSING (<60 sec)         │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Qwen3 VL 8B                            │
    │  ├─ OCR all documents                   │
    │  ├─ Extract text, tables, figures       │
    │  └─ Detect branding elements            │
    │                                         │
    │  Qwen3 VL 30B Thinking                  │
    │  ├─ Check against checklist             │
    │  ├─ Identify missing items              │
    │  └─ Assess quality                      │
    │                                         │
    │  DeepSeek V3.2                          │
    │  └─ Generate feedback report            │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ COMPLETE │ │ PARTIAL  │ │INCOMPLETE│
  │  90%+    │ │  70-89%  │ │  <70%    │
  └────┬─────┘ └────┬─────┘ └────┬─────┘
       │            │            │
       ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ COMPLETE │ │ PARTIAL  │ │INCOMPLETE│
  │ EMAIL    │ │ EMAIL    │ │ EMAIL    │
  │          │ │ "Items   │ │ "Cannot  │
  │ "Ready   │ │ needed"  │ │ proceed" │
  │ for      │ │          │ │          │
  │ review"  │ │ [Add     │ │ [Submit  │
  │          │ │ Items →] │ │ More →]  │
  └────┬─────┘ └────┬─────┘ └────┬─────┘
       │            │            │
       │            │ (loop until complete)
       │            └──────┬─────┘
       │                   │
       ▼                   │
┌──────────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│           MANUAL REVIEW                  │
│           (Within 48 hours)              │
├─────────────────────────────────────────┤
│                                         │
│  ├─ Review extracted data               │
│  ├─ Assess project complexity           │
│  ├─ Determine package fit               │
│  └─ Prepare proposal                    │
│                                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           PROPOSAL EMAIL                 │
├─────────────────────────────────────────┤
│                                         │
│  Subject: Proposal for [Project Name]   │
│                                         │
│  Package: [Growth/Institutional/Infra]  │
│  Price: $[Amount] USD                   │
│  Timeline: [X] weeks                    │
│  Valid: 14 days                         │
│                                         │
│  [Accept Proposal →]                    │
│  [Schedule Call →] (optional)           │
│                                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
           ┌────────────┐
           │   END J3   │
           │   → J4     │
           └────────────┘
```

### Completeness Email Templates

```
COMPLETE SUBMISSION (90%+)
──────────────────────────
Subject: Submission Complete - [Project Name] ✓

Hi [Name],

Your submission for [Project Name] is complete.

WHAT WE RECEIVED
────────────────
✓ Financial model (35 sheets)
✓ Feasibility study (52 pages)
✓ Company registration
✓ Brand assets detected
✓ Target: $15M via IFC

BRANDING DETECTED
─────────────────
├─ Logo: ✓ High resolution
├─ Colours: #1E3A5F, #2ECC71
└─ Fonts: Montserrat, Open Sans

NEXT STEPS
──────────
We are preparing your proposal.
Expect it within 48 hours.

JASPER Financial Architecture


PARTIAL SUBMISSION (70-89%)
───────────────────────────
Subject: Almost there - [Project Name] needs a few items

Hi [Name],

Your submission is 78% complete.

RECEIVED ✓
──────────
✓ Financial model
✓ Company registration
✓ Target: $8M via AfDB

MISSING ITEMS
─────────────
1. TARGET DFI CONFIRMATION [High Priority]
   You selected AfDB - please confirm this is correct.

2. PROJECT LOCATION [Required]
   Please specify: Country, Region, Site

3. FEASIBILITY STUDY [Recommended]
   Technical overview of your project

HOW TO COMPLETE
───────────────
Reply to this email with the missing information, or:
[Add Missing Items →] ← links to /submit

Once complete, you'll receive your proposal within 48 hours.

JASPER Financial Architecture


INCOMPLETE SUBMISSION (<70%)
────────────────────────────
Subject: Cannot proceed - [Project Name] missing critical items

Hi [Name],

Your submission is missing critical documentation.
We cannot prepare a proposal until these are provided.

RECEIVED
────────
✓ Contact information
✓ Project name
✓ Sector: Agribusiness

MISSING (Required)
──────────────────
✗ Financial model or projections
✗ Project description (need 200+ words)
✗ Funding amount
✗ Target DFI
✗ Company registration

MINIMUM TO PROCEED
──────────────────
We need at least:
├─ Project description (200+ words)
├─ Funding amount and target DFI
├─ Financial projections (any format)
└─ Company information

[Complete Submission →] ← links to /submit

JASPER Financial Architecture
```

---

## Journey 4: Proposal → Client

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    JOURNEY 4: PROPOSAL → CLIENT                           │
└──────────────────────────────────────────────────────────────────────────┘

              ┌────────────────┐
              │   PROPOSAL     │
              │   SENT         │
              │   (from J3)    │
              └───────┬────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
    ┌────────────┐        ┌────────────┐
    │  ACCEPT    │        │  NO        │
    │  (Reply)   │        │  RESPONSE  │
    └─────┬──────┘        └─────┬──────┘
          │                     │
          │               ┌─────┴─────┐
          │               ▼           ▼
          │         ┌─────────┐ ┌─────────┐
          │         │ DAY 7   │ │ DAY 13  │
          │         │ Remind  │ │ Final   │
          │         └────┬────┘ └────┬────┘
          │              │           │
          │              ▼           ▼
          │         ┌─────────┐ ┌─────────┐
          │         │ Response│ │ Expired │
          │         │    ?    │ │ Close   │
          │         └────┬────┘ └─────────┘
          │              │
          └──────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │         DEPOSIT INVOICE                  │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Invoice: JASPER-2025-XXX               │
    │  Amount: 50% of package price           │
    │                                         │
    │  Payment Options:                       │
    │  ├─ Crypto (USDC, USDT, BTC, ETH)      │
    │  ├─ Wise (USD)                          │
    │  └─ Bank (FNB - ZAR)                    │
    │                                         │
    │  [Pay with Crypto →]                    │
    │  [Pay via Wise →]                       │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
    ┌────────────┐      ┌────────────┐
    │  PAYMENT   │      │  NO        │
    │  RECEIVED  │      │  PAYMENT   │
    └─────┬──────┘      └─────┬──────┘
          │                   │
          │             ┌─────┴─────┐
          │             ▼           ▼
          │       ┌─────────┐ ┌─────────┐
          │       │ DAY 3   │ │ DAY 7   │
          │       │ Remind  │ │ Cancel  │
          │       └─────────┘ └─────────┘
          │
          ▼
    ┌─────────────────────────────────────────┐
    │           KICKOFF EMAIL                  │
    ├─────────────────────────────────────────┤
    │                                         │
    │  "Your project has begun"               │
    │                                         │
    │  Timeline:                              │
    │  ├─ Week 1: Lock assumptions            │
    │  ├─ Week 2-3: Build model               │
    │  ├─ Week 3-4: Draft delivery            │
    │  └─ Week 4-5: Revisions + final         │
    │                                         │
    │  Next milestone: Assumptions review     │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
              ┌────────────┐
              │   END J4   │
              │   → J5     │
              └────────────┘
```

### Follow-up Emails

```
DAY 7 PROPOSAL REMINDER
───────────────────────
Subject: Following up - [Project Name] proposal

Hi [Name],

Following up on the proposal I sent last week for [Project Name].

PROPOSAL SUMMARY
────────────────
Package: [Package Name]
Price: $[Amount] USD
Valid until: [Date]

If you have any questions, just reply to this email.

Ready to proceed?
[Accept Proposal →]

JASPER Financial Architecture


DAY 13 FINAL REMINDER
─────────────────────
Subject: Proposal expires tomorrow - [Project Name]

Hi [Name],

Your proposal for [Project Name] expires tomorrow.

If you'd like to proceed, please reply by [Date].
After expiry, a new proposal will be required.

[Accept Before Expiry →]

JASPER Financial Architecture
```

---

## Journey 5: Client → Delivery

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    JOURNEY 5: CLIENT → DELIVERY                           │
└──────────────────────────────────────────────────────────────────────────┘

              ┌────────────────┐
              │   PROJECT      │
              │   STARTED      │
              │   (from J4)    │
              └───────┬────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │         MILESTONE 1: ASSUMPTIONS         │
    ├─────────────────────────────────────────┤
    │                                         │
    │  ├─ Review client documents             │
    │  ├─ Extract key assumptions             │
    │  ├─ Identify gaps                       │
    │  └─ Send for confirmation               │
    │                                         │
    │  Email: "Review these assumptions"      │
    │  [Confirm Assumptions →]                │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │        MILESTONE 2: MODEL BUILD          │
    ├─────────────────────────────────────────┤
    │                                         │
    │  ├─ Build JASPER 28 structure           │
    │  ├─ Implement all layers                │
    │  ├─ Run validation checks               │
    │  └─ Prepare draft                       │
    │                                         │
    │  Email: "Model structure complete"      │
    │  (Progress update)                      │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         MILESTONE 3: DRAFT               │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Email: "Draft ready for review"        │
    │                                         │
    │  ├─ Download link                       │
    │  ├─ Review deadline (5 days)            │
    │  └─ Feedback form link                  │
    │                                         │
    │  [Download Draft →]                     │
    │  [Submit Feedback →]                    │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
    ┌────────────┐      ┌────────────┐
    │  FEEDBACK  │      │ APPROVED   │
    │  RECEIVED  │      │ AS-IS      │
    └─────┬──────┘      └─────┬──────┘
          │                   │
          ▼                   │
    ┌────────────┐            │
    │  REVISION  │            │
    │  ROUND     │            │
    └─────┬──────┘            │
          │                   │
          ▼                   │
    ┌────────────┐            │
    │  UPDATED   │            │
    │  DRAFT     ├────────────┘
    └─────┬──────┘
          │
          ▼ (may loop for included revisions)
          │
    ┌─────────────────────────────────────────┐
    │         BALANCE INVOICE                  │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Invoice: JASPER-2025-XXX-BAL           │
    │  Amount: 50% balance                    │
    │                                         │
    │  [Pay Balance →]                        │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         FINAL DELIVERY                   │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Email: "Your deliverables are ready"   │
    │                                         │
    │  Includes:                              │
    │  ├─ Financial model (Excel)             │
    │  ├─ Business plan (PDF)                 │
    │  ├─ Executive summary                   │
    │  ├─ Infographics                        │
    │  └─ Source files                        │
    │                                         │
    │  [Download All →]                       │
    │                                         │
    │  Support: 30/60/90 days included        │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
              ┌────────────┐
              │   END J5   │
              │   → J6     │
              └────────────┘
```

---

## Journey 6: Delivery → Advocate

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   JOURNEY 6: DELIVERY → ADVOCATE                          │
└──────────────────────────────────────────────────────────────────────────┘

              ┌────────────────┐
              │   FINAL        │
              │   DELIVERY     │
              │   (from J5)    │
              └───────┬────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────┐
    │         DAY 7: FEEDBACK SURVEY           │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Email: "How did we do?"                │
    │                                         │
    │  Survey:                                │
    │  ├─ Overall satisfaction (1-10)         │
    │  ├─ Model quality                       │
    │  ├─ Communication                       │
    │  ├─ Would you recommend?                │
    │  └─ Testimonial (optional)              │
    │                                         │
    │  [Complete Survey →]                    │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         DAY 30: CHECK-IN                 │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Email: "How's the submission going?"   │
    │                                         │
    │  ├─ Any questions about the model?      │
    │  ├─ DFI submission progress?            │
    │  └─ Need any updates?                   │
    │                                         │
    │  [Request Update →] (if needed)         │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         DAY 90: REFERRAL REQUEST         │
    │         (Only if feedback positive)      │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Email: "Know someone with a project?"  │
    │                                         │
    │  If you know anyone preparing a DFI     │
    │  application, we'd appreciate an intro. │
    │                                         │
    │  (Soft ask, no pressure)                │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         NEWSLETTER (Optional)            │
    ├─────────────────────────────────────────┤
    │                                         │
    │  If subscribed:                         │
    │  ├─ Monthly DFI insights                │
    │  ├─ Sector updates                      │
    │  └─ JASPER news                         │
    │                                         │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │         FUTURE PROJECTS                  │
    ├─────────────────────────────────────────┤
    │                                         │
    │  Returning client benefits:             │
    │  ├─ Priority scheduling                 │
    │  ├─ Quarterly updates: $2,500           │
    │  └─ Direct email contact                │
    │                                         │
    └─────────────────────────────────────────┘
```

---

## Complete CTA Map

### Primary CTAs by Page

| Page | CTA Text | Destination | Notes |
|------|----------|-------------|-------|
| **Home** | "Start Your Project →" | /contact | Primary action |
| **Home** | "See How We Work" | /process | Secondary |
| **Methodology** | "Get Started →" | /contact | After understanding |
| **Methodology** | "View Packages" | /services | Explore more |
| **Services** | "Start Your Project →" | /contact | Primary |
| **Services** | "See Our Process" | /process | Secondary |
| **Process** | "Begin Now →" | /contact | Primary |
| **Process** | "View Pricing" | /services | Secondary |
| **Sectors** | "Discuss Your Project →" | /contact | Sector-specific |
| **FAQ** | "Ready to Start?" | /contact | Trust confirmed |
| **Contact** | "Send Inquiry →" | Submit form | Form submission |
| **Submission** | "Submit Documents →" | Submit form | Upload action |
| **Terms** | "Start Your Project →" | /contact | After reading terms |

### Email CTAs

| Email | CTA Text | Action |
|-------|----------|--------|
| Inquiry received | - | Confirmation only |
| Intake invite | "Submit Documents →" | Link to /submit |
| Complete submission | - | Confirmation only |
| Partial submission | "Add Missing Items →" | Link to /submit |
| Incomplete submission | "Complete Submission →" | Link to /submit |
| Proposal | "Accept Proposal →" | Reply to accept |
| Proposal reminder | "Accept Proposal →" | Reply to accept |
| Deposit invoice | "Pay Now →" | Payment link |
| Kickoff | - | Information only |
| Milestone update | - | Progress update |
| Draft ready | "Download Draft →" | Secure download |
| Draft ready | "Submit Feedback →" | Feedback form |
| Balance invoice | "Pay Balance →" | Payment link |
| Final delivery | "Download All →" | Secure download |
| Feedback survey | "Complete Survey →" | Survey form |
| Check-in | "Request Update →" | Optional |
| Referral request | - | Soft ask |

---

## Navigation Structure

```
HEADER NAV
──────────
┌─────────────────────────────────────────────────────────┐
│  JASPER   Methodology   Services   Process   Sectors    │
│                                                         │
│                               [Start Your Project →]    │
└─────────────────────────────────────────────────────────┘

FOOTER NAV
──────────
┌─────────────────────────────────────────────────────────┐
│  JASPER Financial Architecture                          │
│                                                         │
│  Services        Resources       Legal                  │
│  ─────────       ─────────       ─────                  │
│  Methodology     FAQ             Terms                  │
│  Services        Sectors         Privacy                │
│  Process         Contact                                │
│                                                         │
│  [Start Your Project →]                                 │
│                                                         │
│  © 2025 Gahn Eden (Pty) Ltd                            │
└─────────────────────────────────────────────────────────┘
```

---

## Conversion Points

```
JOURNEY 1: Discovery → Inquiry
──────────────────────────────
Goal: Contact form submission
KPI: Form completion rate

JOURNEY 2: Inquiry → Qualified
──────────────────────────────
Goal: Document submission
KPI: Intake completion rate

JOURNEY 3: Submission → Proposal
────────────────────────────────
Goal: Complete submission
KPI: Completeness score

JOURNEY 4: Proposal → Client
────────────────────────────
Goal: Deposit payment
KPI: Proposal acceptance rate

JOURNEY 5: Client → Delivery
────────────────────────────
Goal: Project completion
KPI: On-time delivery rate

JOURNEY 6: Delivery → Advocate
──────────────────────────────
Goal: Referral
KPI: NPS score, referral rate
```

---

*UX User Journeys v1.0 - December 2025*
*Ready for diagramming and implementation*
