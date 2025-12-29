# MarketingHeader Rebuild Plan

**Created:** December 29, 2025
**Purpose:** Rebuild the marketing navigation header for portal public pages

---

## What We're Rebuilding

The original header had:
1. **Floating platform with animated button** - START PROJECT button on a floating element with smooth animation
2. **Logo** - JASPER icon + wordmark
3. **Navigation dropdowns**:
   - Services (Growth, Institutional, Infrastructure, Strategic)
   - Methodology (link)
   - Sectors (link)
   - Process (link)
   - Resources (Insights, Contact dropdown)
4. **Search button** - Opens Cmd+K modal for article search
5. **START PROJECT CTA** - Prominent button with animation

---

## Architecture Decision

**Approach:** Add MarketingHeader to the Portal (Next.js) public pages, then configure nginx to proxy `/insights` from jasperfinance.org to the portal.

**Why this approach:**
- Portal already has working insights page with featured section, dynamic articles, search
- Portal uses Next.js (better for SEO, SSR)
- Single source of truth for blog/insights content
- Less code duplication

**Flow:**
```
jasperfinance.org/insights → nginx proxy → portal.jasperfinance.org/insights
                                            (with MarketingHeader)
```

---

## Component Structure

```
jasper-portal-frontend/src/components/marketing/
├── MarketingHeader.tsx      # Main header component
├── NavDropdown.tsx          # Reusable dropdown component
├── SearchButton.tsx         # Cmd+K search trigger
└── AnimatedButton.tsx       # Floating animated CTA
```

---

## MarketingHeader Features

### 1. Logo Section
- JASPER icon (gradient emerald)
- "JASPER" text + "FINANCIAL ARCHITECTURE" tagline
- Links to jasperfinance.org

### 2. Navigation Items
```tsx
const navItems = [
  {
    label: 'Services',
    dropdown: [
      { label: 'Growth Stage', href: '/sectors/growth', desc: 'Series A-C funding models' },
      { label: 'Institutional', href: '/sectors/institutional', desc: 'DFI & sovereign wealth' },
      { label: 'Infrastructure', href: '/sectors/infrastructure', desc: 'PPP & project finance' },
      { label: 'Strategic', href: '/sectors/strategic', desc: 'M&A and restructuring' },
    ]
  },
  { label: 'Methodology', href: '/process' },
  { label: 'Sectors', href: '/sectors' },
  { label: 'Process', href: '/process' },
  {
    label: 'Resources',
    dropdown: [
      { label: 'Insights', href: '/insights', desc: 'DFI funding intelligence' },
      { label: 'Contact', href: '/contact', desc: 'Get in touch' },
    ]
  },
]
```

### 3. Search Button
- Icon + "Search" text
- Shows keyboard shortcut badge (⌘K / Ctrl+K)
- Opens SiteSearch modal on click or keyboard shortcut

### 4. START PROJECT Button
- Floating platform effect with shadow
- Hover animation (subtle lift/glow)
- Emerald gradient background
- Links to /intake form

---

## Animation Specifications

### Floating Button Animation
```css
/* Initial state */
.floating-button {
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 10px 25px -5px rgba(16, 185, 129, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover state */
.floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.1),
              0 4px 6px -1px rgba(0, 0, 0, 0.06),
              0 15px 35px -5px rgba(16, 185, 129, 0.3);
}
```

### Dropdown Animation
```css
/* Dropdown entrance */
.dropdown-menu {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.2s ease-out;
}

.dropdown-menu.open {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

---

## Files to Modify

1. **Create:** `jasper-portal-frontend/src/components/marketing/MarketingHeader.tsx`
2. **Create:** `jasper-portal-frontend/src/components/marketing/SiteSearch.tsx` (port from jasper-marketing)
3. **Update:** `jasper-portal-frontend/src/app/(public)/insights/page.tsx`
4. **Update:** `jasper-portal-frontend/src/app/(public)/insights/[slug]/page.tsx`
5. **Update:** VPS nginx config for `/insights` proxy

---

## Testing Checklist

- [ ] Header displays correctly on desktop (1440px+)
- [ ] Header is responsive on mobile (hamburger menu)
- [ ] Services dropdown opens/closes smoothly
- [ ] Resources dropdown opens/closes smoothly
- [ ] Search button opens Cmd+K modal
- [ ] Search results display correctly
- [ ] START PROJECT button has floating animation
- [ ] Links navigate correctly (to jasperfinance.org pages)
- [ ] Insights link stays on portal (current page highlight)
- [ ] jasperfinance.org/insights proxies correctly

---

## Deployment Steps

1. Build portal locally: `npm run build`
2. Test locally with `npm run dev`
3. Deploy to VPS:
   ```bash
   rsync -avz --delete .next/ root@72.61.201.237:/opt/jasper-portal-standalone/.next/
   ssh root@72.61.201.237 'pm2 restart jasper-portal'
   ```
4. Update nginx config to proxy `/insights`
5. Test live site
6. Commit and push all changes

---

## Recovery Notes

**This plan is committed to git** - if work is lost again, this document serves as the specification.

**Key commits to reference:**
- `b2c845cda` - CRM content enhancement system (Dec 29, 2025)
- Future: MarketingHeader rebuild commit

---

*Last Updated: December 29, 2025*
