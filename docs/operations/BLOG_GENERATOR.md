# JASPER Blog Generator System

**Purpose:** Automated content creation for LinkedIn and website
**Platform:** n8n + Multi-Model AI Pipeline
**Last Updated:** December 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JASPER BLOG GENERATOR PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  DeepSeek    │───▶│ Nano Banana  │───▶│   Sonnet     │              │
│  │ V3.2 + OCR   │    │     Pro      │    │    4.5       │              │
│  │  RESEARCH    │    │   IMAGES     │    │  WRITING     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  Topic analysis       Hero image          1,000+ word                   │
│  OCR if needed        Infographics        article draft                 │
│  Data gathering       All visuals                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │                    SOCIAL CONTENT                         │          │
│  │  Nano Banana Pro → DeepSeek V3.2 → Claude Sonnet 4.5     │          │
│  │     (images)         (draft)          (polish)            │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Model Assignments

### DeepSeek V3.2 + OCR - Research Agent

```
ROLE: Research & Analysis + Document Processing
────────────────────────────────────────────────
Purpose: Topic research, data gathering, outline creation, OCR

DeepSeek V3.2 Strengths:
├─ Native thinking mode (internal reasoning)
├─ Tool-use integration
├─ Agentic orchestration
├─ Cost-effective deep research
└─ Function calling for data retrieval

DeepSeek-OCR Capabilities (October 2025):
├─ 10x compression (2000-5000 tokens → 200-400 vision tokens)
├─ ~97% accuracy at 10x compression
├─ 3B parameters (MoE architecture)
├─ Parses: charts, tables, formulas, geometric figures
├─ Outputs: structured formats (HTML tables, SMILES, etc.)
└─ Open-source model

PRICING (via OpenRouter)
────────────────────────
DeepSeek V3.2:
├─ Input:  $0.028/1M tokens (cache hit)
│          $0.28/1M tokens (cache miss)
└─ Output: $0.42/1M tokens

DeepSeek-OCR:
└─ Similar pricing, minimal token usage due to compression

USE FOR
───────
✓ Topic research and analysis
✓ Data point extraction
✓ Outline generation
✓ Fact-checking
✓ Source identification
✓ SEO keyword research
✓ OCR for source documents
✓ Chart/table extraction
✓ Document parsing

DON'T USE FOR
─────────────
✗ Final article writing (use Sonnet)
✗ Image generation (use Nano Banana)
✗ Creative polish (use Sonnet)
```

### Nano Banana Pro - ALL Image Generation

```
ROLE: Primary Image Generator (ALL visuals)
────────────────────────────────────────────
Purpose: Hero images, infographics, social images, ALL visuals
Platform: Higgsfield.ai
Status: ALREADY PURCHASED ✅

PLAN DETAILS
────────────
├─ Unlimited 2K image generation
├─ 8 concurrent generations
├─ Perfect text rendering (94%)
├─ Up to 14 reference images
├─ Multi-language support
├─ 1,200 video credits/month
├─ Commercial rights included
└─ Cost: R5,292/year ($24.50/month) - PREPAID

USE FOR (ALL IMAGES)
────────────────────
✓ Blog hero images
✓ Process diagrams
✓ Infographics
✓ Data visualisations
✓ Social media images
✓ LinkedIn carousels
✓ Image variations
✓ Text-heavy graphics
✓ Branded content
✓ Thumbnails

WHY NOT GEMINI 3?
─────────────────
Nano Banana is UNLIMITED (already paid)
Gemini 3 costs $2-12/1M tokens
No reason to pay for images when unlimited is available

COST: $0 per image (subscription covers everything)
```

### Claude Sonnet 4.5 - Article Writing

```
ROLE: Long-Form Content Creation
────────────────────────────────
Purpose: 1,000+ word articles, polished prose
Strengths:
├─ Superior writing quality
├─ Consistent tone and voice
├─ SEO-aware structure
├─ Clear, engaging prose
└─ Professional output

PRICING (via OpenRouter)
────────────────────────
Input:  $3.00/1M tokens
Output: $15.00/1M tokens

USE FOR
───────
✓ Blog article writing (1,000+ words)
✓ Final content polish
✓ Voice consistency
✓ SEO optimisation
✓ Call-to-action crafting

OUTPUT STANDARDS
────────────────
├─ Minimum 1,000 words
├─ Clear section headers
├─ Actionable insights
├─ JASPER voice consistency
└─ SEO keyword integration
```

---

## Blog Article Workflow

### n8n Workflow: `generate-blog-article`

