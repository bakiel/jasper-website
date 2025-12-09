# JASPER Client Submission Processor

**Purpose:** AI-powered intake analysis with automatic completeness checking
**Platform:** n8n + Qwen3-VL + DeepSeek
**Last Updated:** December 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 CLIENT SUBMISSION PROCESSING PIPELINE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CLIENT UPLOADS                                                          │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │ Documents, Images, PDFs, Spreadsheets, Brand Assets      │           │
│  └──────────────────────────────────────────────────────────┘           │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Qwen3 VL    │───▶│  Qwen3 VL    │───▶│   DeepSeek   │              │
│  │     8B       │    │ 30B Thinking │    │    V3.2      │              │
│  │  OCR/EXTRACT │    │   ANALYZE    │    │   REPORT     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  Extract text         Check against       Generate client               │
│  Parse documents      checklist           feedback report               │
│  Identify branding    Find missing        Send auto-response            │
│                       items                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Model Stack

### Qwen3 VL 8B - Document Extraction

```
ROLE: OCR + Initial Processing
──────────────────────────────
Purpose: Extract all text/data from submitted documents

CAPABILITIES
────────────
├─ 32-language OCR support
├─ Robust in low light, blur, tilt
├─ Rare/ancient character handling
├─ Long-document structure parsing
├─ Table and chart extraction
├─ Visual element identification
└─ Apache 2.0 (open source)

PRICING (OpenRouter)
────────────────────
Input:  $0.064/1M tokens
Output: $0.40/1M tokens

COST PER DOCUMENT: ~$0.001-0.005
```

### Qwen3 VL 30B Thinking - Analysis & Reasoning

```
ROLE: Completeness Check + Gap Analysis
───────────────────────────────────────
Purpose: Reason about submission quality, identify missing items

CAPABILITIES
────────────
├─ Extended thinking/reasoning mode
├─ Questions ambiguous information
├─ Context-aware responses
├─ Checklist validation
├─ Missing item identification
└─ Quality assessment

PRICING (OpenRouter)
────────────────────
Input:  $0.30/1M tokens
Output: $1.20/1M tokens

COST PER ANALYSIS: ~$0.01-0.02
```

### DeepSeek V3.2 - Report Generation

```
ROLE: Client Communication
──────────────────────────
Purpose: Generate professional feedback reports

CAPABILITIES
────────────
├─ Professional writing
├─ Structured output
├─ Multi-format support
├─ Tool-use integration
└─ Low cost

PRICING (OpenRouter)
────────────────────
Input:  $0.028/1M (cache) / $0.28/1M
Output: $0.42/1M tokens

COST PER REPORT: ~$0.005
```

---

## Submission Checklist

### Category 1: Project Information

```
PROJECT BASICS (Required)
─────────────────────────
☐ Project name
☐ Project location (country, region, city)
☐ Project description (min 200 words)
☐ Sector classification
☐ Project stage (concept, feasibility, implementation)

FINANCIAL OVERVIEW (Required)
─────────────────────────────
☐ Total funding sought (USD amount)
☐ Funding breakdown (equity, debt, grant)
☐ Target DFI(s) (IFC, AfDB, ADB, IDC, etc.)
☐ Existing funding secured (if any)
☐ Use of funds summary

TIMELINE (Required)
───────────────────
☐ Expected start date
☐ Construction/implementation period
☐ Operations commencement date
☐ Project lifespan
```

### Category 2: Technical Documentation

```
TECHNICAL DOCUMENTS (Required - at least 3)
───────────────────────────────────────────
☐ Feasibility study or concept note
☐ Technical specifications
☐ Site plans or layouts
☐ Environmental assessment (if available)
☐ Permits and approvals (if available)

FINANCIAL DOCUMENTS (Required - at least 2)
───────────────────────────────────────────
☐ Existing financial model (Excel)
☐ Historical financials (if operating)
☐ Revenue projections
☐ Cost estimates or quotes
☐ Market research or off-take agreements

LEGAL DOCUMENTS (If available)
──────────────────────────────
☐ Company registration
☐ Shareholding structure
☐ Key contracts
☐ Land ownership/lease documents
```

### Category 3: Branding Assets

```
BRAND IDENTITY (For business plan)
──────────────────────────────────
☐ Company logo (vector/high-res preferred)
☐ Brand colours (hex codes or Pantone)
☐ Typography/fonts used
☐ Brand guidelines document (if available)
☐ Existing marketing materials

VISUAL ASSETS (Optional but helpful)
────────────────────────────────────
☐ Project photos
☐ Renderings or visualisations
☐ Team photos
☐ Site photos
☐ Product images
```

### Category 4: Company Information

