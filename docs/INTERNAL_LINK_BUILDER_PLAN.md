# Content Enhancement System - Technical Plan

**Purpose:** Comprehensive system to improve SEO, credibility, and lead capture across all articles.

**Date:** 2025-12-29

---

## Overview

### Goals
1. **Internal Linking** - Connect related articles to each other
2. **External Linking** - Add links to authoritative sources
3. **Source Attribution** - Academic-style footnotes with citations
4. **Contact CTA** - Every article ends with call-to-action
5. **Email Capture** - Strategic popup for newsletter subscription
6. **A/B Title Testing** - Test headlines for better CTR
7. **Competitor Gap Analysis** - Find content opportunities
8. **Site Search** - Search across all articles (Frontend)

### Current State
- **30 articles** in blog_posts.json
- **10 categories** (some duplicates need normalization)
- **Tags available** for semantic matching
- **Average content length:** ~12,000 chars (~2,000 words)

---

## ⚠️ FEATURE PRESERVATION PROTOCOL

**CRITICAL:** Before ANY modification, verify existing features still work.

### Pre-Implementation Checklist
```bash
# 1. Document current state
ssh root@72.61.201.237 'cat /opt/jasper-crm/data/blog_posts.json | python3 -c "import json,sys; posts=json.load(sys.stdin); print(len(posts), \"articles\")"'

# 2. Backup current data
ssh root@72.61.201.237 'cp /opt/jasper-crm/data/blog_posts.json /opt/jasper-crm/data/blog_posts_backup_$(date +%Y%m%d).json'

# 3. Verify content pipeline works
ssh root@72.61.201.237 'curl -s http://localhost:8001/api/health'
```

### Post-Implementation Verification
- [ ] Content generation pipeline still works (4 stages)
- [ ] Image generation still works (Nano Banana Pro)
- [ ] BlockNote editor still works (all components)
- [ ] Existing articles unchanged (spot check 3 random)
- [ ] SEO scores preserved
- [ ] All API endpoints respond

### Rollback Plan
```bash
# If anything breaks:
ssh root@72.61.201.237 'cp /opt/jasper-crm/data/blog_posts_backup_YYYYMMDD.json /opt/jasper-crm/data/blog_posts.json'
ssh root@72.61.201.237 'systemctl restart jasper-crm'
```

---

## Architecture

### Service Locations
```
/opt/jasper-crm/services/
├── link_builder_service.py      # Internal/external linking
├── citation_service.py          # Footnotes and source attribution
├── ab_testing_service.py        # Title A/B testing
├── competitor_analysis_service.py # Content gap analysis
├── email_capture_service.py     # Subscription popup logic
└── search_service.py            # Article search indexing
```

### Frontend Components (Portal)
```
jasper-portal-frontend/src/components/
├── content/
│   ├── EmailCapturePopup.tsx    # Newsletter subscription
│   └── FootnoteRenderer.tsx     # Citation display
└── search/
    ├── SearchModal.tsx          # Site-wide search
    └── SearchResults.tsx        # Results display
```

### Marketing Site Components
```
jasper-marketing/src/components/
├── EmailCapturePopup.tsx        # Newsletter popup (shared)
├── ArticleFootnotes.tsx         # Citation rendering
└── SiteSearch.tsx               # Search interface
```

---

## Pipeline Stages

| Stage | Purpose | Model | Cost |
|-------|---------|-------|------|
| 1. Index | Build topic/keyword index | None (Python) | FREE |
| 2. Match | Find related articles | None (TF-IDF) | FREE |
| 3. Insert Internal Links | Add 3-5 internal links | DeepSeek Chat | ~$0.002 |
| 4. Find External Sources | Grounded source discovery | Gemini 2.0 Flash | ~$0.001 |
| 5. Insert External Links | Add 1-2 external links | DeepSeek Chat | ~$0.001 |
| 6. Generate Footnotes | Create academic citations | DeepSeek Chat | ~$0.001 |
| 7. Add CTA | Append contact call-to-action | Template | FREE |
| 8. Add Email Capture | Insert subscription trigger | Template | FREE |

