# JASPER Design Approach & Assets Reference

## Color System

```css
/* Brand Colors */
--brand-navy: #0B1E2B;
--brand-surface: #0F172A;
--brand-emerald: #2C8A5B;
--brand-glow: #44D685;
--brand-text: rgba(255, 255, 255, 0.95);
--brand-muted: rgba(255, 255, 255, 0.6);

/* Sector Accent Colors */
--emerald: text-brand-emerald border-brand-emerald/30 bg-brand-emerald/10
--blue: text-blue-400 border-blue-400/30 bg-blue-400/10
--yellow: text-yellow-400 border-yellow-400/30 bg-yellow-400/10
--teal: text-teal-400 border-teal-400/30 bg-teal-400/10

/* Background Layers */
--bg-dark: #050A14
--bg-card: rgba(255, 255, 255, 0.02)
--bg-card-hover: rgba(255, 255, 255, 0.04)
```

## Typography

```css
/* Font Family */
font-family: 'Poppins', sans-serif;

/* Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Heading Sizes */
h1: text-5xl md:text-7xl font-display font-bold
h2: text-3xl lg:text-5xl font-display font-bold
h3: text-xl font-bold
h4: text-sm font-bold uppercase tracking-wider

/* Body */
body: text-base text-brand-muted
small: text-sm text-gray-300
micro: text-[10px] uppercase tracking-widest
```

## Component Patterns

### Hero Section
```tsx
<section className="relative px-6 lg:px-12 mb-32">
  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />
  <div className="container mx-auto">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Label</span>
    </div>
    {/* Title */}
    <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
      Main Title <br/>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-white">Gradient.</span>
    </h1>
  </div>
</section>
```

### Card Pattern
```tsx
<div className="group/card relative p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
  <div className="absolute left-0 top-6 bottom-6 w-1 bg-white/10 group-hover/card:bg-brand-emerald transition-colors rounded-r-full" />
  {/* Content */}
</div>
```

### Stats Grid
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
    <span className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Label</span>
    <span className="text-sm font-bold text-white">Value</span>
  </div>
</div>
```

### Button Styles
```tsx
// Primary CTA
<button className="px-8 py-4 bg-brand-emerald text-white font-bold rounded-full shadow-[0_0_20px_rgba(44,138,91,0.5)] hover:shadow-[0_0_30px_rgba(68,214,133,0.6)] border border-brand-emerald/50 transition-all">
  CTA Text
</button>

// Secondary
<button className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-brand-emerald/50 hover:bg-white/10 transition-all text-sm font-semibold text-gray-300 hover:text-white">
  Secondary
</button>
```

### Visual Container
```tsx
<div className="aspect-square w-full rounded-3xl bg-[#0F172A] border border-white/10 relative overflow-hidden shadow-2xl">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_60%)] pointer-events-none" />
  {/* Video or Image */}
</div>
```

## Animation Keyframes

```css
@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes border-beam {
  0% { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}
```

## Layout Structure

```tsx
// Page Template
<div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
  <Navbar />
  <main className="pt-32 pb-20">
    {/* Sections */}
  </main>
  <Footer />
</div>
```

## Assets

### Logo
```
Primary: https://i.postimg.cc/C1VxnRJL/JASPER-FINANCIAL-ARCHITECTURE.png
Local: /public/images/jasper-logo.png
```

### Sector Videos
```
/public/images/sectors/renewable-energy-animation.mp4
/public/images/sectors/data-centres-animation.mp4
/public/images/sectors/agri-industrial-animation.mp4
/public/images/sectors/climate-finance-animation.mp4
```

### Icons (Lucide React)
```tsx
import { 
  Zap,      // Renewable Energy
  Cpu,      // Data Centres
  Sprout,   // Agri-Industrial
  Globe,    // Climate Finance
  Leaf,     // Green/Eco
  Factory,  // Manufacturing
  Landmark, // Institutional
  ArrowRight,
  ChevronDown,
  Download,
  FileSpreadsheet
} from 'lucide-react';
```

## Framer Motion Patterns

```tsx
// Fade In
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}

// Tab Content
initial={{ opacity: 0, x: -10 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 10 }}
transition={{ duration: 0.2 }}

// Dropdown
initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(8px)' }}
animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(8px)' }}
```

## Grid Patterns

```css
/* Dot Grid */
bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-5

/* Line Grid */
bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]
```

## Lead Magnet Component Pattern

```tsx
// Download CTA Card
<div className="p-8 rounded-2xl bg-gradient-to-br from-brand-emerald/20 to-transparent border border-brand-emerald/30">
  <FileSpreadsheet className="w-12 h-12 text-brand-emerald mb-4" />
  <h3 className="text-xl font-bold text-white mb-2">Free Model Template</h3>
  <p className="text-brand-muted mb-6">Download our sector-specific financial model template</p>
  <button className="flex items-center gap-2 px-6 py-3 bg-brand-emerald text-white font-bold rounded-full">
    <Download className="w-4 h-4" />
    Download Template
  </button>
</div>
```

## SEO Metadata Pattern

```tsx
export const metadata = {
  title: 'Sector Name | JASPER Financial Architecture',
  description: 'Investment-grade financial modeling for sector...',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    title: 'Sector Name | JASPER',
    description: '...',
    images: ['/images/og/sector-name.jpg'],
  },
};
```
