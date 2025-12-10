# JASPER Design System Rules

**Purpose:** Mandatory design alignment rules for all pages, components, and templates
**Source of Truth:** JASPER_BRAND_GUIDE.md
**Last Updated:** December 2025

---

## CRITICAL: Read Before Building Any Page

Every page, component, email, and PDF MUST follow these rules. No exceptions.

---

## 1. COLOR PALETTE

### Primary Colors (MUST USE)

```css
/* PRIMARY - Use these for main UI elements */
--navy: #0F2A3C;           /* Primary backgrounds, text on light */
--emerald: #2C8A5B;        /* CTAs, accents, highlights, links */
--carbon-black: #0F172A;   /* Deep backgrounds, premium sections */
```

### Secondary Colors

```css
/* SECONDARY - Use for depth and hierarchy */
--navy-light: #1A3A4C;     /* Card backgrounds, hover states */
--navy-dark: #0B1E2B;      /* Deep backgrounds */
--graphite: #1B2430;       /* Secondary dark elements */
```

### Neutral Colors

```css
/* NEUTRALS - Use for text and borders */
--white: #FFFFFF;          /* Text on dark, light backgrounds */
--gray: #94A3B8;           /* Body text, secondary text */
--gray-light: #CBD5E1;     /* Borders, dividers */
--gray-100: #F1F5F9;       /* Light backgrounds (cards on white) */
```

### System Colors

```css
/* SYSTEM - Use sparingly for status only */
--success: #10B981;        /* Success states, confirmations */
--warning: #F59E0B;        /* Warnings, pending states */
--error: #EF4444;          /* Errors, destructive actions */
--info: #3B82F6;           /* Information, tips */
```

### COLOR RULES

| Element | Color | Hex |
|---------|-------|-----|
| Page background (dark mode) | Navy | #0F2A3C |
| Page background (light mode) | White | #FFFFFF |
| Primary buttons | Emerald | #2C8A5B |
| Primary button hover | Emerald dark | #1E6B45 |
| Secondary buttons | Transparent + white border | |
| Links | Emerald | #2C8A5B |
| Headings (dark bg) | White | #FFFFFF |
| Headings (light bg) | Navy | #0F2A3C |
| Body text (dark bg) | Gray | #94A3B8 |
| Body text (light bg) | Graphite | #1B2430 |
| Card backgrounds | Navy Light | #1A3A4C |
| Borders | Gray Light | #CBD5E1 |
| Accent highlights | Emerald | #2C8A5B |

---

## 2. TYPOGRAPHY

### Web/Portal: Poppins

```css
/* IMPORT */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* USAGE */
font-family: 'Poppins', system-ui, -apple-system, sans-serif;
```

### PDF/Print: Montserrat

```python
# For ReportLab PDF generation
font_regular = 'Montserrat'
font_bold = 'Montserrat-Bold'
font_semi = 'Montserrat-SemiBold'
```

### Font Weights

| Weight | Name | Usage |
|--------|------|-------|
| 300 | Light | Captions, fine print |
| 400 | Regular | Body text |
| 500 | Medium | Subheadings, emphasis |
| 600 | SemiBold | Section headers |
| 700 | Bold | Headlines, CTAs |

### Type Scale

| Element | Desktop | Mobile | Weight | Line Height |
|---------|---------|--------|--------|-------------|
| H1 | 48px | 32px | 700 | 1.1 |
| H2 | 36px | 28px | 700 | 1.2 |
| H3 | 24px | 20px | 600 | 1.3 |
| H4 | 18px | 16px | 600 | 1.4 |
| Body | 16px | 16px | 400 | 1.6 |
| Small | 14px | 14px | 400 | 1.5 |
| Caption | 12px | 12px | 300 | 1.4 |

### TYPOGRAPHY RULES

```css
/* Headlines */
h1, h2, h3 {
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--white); /* or --navy on light bg */
}

/* Body */
p, li {
    font-weight: 400;
    line-height: 1.6;
    color: var(--gray); /* or --graphite on light bg */
}

/* Labels & Tags */
.label {
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

/* Links */
a {
    color: var(--emerald);
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
```

---

## 3. SPACING

### Base Unit: 4px

```css
--space-xs: 4px;    /* 0.25rem */
--space-sm: 8px;    /* 0.5rem */
--space-md: 16px;   /* 1rem */
--space-lg: 24px;   /* 1.5rem */
--space-xl: 32px;   /* 2rem */
--space-2xl: 48px;  /* 3rem */
--space-3xl: 64px;  /* 4rem */
```

### SPACING RULES

| Element | Padding | Margin |
|---------|---------|--------|
| Page container | 24px (mobile), 48px (desktop) | - |
| Cards | 24px | 16px bottom |
| Buttons | 12px 24px | - |
| Form inputs | 12px 16px | 8px bottom |
| Sections | 64px top/bottom | - |
| Between paragraphs | - | 16px |

---

## 4. COMPONENTS

### Buttons

```css
/* Primary Button */
.btn-primary {
    background: #2C8A5B;
    color: #FFFFFF;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}
.btn-primary:hover {
    background: #1E6B45;
    box-shadow: 0 4px 20px rgba(44, 138, 91, 0.3);
}

/* Secondary Button */
.btn-secondary {
    background: transparent;
    color: #FFFFFF;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.2);
}
.btn-secondary:hover {
    border-color: #2C8A5B;
    color: #2C8A5B;
}
```

### Cards

```css
/* Standard Card */
.card {
    background: rgba(26, 58, 76, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
}

/* Card on light background */
.card-light {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Highlighted Card */
.card-highlight {
    border: 2px solid #2C8A5B;
    box-shadow: 0 0 30px rgba(44, 138, 91, 0.2);
}
```