**Total per article: ~$0.005**
**Total for 30 articles: ~$0.15**

---

## Stage 1: Article Indexing (FREE)

Build a searchable index of all articles without AI.

### Data Structure
```python
article_index = {
    "slug": {
        "title": str,
        "category": str,  # normalized
        "tags": List[str],
        "keywords": List[str],  # extracted from content
        "entities": List[str],  # DFI names, countries, sectors
        "claims": List[str],  # Factual claims needing citation
        "word_count": int,
        "existing_links": List[str],
        "existing_citations": List[str],
    }
}
```

### Keyword Extraction (No AI)
```python
from sklearn.feature_extraction.text import TfidfVectorizer

def extract_keywords(content: str, top_n: int = 20) -> List[str]:
    vectorizer = TfidfVectorizer(
        stop_words='english',
        max_features=top_n,
        ngram_range=(1, 2)
    )
    return top_keywords
```

### Entity Recognition (No AI)
```python
DFI_ENTITIES = [
    "IFC", "BII", "DFC", "Proparco", "DEG", "AfDB", "EIB",
    "World Bank", "African Development Bank", "FMO", "CDC",
    "OPIC", "MIGA", "IDC", "Land Bank"
]

COUNTRY_ENTITIES = [
    "South Africa", "Kenya", "Nigeria", "Ghana", "Ethiopia",
    "Tanzania", "Uganda", "Rwanda", "Mozambique", "Zambia"
]

SECTOR_ENTITIES = [
    "renewable energy", "solar", "wind", "agriculture",
    "infrastructure", "healthcare", "fintech", "housing"
]
```

---

## Stage 2: Relevance Matching (FREE)

Find related articles for internal linking.

### Matching Algorithm
```python
def find_related_articles(
    target_slug: str,
    article_index: dict,
    max_links: int = 5
) -> List[Tuple[str, float]]:
    target = article_index[target_slug]
    scores = {}

    for slug, article in article_index.items():
        if slug == target_slug:
            continue
        if slug in target["existing_links"]:
            continue

        score = 0.0

        # Same category = high relevance
        if normalize_category(article["category"]) == normalize_category(target["category"]):
            score += 3.0

        # Tag overlap
        common_tags = set(article["tags"]) & set(target["tags"])
        score += len(common_tags) * 1.5

        # Keyword overlap
        keyword_overlap = len(set(article["keywords"]) & set(target["keywords"]))
        score += keyword_overlap * 0.5

        # Entity overlap
        entity_overlap = len(set(article["entities"]) & set(target["entities"]))
        score += entity_overlap * 1.0

        scores[slug] = score

    sorted_scores = sorted(scores.items(), key=lambda x: -x[1])
    return sorted_scores[:max_links]
```

---

## Stage 3: Internal Link Insertion

### Model: DeepSeek Chat (Tier 3)
- **Cost:** $0.27/$0.40 per 1M tokens
- **Estimated per article:** ~$0.002

### Prompt Template
```python
INTERNAL_LINK_PROMPT = """
You are an SEO editor. Add internal links to this article naturally.

## Article Content
{content}

## Links to Add
{links_to_add}

## Rules
1. Insert each link ONCE only
2. Link on relevant anchor text (2-5 words)
3. Links must flow naturally
4. Do NOT add links in headings or first paragraph
5. Spread links throughout the article
6. Return FULL article with links as: [anchor text](/blog/slug)
"""
```

---

## Stage 4 & 5: External Link Discovery & Insertion

### Model: Gemini 2.0 Flash with Google Search Grounding
- **Cost:** FREE tier or ~$0.001

### Authoritative Source Domains

| Category | Preferred Domains |
|----------|-------------------|
| DFI Reports | ifc.org, bii.co.uk, dfc.gov, afdb.org |
| Data Sources | worldbank.org, imf.org, unctad.org |
| Industry | irena.org, fao.org |
| Standards | unpri.org, gri.org, sdgs.un.org |

### Blocked Domains
```python
BLOCKED_DOMAINS = [
    "medium.com", "linkedin.com/pulse",
    "wikipedia.org",  # Prefer primary sources
]
```

