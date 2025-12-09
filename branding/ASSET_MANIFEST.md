# JASPER Branding Asset Manifest

**Location:** `/Users/mac/Downloads/Jasper Branding/organized/`
**Last Updated:** December 2025
**Format:** PNG (original) + JPEG (optimised for LaTeX/print)

---

## Folder Structure

```
organized/
├── logos/              # PNG originals
├── infographics/       # PNG originals
├── templates/          # PNG originals
└── jpeg/
    ├── logos/          # JPEG optimised (90% quality)
    ├── infographics/   # JPEG optimised
    └── templates/      # JPEG optimised
```

---

## Asset Catalogue

### LOGOS (11 files)

| File Name | Description | Orientation | Best For |
|-----------|-------------|-------------|----------|
| jasper-brand-guide-full.jpg | Complete brand guide with logo variations, colours, typography | Portrait | Reference document |
| jasper-brand-guide-compact.jpg | Compact brand guide with colour palette | Portrait | Quick reference |
| jasper-logo-white-on-navy.jpg | White logo on navy background | Square | Dark backgrounds, headers |
| jasper-logo-horizontal-color.jpg | Horizontal full colour logo | Landscape | Document headers, web |
| jasper-logo-stacked-navy.jpg | Stacked logo, navy on white | Portrait | Light backgrounds |
| jasper-logo-stacked-dark-bg.jpg | Stacked logo on dark background | Square | Hero sections |
| jasper-logo-stacked-color.jpg | Stacked logo, full colour | Portrait | General use |
| jasper-logo-black.jpg | Black monotone logo | Portrait | B&W printing |
| jasper-icon-only-color.jpg | Icon mark only, colour | Square | Favicons, small use |
| jasper-icon-only-color-2.jpg | Icon mark only, colour variant | Square | App icons |
| jasper-wordmark-navy.jpg | Text only wordmark, navy | Landscape | Minimal headers |

### INFOGRAPHICS (8 files)

| File Name | Description | Orientation | A4 Usage |
|-----------|-------------|-------------|----------|
| jasper-28-sheet-architecture-colorful.jpg | Full 28-sheet architecture, colour-coded layers | Landscape | A4 Landscape |
| jasper-28-sheet-architecture-detailed.jpg | Detailed 28-sheet with sheet descriptions | Landscape | A4 Landscape |
| jasper-28-sheet-list-vertical.jpg | Vertical list of all 28 sheets with descriptions | Portrait | A4 Portrait |
| jasper-10-layer-build-sequence.jpg | 10-layer build sequence flowchart | Portrait | A4 Portrait |
| jasper-10-layer-build-sequence-detailed.jpg | Detailed 10-layer with formula references | Portrait | A4 Portrait |
| jasper-build-pipeline-python-csharp.jpg | Python → JSON → C# → Excel pipeline | Landscape | A4 Landscape |
| jasper-build-sequence-detailed.jpg | Multi-layer build sequence with dependencies | Landscape | A4 Landscape |
| jasper-uaei-build-pipeline.jpg | UAEI-specific build pipeline diagram | Landscape | A4 Landscape |

### TEMPLATES (2 files)

| File Name | Description | Orientation | A4 Usage |
|-----------|-------------|-------------|----------|
| jds-template-1-design-system.jpg | JDS Template 1 complete design system | Landscape | A4 Landscape (reference) |
| jds-template-1-full-reference.jpg | JDS Template 1 full specification | Portrait | A4 Portrait |

---

## LaTeX Usage Guide

### A4 Landscape (297mm × 210mm)

Best for: Architecture diagrams, pipeline flowcharts, colour-coded infographics

```latex
\documentclass[a4paper,landscape]{article}
\usepackage{graphicx}
\usepackage[margin=15mm]{geometry}

% Full-page infographic
\begin{figure}[htbp]
  \centering
  \includegraphics[width=\textwidth,height=0.85\textheight,keepaspectratio]{%
    jpeg/infographics/jasper-28-sheet-architecture-colorful.jpg}
  \caption{JASPER 28-Sheet Financial Model Architecture}
\end{figure}
```

### A4 Portrait (210mm × 297mm)

Best for: Vertical lists, build sequences, detailed documentation

```latex
\documentclass[a4paper]{article}
\usepackage{graphicx}
\usepackage[margin=20mm]{geometry}

% Full-page vertical infographic
\begin{figure}[htbp]
  \centering
  \includegraphics[width=\textwidth,height=0.9\textheight,keepaspectratio]{%
    jpeg/infographics/jasper-28-sheet-list-vertical.jpg}
  \caption{JASPER 28-Sheet Architecture - Complete List}
\end{figure}
```

### Header Logo (Both Orientations)

```latex
% For document headers
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhead[L]{\includegraphics[height=1cm]{jpeg/logos/jasper-logo-horizontal-color.jpg}}
\fancyhead[R]{JASPER Financial Architecture}
```

### Cover Page Logo

```latex
% Centred logo for cover pages
\begin{center}
  \includegraphics[width=0.4\textwidth]{jpeg/logos/jasper-logo-stacked-color.jpg}
  \vspace{1cm}

  {\Huge\bfseries Document Title}
\end{center}
```

---

## Recommended A4 Pairings

### For Client Documentation Pack

| Page | Orientation | Asset |
|------|-------------|-------|
| Cover | Portrait | jasper-logo-stacked-color.jpg |
| Page 1 | Landscape | jasper-28-sheet-architecture-colorful.jpg |
| Page 2 | Portrait | jasper-28-sheet-list-vertical.jpg |
| Page 3 | Portrait | jasper-10-layer-build-sequence-detailed.jpg |
| Page 4 | Landscape | jasper-build-pipeline-python-csharp.jpg |

### For Technical Reference

| Page | Orientation | Asset |
|------|-------------|-------|
| Cover | Portrait | jasper-logo-stacked-navy.jpg |
| Page 1 | Landscape | jds-template-1-design-system.jpg |
| Page 2 | Portrait | jds-template-1-full-reference.jpg |
| Page 3 | Landscape | jasper-28-sheet-architecture-detailed.jpg |

---

## File Size Summary

| Category | PNG Total | JPEG Total | Reduction |
|----------|-----------|------------|-----------|
| Logos | ~52 MB | ~6 MB | 88% |
| Infographics | ~55 MB | ~11 MB | 80% |
| Templates | ~27 MB | ~5 MB | 81% |
| **Total** | **~134 MB** | **~22 MB** | **84%** |

---

## Brand Colours (Reference)

```latex
\usepackage{xcolor}
\definecolor{jaspernavy}{HTML}{0F2A3C}
\definecolor{jasperemeralda}{HTML}{2C8A5B}
\definecolor{jaspergraphite}{HTML}{1B2430}
\definecolor{jasperwhite}{HTML}{FFFFFF}
```

---

*Asset manifest generated December 2025*
*JASPER Financial Architecture*