```
COMPANY PROFILE (Required)
──────────────────────────
☐ Company name and registration number
☐ Date of incorporation
☐ Registered address
☐ Key management bios
☐ Organizational structure

TRACK RECORD (Required for credibility)
───────────────────────────────────────
☐ Previous projects completed
☐ Relevant experience
☐ References or testimonials
☐ Awards or certifications
```

---

## AI Processing Workflow

### n8n Workflow: `process-client-submission`

```
TRIGGER: Tally webhook (intake form submitted)
    │
    ├─ Receive form data
    ├─ Download all attachments
    └─ Store in project folder
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 1: DOCUMENT EXTRACTION (Qwen3 VL 8B)
═══════════════════════════════════════════════════════════════
    │
    FOR EACH DOCUMENT:
    │
    ├─ Step 1.1: OCR Processing
    │   - Extract all text content
    │   - Parse tables and charts
    │   - Identify document type
    │
    ├─ Step 1.2: Branding Extraction
    │   - Detect logos
    │   - Extract colour palette
    │   - Identify fonts used
    │   - Note brand elements
    │
    └─ Output: Extracted Data JSON
        {
          "documents": [
            {
              "filename": "...",
              "type": "feasibility_study",
              "extracted_text": "...",
              "tables": [...],
              "figures": [...],
              "confidence": 0.95
            }
          ],
          "branding": {
            "logo_detected": true,
            "colours": ["#1E3A5F", "#FFFFFF"],
            "fonts": ["Roboto", "Open Sans"]
          }
        }
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 2: COMPLETENESS ANALYSIS (Qwen3 VL 30B Thinking)
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 2.1: Checklist Validation
    │   - Compare extracted data against checklist
    │   - Mark items as: ✓ Complete, ⚠ Partial, ✗ Missing
    │
    ├─ Step 2.2: Quality Assessment
    │   - Evaluate document quality
    │   - Check for inconsistencies
    │   - Identify unclear information
    │
    ├─ Step 2.3: Gap Identification
    │   - List missing required items
    │   - Prioritize by importance
    │   - Suggest alternatives if applicable
    │
    └─ Output: Analysis Report JSON
        {
          "completeness_score": 72,
          "status": "partial",
          "checklist": {
            "project_basics": {
              "project_name": "complete",
              "project_location": "complete",
              "project_description": "partial",
              "note": "Description is 150 words, minimum 200 required"
            },
            "financial_overview": {
              "total_funding": "complete",
              "target_dfi": "missing"
            }
          },
          "missing_items": [
            {
              "item": "Target DFI specification",
              "priority": "high",
              "reason": "Required to select appropriate model format"
            }
          ],
          "quality_notes": [
            "Financial model has hardcoded values - sources needed"
          ]
        }
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 3: REPORT GENERATION (DeepSeek V3.2)
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 3.1: Generate Client Report
    │   - Professional formatting
    │   - Clear action items
    │   - Helpful suggestions
    │
    ├─ Step 3.2: Format for Email
    │   - HTML version
    │   - Plain text version
    │
    └─ Output: Client Feedback Email
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 4: NOTIFICATION & STORAGE
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 4.1: Send Client Email
    │   - Submission confirmation
    │   - Completeness feedback
    │   - Next steps
    │
    ├─ Step 4.2: Internal Notification
    │   - Alert if submission is complete
    │   - Summary for review
    │
    └─ Step 4.3: Update Database
        - Store analysis results
        - Update project status
```

---

## Client Feedback Templates

### Complete Submission

```
Subject: Submission Received - [Project Name] ✓ Complete

Hi [Name],

Thank you for submitting your project materials for [Project Name].

SUBMISSION STATUS: COMPLETE ✓
─────────────────────────────
Your submission includes all required documentation.

WHAT WE RECEIVED
────────────────
✓ Project description (comprehensive)
✓ Financial model (Excel, 25 sheets)
✓ Feasibility study (45 pages)
✓ Company registration documents
✓ Target funding: $15M via IFC
✓ Brand assets (logo, colours)

NEXT STEPS
──────────
1. We will review your materials within 48 hours
2. You will receive a proposal with scope and pricing
3. Proposal valid for 14 days

BRANDING DETECTED
─────────────────
├─ Logo: ✓ High resolution
├─ Colours: #1E3A5F, #2ECC71, #F39C12
└─ Fonts: Montserrat, Open Sans

No action required from you at this time.

JASPER Financial Architecture
models@jasperfinance.org
```

### Partial Submission

