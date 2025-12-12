# JASPER CRM + ALEPH AI Architecture Plan

## Overview

An AI-native CRM that uses **local self-hosted models** for speed/privacy and **cloud models** for complex reasoning. Every interaction is embedded and searchable semantically.

---

## 1. Model Routing Strategy

### Local Models (Self-Hosted on VPS - FREE, Fast)

| Model | Size | Task | Latency | Use Case |
|-------|------|------|---------|----------|
| **GTE-Large** | ~400MB | Embeddings | 50-100ms | All semantic search, lead scoring, similarity |
| **SmolDocling** | 256MB | Document OCR | 350ms/page | Extract text from PDFs, invoices, financials |
| **SmolVLM** | 500MB | Vision | 200ms | Analyze images, design assets, receipts |
| **Moondream** | 2GB | Detection | 500ms | Object detection, counting (on-demand) |

### Cloud Models (OpenRouter - Pay per token)

| Model | Cost | Task | Use Case |
|-------|------|------|----------|
| **Gemini Flash** | FREE | Classification | Lead scoring, email sorting, spam detection |
| **DeepSeek V3** | $0.14/M in | Long-form | Proposals, reports, document analysis |
| **Grok Mini** | $0.30/M in | Code/Drafts | Email drafting, client responses |

### Routing Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                      CRM AI REQUEST                             │
├─────────────────────────────────────────────────────────────────┤
│                              │                                  │
│      ┌───────────────────────┴───────────────────────┐          │
│      │         Is this an embedding/search?          │          │
│      └───────────────────────┬───────────────────────┘          │
│               YES            │            NO                     │
│                ↓             │             ↓                     │
│         ┌─────────┐          │      ┌──────────────┐            │
│         │GTE-Large│          │      │Is it vision? │            │
│         │ (LOCAL) │          │      └──────┬───────┘            │
│         └─────────┘          │      YES    │    NO              │
│                              │       ↓     │     ↓              │
│                              │  SmolDocling│  Cloud Model       │
│                              │  or SmolVLM │  Selection:        │
│                              │   (LOCAL)   │                    │
│                              │             │  Simple → Gemini   │
│                              │             │  Draft → Grok      │
│                              │             │  Complex → DeepSeek│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CRM Vector Collections

Add these to ALEPH AI Milvus:

```python
CRM_COLLECTIONS = {
    # Contact Intelligence
    "crm_contacts": {
        "description": "Contact profiles + interaction summaries",
        "dimension": 1024,  # GTE-Large
        "business": "jasper",
        "fields": ["contact_id", "name", "company", "context_summary"]
    },

    # Email Intelligence
    "crm_emails": {
        "description": "All email content embedded for semantic search",
        "dimension": 1024,
        "business": "jasper",
        "fields": ["contact_id", "direction", "subject", "sentiment", "date"]
    },

    # Document Intelligence
    "crm_documents": {
        "description": "Client documents (financials, proposals, MOUs)",
        "dimension": 1024,
        "business": "jasper",
        "fields": ["contact_id", "document_type", "analysis_json"]
    },

    # Deal Intelligence
    "crm_deals": {
        "description": "Deal profiles for win/loss pattern matching",
        "dimension": 1024,
        "business": "jasper",
        "fields": ["deal_id", "status", "value", "industry", "outcome_reason"]
    },

    # Meeting Notes
    "crm_meetings": {
        "description": "Meeting transcripts and notes",
        "dimension": 1024,
        "business": "jasper",
        "fields": ["contact_id", "date", "attendees", "action_items"]
    }
}
```

---

## 3. CRM AI Endpoints

### 3.1 Semantic Contact Search
```
POST /v1/crm/contacts/search
{
    "query": "agricultural investors interested in East Africa",
    "limit": 10
}

Response:
{
    "contacts": [
        {
            "contact_id": "cnt_abc123",
            "name": "John Okafor",
            "company": "AgriVest Nigeria",
            "relevance": 0.89,
            "matched_context": "Discussed renewable energy projects in Kenya..."
        }
    ]
}
```

### 3.2 Intelligent Lead Scoring
```
POST /v1/crm/leads/score
{
    "lead": {
        "company": "FarmTech Ghana",
        "industry": "Agricultural Processing",
        "project_description": "Cold storage facility with solar power",
        "budget_range": "R2-5M",
        "timeline": "Q2 2025"
    }
}

Response:
{
    "score": 78,
    "win_probability": 0.78,
    "similar_won_deals": ["Mokwena Agri", "GreenGrow Zambia"],
    "reasoning": "Matches 3 won deals in agricultural processing...",
    "recommended_package": "Professional ($85K-150K)",
    "suggested_dfis": ["AfDB AFAWA", "IFC"]
}
```

