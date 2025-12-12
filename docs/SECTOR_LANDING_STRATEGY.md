# JASPER Sector Landing Pages - Strategy Document

## Executive Summary

This document outlines the complete user pathway, lead capture process, and technical implementation strategy for sector-specific landing pages (Agribusiness & Real Estate) with downloadable lead magnets.

---

## Current Infrastructure Audit

### 1. Email System
**Provider:** Hostinger SMTP (100 mailboxes included, 1000 emails/day each)
```
Host: smtp.hostinger.com
Port: 587
User: configured in .env (SMTP_USER)
Pass: configured in .env (SMTP_PASS)
Admin: ADMIN_EMAIL env variable
```

**Existing Email Templates:**
- Admin notification (styled HTML)
- Client auto-reply confirmation

### 2. API Infrastructure
**Contact API:** `/jasper-api/api/contact.js`
- Deployed on Vercel
- Rate limiting: 5 requests/IP per 15 minutes
- Validation: name, email, company, sector, fundingStage, message
- Features:
  - SMTP email delivery
  - CRM webhook integration
  - Reference number generation (JSP-xxx)

**CRM Integration:**
- Endpoint: `{CRM_API_URL}/api/v1/webhooks/contact-form`
- Webhook secret authentication
- Creates Contact + Company records

### 3. Database Models (PostgreSQL)
**Contact Model:**
- `first_name`, `last_name`, `email` (unique)
- `company_id` (FK)
- `job_title`, `phone`, `mobile`
- `portal_access`, `accepts_marketing`
- `email_verified`, `last_login`

**Company Model:** (assumed from FK relationship)
- Name, sector, funding stage
- Source tracking

### 4. Frontend Architecture
**Stack:** Next.js + React + Tailwind CSS + Framer Motion
**Deployment:** Vercel
**Design System:** See DESIGN_APPROACH.md

---

## Lead Magnet Strategy

### Value Proposition by Sector

#### Agribusiness Lead Magnet
**Offer:** "Agricultural Project Finance Model Template"
- 5-sheet Excel sample demonstrating JASPER methodology
- Includes: Revenue projections, yield curves, commodity pricing
- Target keywords: agricultural finance, agribusiness investment

#### Real Estate Lead Magnet
**Offer:** "Property Development Financial Model Sample"  
- 5-sheet Excel sample for mixed-use development
- Includes: Construction phasing, sales absorption, IRR analysis
- Target keywords: real estate financial model, property development finance

### Why These Work
1. **Immediate value** - Usable template, not just a PDF
2. **Demonstrates expertise** - Shows JASPER methodology quality
3. **Low friction** - Email only, no complex forms
4. **Qualifies leads** - Only serious prospects download financial models

---

## User Journey Map

### Path A: Organic Search → Landing Page → Lead Magnet

```
1. DISCOVERY
   User searches "agricultural finance model excel"
   └─→ Google shows JASPER Agribusiness landing page

2. LANDING PAGE
   User sees:
   ├─ Hero: Sector-specific headline + value prop
   ├─ Proof: Metrics, case studies, DFI logos
   ├─ Lead Magnet CTA: "Download Free Model Template"
   └─ Secondary CTA: "Start Project" → /contact

3. LEAD CAPTURE (Modal/Inline Form)
   Simple form:
   ├─ Email (required)
   ├─ Name (required)
   ├─ Company (optional)
   └─ Checkbox: "Send me JASPER updates" (default: checked)

4. DELIVERY
   ├─ Immediate: Download starts automatically
   ├─ Email: Confirmation + download link + next steps
   └─ CRM: Lead created with source="lead_magnet_agribusiness"

5. NURTURE SEQUENCE
   ├─ Day 0: Welcome + download link
   ├─ Day 3: "How's the model working?" + offer help
   ├─ Day 7: Case study relevant to sector
   └─ Day 14: Soft CTA to schedule call
```

### Path B: Direct Traffic → Contact Form

```
Existing flow (unchanged):
/contact → Full qualification form → CRM + Admin notification
```

### Path C: Landing Page → Full Contact

```
User wants more than template:
Landing Page → "Start Your Project" CTA → /contact (pre-filled sector)
```

---

## Technical Implementation

### New API Endpoint: `/api/lead-magnet.js`

```javascript
// Handles lead magnet submissions
// Lighter validation than contact form
// Returns download URL + triggers email

POST /api/lead-magnet
Body: {
  email: string (required)
  name: string (required)
  company?: string
  accepts_marketing: boolean
  lead_magnet_type: "agribusiness" | "real-estate"
  source_page: string
}

Response: {
  success: boolean
  download_url: string
  message: string
}
```

### File Storage Strategy

**Option A: Static Files (Recommended for MVP)**
```
/public/downloads/
├─ agribusiness-financial-model-sample.xlsx
├─ real-estate-financial-model-sample.xlsx
└─ [future sector models...]
```
- Pros: Simple, fast, no infrastructure needed
- Cons: Download tracking requires workaround

**Option B: Signed URLs (Future)**
- Generate time-limited download URLs
- Better tracking, prevents sharing
- Requires S3 or similar

### CRM Integration

Extend existing webhook to handle lead magnet submissions:

```javascript
// New lead_source values
"lead_magnet_agribusiness"
"lead_magnet_real_estate"
"website_contact_form"  // existing
"referral"
"direct"
```

