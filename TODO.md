# JASPER SEO Enhancement - Swarm TODO

## Agent Tasks

### 🔴 citation_service.py - NOT STARTED
- [ ] Create jasper-crm/services/citation_service.py
- [ ] detect_claims() - Find factual claims needing sources
- [ ] find_source() - Use Gemini grounding for authoritative sources
- [ ] insert_footnotes() - Add [^1] markers to content
- [ ] generate_references_section() - Chicago-style refs
- [ ] CitationService class with process_article(slug)
- [ ] Test: tests/test_citation_service.py

### 🔴 link_builder_service.py - NOT STARTED
- [ ] Create jasper-crm/services/link_builder_service.py  
- [ ] build_article_index() - TF-IDF index of 30 articles
- [ ] find_related_articles() - Score-based matching (max 5)
- [ ] find_external_sources() - ifc.org, afdb.org, worldbank.org
- [ ] insert_links() - Natural placement (not in H1/first para)
- [ ] LinkBuilderService class with process_article(slug)
- [ ] Test: tests/test_link_builder_service.py

### 🔴 ab_title_service.py - NOT STARTED
- [ ] Create jasper-crm/services/ab_title_service.py
- [ ] generate_variants() - 3 title options per article
- [ ] track_click() - Record CTR data
- [ ] get_winner() - Return best performing title
- [ ] ABTitleService class with process_article(slug)
- [ ] Test: tests/test_ab_title_service.py

### 🔴 Integration - NOT STARTED
- [ ] Update enhancement_orchestrator.py imports
- [ ] Wire _add_citations() method
- [ ] Wire _add_internal_links() method
- [ ] Wire _generate_ab_titles() method
- [ ] Test full pipeline

### 🔴 Deployment - NOT STARTED
- [ ] Copy all services to VPS 72.61.201.237
- [ ] Restart jasper-crm
- [ ] Verify /api/v1/health returns healthy
- [ ] Test /api/v1/content/enhance endpoint

---

## Completion Marker
When ALL tasks above are checked [x], add this line:
<!-- SWARM_COMPLETE -->