---

## Stage 6: Source Attribution (Footnotes)

### Overview
Academic-style inline citations that appear as superscript numbers, with full references at article end.

### Data Structure
```python
# In article JSON
{
    "content": "The IFC committed $71.7 billion in FY2025[^1], marking...",
    "footnotes": [
        {
            "id": 1,
            "claim": "IFC committed $71.7 billion in FY2025",
            "source_title": "IFC Annual Report 2025",
            "source_url": "https://www.ifc.org/annual-report-2025",
            "source_domain": "ifc.org",
            "access_date": "2025-12-29",
            "quote": "Total commitments reached $71.7 billion..."
        }
    ]
}
```

### Citation Format (Chicago-Style)
```markdown
## References

1. International Finance Corporation, "IFC Annual Report 2025,"
   accessed December 29, 2025, https://www.ifc.org/annual-report-2025.

2. British International Investment, "Climate Finance Strategy 2024-2030,"
   accessed December 29, 2025, https://www.bii.co.uk/climate-strategy.
```

### Footnote Detection Prompt
```python
FOOTNOTE_DETECTION_PROMPT = """
Identify factual claims in this article that should have citations.

## Article
{content}

## Find claims about:
- Specific dollar amounts or percentages
- DFI commitments or investments
- Market sizes or growth rates
- Policy statements or mandates
- Research findings or statistics

## Return format:
CLAIM: [exact text from article]
NEEDS_SOURCE: [yes/no]
SOURCE_TYPE: [DFI report / research paper / news / official policy]
"""
```

### Frontend Rendering
```tsx
// FootnoteRenderer.tsx
export function FootnoteRenderer({ footnotes }: { footnotes: Footnote[] }) {
  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-semibold mb-4">References</h2>
      <ol className="space-y-2 text-sm text-gray-600">
        {footnotes.map((fn) => (
          <li key={fn.id} id={`fn-${fn.id}`}>
            <sup>{fn.id}</sup>{' '}
            <a href={fn.source_url} target="_blank" rel="noopener"
               className="text-jasper-emerald hover:underline">
              {fn.source_title}
            </a>
            , accessed {fn.access_date}.
          </li>
        ))}
      </ol>
    </section>
  );
}
```

---

## Stage 7: Contact CTA

### Category-Specific CTAs
```python
CTA_VARIANTS = {
    "DFI Insights": """
---

## Need Help with DFI Applications?

Our team has direct experience structuring deals for IFC, BII, DFC, and other
development finance institutions. Let us help you present your project effectively.

**[Discuss Your Project →](/contact)**
""",

    "Climate Finance": """
---

## Structuring Climate-Aligned Investments?

We specialize in renewable energy, sustainable agriculture, and climate adaptation
financial models that meet DFI and green fund requirements.

**[Get Expert Support →](/contact)**
""",

    "Financial Modelling": """
---

## Need a Bankable Financial Model?

Our JASPER methodology creates investment-ready models that satisfy DFI due diligence
requirements. From assumptions to sensitivity analysis.

**[Request a Model Review →](/contact)**
""",

    "default": """
---

## Ready to Structure Your Investment?

JASPER Financial Architecture helps project developers and fund managers prepare
investment-grade financial models and documentation for DFI and impact investor funding.

**[Schedule a Consultation →](/contact)**
"""
}
```

---

## Stage 8: Email Capture Popup

### Strategy
Trigger a non-intrusive subscription popup when user has shown engagement.

### Trigger Conditions
```python
EMAIL_CAPTURE_TRIGGERS = {
    "scroll_depth": 0.6,      # 60% of article read
    "time_on_page": 45,       # 45 seconds minimum
    "returning_visitor": True, # Or second article view
    "exit_intent": True,       # Mouse moves toward close button
}
```