### Email Templates Needed

1. **Lead Magnet Delivery Email**
   - Download link (backup)
   - "What's inside" summary
   - Next steps
   - Soft CTA: "Need a custom model?"

2. **Nurture Sequence** (Phase 2)
   - Day 3, 7, 14 follow-ups
   - Sector-specific content

---

## Page Structure

### `/app/sectors/agribusiness/page.tsx`

```
┌────────────────────────────────────────┐
│ NAVBAR                                 │
├────────────────────────────────────────┤
│                                        │
│ HERO SECTION                           │
│ - Badge: "Agribusiness Finance"        │
│ - H1: Investment-Grade Agricultural    │
│       Financial Models                 │
│ - Subhead: Value prop                  │
│ - CTA: "Download Free Model"           │
│ - Secondary: "Start Project"           │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ STATS BAR                              │
│ [R438M+] [300+ Farmers] [4 DFIs]       │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ WHAT WE MODEL                          │
│ - Production (farming, greenhouse...)  │
│ - Processing (cold chain, packaging)   │
│ - Distribution (aggregation, trading)  │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ LEAD MAGNET SECTION                    │
│ ┌──────────────────────────────────┐   │
│ │ [Excel Preview Image]            │   │
│ │                                  │   │
│ │ FREE: Agricultural Finance Model │   │
│ │ Sample                           │   │
│ │                                  │   │
│ │ Email: [____________]            │   │
│ │ Name:  [____________]            │   │
│ │                                  │   │
│ │ [Download Now →]                 │   │
│ └──────────────────────────────────┘   │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ DFI LOGOS                              │
│ Land Bank | AfDB | IDC | IFAD          │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ CTA SECTION                            │
│ "Ready for a custom model?"            │
│ [Start Your Project →]                 │
│                                        │
├────────────────────────────────────────┤
│ FOOTER                                 │
└────────────────────────────────────────┘
```

---

## Image Requirements

### Agribusiness
| Image | Size | Purpose |
|-------|------|---------|
| `agribusiness-hero.jpg` | 1920x1080 | Hero background |
| `agri-model-preview.png` | 800x600 | Lead magnet preview |
| `og-agribusiness.jpg` | 1200x630 | Social sharing |

### Real Estate
| Image | Size | Purpose |
|-------|------|---------|
| `real-estate-hero.jpg` | 1920x1080 | Hero background |
| `real-estate-model-preview.png` | 800x600 | Lead magnet preview |
| `og-real-estate.jpg` | 1200x630 | Social sharing |

**Image Sources:**
- Use uploaded reference images (resize needed)
- Or use existing `/public/images/sectors/` assets

---

## SEO Metadata

### Agribusiness Page
```typescript
export const metadata = {
  title: 'Agricultural Financial Modeling | Agribusiness Investment | JASPER',
  description: 'Investment-grade financial models for agricultural projects. Commodity pricing, yield curves, DFI-ready. Download free template.',
  keywords: ['agricultural finance', 'agribusiness investment', 'farm financial model', 'agricultural project finance'],
  openGraph: {
    title: 'Agricultural Financial Modeling | JASPER',
    description: 'DFI-ready financial models for agribusiness investments.',
    images: ['/images/og/agribusiness.jpg'],
  },
};
```

### Real Estate Page
```typescript
export const metadata = {
  title: 'Real Estate Financial Modeling Africa | Property Development | JASPER',
  description: 'Professional financial models for property development. Construction phasing, IRR analysis, mixed-use projects. Download free template.',
  keywords: ['real estate financial model', 'property development finance', 'real estate investment model'],
  openGraph: {
    title: 'Real Estate Financial Modeling | JASPER',
    description: 'Investment-grade financial models for property development.',
    images: ['/images/og/real-estate.jpg'],
  },
};
```

---

## Implementation Phases

### Phase 1: MVP (This Session)
- [x] Design system documentation
- [x] Asset inventory
- [ ] Create Agribusiness landing page
- [ ] Create Real Estate landing page
- [ ] Simple inline lead capture form
- [ ] Static file downloads
- [ ] Basic email delivery

### Phase 2: Enhancement
- [ ] Dedicated lead magnet API endpoint
- [ ] CRM integration for lead source tracking
- [ ] Download tracking/analytics
- [ ] A/B testing different CTAs

### Phase 3: Automation
- [ ] Email nurture sequences
- [ ] Lead scoring based on engagement
- [ ] Sales team notifications
- [ ] Integration with project pipeline

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page views | 500/month | Analytics |
| Download rate | 15% of visitors | Form submissions |
| Email open rate | 40%+ | Email provider |
| Contact form conversion | 5% of downloads | CRM |
| Time on page | >2 min | Analytics |

---

## Risk Mitigation

1. **Download abuse**: Rate limit by email
2. **Fake emails**: Email verification (Phase 2)
3. **Model sharing**: Watermark with lead's email
4. **Low conversions**: A/B test CTAs and form placement
5. **Email deliverability**: Use Hostinger's included service

---

## Next Steps

1. Confirm strategy approach
2. Create/resize hero images
3. Build LeadMagnetForm component
4. Create sector landing pages
5. Create lead magnet Excel files
6. Test email delivery
7. Deploy to Vercel