### 3.3 Email Intelligence
```
POST /v1/crm/emails/context
{
    "contact_id": "cnt_abc123",
    "new_situation": "Follow up on board meeting about DFI options"
}

Response:
{
    "summary": "Last contact 3 weeks ago about solar cold storage...",
    "key_points": ["He prefers detailed technical info", "Board meeting was Nov 15"],
    "tone_recommendation": "Formal but warm",
    "last_contact_date": "2025-11-20"
}

POST /v1/crm/emails/draft
{
    "contact_id": "cnt_abc123",
    "purpose": "Follow up on board meeting",
    "key_points": ["Share DFI matches", "Propose next steps"]
}

Response:
{
    "draft": "Dear John,\n\nI hope your board meeting went well...",
    "model_used": "grok-code",
    "tokens": {"input": 450, "output": 120}
}
```

### 3.4 Document Analysis
```
POST /v1/crm/documents/analyze
{
    "document": "<base64_pdf>",
    "contact_id": "cnt_abc123",
    "document_type": "financial_statement"
}

Response:
{
    "document_id": "doc_xyz789",
    "extracted_text_preview": "Annual Financial Statements 2024...",
    "analysis": {
        "revenue_trend": "Growing 23% YoY",
        "financial_health": "Strong liquidity",
        "red_flags": ["High customer concentration"],
        "strengths": ["Proven track record"],
        "recommended_package": "Professional",
        "suggested_dfis": ["AfDB AFAWA", "IFC", "Norfund"]
    },
    "tables_extracted": 5,
    "processing_time_ms": 2340
}
```

### 3.5 Meeting Preparation
```
POST /v1/crm/meetings/prepare
{
    "contact_id": "cnt_abc123",
    "meeting_purpose": "DFI Matching Results Presentation"
}

Response:
{
    "brief": {
        "executive_summary": "John is CEO of AgriTech Ltd...",
        "relationship_timeline": [...],
        "their_priorities": [...],
        "open_items": [...],
        "discussion_points": [...],
        "potential_objections": [...]
    },
    "quick_stats": {
        "total_interactions": 7,
        "relationship_age_days": 120,
        "deal_value": 150000
    }
}
```

---

## 4. Cost Projections

### Per Lead Processing Cost
| Step | Model | Cost |
|------|-------|------|
| Embed lead profile | GTE-Large (local) | R0 |
| Search similar deals | Milvus (local) | R0 |
| Score reasoning | Gemini Flash | R0 (FREE) |
| Email draft | Grok Mini | ~R0.50 |
| **Total per lead** | | **~R0.50-R2** |

### Monthly Estimates (50 leads/month)
| Activity | Estimated Cost |
|----------|----------------|
| Lead scoring | R0 (Gemini FREE) |
| Email drafts | R25-50 |
| Document analysis | R50-100 |
| Meeting prep | R25-50 |
| **Monthly Total** | **R100-200 (~$5-10)** |

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add CRM collections to Milvus
- [ ] Create `/v1/crm/` route prefix
- [ ] Implement semantic contact search
- [ ] Test embedding + search flow

### Phase 2: Intelligence (Week 2)
- [ ] Implement lead scoring endpoint
- [ ] Add email context retrieval
- [ ] Create email draft generation
- [ ] Build document analysis pipeline

### Phase 3: Integration (Week 3)
- [ ] Connect to JASPER Portal
- [ ] Auto-embed new contacts/emails
- [ ] Meeting prep automation
- [ ] Dashboard widgets

### Phase 4: Learning (Ongoing)
- [ ] Track win/loss patterns
- [ ] Improve scoring with feedback
- [ ] Expand DFI knowledge base
- [ ] Refine email style matching

---

## 6. Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         JASPER PORTAL                           │
│   [Contacts] [Deals] [Tasks] [Emails] [Documents] [AI Search]  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ALEPH AI GATEWAY                           │
│                    http://72.61.201.237:8000                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  New Contact Added ────→ GTE-Large ────→ crm_contacts          │
│  Email Sent/Received ──→ GTE-Large ────→ crm_emails            │
│  Document Uploaded ────→ SmolDocling ──→ GTE-Large → crm_documents│
│  Deal Created/Updated ─→ GTE-Large ────→ crm_deals             │
│                                                                 │
│  Semantic Search ──────→ GTE-Large + Milvus (all local)        │
│  Lead Score ───────────→ Milvus + Gemini (local + free cloud)  │
│  Email Draft ──────────→ Context + Grok ($0.30/M)              │
│  Doc Analysis ─────────→ SmolDocling + DeepSeek ($0.14/M)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Considerations

1. **API Key per Business**: CRM uses `jasper_api_key` for all requests
2. **Data Isolation**: CRM collections are JASPER-specific
3. **No PII in Cloud**: Personal data stays in Milvus, only context goes to cloud models
4. **Audit Log**: All AI requests logged with user, timestamp, model used

---

## 8. Next Steps

1. **Add CRM collections** to `/opt/aleph-ai/api/config/settings.py`
2. **Create CRM routes** at `/opt/aleph-ai/api/routes/crm.py`
3. **Update JASPER Portal** to call CRM AI endpoints
4. **Seed test data** for demo

Ready to implement?