### Popup Content (Category-Aware)
```python
POPUP_VARIANTS = {
    "DFI Insights": {
        "headline": "Get DFI Funding Insights",
        "subhead": "Weekly analysis of IFC, BII, and AfDB investment trends.",
        "cta": "Subscribe Free"
    },
    "Climate Finance": {
        "headline": "Climate Finance Newsletter",
        "subhead": "Green funding opportunities and ESG compliance updates.",
        "cta": "Join 2,000+ Readers"
    },
    "default": {
        "headline": "JASPER Insights",
        "subhead": "Expert analysis on African project finance and DFI funding.",
        "cta": "Subscribe Free"
    }
}
```

### Frontend Component
```tsx
// EmailCapturePopup.tsx
interface EmailCaptureProps {
  category: string;
  articleSlug: string;
  onClose: () => void;
  onSubmit: (email: string, name: string) => void;
}

export function EmailCapturePopup({ category, articleSlug, onClose, onSubmit }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const variant = POPUP_VARIANTS[category] || POPUP_VARIANTS.default;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <>
            <h3 className="text-2xl font-bold text-jasper-navy mb-2">
              {variant.headline}
            </h3>
            <p className="text-gray-600 mb-6">{variant.subhead}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
              <button
                type="submit"
                className="w-full bg-jasper-emerald text-white py-3 rounded-lg font-semibold hover:bg-jasper-emerald-dark"
              >
                {variant.cta}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              No spam. Unsubscribe anytime.
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-jasper-emerald mx-auto mb-4" />
            <h3 className="text-xl font-bold">You're subscribed!</h3>
            <p className="text-gray-600">Check your email for confirmation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Backend API
```python
# /opt/jasper-crm/routes/email_capture.py

@router.post("/api/v1/subscribe")
async def subscribe(request: SubscribeRequest):
    """
    Capture email subscription from popup.
    """
    # Validate email
    if not is_valid_email(request.email):
        raise HTTPException(400, "Invalid email")

    # Check if already subscribed
    existing = await db.subscribers.find_one({"email": request.email})
    if existing:
        return {"status": "already_subscribed"}

    # Create subscriber
    subscriber = {
        "email": request.email,
        "name": request.name,
        "source_article": request.article_slug,
        "source_category": request.category,
        "subscribed_at": datetime.utcnow(),
        "status": "pending_confirmation",
        "ip_address": request.client.host,
    }

    await db.subscribers.insert_one(subscriber)

    # Send confirmation email (double opt-in)
    await email_service.send_confirmation(request.email, request.name)

    return {"status": "confirmation_sent"}
```

### Storage
```python
# In blog_posts.json or separate collection
{
    "email_capture": {
        "enabled": True,
        "trigger": "scroll_60",
        "variant": "dfi-insights",
        "position": "modal",  # or "inline", "slide-in"
    }
}
```

---

## A/B Title Testing

### Overview
Test multiple headlines for each article to optimize click-through rates.

### Data Structure
```python
# In article JSON
{
    "title": "How Blended Finance Unlocks Climate Adaptation",  # Current winner
    "title_variants": [
        {
            "id": "a",
            "title": "How Blended Finance Unlocks Climate Adaptation",
            "impressions": 1250,
            "clicks": 87,
            "ctr": 0.0696,
            "status": "winner"
        },
        {
            "id": "b",
            "title": "Blended Finance: The Key to Climate Adaptation in Africa",
            "impressions": 1180,
            "clicks": 71,
            "ctr": 0.0602,
            "status": "challenger"
        },
        {
            "id": "c",
            "title": "Why DFIs Are Betting Big on Blended Climate Finance",
            "impressions": 1200,
            "clicks": 96,
            "ctr": 0.0800,
            "status": "testing"
        }
    ],
    "ab_test": {
        "active": True,
        "started_at": "2025-12-01",
        "min_impressions": 1000,
        "confidence_threshold": 0.95,
        "auto_winner": True
    }
}
```

### Title Variant Generation
```python
TITLE_GENERATION_PROMPT = """
Generate 3 title variants for this article. The original title is:
"{original_title}"

Category: {category}
Target audience: DFI deal teams, impact investors, project developers

## Variant styles:
1. Question-based: Start with "Why", "How", "What"
2. Number-based: "5 Ways...", "The 3 Key..."
3. Bold claim: Make a strong statement

## Rules:
- Max 60 characters each
- Include main keyword
- No clickbait or exaggeration
- Professional tone

## Return format:
VARIANT_A: [title]
VARIANT_B: [title]
VARIANT_C: [title]
"""
```

### Traffic Splitting Logic
```python
def get_title_for_visitor(article: dict, visitor_id: str) -> str:
    """
    Deterministic title selection based on visitor ID.
    Ensures same visitor always sees same title.
    """
    if not article.get("ab_test", {}).get("active"):
        return article["title"]

    variants = article.get("title_variants", [])
    active_variants = [v for v in variants if v["status"] in ("winner", "testing")]

    if not active_variants:
        return article["title"]

    # Deterministic hash for consistent experience
    hash_input = f"{article['slug']}:{visitor_id}"
    variant_index = int(hashlib.md5(hash_input.encode()).hexdigest(), 16) % len(active_variants)

    return active_variants[variant_index]["title"]
