# JASPER Site Architecture - CRITICAL REFERENCE

**Created:** December 29, 2025
**Purpose:** Prevent confusion between marketing site and portal

---

## Overview: TWO Separate Frontend Applications

### 1. Marketing Site (jasperfinance.org)
| Attribute | Value |
|-----------|-------|
| **URL** | https://jasperfinance.org |
| **Tech** | React + Vite (SPA) |
| **VPS Location** | `/root/jasper-marketing-site/dist/` |
| **PM2 Process** | `jasper-marketing` (port 3005) |
| **Local Source** | `/Users/mac/Downloads/jasper-financial-architecture/` (root) |
| **Has Blog?** | NO |
| **Has Search?** | NO |

**Pages:**
- Home (/)
- Sectors (/sectors, /sectors/:slug)
- Process (/process)
- Contact (/contact)
- FAQ (/faq)
- Terms (/terms)
- Login (/login) - redirects to portal
- Portal (/portal) - redirects to portal

**Purpose:** Lead generation, marketing copy, service descriptions

---

### 2. Portal (portal.jasperfinance.org)
| Attribute | Value |
|-----------|-------|
| **URL** | https://portal.jasperfinance.org |
| **Tech** | Next.js 14 |
| **VPS Location** | `/opt/jasper-portal-standalone/` |
| **PM2 Process** | `jasper-portal` (port 3002) |
| **Local Source** | `/Users/mac/Downloads/jasper-financial-architecture/jasper-portal-frontend/` |
| **Has Blog?** | YES (/insights) |
| **Has Search?** | YES (built into insights page) |

**Pages:**
- **Public (no auth):**
  - Insights/Blog (/insights) - HAS SEARCH
  - Article pages (/insights/:slug)
  - Intake form (/intake)

- **Authenticated:**
  - Dashboard (/)
  - Clients (/clients)
  - Projects (/projects)
  - Leads (/leads)
  - Content management (/content)
  - Command Center (/command-center)
  - Messages (/messages)
  - Settings (/settings)

**Purpose:** Client portal, blog/insights, CRM dashboard

---

## Key Insight: Where Blog/Search Lives

```
                   jasperfinance.org          portal.jasperfinance.org
                   ┌─────────────────┐        ┌─────────────────────────┐
                   │  MARKETING SITE │        │        PORTAL           │
                   │  (React/Vite)   │        │      (Next.js)          │
                   │                 │        │                         │
                   │  - Home         │        │  - /insights (BLOG)     │
                   │  - Sectors      │        │  - /insights/:slug      │
                   │  - Process      │        │  - Dashboard            │
                   │  - Contact      │        │  - CRM features         │
                   │  - FAQ          │        │                         │
                   │                 │        │  SEARCH IS HERE ────────┼─► Line 537
                   │  NO BLOG        │        │                         │
                   │  NO SEARCH      │        │                         │
                   └─────────────────┘        └─────────────────────────┘
```

---

## API Connection

The **Portal** connects to the CRM API:

```
portal.jasperfinance.org  ──────►  api.jasperfinance.org (port 8001)
                                        │
                                        ├── /api/v1/blog
                                        ├── /api/v1/content
                                        ├── /api/v1/leads
                                        ├── /api/v1/enhancement
                                        ├── /api/v1/supervisor
                                        └── /api/v1/news-config
```

The **Marketing Site** is static - no direct CRM connection.

---

## When to Modify Each Site

### Modify Marketing Site (/jasper-financial-architecture root) when:
- Changing homepage design
- Updating sector descriptions
- Changing contact form
- Updating pricing/services copy
- Changing navigation structure

### Modify Portal (/jasper-financial-architecture/jasper-portal-frontend) when:
- Adding blog features
- Adding search functionality
- Changing CRM dashboard
- Adding authentication features
- Modifying insights/articles display

---

## Deployment Commands

### Marketing Site
```bash
# Build locally
cd /Users/mac/Downloads/jasper-financial-architecture
npm run build

# Deploy to VPS
rsync -avz --delete dist/ root@72.61.201.237:/root/jasper-marketing-site/dist/

# Restart if needed (usually not needed - static files)
ssh root@72.61.201.237 'pm2 restart jasper-marketing'
```

### Portal
```bash
# Build locally
cd /Users/mac/Downloads/jasper-financial-architecture/jasper-portal-frontend
npm run build

# Deploy to VPS
rsync -avz --delete .next/ root@72.61.201.237:/opt/jasper-portal-standalone/.next/
rsync -avz package.json root@72.61.201.237:/opt/jasper-portal-standalone/

# Restart (required for Next.js)
ssh root@72.61.201.237 'pm2 restart jasper-portal'
```

---

## Common Mistakes to Avoid

1. **DON'T** add blog features to marketing site (wrong site)
2. **DON'T** add search to marketing site (portal already has it)
3. **DON'T** confuse the two `package.json` files
4. **DON'T** deploy portal builds to marketing site folder

---

*Last Updated: December 29, 2025*
