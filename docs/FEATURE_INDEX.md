# JASPER Feature Index

**Purpose:** Master index of all feature documentation. READ THIS FIRST when restoring lost features.

**Baseline Commit:** `c20bc4585` (December 2025)

---

## Quick Links

| System | Documentation | Location |
|--------|---------------|----------|
| **Portal Frontend** | [FEATURES.md](../jasper-portal-frontend/FEATURES.md) | BlockNote editor, Images page, Content hub |
| **Content Pipeline** | [CONTENT_GENERATION_FEATURES.md](./CONTENT_GENERATION_FEATURES.md) | 4-stage article generation, AI images |
| **Content Enhancement** | [CONTENT_ENHANCEMENT_SYSTEM.md](./CONTENT_ENHANCEMENT_SYSTEM.md) | Citations, A/B titles, competitor analysis, search |
| **Model Allocation** | [MODEL_ALLOCATION_STRATEGY.md](./MODEL_ALLOCATION_STRATEGY.md) | Which AI models for which tasks |
| **Architecture** | [PURE_PYTHON_ARCHITECTURE_STRATEGY.md](./PURE_PYTHON_ARCHITECTURE_STRATEGY.md) | No n8n policy, Python-only automation |

---

## Critical Systems Overview

### 1. Content Generation Pipeline
**Backend:** `/opt/jasper-crm/services/content_pipeline_v2.py`

| Stage | Model | Purpose |
|-------|-------|---------|
| Research | Gemini 2.0 Flash + Google Search | Grounded facts |
| Draft | DeepSeek V3.2 | Cost-effective generation |
| Humanize | Gemini 3 Flash Preview | Remove AI-isms |
| SEO | Gemini 2.0 Flash | Keyword optimization |

**Cost:** ~$0.008 per article

### 2. Image Generation
**Backend:** `/opt/jasper-crm/services/ai_image_service.py`

| Component | Model | Purpose |
|-----------|-------|---------|
| Planning | Gemini 3 Flash Preview | Analyze content, plan images |
| Generation | Gemini 3 Pro Image (Nano Banana Pro) | 2K image generation |

**Cost:** ~$0.07-0.13 per image

### 3. Content Enhancement System
**Backend:** `/opt/jasper-crm/services/` (multiple services)

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Citation Service | `/api/v1/citations` | AI-powered source attribution |
| A/B Title Testing | `/api/v1/ab-titles` | Statistical title optimization |
| Competitor Analysis | `/api/v1/competitor` | Content gap identification |
| Site Search | `/api/v1/search` | Full-text article search |

**Frontend Components:**
- `EmailCapturePopup.tsx` - Scroll-triggered newsletter signup
- `SiteSearch.tsx` - Article search component

### 4. BlockNote Rich Text Editor
**Frontend:** `jasper-portal-frontend/src/components/content/`

| Component | Size | Purpose |
|-----------|------|---------|
| BlockNoteEditor.tsx | 29KB | Main editor |
| BlockEditor.tsx | 19KB | Editor wrapper |
| content-serializers.ts | 32KB | Markdown/HTML |

**Dependencies:** @blocknote/core, @blocknote/react, @blocknote/mantine, @mantine/core

---

## Restoration Quick Reference

### Frontend Editor Missing
```bash
cd jasper-portal-frontend
git checkout c20bc4585 -- src/components/content/ src/lib/content-serializers.ts src/lib/word-converter.ts src/lib/oembed-service.ts src/lib/blocknote-config.ts package.json
npm install --legacy-peer-deps
npm run build
```

### Backend Pipeline Missing
```bash
cd /opt/jasper-crm
git log --oneline services/content_pipeline_v2.py
git checkout <commit> -- services/content_pipeline_v2.py
systemctl restart jasper-crm
```

### VPS Deployment
```bash
# Frontend
rsync -avz --delete .next/ root@72.61.201.237:/opt/jasper-portal-standalone/.next/
ssh root@72.61.201.237 'pm2 restart jasper-portal'

# Backend
ssh root@72.61.201.237 'systemctl restart jasper-crm'
```

---

## Environment Variables Required

### Content Pipeline
```bash
DEEPSEEK_API_KEY=sk-xxx          # DeepSeek V3.2 for drafting
GOOGLE_API_KEY=xxx               # Gemini models + image generation
```

### VPS Services
| Service | Port | Manager |
|---------|------|---------|
| JASPER CRM | 8001 | systemd (jasper-crm) |
| JASPER Portal | 3002 | PM2 (jasper-portal) |
| JASPER Marketing | 3000 | PM2 (jasper-marketing) |

---

## Red Flags Checklist

| Symptom | Check | Solution |
|---------|-------|----------|
| Editor is plain textarea | BlockNote components | Restore from c20bc4585 |
| Articles have no facts | Research stage | Check GOOGLE_API_KEY |
| Articles sound robotic | Humanize stage | Check Gemini 3 Flash access |
| No images generated | Image service | Check ai_image_service.py |
| High API costs | Model routing | Check ai_router.py, disable R1 |

---

## Feature Documentation Locations

```
jasper-financial-architecture/
├── docs/
│   ├── FEATURE_INDEX.md              ← You are here
│   ├── CONTENT_GENERATION_FEATURES.md
│   ├── MODEL_ALLOCATION_STRATEGY.md
│   └── PURE_PYTHON_ARCHITECTURE_STRATEGY.md
├── jasper-portal-frontend/
│   └── FEATURES.md                   ← Frontend features
└── jasper-portal/
    └── [backend docs if any]
```

---

*Last Updated: 2025-12-29*
*Baseline: c20bc4585*