```

### Statistical Significance
```python
from scipy import stats

def check_winner(variants: List[dict], confidence: float = 0.95) -> Optional[str]:
    """
    Check if any variant is statistically significant winner.
    Uses chi-square test for independence.
    """
    if len(variants) < 2:
        return None

    # Need minimum impressions
    if any(v["impressions"] < 1000 for v in variants):
        return None

    # Build contingency table
    observed = [
        [v["clicks"], v["impressions"] - v["clicks"]]
        for v in variants
    ]

    chi2, p_value, _, _ = stats.chi2_contingency(observed)

    if p_value < (1 - confidence):
        # Significant difference - find winner
        best = max(variants, key=lambda v: v["ctr"])
        return best["id"]

    return None  # No significant winner yet
```

### API Endpoints
```python
@router.post("/api/v1/ab/impression")
async def record_impression(slug: str, variant_id: str, visitor_id: str):
    """Record title impression"""
    pass

@router.post("/api/v1/ab/click")
async def record_click(slug: str, variant_id: str, visitor_id: str):
    """Record title click"""
    pass

@router.get("/api/v1/ab/results/{slug}")
async def get_results(slug: str):
    """Get A/B test results for article"""
    pass

@router.post("/api/v1/ab/declare-winner/{slug}")
async def declare_winner(slug: str, variant_id: str):
    """Manually declare winner"""
    pass
```

---

## Competitor Content Gap Analysis

### Overview
Identify topics competitors cover that JASPER doesn't, finding content opportunities.

### Competitor List
```python
COMPETITORS = [
    {
        "name": "Africa Finance Corporation",
        "blog_url": "https://www.africafc.org/news",
        "focus": "Infrastructure finance"
    },
    {
        "name": "Convergence",
        "blog_url": "https://www.convergence.finance/news-and-views",
        "focus": "Blended finance"
    },
    {
        "name": "AVCA",
        "blog_url": "https://www.avca-africa.org/newsroom",
        "focus": "Private equity Africa"
    },
    {
        "name": "Mo Ibrahim Foundation",
        "blog_url": "https://mo.ibrahim.foundation/news",
        "focus": "African governance, development"
    }
]
```

### Gap Analysis Process
```python
class CompetitorAnalysisService:

    async def fetch_competitor_topics(self, competitor: dict) -> List[str]:
        """
        Scrape competitor blog for recent topics.
        Uses Gemini with grounding for ethical scraping.
        """
        prompt = f"""
        Visit {competitor['blog_url']} and list the main topics
        covered in their last 20 articles.

        Return as:
        TOPIC: [topic name]
        KEYWORDS: [key terms]
        """
        # Use Gemini grounding
        pass

    def find_gaps(
        self,
        competitor_topics: List[str],
        our_topics: List[str]
    ) -> List[dict]:
        """
        Find topics competitors cover that we don't.
        """
        our_keywords = set()
        for topic in our_topics:
            our_keywords.update(extract_keywords(topic))

        gaps = []
        for topic in competitor_topics:
            topic_keywords = set(extract_keywords(topic))
            overlap = len(topic_keywords & our_keywords) / len(topic_keywords)

            if overlap < 0.3:  # Less than 30% overlap = gap
                gaps.append({
                    "topic": topic,
                    "keywords": list(topic_keywords),
                    "overlap_score": overlap,
                    "opportunity_score": 1 - overlap
                })

        return sorted(gaps, key=lambda x: -x["opportunity_score"])

    async def generate_content_ideas(self, gaps: List[dict]) -> List[dict]:
        """
        Turn gaps into JASPER-style content ideas.
        """
        prompt = f"""
        Based on these content gaps, suggest article ideas for JASPER.

        Gaps: {gaps[:10]}

        JASPER audience: DFI deal teams, impact investors, project developers
        JASPER focus: Financial modelling, DFI funding, African infrastructure

        For each gap, suggest:
        1. Article title
        2. Target keywords
        3. Unique JASPER angle
        """
        pass
