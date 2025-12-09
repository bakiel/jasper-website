# JASPER™ Web App
## SEO & Google Integration Guide

**Version:** 1.1 (Updated with Google OAuth)
**Author:** Bakiel Ben Shomriel Nxumalo
**Platform:** Vercel + Next.js (Frontend) | Hostinger PHP (Backend)
**Last Updated:** December 7, 2025

---

# Table of Contents

1. [Overview](#1-overview)
2. [One-Time Google Setup](#2-one-time-google-setup)
3. [Google OAuth for Client Portal](#3-google-oauth-for-client-portal) ⭐ NEW
4. [SEO Architecture](#4-seo-architecture)
5. [Technical Implementation](#5-technical-implementation)
6. [Content Strategy](#6-content-strategy)
7. [Performance Optimization](#7-performance-optimization)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)

---

# 1. Overview

## Philosophy

JASPER's SEO strategy is **built into the codebase**, not bolted on with plugins or third-party services. This means:

- Zero monthly SEO tool subscriptions
- Full control over all meta tags and schema
- Claude can update SEO elements conversationally
- No dependency on external platforms

## What You Do vs What Claude Does

| Task | Who | Frequency |
|------|-----|-----------|
| Create Google Analytics property | You | Once |
| Verify Search Console | You | Once |
| Generate meta tags | Claude | As needed |
| Update sitemap | Claude | Automatic |
| Schema markup | Claude | Built-in |
| Content optimization | Claude | On request |
| Performance fixes | Claude | As needed |
| Keyword research | Claude | On request |

## Target Keywords

### Primary Keywords
- DFI financial modeling
- Investment-grade financial models
- IFC funding application
- AfDB project finance
- Development finance institution consulting

### Secondary Keywords
- Agricultural finance models
- Infrastructure project finance
- Bankable feasibility study
- DFI compliance modeling
- Africa project finance

### Long-tail Keywords
- How to apply for IFC funding
- Financial model for AfDB application
- DFI-compliant feasibility study template
- Agricultural project finance Africa
- Infrastructure funding South Africa

---

# 2. One-Time Google Setup

## Step 1: Google Analytics 4 (10 minutes)

### Create Property

1. Go to: https://analytics.google.com
2. Click **Admin** (gear icon)
3. Click **Create Property**
4. Enter:
   - Property name: `JASPER Financial`
   - Reporting time zone: `South Africa`
   - Currency: `South African Rand (ZAR)`
5. Click **Next**
6. Select:
   - Industry: `Business & Industrial`
   - Business size: `Small`
7. Click **Create**

### Get Measurement ID

1. In the new property, go to **Data Streams**
2. Click **Add stream** → **Web**
3. Enter:
   - Website URL: `jasperfinance.org`
   - Stream name: `JASPER Website`
4. Click **Create stream**
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Give Claude the ID

```
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 2: Google Search Console (5 minutes)

### Verify Domain

1. Go to: https://search.google.com/search-console
2. Click **Add property**
3. Select **Domain** (not URL prefix)
4. Enter: `jasperfinance.org`
5. Click **Continue**

### DNS Verification

Google will show a TXT record like:
```
google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Option A: Claude adds via Hostinger MCP**
Tell me the verification code and I'll add the DNS record.

**Option B: Manual in Hostinger**
1. Go to hPanel → Domains → DNS Zone
2. Add TXT record:
   - Type: `TXT`
   - Name: `@`
   - Value: (paste Google's code)
   - TTL: `14400`

3. Return to Search Console and click **Verify**

### Submit Sitemap

Once verified:
1. Go to **Sitemaps** in Search Console
2. Enter: `sitemap.xml`
3. Click **Submit**

## Step 3: Google Business Profile (Optional - 15 minutes)

Only if you want local search visibility for "financial consultants near me" type queries.

1. Go to: https://business.google.com
2. Click **Manage now**
3. Enter business name: `JASPER Financial Architecture`
4. Select category: `Financial Consultant`
5. Add location or select "Online services"
6. Add contact info and verify

---

# 3. Google OAuth for Client Portal ⭐ NEW

This section covers setting up Google OAuth 2.0 authentication for the JASPER client portal, allowing clients to log in using their Google accounts.

## Why Google OAuth?

| Feature | Benefit |
|---------|----------|
| **No passwords to manage** | Clients use their existing Google account |
| **Enterprise-ready** | Works with Google Workspace domains |
| **FREE** | Millions of authentications at no cost |
| **Secure** | Google handles all security concerns |
| **Fast onboarding** | One-click login for clients |

## Step 1: Create Google Cloud Project (10 minutes)

### Create Project

1. Go to: https://console.cloud.google.com
2. Click **Select a project** → **New Project**
3. Enter:
   - Project name: `JASPER Client Portal`
   - Organization: (leave default or select your org)
4. Click **Create**
5. Wait for project creation, then select it

### Enable APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google+ API** (for profile info)
   - **Google People API** (alternative for profile)

## Step 2: Create OAuth Credentials (5 minutes)

### Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for all Google accounts)
3. Fill in:
   - App name: `JASPER Financial Architecture`
   - User support email: `models@jasperfinance.org`
   - Developer contact: your email
4. Click **Save and Continue**
5. Add scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
6. Click **Save and Continue**
7. Add test users (during development)
8. Click **Save and Continue**

### Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Enter:
   - Name: `JASPER Web Client`
   - Authorized JavaScript origins:
     - `https://jasper.kutlwano.co.za`
     - `http://localhost:8000` (for dev)
   - Authorized redirect URIs:
     - `https://jasper.kutlwano.co.za/auth/callback`
     - `http://localhost:8000/auth/callback` (for dev)
5. Click **Create**
6. **SAVE YOUR CREDENTIALS:**
   - Client ID: `xxxxxxxxxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxx`

## Step 3: Configure PHP Backend

Add to your `.env` file:

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://jasper.kutlwano.co.za/auth/callback
```

Install PHP library:

```bash
composer require league/oauth2-google
```

## Step 4: Test Authentication Flow

1. Visit: `https://jasper.kutlwano.co.za/login`
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. Redirected to dashboard with user info

## OAuth Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  JASPER Portal  │     │  Google OAuth   │     │   MySQL DB      │
│  (PHP Backend)  │     │  (Google Cloud) │     │  (Hostinger)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
        │                        │                        │
        │  1. User clicks        │                        │
        │     "Sign in"          │                        │
        ├───────────────────────┤                        │
        │  2. Redirect to Google │                        │
        │                        │                        │
        │                        │  3. User grants        │
        │                        │     permission         │
        │                        │                        │
        │  4. Callback with code │                        │
        ├───────────────────────┤                        │
        │                        │                        │
        │  5. Exchange code for  │                        │
        │     access token       │                        │
        ├───────────────────────┤                        │
        │                        │                        │
        │  6. Get user profile   │                        │
        ├───────────────────────┤                        │
        │                        │                        │
        │  7. Find/create user   │                        │
        ├───────────────────────┼───────────────────────┤
        │                        │                        │
        │  8. Create session     │                        │
        ├───────────────────────┤                        │
        │                        │                        │
        │  9. Redirect to        │                        │
        │     dashboard          │                        │
        │                        │                        │
```

## Security Considerations

| Concern | Solution |
|---------|----------|
| CSRF attacks | State parameter in OAuth flow |
| Token theft | HTTPS only, HTTP-only cookies |
| Session hijacking | Regenerate session on login |
| Unauthorized access | Middleware checks on all routes |

## Cost: FREE

Google OAuth 2.0 free tier includes:
- **Unlimited authentications** for web apps
- No credit card required
- Production-ready immediately

---

# 4. SEO Architecture

## File Structure

```
jasper-web/
├── public/
│   ├── robots.txt                 # Crawl directives
│   ├── sitemap.xml                # Dynamic sitemap
│   ├── sitemap-0.xml              # Generated pages
│   ├── favicon.ico                # 32x32 favicon
│   ├── favicon-16x16.png          # Small favicon
│   ├── favicon-32x32.png          # Standard favicon
│   ├── apple-touch-icon.png       # iOS icon (180x180)
│   ├── android-chrome-192x192.png # Android icon
│   ├── android-chrome-512x512.png # Android splash
│   ├── og-image.jpg               # Default social image (1200x630)
│   └── site.webmanifest           # PWA manifest
│
├── app/
│   ├── layout.tsx                 # Root layout with global meta
│   ├── page.tsx                   # Homepage
│   ├── about/
│   │   └── page.tsx               # About page
│   ├── services/
│   │   └── page.tsx               # Services page
│   ├── process/
│   │   └── page.tsx               # Our process
│   ├── sectors/
│   │   ├── page.tsx               # Sectors overview
│   │   ├── agribusiness/
│   │   │   └── page.tsx           # Agribusiness sector
│   │   ├── infrastructure/
│   │   │   └── page.tsx           # Infrastructure sector
│   │   └── manufacturing/
│   │       └── page.tsx           # Manufacturing sector
│   ├── resources/
│   │   ├── page.tsx               # Resources hub
│   │   └── [slug]/
│   │       └── page.tsx           # Individual articles
│   ├── contact/
│   │   └── page.tsx               # Contact form
│   └── intake/
│       └── page.tsx               # Full intake form
│
├── components/
│   └── seo/
│       ├── JsonLd.tsx             # Schema markup component
│       ├── BreadcrumbSchema.tsx   # Breadcrumb schema
│       └── FAQSchema.tsx          # FAQ schema
│
└── lib/
    └── seo/
        ├── metadata.ts            # Metadata generators
        └── schemas.ts             # JSON-LD generators
```

## URL Structure

| Page | URL | Priority |
|------|-----|----------|
| Homepage | `/` | 1.0 |
| Services | `/services` | 0.9 |
| About | `/about` | 0.8 |
| Process | `/process` | 0.8 |
| Sectors | `/sectors` | 0.8 |
| Agribusiness | `/sectors/agribusiness` | 0.7 |
| Infrastructure | `/sectors/infrastructure` | 0.7 |
| Manufacturing | `/sectors/manufacturing` | 0.7 |
| Resources | `/resources` | 0.7 |
| Blog Post | `/resources/[slug]` | 0.6 |
| Contact | `/contact` | 0.6 |
| Intake | `/intake` | 0.5 |

---

# 5. Technical Implementation

## Root Layout with Global Meta

```tsx
// app/layout.tsx
import { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata: Metadata = {
  metadataBase: new URL('https://jasperfinance.org'),
  title: {
    default: 'JASPER™ Financial Architecture | DFI Investment Models',
    template: '%s | JASPER Financial'
  },
  description: 'Investment-grade financial models for DFI funding applications. Specialists in IFC, AfDB, ADB, IDC, and Land Bank project finance across Africa.',
  keywords: [
    'DFI financial modeling',
    'IFC funding application',
    'AfDB project finance',
    'investment-grade financial model',
    'development finance institution',
    'agricultural finance Africa',
    'infrastructure project finance'
  ],
  authors: [{ name: 'JASPER Financial Architecture' }],
  creator: 'JASPER Financial Architecture',
  publisher: 'JASPER Financial Architecture',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://jasperfinance.org',
    siteName: 'JASPER Financial Architecture',
    title: 'JASPER™ Financial Architecture | DFI Investment Models',
    description: 'Investment-grade financial models for DFI funding applications. IFC, AfDB, ADB, IDC specialists.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JASPER Financial Architecture'
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'JASPER™ Financial Architecture',
    description: 'Investment-grade financial models for DFI funding applications.',
    images: ['/og-image.jpg']
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  
  // Verification
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE'
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' }
    ]
  },
  
  // Alternate languages (future)
  alternates: {
    canonical: 'https://jasperfinance.org'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

## Page-Specific Metadata

```tsx
// app/services/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DFI Financial Modeling Services',
  description: 'Professional financial modeling services for IFC, AfDB, ADB, IDC, and Land Bank funding applications. Investment-grade models that get approved.',
  openGraph: {
    title: 'DFI Financial Modeling Services | JASPER Financial',
    description: 'Professional financial modeling services for DFI funding applications.',
    url: 'https://jasperfinance.org/services'
  },
  alternates: {
    canonical: 'https://jasperfinance.org/services'
  }
}

export default function ServicesPage() {
  return (
    // Page content
  )
}
```

## JSON-LD Schema Components

```tsx
// components/seo/JsonLd.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'JASPER Financial Architecture',
    description: 'Investment-grade financial modeling for DFI funding applications',
    url: 'https://jasperfinance.org',
    logo: 'https://jasperfinance.org/logo.png',
    image: 'https://jasperfinance.org/og-image.jpg',
    telephone: '+27-XX-XXX-XXXX',
    email: 'models@jasperfinance.org',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bela Bela',
      addressRegion: 'Limpopo',
      addressCountry: 'ZA'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -24.8849,
      longitude: 28.2930
    },
    areaServed: [
      { '@type': 'Continent', name: 'Africa' },
      { '@type': 'Country', name: 'South Africa' }
    ],
    serviceType: [
      'Financial Modeling',
      'DFI Funding Applications',
      'Investment Banking',
      'Project Finance'
    ],
    priceRange: '$$$',
    openingHours: 'Mo-Fr 08:00-17:00',
    sameAs: [
      'https://www.linkedin.com/company/jasper-financial'
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ServiceSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Financial Modeling',
    provider: {
      '@type': 'ProfessionalService',
      name: 'JASPER Financial Architecture'
    },
    areaServed: {
      '@type': 'Continent',
      name: 'Africa'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'DFI Financial Modeling Packages',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Growth Package',
            description: 'For projects $5M-$25M seeking DFI funding'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Institutional Package',
            description: 'For projects $25M-$100M with complex structures'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Infrastructure Package',
            description: 'For major infrastructure projects $100M+'
          }
        }
      ]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
  url
}: {
  title: string
  description: string
  datePublished: string
  dateModified: string
  author: string
  image: string
  url: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished,
    dateModified: dateModified,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'JASPER Financial Architecture',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jasperfinance.org/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

## robots.txt

```txt
# robots.txt for jasperfinance.org

User-agent: *
Allow: /

# Disallow admin/internal paths
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Sitemap
Sitemap: https://jasperfinance.org/sitemap.xml
```

## Sitemap Configuration

```js
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://jasperfinance.org',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/admin/*', '/intake/success'],
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/']
      }
    ]
  },
  transform: async (config, path) => {
    // Custom priority per page
    const priorities = {
      '/': 1.0,
      '/services': 0.9,
      '/about': 0.8,
      '/process': 0.8,
      '/sectors': 0.8,
      '/contact': 0.6
    }
    
    return {
      loc: path,
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: priorities[path] || 0.7,
      lastmod: new Date().toISOString()
    }
  }
}
```

## Site Manifest (PWA)

```json
// public/site.webmanifest
{
  "name": "JASPER Financial Architecture",
  "short_name": "JASPER",
  "description": "Investment-grade financial models for DFI funding",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a365d",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

# 6. Content Strategy

## Homepage SEO

### Title Tag (60 chars max)
```
JASPER™ Financial Architecture | DFI Investment Models
```

### Meta Description (155 chars max)
```
Investment-grade financial models for IFC, AfDB, ADB, IDC funding. 21+ years expertise in DFI-compliant project finance across Africa. Get funded.
```

### H1 (One per page)
```
Investment-Grade Financial Models for DFI Funding
```

### Key Content Sections
1. Hero with primary value proposition
2. Trusted by / DFI logos
3. Services overview
4. Sector expertise
5. Process overview
6. Testimonials / Case studies
7. CTA to contact

## Service Pages SEO

### Services Page
- **Title:** DFI Financial Modeling Services | JASPER Financial
- **Description:** Professional financial modeling for IFC, AfDB, ADB, IDC applications. Bankable feasibility studies that get approved.
- **H1:** DFI Financial Modeling Services

### Sector Pages

**Agribusiness:**
- **Title:** Agricultural Project Finance | JASPER Financial
- **Description:** Financial models for agricultural DFI funding. Irrigation, processing, value chains. IFC, Land Bank, IDC specialists.
- **H1:** Agricultural Project Finance & DFI Funding

**Infrastructure:**
- **Title:** Infrastructure Project Finance | JASPER Financial
- **Description:** Financial models for infrastructure DFI funding. Energy, transport, water. IFC, AfDB, ADB specialists.
- **H1:** Infrastructure Project Finance & DFI Funding

**Manufacturing:**
- **Title:** Manufacturing Project Finance | JASPER Financial
- **Description:** Financial models for manufacturing DFI funding. Industrial, processing, technology. IDC, IFC specialists.
- **H1:** Manufacturing Project Finance & DFI Funding

## Blog/Resources Strategy

### Content Pillars

1. **DFI Application Guides**
   - How to apply for IFC funding
   - AfDB application process explained
   - IDC funding requirements

2. **Financial Modeling Insights**
   - What makes a bankable financial model
   - Common financial model mistakes
   - DFI compliance checklist

3. **Sector Deep Dives**
   - Agricultural finance trends Africa
   - Renewable energy project finance
   - Infrastructure funding landscape

4. **Case Studies**
   - Successful DFI applications
   - Model transformation stories

### Publishing Schedule
- 2 articles/month minimum
- 1 sector deep dive/quarter
- 1 case study/quarter

---

# 7. Performance Optimization

## Core Web Vitals Targets

| Metric | Target | Impact |
|--------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Ranking factor |
| **FID** (First Input Delay) | < 100ms | Ranking factor |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Ranking factor |
| **TTFB** (Time to First Byte) | < 600ms | User experience |

## Vercel Optimizations

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: ['jasperfinance.org'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      // www to non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.jasperfinance.org' }],
        destination: 'https://jasperfinance.org/:path*',
        permanent: true
      },
      // Old URLs (add as needed)
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true
      // }
    ]
  }
}

module.exports = nextConfig
```

## Image Optimization

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image'

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className
}: {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD..."
      className={className}
    />
  )
}
```

## Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true
})

// Or for Century Gothic (your brand font)
import localFont from 'next/font/local'

const centuryGothic = localFont({
  src: [
    {
      path: '../public/fonts/CenturyGothic.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../public/fonts/CenturyGothic-Bold.woff2',
      weight: '700',
      style: 'normal'
    }
  ],
  display: 'swap',
  variable: '--font-century-gothic'
})
```

---

# 8. Monitoring & Maintenance

## Weekly SEO Checklist

| Task | Tool | Action |
|------|------|--------|
| Check crawl errors | Search Console | Fix any 404s |
| Review Core Web Vitals | Search Console | Address issues |
| Monitor rankings | Search Console | Track keywords |
| Check analytics | GA4 | Review traffic |

## Monthly SEO Tasks

| Task | Description |
|------|-------------|
| Content audit | Review/update existing pages |
| New content | Publish 2+ blog posts |
| Backlink check | Monitor new links |
| Competitor analysis | Track competitor changes |
| Technical audit | Check for issues |

## Google Search Console Alerts

Set up email alerts for:
- Crawl errors
- Security issues
- Manual actions
- Core Web Vitals issues

## Key Metrics to Track

### Search Console
- Total clicks
- Total impressions
- Average CTR
- Average position
- Top queries
- Top pages

### Google Analytics
- Users (new vs returning)
- Sessions
- Bounce rate
- Time on site
- Conversions (contact form, intake form)
- Traffic sources

## SEO Maintenance via Claude

When you want SEO updates, just ask:

```
"Update the meta description for the services page"
"Add schema markup for a new case study"
"Check why traffic dropped this week"
"Generate new blog post about IFC applications"
"Optimize the homepage for 'agricultural project finance'"
```

---

# Quick Reference

## Files to Create

| File | Purpose |
|------|---------|
| `public/robots.txt` | Crawl rules |
| `public/sitemap.xml` | Auto-generated |
| `public/site.webmanifest` | PWA manifest |
| `public/og-image.jpg` | Social sharing image (1200x630) |
| `public/favicon.ico` | Browser favicon |
| `next-sitemap.config.js` | Sitemap generator |

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://jasperfinance.org
GOOGLE_SITE_VERIFICATION=xxxxxxxxxxxxx
```

## NPM Packages

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@next/third-parties": "^14.0.0"
  },
  "devDependencies": {
    "next-sitemap": "^4.2.0"
  }
}
```

## Build Commands

```bash
# Generate sitemap after build
npm run build
npm run postbuild  # runs next-sitemap
```

---

# Summary

## What You Do (Once)

1. ✅ Create Google Analytics 4 property → Get `G-XXXXXXXXXX`
2. ✅ Verify domain in Search Console → Add DNS TXT record
3. ✅ Submit sitemap in Search Console

## What's Built Into Code

- ✅ All meta tags (title, description, OG, Twitter)
- ✅ JSON-LD schema markup
- ✅ Sitemap generation
- ✅ robots.txt
- ✅ Image optimization
- ✅ Performance optimization
- ✅ Core Web Vitals compliance

## Ongoing (Claude Handles)

- Content optimization
- New blog posts with SEO
- Schema updates
- Technical fixes
- Performance monitoring

---

*JASPER™ Financial Architecture*
*SEO & Google Integration Guide v1.0*
*December 2025*