```
TRIGGER: Manual or Scheduled (weekly)
    │
    ▼
INPUT: Topic + Target Keywords
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 1: RESEARCH (DeepSeek V3.2)
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 1.1: Topic Analysis
    │   - Parse topic for key themes
    │   - Identify target audience
    │   - Define article angle
    │
    ├─ Step 1.2: Data Gathering
    │   - Research current trends
    │   - Find supporting data points
    │   - Identify expert sources
    │
    ├─ Step 1.3: Outline Creation
    │   - Create structured outline
    │   - Define key sections
    │   - Identify SEO opportunities
    │
    └─ Output: Research Package (JSON)
        {
          "topic": "...",
          "angle": "...",
          "key_points": [...],
          "data_points": [...],
          "sources": [...],
          "outline": [...],
          "seo_keywords": [...]
        }
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 2: IMAGES (Nano Banana Pro - ALL IMAGES)
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 2.1: Hero Image
    │   - Generate main article image
    │   - Style: Professional, clean, on-brand
    │   - Size: 1200x630 (OG standard)
    │
    ├─ Step 2.2: Section Images
    │   - Generate 2-3 section images
    │   - Diagrams or illustrations
    │   - Consistent visual style
    │
    ├─ Step 2.3: Social Thumbnail
    │   - Optimised for LinkedIn
    │   - Size: 1200x627
    │
    └─ Output: Image Package (ALL from Nano Banana)
        - hero_image.png
        - section_1.png
        - section_2.png
        - social_thumbnail.png
        - Cost: $0 (unlimited plan)
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 3: WRITING (Claude Sonnet 4.5)
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 3.1: Draft Article
    │   - Input: Research package + Outline
    │   - Target: 1,000+ words
    │   - Voice: JASPER brand (professional, direct)
    │
    ├─ Step 3.2: SEO Optimisation
    │   - Integrate target keywords
    │   - Optimise headings
    │   - Add meta description
    │
    ├─ Step 3.3: Final Polish
    │   - Check flow and readability
    │   - Ensure actionable content
    │   - Add call-to-action
    │
    └─ Output: Article Package
        {
          "title": "...",
          "meta_description": "...",
          "content_html": "...",
          "content_markdown": "...",
          "word_count": 1200,
          "reading_time": "5 min"
        }
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 4: PUBLISH
═══════════════════════════════════════════════════════════════
    │
    ├─ Step 4.1: Upload Images
    │   - To website CDN or hosting
    │   - Generate image URLs
    │
    ├─ Step 4.2: Create Blog Post
    │   - Via CMS API or manual
    │   - Include all metadata
    │
    └─ Step 4.3: Schedule Social
    │   - Trigger social content workflow
    │
    ▼
COMPLETE: Article published + social queued
```

---

## Social Content Workflow

### n8n Workflow: `generate-social-content`

```
TRIGGER: After blog publish OR Manual
    │
    ▼
INPUT: Article content + Images
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 1: SOCIAL IMAGES (Nano Banana Pro)
═══════════════════════════════════════════════════════════════
    │
    ├─ LinkedIn Post Image
    │   - Size: 1200x627
    │   - Style: Professional, branded
    │   - Include key stat or quote
    │
    ├─ LinkedIn Carousel (if applicable)
    │   - 5-10 slides
    │   - Key insights from article
    │   - Visual progression
    │
    └─ Output: Social Image Set
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 2: DRAFT POST (DeepSeek V3.2)
═══════════════════════════════════════════════════════════════
    │
    ├─ Extract Key Insights
    │   - 3-5 main points from article
    │   - Hook statement
    │   - Call-to-action
    │
    ├─ Draft LinkedIn Post
    │   - Hook (first line)
    │   - Value points
    │   - Engagement question
    │   - Link to article
    │
    └─ Output: Draft post (250-300 words)
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 3: POLISH (Claude Sonnet 4.5)
═══════════════════════════════════════════════════════════════
    │
    ├─ Refine Voice
    │   - Match JASPER brand
    │   - Professional but accessible
    │   - Direct, no fluff
    │
    ├─ Optimise for Engagement
    │   - Strong hook
    │   - Clear value proposition
    │   - Effective CTA
    │
    └─ Output: Final LinkedIn post
    │
    ▼
═══════════════════════════════════════════════════════════════
STAGE 4: SCHEDULE
═══════════════════════════════════════════════════════════════
    │
    ├─ Queue for optimal posting time
    │   - LinkedIn: Tuesday-Thursday, 8-10 AM
    │
    └─ Add to content calendar
    │
    ▼
COMPLETE: Social content ready
```

---

## Content Types

### Type 1: Educational Article