### Form Inputs

```css
/* Input Field */
.input {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 16px;
    color: #0F2A3C;
    width: 100%;
}
.input:focus {
    outline: none;
    border-color: #2C8A5B;
    box-shadow: 0 0 0 3px rgba(44, 138, 91, 0.1);
}
.input::placeholder {
    color: #94A3B8;
}

/* Input on dark background */
.input-dark {
    background: rgba(26, 58, 76, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
}
```

### Tables

```css
/* Table */
.table {
    width: 100%;
    border-collapse: collapse;
}
.table th {
    background: #F1F5F9;
    color: #0F2A3C;
    font-weight: 600;
    text-align: left;
    padding: 12px 16px;
    font-size: 14px;
}
.table td {
    padding: 12px 16px;
    border-bottom: 1px solid #CBD5E1;
    color: #1B2430;
}
.table tr:hover {
    background: #F8FAFC;
}
```

### Status Badges

```css
.badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
}
.badge-success { background: #D1FAE5; color: #065F46; }
.badge-warning { background: #FEF3C7; color: #92400E; }
.badge-error { background: #FEE2E2; color: #991B1B; }
.badge-info { background: #DBEAFE; color: #1E40AF; }
.badge-neutral { background: #F1F5F9; color: #475569; }
```

---

## 5. LAYOUT

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-max: 1440px;
```

### Grid System

```css
/* 12-column grid */
.grid {
    display: grid;
    gap: 24px;
}
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive */
@media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 {
        grid-template-columns: 1fr;
    }
}
```

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│  HEADER (fixed, navy background)                    │
│  - Logo left                                        │
│  - Nav center                                       │
│  - CTA button right                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  MAIN CONTENT                                       │
│  - Max width: 1280px                               │
│  - Padding: 24px (mobile) / 48px (desktop)         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FOOTER (navy dark background)                      │
│  - Company info                                     │
│  - Links                                           │
│  - Copyright                                        │
└─────────────────────────────────────────────────────┘
```

---

## 6. SHADOWS & EFFECTS

```css
/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-emerald: 0 4px 20px rgba(44, 138, 91, 0.2);

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-full: 9999px;

/* Transitions */
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease;
```

---

## 7. ICONS

### Library: Lucide Icons

```jsx
import { ShieldCheck, Layers, Zap, Globe } from 'lucide-react';
```

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| sm | 16px | Inline with text |
| md | 20px | Buttons, lists |
| lg | 24px | Cards, features |
| xl | 32px | Hero sections |

### Icon Colors

- Default: `currentColor` (inherits text color)
- Accent: `#2C8A5B` (emerald)
- Muted: `#94A3B8` (gray)

---

## 8. RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
--bp-sm: 640px;   /* Small devices */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large screens */
```

---

## 9. DARK MODE (PRIMARY)

```css
:root {
    --bg-primary: #0F2A3C;
    --bg-secondary: #1A3A4C;
    --bg-tertiary: #0B1E2B;
    --text-primary: #FFFFFF;
    --text-secondary: #94A3B8;
    --border: rgba(255, 255, 255, 0.1);
}
```

## 10. LIGHT MODE (SECONDARY)

```css
[data-theme="light"] {
    --bg-primary: #FFFFFF;
    --bg-secondary: #F1F5F9;
    --bg-tertiary: #F8FAFC;
    --text-primary: #0F2A3C;
    --text-secondary: #1B2430;
    --border: #CBD5E1;
}
```

---

## 11. DO's AND DON'Ts

### DO ✓

- Use emerald (#2C8A5B) for all CTAs and interactive elements
- Use Poppins for web, Montserrat for PDFs
- Maintain consistent 8px spacing increments
- Use navy backgrounds for premium feel
- Keep cards with subtle borders and rounded corners
- Use proper heading hierarchy (H1 → H2 → H3)

### DON'T ✗

- Don't use colors outside the palette
- Don't use fonts other than Poppins/Montserrat
- Don't create buttons that aren't emerald
- Don't use sharp corners (always rounded)
- Don't skip heading levels
- Don't use pure black (#000000)
- Don't use thin fonts for body text

---

## 12. CODE SNIPPETS

### React Component Template

```jsx
import React from 'react';
import styles from './Component.module.css';

const Component = ({ title, children }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Component;
```

### CSS Module Template

```css
.container {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.title {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.content {
  color: var(--text-secondary);
  line-height: 1.6;
}
```

### Tailwind Config (if using Tailwind)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2A3C',
          light: '#1A3A4C',
          dark: '#0B1E2B',
        },
        emerald: {
          DEFAULT: '#2C8A5B',
          dark: '#1E6B45',
        },
        carbon: '#0F172A',
        graphite: '#1B2430',
      },
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

## 13. COMPONENT CHECKLIST

Before shipping any component, verify:

- [ ] Uses only brand colors
- [ ] Uses Poppins font (web) or Montserrat (PDF)
- [ ] Has proper spacing (8px increments)
- [ ] Buttons are emerald with proper hover states
- [ ] Links are emerald
- [ ] Has responsive breakpoints
- [ ] Cards have rounded corners (16px)
- [ ] Forms have proper focus states
- [ ] Accessible (proper contrast, focus indicators)

---

## 14. AI INTEGRATION

### OpenRouter API Configuration

```python
# Environment variable
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Usage in code
import httpx

async def ai_request(prompt: str, model: str = "anthropic/claude-3-haiku"):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://jasperfinance.org",
                "X-Title": "JASPER Portal"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        return response.json()
```

---

*JASPER Design System Rules v1.0 - December 2025*
*Source: JASPER_BRAND_GUIDE.md*
