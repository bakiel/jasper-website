# JASPER Memory

**Shared Vector Memory Service for Kutlwano Holdings**

Self-hosted embedding and semantic search service that serves all apps:
- JASPER CRM
- JASPER Portal
- Aleph (future)
- Future applications

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    JASPER MEMORY SERVICE                         │
│                    http://72.61.201.237:8002                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ JASPER CRM  │    │   Portal    │    │    Aleph    │        │
│   │  (port 8001)│    │  (Vercel)   │    │  (future)   │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                    │
│                             ▼                                    │
│              ┌──────────────────────────────┐                   │
│              │     FastAPI Service          │                   │
│              │     - /embed                 │                   │
│              │     - /memory/insert         │                   │
│              │     - /memory/search         │                   │
│              │     - /jasper/match-dfi      │                   │
│              └──────────────┬───────────────┘                   │
│                             │                                    │
│          ┌──────────────────┼──────────────────┐                │
│          │                  │                  │                │
│          ▼                  ▼                  ▼                │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Embedding  │    │ Milvus Lite │    │ Collections │        │
│   │   Model     │    │  (Vectors)  │    │   (Data)    │        │
│   │ GTE-Qwen2   │    │             │    │             │        │
│   │   1.5B      │    │  - leads    │    │ - metadata  │        │
│   │             │    │  - projects │    │ - text      │        │
│   └─────────────┘    │  - dfis     │    │             │        │
│                      │  - templates│    │             │        │
│                      │  - content  │    │             │        │
│                      │  - aleph    │    │             │        │
│                      └─────────────┘    └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Collections

| Collection | Purpose | Apps |
|------------|---------|------|
| `jasper_leads` | CRM lead data for similarity matching | JASPER CRM |
| `jasper_projects` | Past projects for pricing reference | JASPER CRM, Portal |
| `jasper_dfis` | DFI requirements for matching | JASPER CRM |
| `jasper_templates` | Financial model components | JASPER CRM |
| `jasper_content` | Blog posts, documentation | Portal |
| `aleph_knowledge` | Knowledge base | Aleph |

## API Endpoints

### Embeddings

```bash
# Generate embedding
curl -X POST http://72.61.201.237:8002/embed \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"text": "Solar farm project in Northern Cape"}'

# Batch embeddings
curl -X POST http://72.61.201.237:8002/embed/batch \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Text 1", "Text 2", "Text 3"]}'
```

### Memory Operations

```bash
# Insert with auto-embedding
curl -X POST http://72.61.201.237:8002/memory/insert \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "jasper_leads",
    "id": "LEAD-001",
    "text": "AgTech company seeking R15M for processing facility",
    "metadata": {"sector": "agri", "amount": "15000000"}
  }'

# Semantic search
curl -X POST http://72.61.201.237:8002/memory/search \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "jasper_leads",
    "query": "agricultural processing investment",
    "limit": 5
  }'
```

### JASPER-Specific

```bash
# Match project to DFIs
curl -X POST "http://72.61.201.237:8002/jasper/match-dfi" \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -d "project_description=Solar farm in Limpopo&sector=renewable_energy&funding_amount=R50M"

# Find similar projects
curl -X POST "http://72.61.201.237:8002/jasper/similar-projects" \
  -H "X-API-Key: jcrm_sk_live_xxxxx" \
  -d "project_description=50MW solar installation with battery storage"
```

## Deployment

```bash
cd jasper-memory
chmod +x deploy.sh
./deploy.sh
```

## API Keys

| App | Key | Port |
|-----|-----|------|
| JASPER CRM | `jcrm_sk_live_k8x9m2n4p5q7r0s3t6u` | 8001 |
| JASPER Portal | `jportal_sk_live_a1b2c3d4e5f6g7h8i9j` | - |
| Aleph | `aleph_sk_live_z0y9x8w7v6u5t4s3r2q1` | - |

## Model Details

**GTE-Qwen2-1.5B-instruct**
- Dimensions: 1536
- Context: 32K tokens
- Self-hosted on VPS (zero API cost)
- ~3GB RAM when loaded

## Cost

| Component | Cost |
|-----------|------|
| Embedding | FREE (self-hosted) |
| Vector Storage | FREE (Milvus Lite) |
| VPS | Existing infrastructure |
| **Total** | **$0/month** |

---

*JASPER Financial Architecture - Kutlwano Holdings*
