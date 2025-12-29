# JASPER Portal Frontend - Feature Documentation

**Purpose:** This document tracks ALL implemented features to help future Claude sessions restore them if lost. READ THIS BEFORE MODIFYING ANY COMPONENT.

**Baseline Commit:** `c20bc4585` (December 2025 - fully working state)

---

## Table of Contents
1. [BlockNote Rich Text Editor](#blocknote-rich-text-editor)
2. [Content Hub](#content-hub-content)
3. [Content Editor Page](#content-editor-page-contentslug)
4. [Images Page](#images-page-images)
5. [Required Dependencies](#required-dependencies)
6. [Restoration Commands](#restoration-commands)

---

## BlockNote Rich Text Editor

**CRITICAL:** This is a WordPress-style rich text editor. If it appears as a plain textarea or loses formatting features, the BlockNote components are missing.

### Required Components (ALL must exist)

| File | Location | Purpose |
|------|----------|---------|
| `BlockNoteEditor.tsx` | `src/components/content/` | Main rich text editor (29KB) |
| `BlockEditor.tsx` | `src/components/content/` | Editor wrapper component (19KB) |
| `BlockNoteErrorBoundary.tsx` | `src/components/content/` | Error handling for editor |
| `CustomBlocks.tsx` | `src/components/content/` | Custom block types |
| `CustomFilePanel.tsx` | `src/components/content/` | File upload panel |
| `EmbedBlock.tsx` | `src/components/content/` | Video/media embedding |
| `GalleryBlock.tsx` | `src/components/content/` | Image galleries |
| `ImagePickerBlock.tsx` | `src/components/content/` | Inline image insertion |
| `SEOHealthIndicator.tsx` | `src/components/content/` | SEO score display |
| `WordImporter.tsx` | `src/components/content/` | Word document import |

### Required Library Files

| File | Location | Purpose |
|------|----------|---------|
| `content-serializers.ts` | `src/lib/` | Markdown/HTML conversion (32KB) |
| `word-converter.ts` | `src/lib/` | Word doc processing |
| `oembed-service.ts` | `src/lib/` | Video embed resolution |
| `blocknote-config.ts` | `src/lib/` | Editor configuration |

### Editor Features Checklist

When editor is working correctly, these features MUST exist:

**Formatting Toolbar:**
- [ ] Bold, Italic, Underline, Strikethrough
- [ ] Headings (H1, H2, H3)
- [ ] Bullet lists and numbered lists
- [ ] Block quotes
- [ ] Code blocks
- [ ] Text alignment
- [ ] Links

**Block Types:**
- [ ] Paragraph blocks
- [ ] Image blocks with picker modal
- [ ] Gallery blocks (multiple images)
- [ ] Embed blocks (YouTube, Vimeo, etc.)
- [ ] Table blocks

**Advanced Features:**
- [ ] Slash command menu (type `/` to see options)
- [ ] Drag-and-drop block reordering
- [ ] Inline image insertion
- [ ] Word document import button
- [ ] Markdown view toggle
- [ ] SEO health indicator panel

### Required npm Dependencies

```json
{
  "@blocknote/core": "^0.45.0",
  "@blocknote/mantine": "^0.45.0",
  "@blocknote/react": "^0.45.0",
  "@mantine/core": "^7.17.0"
}
```

**If editor breaks, first check:** `package.json` has these dependencies.

---

## Content Hub (`/content`)

**Location:** `src/app/content/page.tsx`

### Table Features
1. Clickable column headers for sorting (Date, Category, Status, etc.)
2. Sort direction indicators (ChevronUp/ChevronDown icons)
3. Fullscreen mode (Maximize2 button in header)
4. ESC key to exit fullscreen
5. Date display with en-GB formatting (dd MMM yyyy)

### Article Row Features
- Status badges (Draft, Published, Scheduled)
- Category badges with colors
- Quick action buttons (Edit, View, Delete)
- Word count display
- SEO score indicator

### Filters & Search
- Category dropdown filter
- Status dropdown filter
- Search by title
- Date range filter

---

## Content Editor Page (`/content/[slug]`)

**Location:** `src/app/content/[slug]/page.tsx`

### Page Layout
- Left panel: BlockNote rich text editor (main content area)
- Right panel: Metadata sidebar

### Metadata Sidebar Features
- Title input field
- Slug input (auto-generated from title)
- Category dropdown
- Tags input (comma-separated)
- SEO Title input (max 60 chars)
- SEO Description textarea (max 155 chars)
- Excerpt textarea
- Featured image selector
- Author dropdown
- Publish date picker

### Action Buttons (Top Header)
- **Save Draft** - Saves without publishing
- **Publish** - Sets status to published
- **Unpublish** - Returns to draft status
- **Schedule** - Opens date picker for scheduled publishing
- **Preview** - Opens preview in new tab
- **Delete** - Deletes article (with confirmation)

### Status Indicators
- Draft badge (gray)
- Published badge (green)
- Scheduled badge (blue with date)

### Keyboard Shortcuts
- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + Shift + P` - Publish
- `ESC` - Exit without saving (with confirmation if changes)

---

## Images Page (`/images`)

**Location:** `src/app/images/page.tsx`
**Baseline Commit:** `c20bc4585`

### Full Preview Modal

**State Variables:**
- `showFullPreview` - Boolean to show/hide modal
- `previewImage` - Current image being previewed
- `copied` - Boolean for URL copy feedback

**Functions:**
- `openFullPreview(img)` - Opens the full preview modal
- `navigatePreview('next'|'prev')` - Navigate between images
- `copyToClipboard(text)` - Copy URL to clipboard

**Modal Features:**
1. Left/right navigation arrows
2. Keyboard navigation (←/→ arrows, ESC to close)
3. Side panel with:
   - Image filename and ID
   - Public URL with copy button
   - Metadata grid (source, category, dimensions, file size, format, created date)
   - Quality Score progress bar
   - Brand Alignment progress bar
   - AI Description
   - Dominant Colors (click to copy hex)
   - AI Tags
   - Used in Articles links
   - Attribution info
   - Generation prompt (for AI images)
4. Action buttons (Favorite, Download, Delete)
5. Image index indicator (X of Y)

### Grid View Features
- Hover shows fullscreen button (Maximize2 icon)
- Click on image opens detail panel
- Quality score badge
- Favorite star toggle
- "In Use" badge for images used in articles

### Detail Panel Features
- Click on image preview opens full preview modal
- All image metadata displayed
- AI evaluation details
- Action buttons row

---

## Required Dependencies

### package.json - Full dependency list for features

```json
{
  "dependencies": {
    "@blocknote/core": "^0.45.0",
    "@blocknote/mantine": "^0.45.0",
    "@blocknote/react": "^0.45.0",
    "@mantine/core": "^7.17.0",
    "@tanstack/react-query": "^5.90.12",
    "@types/dompurify": "^3.2.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "dompurify": "^3.3.1",
    "lucide-react": "^0.460.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "recharts": "^2.12.0",
    "tailwind-merge": "^2.5.0"
  }
}
```

---

## Restoration Commands

### Quick Restoration (All Editor Components)

```bash
# Navigate to frontend directory
cd jasper-portal-frontend

# Restore all BlockNote components from baseline
git checkout c20bc4585 -- \
  src/components/content/BlockEditor.tsx \
  src/components/content/BlockNoteEditor.tsx \
  src/components/content/BlockNoteErrorBoundary.tsx \
  src/components/content/CustomBlocks.tsx \
  src/components/content/CustomFilePanel.tsx \
  src/components/content/EmbedBlock.tsx \
  src/components/content/GalleryBlock.tsx \
  src/components/content/ImagePickerBlock.tsx \
  src/components/content/SEOHealthIndicator.tsx \
  src/components/content/WordImporter.tsx

# Restore library files
git checkout c20bc4585 -- \
  src/lib/content-serializers.ts \
  src/lib/word-converter.ts \
  src/lib/oembed-service.ts \
  src/lib/blocknote-config.ts

# Restore package.json (for dependencies)
git checkout c20bc4585 -- package.json

# Reinstall dependencies
npm install --legacy-peer-deps
```

### View File at Baseline

```bash
# View any file at baseline commit
git show c20bc4585:jasper-portal-frontend/src/components/content/BlockNoteEditor.tsx

# Compare current with baseline
git diff c20bc4585 -- src/components/content/BlockNoteEditor.tsx

# See what files changed since baseline
git diff c20bc4585 --name-only
```

### Check if Components Exist

```bash
# Quick check for all editor components
ls -la src/components/content/Block*.tsx
ls -la src/components/content/*Block.tsx
ls -la src/lib/content-serializers.ts
ls -la src/lib/word-converter.ts
```

### VPS Deployment After Restoration

```bash
# Build locally
npm run build

# Deploy to VPS
rsync -avz --delete .next/ root@72.61.201.237:/opt/jasper-portal-standalone/.next/
scp package.json root@72.61.201.237:/opt/jasper-portal-standalone/

# Install dependencies on VPS
ssh root@72.61.201.237 'cd /opt/jasper-portal-standalone && npm install --legacy-peer-deps'

# Restart service
ssh root@72.61.201.237 'pm2 restart jasper-portal'
```

---

## Feature Loss Prevention Checklist

Before making changes to any component, verify:

1. [ ] Read this FEATURES.md file
2. [ ] Check baseline commit for reference
3. [ ] Document any new features added
4. [ ] Test all existing features still work
5. [ ] Update this file with new features

### Red Flags That Features Are Missing

| Symptom | Likely Cause |
|---------|--------------|
| Editor is plain textarea | BlockNote components missing |
| No formatting toolbar | BlockNoteEditor.tsx missing |
| Can't insert images | ImagePickerBlock.tsx missing |
| Build fails with "Cannot find module '@/lib/word-converter'" | Library files missing |
| Build fails with "Cannot find module '@blocknote/react'" | npm dependencies missing |
| Images page has no preview modal | openFullPreview function missing |
| No draft/publish buttons | Editor page action buttons removed |

---

## Component Dependencies Map

```
BlockNoteEditor.tsx
├── @blocknote/react (npm)
├── @blocknote/mantine (npm)
├── @mantine/core (npm)
├── content-serializers.ts
├── blocknote-config.ts
├── CustomBlocks.tsx
│   ├── ImagePickerBlock.tsx
│   ├── GalleryBlock.tsx
│   └── EmbedBlock.tsx
├── CustomFilePanel.tsx
├── WordImporter.tsx
│   └── word-converter.ts
└── SEOHealthIndicator.tsx

content/[slug]/page.tsx
├── BlockNoteEditor.tsx (or BlockEditor.tsx)
├── API calls to /api/posts/[slug]
└── Status management (draft/published/scheduled)
```

---

*Last Updated: 2025-12-29*
*Baseline Commit: c20bc4585*
*Features Verified Working: Yes*