```
Subject: Submission Received - [Project Name] - Items Needed

Hi [Name],

Thank you for submitting your project materials for [Project Name].

SUBMISSION STATUS: PARTIAL (72% complete)
─────────────────────────────────────────
Your submission is missing some required items.
Please review the list below and provide the missing information.

WHAT WE RECEIVED ✓
──────────────────
✓ Project description
✓ Financial model (Excel)
✓ Company registration
✓ Target funding amount: $8M

MISSING ITEMS (Required)
────────────────────────
1. TARGET DFI SPECIFICATION [High Priority]
   Which institution(s) are you targeting?
   Options: IFC, AfDB, ADB, IDC, DFC, other

2. PROJECT LOCATION [High Priority]
   Please specify: Country, Region, City/Site

3. USE OF FUNDS BREAKDOWN [Medium Priority]
   How will the $8M be allocated?

QUALITY NOTES
─────────────
⚠ Financial model contains hardcoded values
  → Please add assumption sources/documentation
⚠ Project description is 150 words
  → Minimum 200 words recommended

HOW TO SUBMIT MISSING ITEMS
───────────────────────────
Reply to this email with the missing information,
or upload additional documents to:
[Secure Upload Link]

Once complete, we will proceed with your proposal.

JASPER Financial Architecture
models@jasperfinance.org
```

### Incomplete Submission

```
Subject: Submission Received - [Project Name] - Significant Items Missing

Hi [Name],

Thank you for your interest in JASPER Financial Architecture.

SUBMISSION STATUS: INCOMPLETE (35% complete)
────────────────────────────────────────────
Your submission is missing critical documentation required
for us to prepare a proposal.

WHAT WE RECEIVED
────────────────
✓ Contact information
✓ Project name
✓ Sector: Agribusiness

CRITICAL MISSING ITEMS
──────────────────────
1. PROJECT DESCRIPTION [Required]
   We need at least a 200-word overview of your project

2. FUNDING AMOUNT [Required]
   What is the total funding you are seeking?

3. FINANCIAL MODEL OR PROJECTIONS [Required]
   Excel model, business plan, or financial projections

4. TARGET DFI [Required]
   Which development finance institution(s)?

5. COMPANY INFORMATION [Required]
   Registration details and key management

MINIMUM REQUIREMENTS
────────────────────
To proceed, we need at minimum:
├─ Project description (200+ words)
├─ Funding amount and target DFI
├─ Basic financial projections
└─ Company registration

Please reply with the missing information or upload to:
[Secure Upload Link]

We cannot proceed until these items are received.

JASPER Financial Architecture
models@jasperfinance.org
```

---

## Branding Analysis

### Brand Extraction Process

```
BRAND ANALYSIS (Qwen3 VL 8B)
────────────────────────────

LOGO DETECTION
──────────────
├─ Detect logo in uploaded documents
├─ Extract as separate image
├─ Assess quality (vector vs raster)
├─ Note if logo needs higher resolution

COLOUR EXTRACTION
─────────────────
├─ Primary colour detection
├─ Secondary colours
├─ Accent colours
├─ Extract hex codes
├─ Identify if brand guide exists

TYPOGRAPHY DETECTION
────────────────────
├─ Identify fonts in documents
├─ Header fonts
├─ Body fonts
├─ Note if fonts are standard or custom

OUTPUT FORMAT
─────────────
{
  "branding": {
    "logo": {
      "detected": true,
      "format": "PNG",
      "resolution": "1200x400",
      "quality": "high",
      "needs_vector": true
    },
    "colours": {
      "primary": "#1E3A5F",
      "secondary": "#2ECC71",
      "accent": "#F39C12",
      "background": "#FFFFFF",
      "text": "#333333"
    },
    "typography": {
      "headings": "Montserrat",
      "body": "Open Sans",
      "notes": "Standard Google Fonts available"
    },
    "brand_guide_provided": false,
    "consistency_score": 85
  }
}
```

---

## Cost Analysis

### Per Submission Processing Cost

```
COST BREAKDOWN
──────────────
Qwen3 VL 8B (OCR/extraction)
├─ ~10,000 tokens input (documents)
├─ ~2,000 tokens output
└─ Cost: ~$0.002

Qwen3 VL 30B Thinking (analysis)
├─ ~5,000 tokens input
├─ ~3,000 tokens output (reasoning)
└─ Cost: ~$0.01

DeepSeek V3.2 (report)
├─ ~2,000 tokens input
├─ ~1,500 tokens output
└─ Cost: ~$0.005

TOTAL PER SUBMISSION: ~$0.02
────────────────────────────

MONTHLY ESTIMATE (20 submissions)
─────────────────────────────────
20 × $0.02 = $0.40/month
```

### Comparison with Manual Processing

```
MANUAL PROCESSING
─────────────────
├─ Time: 30-60 minutes per submission
├─ Review documents
├─ Check completeness
├─ Draft response email
└─ Cost: ~$25-50 per submission (time value)

AI PROCESSING
─────────────
├─ Time: <60 seconds
├─ Automatic extraction
├─ Instant completeness check
├─ Auto-generated response
└─ Cost: ~$0.02 per submission

SAVINGS: 99.9% cost reduction
TIME: 60+ minutes → <1 minute
```

