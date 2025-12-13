# JASPER Documentation Assessment & Build Plan

## Current Asset Inventory

### Logos (Available for all documents)
| Asset | Location | Size | Use Case |
|-------|----------|------|----------|
| `jasper-icon-crystal.png` | `/branding/logos/` | 929KB | Document headers, cover pages |
| `jasper-wordmark-navy.png` | `/branding/logos/` | 134KB | Headers, light backgrounds |
| `jasper-logo-white.png` | `/branding/logos/` | 134KB | Dark backgrounds, footers |
| `jasper-logo.png` | `/client-materials/images/` | 929KB | LaTeX documents |

### Infographic Diagrams (Available for embedding)
| Diagram | Orientation | Size | Best Use |
|---------|-------------|------|----------|
| `jasper-10-layer-build-sequence.png` | **Portrait** | 5.4MB | Technical methodology docs |
| `jasper-10-layer-build-sequence-detailed.png` | **Portrait** | 4.7MB | Technical deep-dives |
| `jasper-28-sheet-architecture-colorful.png` | **Landscape** | 7.7MB | Overview slides, brochures |
| `jasper-28-sheet-architecture-detailed.png` | **Landscape** | 7.5MB | Technical reference |
| `jasper-28-sheet-list-vertical.png` | **Portrait** | 7.7MB | Sheet listings, appendices |
| `jasper-build-pipeline-python-csharp.png` | **Landscape** | 6.6MB | Tech stack explanations |
| `jasper-build-sequence-detailed.png` | **Landscape** | 7.7MB | Build process docs |
| `jasper-uaei-build-pipeline.png` | **Landscape** | 4.4MB | UAEI-specific materials |

### Design Templates
| Template | Size | Purpose |
|----------|------|---------|
| `jds-template-1-design-system.png` | 21MB | Design system reference |
| `jds-template-1-full-reference.png` | 5.3MB | Template specification |

---

## Existing LaTeX Documents

### 1. The 28-Sheet Guide (KEEP & ENHANCE)
- **File**: `/client-materials/latex/jasper-28-sheet-guide.tex`
- **PDF**: `/client-materials/pdfs/jasper-28-sheet-guide.pdf` (934KB)
- **Status**: Functional, uses JASPER branding
- **Orientation**: Portrait (A4)
- **Content**: Model architecture overview, 8 categories, 28 sheets explained
- **Diagrams Used**: TikZ-generated flow diagram (internal)
- **Recommendation**: KEEP - This is the existing document mentioned by user

### 2. Client Questionnaire (REMOVED)
- **Status**: Deleted per user request
- **Reason**: Digital intake form replaces need for PDF form

---

## Brand Colours (LaTeX Definition)

```latex
\definecolor{jaspernavy}{HTML}{0F2A3C}
\definecolor{jasperemeralddark}{HTML}{1E6B45}
\definecolor{jasperemerald}{HTML}{2C8A5B}
\definecolor{jasperslate}{HTML}{64748B}
\definecolor{jaspergray}{HTML}{F8FAFC}
```

---

## Proposed Documentation Suite

### Tier 1: Client Confidence Builders (Priority)

#### 1. Service Overview Brochure
- **Purpose**: First touch marketing material
- **Audience**: Prospective clients, funders, partners
- **Orientation**: Portrait (A4) for print, PDF download
- **Pages**: 4-6 pages
- **Content**:
  - Who we are (Kutlwano Holdings background)
  - What we do (DFI-grade financial modelling)
  - Our methodology (28-sheet architecture overview)
  - Service packages (Starter, Professional, Enterprise)
  - Client success stories (testimonials)
  - Contact information
- **Diagrams**: `jasper-28-sheet-architecture-colorful.png` (landscape, spread across 2 pages)
- **Logo**: Full wordmark on cover, icon on footer