```
TOPIC EXAMPLES
──────────────
- "What IFC analysts look for in financial models"
- "The DSCR threshold that kills most applications"
- "Why your assumptions page matters more than projections"
- "5 common mistakes in DFI applications"

STRUCTURE
─────────
1. Hook (problem statement)
2. Context (why this matters)
3. Deep dive (3-5 key points)
4. Practical advice
5. Call-to-action

WORD COUNT: 1,200-1,500
IMAGES: 1 hero + 2 section
SOCIAL: 1 post + optional carousel
```

### Type 2: Sector Insight

```
TOPIC EXAMPLES
──────────────
- "Agribusiness: modelling commodity price volatility"
- "Infrastructure: construction period cash flows"
- "Manufacturing: capacity utilisation assumptions"
- "Technology: SaaS metrics for DFI applications"

STRUCTURE
─────────
1. Sector context
2. Specific challenge
3. Technical deep dive
4. JASPER approach
5. Case reference (anonymised)

WORD COUNT: 1,000-1,200
IMAGES: 1 hero + 1 diagram
SOCIAL: 1 focused post
```

### Type 3: DFI Update

```
TOPIC EXAMPLES
──────────────
- "IFC's 2025 priority sectors"
- "AfDB's new submission requirements"
- "IDC funding windows for Q1 2025"

STRUCTURE
─────────
1. Announcement summary
2. What it means
3. Practical implications
4. How to prepare
5. JASPER relevance

WORD COUNT: 800-1,000
IMAGES: 1 hero
SOCIAL: 1 informational post
```

---

## Prompt Templates

### DeepSeek Research Prompt

```
SYSTEM: You are a research agent for JASPER Financial Architecture,
a DFI financial modelling firm. Your task is to research topics
related to development finance institutions (IFC, AfDB, ADB, IDC),
financial modelling, and project finance.

TASK: Research the following topic and provide a structured analysis.

TOPIC: [Topic]

OUTPUT FORMAT:
1. Key Themes (3-5 bullet points)
2. Target Audience Insights
3. Data Points (statistics, facts)
4. Expert Sources (if applicable)
5. Outline (H2 and H3 structure)
6. SEO Keywords (5-10)
7. Unique Angle (what makes this valuable)

Focus on practical, actionable insights for project developers
seeking DFI funding in the $5M-$500M range.
```

### Gemini 3 Image Prompt

```
Create a professional hero image for a blog article about
[Topic].

Style requirements:
- Clean, minimal design
- Primary colour: Navy (#1E3A5F)
- Accent colour: White
- No text on image (text added separately)
- Professional, corporate feel
- Suitable for DFI/finance audience
- Size: 1200x630 pixels

The image should convey [key concept] without being literal.
Abstract or geometric representations preferred over stock
photo style.
```

### Sonnet Writing Prompt

```
SYSTEM: You are the content writer for JASPER Financial Architecture.
Write in a professional, direct voice. No fluff, no filler. Every
sentence should provide value.

BRAND VOICE:
- Professional but accessible
- Confident without arrogance
- Technical accuracy
- Practical focus
- Direct communication

ARTICLE REQUIREMENTS:
- Minimum 1,000 words
- Clear H2 and H3 structure
- Actionable insights
- SEO keyword integration: [keywords]
- End with clear call-to-action

RESEARCH INPUT:
[Research package from DeepSeek]

OUTLINE:
[Outline from research]

Write the complete article following the outline.
Focus on practical value for project developers seeking
DFI funding.
```

### Social Post Polish Prompt

```
SYSTEM: You are polishing a LinkedIn post for JASPER Financial
Architecture. The voice is professional, direct, and value-focused.

DRAFT POST:
[Draft from DeepSeek]

REQUIREMENTS:
- Strong hook (first line must grab attention)
- Clear value proposition
- Professional tone
- 200-300 words maximum
- End with engagement question or clear CTA
- Include link placeholder: [ARTICLE_LINK]

Polish this post while maintaining the core message.
Remove any fluff or filler. Every word should earn its place.
```

---

## Cost Estimation

### Per Blog Article

```
COST BREAKDOWN (OPTIMISED)
──────────────────────────
DeepSeek V3.2 (Research)
├─ ~5,000 tokens input
├─ ~2,000 tokens output
└─ Cost: ~$0.01

DeepSeek-OCR (if documents parsed)
├─ ~200-400 vision tokens (10x compression)
└─ Cost: ~$0.005

Nano Banana Pro (ALL Images)
├─ Hero image
├─ 2-3 section images
├─ Social thumbnail
└─ Cost: $0 (unlimited plan) ✅

Claude Sonnet 4.5 (Writing)
├─ ~3,000 tokens input (research + outline)
├─ ~2,000 tokens output (article)
└─ Cost: ~$0.04

TOTAL PER ARTICLE: ~$0.05
─────────────────────────
(Down from $0.12 by using Nano Banana for all images)
```