---

## n8n Implementation

### Required Nodes

```
HTTP REQUEST (OpenRouter)
─────────────────────────
├─ Qwen3 VL 8B endpoint
├─ Qwen3 VL 30B Thinking endpoint
└─ DeepSeek V3.2 endpoint

FILE PROCESSING
───────────────
├─ Move Binary Data
├─ Read Binary File
├─ Convert to Base64

DATA PROCESSING
───────────────
├─ JSON Parse
├─ Set variables
├─ Merge nodes
├─ IF conditions

EMAIL
─────
├─ Send Email (SMTP)
└─ HTML formatting
```

### Credential Setup

```
OPENROUTER API
──────────────
Name: openrouter_credentials
Type: HTTP Header Auth
Header: Authorization
Value: Bearer [API_KEY]

MODELS TO USE
─────────────
qwen/qwen3-vl-8b-instruct
qwen/qwen3-vl-30b-a3b-thinking
deepseek/deepseek-chat
```

---

## Prompt Templates

### OCR Extraction Prompt

```
SYSTEM: You are a document extraction specialist. Extract all
text, tables, and data from the provided document image.
Also identify any branding elements (logos, colours, fonts).

OUTPUT FORMAT (JSON):
{
  "document_type": "feasibility_study|financial_model|registration|other",
  "extracted_text": "...",
  "tables": [
    {
      "title": "...",
      "headers": [...],
      "rows": [[...], [...]]
    }
  ],
  "figures": [
    {
      "description": "...",
      "data_points": [...]
    }
  ],
  "branding": {
    "logo_detected": true/false,
    "colours_detected": ["#hex1", "#hex2"],
    "fonts_detected": ["Font1", "Font2"]
  },
  "quality_notes": "..."
}

Extract everything accurately. Note any unclear or low-quality sections.
```

### Completeness Analysis Prompt

```
SYSTEM: You are an intake analyst for a DFI financial modelling firm.
Analyse the extracted submission data against the required checklist.
Think carefully about what is present, partial, or missing.

CHECKLIST:
[Insert full checklist from above]

EXTRACTED DATA:
[Insert extracted data JSON]

THINK THROUGH:
1. What items are fully complete?
2. What items are partially complete (and what's missing)?
3. What items are completely missing?
4. What quality issues exist?
5. What are the highest priority missing items?

OUTPUT FORMAT (JSON):
{
  "completeness_score": 0-100,
  "status": "complete|partial|incomplete",
  "checklist": {
    "category": {
      "item": "complete|partial|missing",
      "note": "explanation if needed"
    }
  },
  "missing_items": [
    {
      "item": "...",
      "priority": "high|medium|low",
      "reason": "..."
    }
  ],
  "quality_notes": ["..."],
  "recommendations": ["..."]
}
```

### Report Generation Prompt

```
SYSTEM: You are writing a professional email for JASPER Financial
Architecture. Generate a client feedback email based on the analysis.

BRAND VOICE:
- Professional but accessible
- Direct, no fluff
- Helpful and constructive
- Clear action items

ANALYSIS RESULTS:
[Insert analysis JSON]

Generate an email that:
1. Thanks them for their submission
2. Clearly states the status (complete/partial/incomplete)
3. Lists what was received
4. Lists what is missing (if applicable)
5. Provides clear next steps
6. Includes branding findings
7. Ends professionally

Format in HTML for email sending.
```

---

## Quality Thresholds

```
COMPLETENESS SCORING
────────────────────
90-100%: COMPLETE
         → Proceed to proposal
         → Auto-notify team

70-89%:  PARTIAL
         → Send missing items request
         → Set 5-day follow-up

50-69%:  INCOMPLETE
         → Send significant items request
         → Set 7-day follow-up

<50%:    INSUFFICIENT
         → Send requirements email
         → Do not proceed until basics received
```

---

## Sources

- [Qwen3-VL GitHub](https://github.com/QwenLM/Qwen3-VL)
- [Qwen OpenRouter Pricing](https://openrouter.ai/qwen)
- [Alibaba Qwen Documentation](https://www.alibabacloud.com/help/en/model-studio/what-is-qwen-llm)
- [DeepSeek-OCR Comparison](https://www.analyticsvidhya.com/blog/2025/11/deepseek-ocr-vs-qwen-3-vl-vs-mistral-ocr/)

---

*Client submission processor v1.0 - December 2025*
*AI Stack: Qwen3-VL 8B + Qwen3-VL 30B Thinking + DeepSeek V3.2*