#### 2. Methodology Deep Dive
- **Purpose**: Technical credibility document
- **Audience**: Technical evaluators, DFI analysts, CFOs
- **Orientation**: Portrait (A4)
- **Pages**: 12-16 pages
- **Content**:
  - The JASPER difference
  - 10-Layer build sequence explained
  - Each of 28 sheets detailed
  - Quality assurance process
  - DFI compliance standards
  - Technology stack (Python + C#)
- **Diagrams**:
  - `jasper-10-layer-build-sequence-detailed.png` (portrait, full page)
  - `jasper-28-sheet-architecture-detailed.png` (landscape, spread)
  - `jasper-build-pipeline-python-csharp.png` (landscape, full page)
- **Logo**: Header on each page

#### 3. Package Comparison Guide
- **Purpose**: Help clients choose the right package
- **Audience**: Decision makers, procurement teams
- **Orientation**: Portrait (A4)
- **Pages**: 2-4 pages
- **Content**:
  - Package comparison table
  - What's included in each tier
  - Typical project examples
  - Pricing transparency
  - ROI justification
- **Diagrams**: Custom tables
- **Logo**: Header

### Tier 2: Onboarding & Process Documents

#### 4. Client Onboarding Guide
- **Purpose**: Set expectations for new clients
- **Audience**: Signed clients
- **Orientation**: Portrait (A4)
- **Pages**: 8-10 pages
- **Content**:
  - Welcome to JASPER
  - What to expect (timeline)
  - Documents we'll need from you
  - Communication channels
  - Milestone walkthrough
  - Portal access guide
- **Diagrams**: Custom workflow diagram
- **Logo**: Full branding

#### 5. Document Requirements Checklist
- **Purpose**: Clear list of what clients need to provide
- **Audience**: Clients preparing for engagement
- **Orientation**: Portrait (A4)
- **Pages**: 2 pages
- **Content**:
  - Required documents by type
  - Format requirements
  - Upload instructions
  - Timeline for submission
- **Diagrams**: Checklist format
- **Logo**: Header

### Tier 3: Technical Reference

#### 6. 28-Sheet Architecture Guide (EXISTS - ENHANCE)
- **Status**: Already exists at `/client-materials/latex/jasper-28-sheet-guide.tex`
- **Enhancement needed**:
  - Add landscape diagram pages for the infographics
  - Include more detailed formula explanations
  - Add appendix with full sheet reference

#### 7. DFI Requirements Matrix
- **Purpose**: Show DFI-specific requirements we meet
- **Audience**: Clients targeting specific DFIs
- **Orientation**: Landscape (for wide tables)
- **Pages**: 4-6 pages
- **Content**:
  - Matrix of DFIs vs requirements
  - How JASPER addresses each
  - Typical DFI feedback we've incorporated
- **Diagrams**: Wide tables
- **Logo**: Header

### Tier 4: Case Studies & Proof Points

#### 8. Case Study Template
- **Purpose**: Showcase successful projects
- **Audience**: Prospective clients
- **Orientation**: Portrait (A4)
- **Pages**: 2 pages per case study
- **Content**:
  - Client overview (anonymized if needed)
  - Challenge
  - Solution
  - Results / Impact
  - Client testimonial
- **Diagrams**: Project-specific metrics
- **Logo**: Full branding

---

## LaTeX Template Architecture

### Master Template Structure

```
/client-materials/
├── latex/
│   ├── common/
│   │   ├── jasper-preamble.tex      # Shared packages, colours, commands
│   │   ├── jasper-header.tex        # Standard header/footer
│   │   └── jasper-cover.tex         # Reusable cover page
│   ├── documents/
│   │   ├── service-overview.tex
│   │   ├── methodology-deep-dive.tex
│   │   ├── package-comparison.tex
│   │   ├── onboarding-guide.tex
│   │   ├── document-checklist.tex
│   │   ├── jasper-28-sheet-guide.tex  # (existing)
│   │   ├── dfi-requirements.tex
│   │   └── case-study-template.tex
│   └── output/                       # Compiled PDFs
├── images/
│   ├── jasper-logo.png
│   ├── jasper-10-layer-build-sequence.png
│   └── jasper-28-sheet-architecture-detailed.png
└── pdfs/
    └── (compiled PDFs)
```

### Landscape Page Handling

For landscape diagrams within portrait documents:
```latex
\usepackage{pdflscape}

% For a full-page landscape diagram:
\begin{landscape}
\begin{figure}[p]
    \centering
    \includegraphics[width=\linewidth]{../images/jasper-28-sheet-architecture-detailed.png}
    \caption{JASPER 28-Sheet Model Architecture}
\end{figure}
\end{landscape}
```

### Image Sizing Guidelines

| Orientation | Max Width | LaTeX Code |
|-------------|-----------|------------|
| Portrait (full page) | `\linewidth` | `\includegraphics[width=\linewidth]{...}` |
| Landscape (full page) | `\textheight` | `\includegraphics[width=\textheight]{...}` in landscape |
| Half page | `0.48\linewidth` | Side-by-side with another |
| Quarter page | `0.45\linewidth` | With text wrap |

---

## Priority Build Order

### Phase 1: Immediate (Build Now)
1. **Service Overview Brochure** - Highest impact for new client acquisition
2. **Enhance 28-Sheet Guide** - Add landscape diagram pages

### Phase 2: Client Journey (Next)
3. **Client Onboarding Guide** - For newly signed clients
4. **Document Requirements Checklist** - Practical utility

### Phase 3: Technical Depth (Later)
5. **Methodology Deep Dive** - For technical evaluators
6. **Package Comparison Guide** - Sales support

### Phase 4: Ongoing
7. **DFI Requirements Matrix** - As needed per target DFI
8. **Case Study Template** - As projects complete

---

## Customer Confidence Building Strategy

### What builds confidence:

1. **Professional Presentation** - Investment-grade documents signal investment-grade work
2. **Methodology Transparency** - Showing our 28-sheet architecture proves rigour
3. **Technical Depth** - The 10-layer build sequence shows we're not guessing
4. **DFI Alignment** - Showing we know what DFIs require
5. **Process Clarity** - Clear onboarding reduces anxiety
6. **Proof Points** - Case studies prove we deliver

### Each document should include:

- JASPER logo (crystal icon + wordmark)
- Consistent brand colours (navy, emerald, slate)
- Professional typography (Helvetica Neue or similar)
- Page numbers and document reference
- Contact information
- Website/portal references

---

## Next Steps

1. Create shared LaTeX preamble (`jasper-preamble.tex`)
2. Build Service Overview Brochure (highest priority)
3. Enhance existing 28-Sheet Guide with landscape diagrams
4. Create Onboarding Guide for client portal delivery

---

*JASPER Financial Architecture - Documentation Strategy*
*Last Updated: December 2025*