### Monthly Budget

```
CONTENT PLAN
────────────
4 articles/month × $0.05 = $0.20
16 social posts/month × $0.01 = $0.16

MONTHLY CONTENT COST: <$0.50
────────────────────────────

FIXED COSTS
───────────
Nano Banana Pro: $24.50/month (already paid annually)
└─ Covers ALL image generation

VARIABLE COSTS (API usage)
──────────────────────────
DeepSeek + Sonnet: ~$0.50/month
```

---

## Content Calendar Integration

### Weekly Schedule

```
MONDAY
──────
- Review previous week's performance
- Select topic for new article

TUESDAY
───────
- Run research workflow (DeepSeek)
- Generate images (Gemini 3 + Nano Banana)

WEDNESDAY
─────────
- Write article (Sonnet 4.5)
- Review and edit

THURSDAY
────────
- Publish article
- Generate social content
- Post first social (8 AM)

FRIDAY
──────
- Monitor engagement
- Respond to comments
```

### Monthly Content Mix

```
WEEK 1: Educational article (broad topic)
WEEK 2: Sector insight (rotating sectors)
WEEK 3: DFI update or industry news
WEEK 4: Case study or methodology deep dive
```

---

## n8n Implementation

### Required Nodes

```
HTTP REQUEST
────────────
- OpenRouter API (DeepSeek, Gemini, Sonnet)
- Higgsfield API (Nano Banana)

DATA PROCESSING
───────────────
- JSON Parse
- Set variables
- Merge data

FILE HANDLING
─────────────
- Move Binary Data
- Write Binary File
- HTTP Request (upload)

SCHEDULING
──────────
- Cron trigger
- Wait nodes
- IF conditions
```

### Credential Setup

```
OPENROUTER
──────────
Name: openrouter_api
Type: HTTP Header Auth
Header: Authorization
Value: Bearer [API_KEY]

HIGGSFIELD (Nano Banana)
────────────────────────
Name: higgsfield_api
Type: HTTP Header Auth
Header: Authorization
Value: Bearer [API_KEY]
```

---

## Quality Checklist

### Before Publishing

```
CONTENT QUALITY
───────────────
☐ Minimum 1,000 words
☐ Clear, actionable insights
☐ SEO keywords integrated naturally
☐ No fluff or filler
☐ Professional tone throughout
☐ Fact-checked data points
☐ Sources cited where applicable

TECHNICAL
─────────
☐ Images optimised for web
☐ Alt text for accessibility
☐ Meta description written
☐ Internal links included
☐ CTA present

BRAND
─────
☐ JASPER voice consistent
☐ No hype or exaggeration
☐ Value-first approach
☐ Professional presentation
```

---

## Troubleshooting

### Common Issues

```
ISSUE: Research too shallow
FIX: Increase DeepSeek token limit, add follow-up queries

ISSUE: Article too short
FIX: Expand outline, add more data points in research phase

ISSUE: Voice inconsistent
FIX: Review Sonnet system prompt, add brand examples

ISSUE: Images off-brand
FIX: Refine Gemini prompt, use Nano Banana for consistency

ISSUE: Social not engaging
FIX: Strengthen hook, test different formats
```

---

## API Endpoints

### OpenRouter (Text Models)

```
BASE URL: https://openrouter.ai/api/v1

DEEPSEEK V3.2
─────────────
Model: deepseek/deepseek-chat
Endpoint: /chat/completions
Use: Research, analysis, OCR orchestration

DEEPSEEK-OCR
────────────
Model: deepseek/deepseek-ocr (or via main model)
Endpoint: /chat/completions
Use: Document parsing, chart extraction

CLAUDE SONNET 4.5
─────────────────
Model: anthropic/claude-sonnet-4-5
Endpoint: /chat/completions
Use: Article writing, content polish
```

### Higgsfield (Nano Banana Pro - ALL Images)

```
BASE URL: https://api.higgsfield.ai/v1
STATUS: ALREADY PAID (unlimited)

IMAGE GENERATION
────────────────
Endpoint: /images/generations
Method: POST
Body: {
  "prompt": "...",
  "width": 1200,
  "height": 630,
  "style": "professional"
}

CAPABILITIES
────────────
├─ Unlimited 2K images
├─ 8 concurrent generations
├─ 94% text accuracy
├─ Up to 14 reference images
├─ Commercial rights included
└─ 1,200 video credits/month

USE FOR ALL:
├─ Hero images
├─ Infographics
├─ Social images
├─ Diagrams
└─ Any visual content
```

---

*Blog generator system v1.0 - December 2025*
*Multi-model pipeline: DeepSeek V3.2 + DeepSeek-OCR + Sonnet 4.5 + Nano Banana Pro*