```

### Gap Report Output
```python
{
    "generated_at": "2025-12-29",
    "competitors_analyzed": 4,
    "our_article_count": 30,
    "gaps_found": 12,
    "top_opportunities": [
        {
            "topic": "Carbon credit monetization for African projects",
            "opportunity_score": 0.85,
            "suggested_title": "How African Project Developers Can Monetize Carbon Credits",
            "target_keywords": ["carbon credits", "African carbon", "VCM"],
            "jasper_angle": "Financial modelling for carbon revenue streams"
        },
        {
            "topic": "Local currency financing structures",
            "opportunity_score": 0.78,
            "suggested_title": "Local Currency Financing: Reducing FX Risk in African Deals",
            "target_keywords": ["local currency", "FX hedging", "DFI local currency"],
            "jasper_angle": "Model local vs USD financing scenarios"
        }
    ]
}
```

### Scheduler
```python
# Run monthly
scheduler.add_job(
    competitor_analysis_service.run_analysis,
    trigger=CronTrigger(day=1, hour=6),  # 1st of each month
    id="competitor_gap_analysis",
    name="Monthly Competitor Content Gap Analysis"
)
```

---

## Site Search System (Frontend)

### Overview
Full-text search across all published articles on the marketing site.

### Search Index Structure
```python
search_index = {
    "articles": [
        {
            "slug": "blended-finance-guide",
            "title": "How Blended Finance Unlocks Climate Adaptation",
            "excerpt": "...",
            "category": "Climate Finance",
            "tags": ["blended finance", "climate", "DFI"],
            "keywords": ["concessional capital", "first-loss", "IFC"],
            "content_preview": "First 500 chars...",
            "published_at": "2025-12-15",
            "hero_image": "/images/hero.jpg"
        }
    ],
    "updated_at": "2025-12-29T10:00:00Z"
}
```

### Backend: Search Index Generation
```python
# /opt/jasper-crm/services/search_service.py

class SearchService:

    def build_index(self) -> dict:
        """
        Build search index from published articles.
        """
        posts = load_blog_posts()
        published = [p for p in posts if p["status"] == "published"]

        index = {
            "articles": [],
            "updated_at": datetime.utcnow().isoformat()
        }

        for post in published:
            index["articles"].append({
                "slug": post["slug"],
                "title": post["title"],
                "excerpt": post.get("excerpt", "")[:200],
                "category": post["category"],
                "tags": post.get("tags", []),
                "keywords": extract_keywords(post["content"], top_n=10),
                "content_preview": strip_markdown(post["content"])[:500],
                "published_at": post["publishedAt"],
                "hero_image": post.get("heroImage", {}).get("url"),
            })

        return index

    def search(self, query: str, limit: int = 10) -> List[dict]:
        """
        Search articles using simple text matching.
        For production, consider Algolia or Elasticsearch.
        """
        index = self.load_index()
        query_terms = query.lower().split()

        results = []
        for article in index["articles"]:
            score = 0
            searchable = (
                article["title"].lower() + " " +
                article["excerpt"].lower() + " " +
                " ".join(article["tags"]).lower() + " " +
                " ".join(article["keywords"]).lower()
            )

            for term in query_terms:
                if term in article["title"].lower():
                    score += 10  # Title match = high score
                if term in searchable:
                    score += 1

            if score > 0:
                results.append({**article, "_score": score})

        results.sort(key=lambda x: -x["_score"])
        return results[:limit]

