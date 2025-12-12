# JASPER Assets Inventory

## Logo Assets
Location: `/public/images/branding/`

| File | Use Case |
|------|----------|
| `Abstract_geometric_crystal_logo.png` | Icon/Favicon |
| `Abstract_geometric_logo_with_text.png` | Full logo with text |
| `Jasper_Financial_Architecture_logo.png` | Primary logo |
| `Jasper_Financial_Architecture_logo_1-4.png` | Logo variants |

**External CDN Logo:**
```
https://i.postimg.cc/C1VxnRJL/JASPER-FINANCIAL-ARCHITECTURE.png
```

## Sector Assets
Location: `/public/images/sectors/`

### Static Images (.jpg)
- `renewable-energy.jpg`
- `data-centres.jpg`
- `agri-industrial.jpg`
- `climate-finance.jpg`
- `technology.jpg`

### Animation Videos (.mp4)
- `renewable-energy-animation.mp4`
- `data-centres-animation.mp4`
- `agri-industrial-animation.mp4`
- `climate-finance-animation.mp4`
- `technology-animation.mp4`
- `manufacturing-animation.mp4`

## NEW SECTORS TO ADD

### Agribusiness Landing Page
**Required Assets:**
- Hero image: Use existing `agri-industrial.jpg` OR create new
- Animation: Use existing `agri-industrial-animation.mp4`
- Lead magnet thumbnail: Create `agri-model-preview.png`
- OG Image: Create `og-agribusiness.jpg` (1200x630)

### Real Estate Landing Page  
**Required Assets (NEW - not in current assets):**
- Hero image: Create `real-estate.jpg`
- Animation: Create `real-estate-animation.mp4`
- Lead magnet thumbnail: Create `real-estate-model-preview.png`
- OG Image: Create `og-real-estate.jpg` (1200x630)

## Component Assets

### Icons (Lucide React)
```tsx
// Already imported in project
import {
  Zap,           // Energy
  Sprout,        // Agriculture
  Cpu,           // Data/Tech
  Globe,         // Climate
  Leaf,          // Green
  Factory,       // Manufacturing
  Landmark,      // Institutional/Real Estate
  Home,          // Real Estate (Anti-portfolio)
  Building2,     // Commercial Real Estate
  TrendingUp,    // Finance
  FileSpreadsheet, // Excel/Models
  Download,      // Downloads
  ArrowRight,    // CTAs
  CheckCircle,   // Success states
  Mail,          // Email capture
} from 'lucide-react';
```

## Background Patterns

### Glow Effects
```tsx
// Emerald glow (right)
<div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />

// Blue glow (left)
<div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
```

### Grid Overlays
```tsx
// Dot pattern
<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

// Line grid
<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
```

## Lead Magnet Files (TO CREATE)

### Agribusiness
- `/public/downloads/agribusiness-financial-model-sample.xlsx`
- Preview: `/public/images/lead-magnets/agri-model-preview.png`

### Real Estate  
- `/public/downloads/real-estate-financial-model-sample.xlsx`
- Preview: `/public/images/lead-magnets/real-estate-model-preview.png`

## File Structure for New Sector Pages

```
/app/sectors/
├── page.tsx                    # Existing overview
├── agribusiness/
│   ├── page.tsx               # NEW landing page
│   └── opengraph-image.jpg    # OG image
├── real-estate/
│   ├── page.tsx               # NEW landing page  
│   └── opengraph-image.jpg    # OG image
└── [existing sectors...]

/components/
├── LeadMagnetForm.tsx         # NEW - email capture
├── SectorHero.tsx             # NEW - reusable hero
└── SectorStats.tsx            # NEW - stats grid

/public/
├── images/
│   ├── sectors/
│   │   ├── real-estate.jpg    # NEW
│   │   └── real-estate-animation.mp4  # NEW
│   └── lead-magnets/
│       ├── agri-model-preview.png     # NEW
│       └── real-estate-model-preview.png # NEW
└── downloads/
    ├── agribusiness-financial-model-sample.xlsx  # NEW
    └── real-estate-financial-model-sample.xlsx   # NEW
```