@router.get("/api/v1/search")
async def search_articles(q: str, limit: int = 10):
    """Public search endpoint"""
    return search_service.search(q, limit)

@router.post("/api/v1/search/reindex")
async def reindex():
    """Rebuild search index"""
    return search_service.build_index()
```

### Frontend: Search Component
```tsx
// SiteSearch.tsx
export function SiteSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-jasper-navy"
      >
        <Search className="w-5 h-5" />
        <span className="hidden md:inline">Search articles...</span>
        <kbd className="hidden md:inline px-2 py-1 text-xs bg-gray-100 rounded">⌘K</kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center border-b px-4">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 px-4 py-4 outline-none text-lg"
                autoFocus
              />
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && <div className="p-4 text-center">Searching...</div>}

              {results.length === 0 && query.length >= 2 && !loading && (
                <div className="p-8 text-center text-gray-500">
                  No articles found for "{query}"
                </div>
              )}

              {results.map((article) => (
                <a
                  key={article.slug}
                  href={`/insights/${article.slug}`}
                  className="block px-4 py-3 hover:bg-gray-50 border-b"
                >
                  <div className="font-medium text-jasper-navy">{article.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{article.excerpt}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-jasper-emerald/10 text-jasper-emerald rounded">
                      {article.category}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Keyboard Shortcut
```tsx
// In layout or _app.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Implementation Order

### Phase 1: Foundation (Low Risk)
1. **Email Capture Popup** - Frontend only, no article modification
2. **Site Search** - New feature, no existing data touched
3. **CTA Addition** - Template-based, append only

### Phase 2: Content Enhancement (Medium Risk)
4. **Article Indexing** - Read-only analysis
5. **Internal Linking** - Modifies content (backup first!)
6. **External Linking** - Modifies content

### Phase 3: Advanced Features (Higher Complexity)
7. **Source Attribution/Footnotes** - Content structure change
8. **A/B Title Testing** - New tracking system
9. **Competitor Gap Analysis** - Scheduled job

---

## Cost Summary

| Component | Model | Per Article | 30 Articles |
|-----------|-------|-------------|-------------|
| Indexing | None | FREE | FREE |
| Matching | None | FREE | FREE |
| Internal Links | DeepSeek | $0.002 | $0.06 |
| External Sources | Gemini | $0.001 | $0.03 |
| External Links | DeepSeek | $0.001 | $0.03 |
| Footnotes | DeepSeek | $0.001 | $0.03 |
| CTA | Template | FREE | FREE |
| Email Popup | Template | FREE | FREE |
| A/B Titles | DeepSeek | $0.001 | $0.03 |
| **TOTAL** | | **~$0.006** | **~$0.18** |

### Competitor Analysis (Monthly)
- Gemini Grounding: ~$0.05/month

### Search Index (On publish)
- No AI cost, Python only

---

## Post-Implementation: Update Feature Docs

After implementation, update these files:

1. **`jasper-portal-frontend/FEATURES.md`**
   - Add EmailCapturePopup component
   - Add SiteSearch component
   - Add FootnoteRenderer component

2. **`docs/FEATURE_INDEX.md`**
   - Add Content Enhancement System section
   - Update API endpoints list

3. **`docs/CONTENT_GENERATION_FEATURES.md`**
   - Add Link Builder pipeline stages
   - Add A/B Testing documentation
   - Add Competitor Analysis docs

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Avg internal links/article | 0-1 | 3-5 |
| Avg external links/article | 0-1 | 1-2 |
| Articles with footnotes | 0% | 100% |
| Articles with CTA | 0% | 100% |
| Email capture rate | 0% | 2-3% |
| Search usage | 0 | Track |
| Pages per session | Baseline | +40% |
| Avg session duration | Baseline | +30% |

---

*Plan created: 2025-12-29*
*Ready for implementation approval*
