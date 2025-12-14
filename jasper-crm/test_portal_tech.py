#!/usr/bin/env python3
"""
JASPER CRM - Portal Tech Test Script

Tests the document processing and SEO system without running the full server.
Run: python test_portal_tech.py
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def test_keyword_service():
    """Test the keyword service loads from CSVs"""
    print("\n" + "="*60)
    print("TEST 1: Keyword Service")
    print("="*60)

    try:
        from services.keyword_service import keyword_service

        stats = keyword_service.get_stats()
        print(f"\n✓ KeywordService initialized")
        print(f"  Total keywords: {stats['total_keywords']}")
        print(f"  Categories: {len(stats['categories'])}")

        # List categories
        print("\n  Categories loaded:")
        for cat, count in stats['categories'].items():
            print(f"    - {cat}: {count} keywords")

        # Search test
        results = keyword_service.search(query="agri", limit=5)
        print(f"\n  Search 'agri': {len(results)} results")
        for kw in results[:3]:
            print(f"    - {kw['keyword']} ({kw['category']})")

        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def test_document_processor():
    """Test document processor initialization"""
    print("\n" + "="*60)
    print("TEST 2: Document Processor Agent")
    print("="*60)

    try:
        from agents.document_processor import document_processor

        print(f"\n✓ DocumentProcessor initialized")
        print(f"  Router: {document_processor.router}")
        print(f"  Document types supported:")
        from agents.document_processor import DocumentType
        for dt in DocumentType:
            print(f"    - {dt.value}")

        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def test_seo_agents():
    """Test SEO agents initialization"""
    print("\n" + "="*60)
    print("TEST 3: SEO Agents")
    print("="*60)

    try:
        from agents.seo_agent import (
            keyword_research_agent,
            content_optimizer,
            technical_seo_agent,
        )

        print(f"\n✓ KeywordResearchAgent initialized")
        print(f"✓ ContentOptimizer initialized")
        print(f"✓ TechnicalSEOAgent initialized")

        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def test_document_report_service():
    """Test document report service initialization"""
    print("\n" + "="*60)
    print("TEST 4: Document Report Service")
    print("="*60)

    try:
        from services.document_report_service import (
            document_report_service,
            ReportPriority,
            ReportStatus,
        )

        print(f"\n✓ DocumentReportService initialized")
        print(f"  Processor: {document_report_service.processor}")
        print(f"  Router: {document_report_service.router}")
        print(f"\n  Report priorities: {[p.value for p in ReportPriority]}")
        print(f"  Report statuses: {[s.value for s in ReportStatus]}")

        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def test_api_routes_import():
    """Test that API routes can be imported"""
    print("\n" + "="*60)
    print("TEST 5: API Routes Import")
    print("="*60)

    routes_to_test = [
        ("routes.documents", "Document Processing Routes"),
        ("routes.admin_reports", "Admin Reports Routes"),
        ("routes.seo", "SEO Routes"),
        ("routes.content", "Content Routes"),
        ("routes.vision", "Vision Routes"),
    ]

    all_passed = True
    for module_name, description in routes_to_test:
        try:
            __import__(module_name)
            print(f"  ✓ {description}")
        except Exception as e:
            print(f"  ✗ {description}: {e}")
            all_passed = False

    return all_passed


async def test_deepseek_router():
    """Test DeepSeek router configuration"""
    print("\n" + "="*60)
    print("TEST 6: DeepSeek Router")
    print("="*60)

    try:
        from services.deepseek_router import deepseek_router, TaskType

        print(f"\n✓ DeepSeek Router initialized")
        print(f"  Task types available:")
        for task in TaskType:
            print(f"    - {task.value}")

        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "#"*60)
    print("# JASPER CRM - Portal Tech Test Suite")
    print("#"*60)

    tests = [
        ("Keyword Service", test_keyword_service),
        ("Document Processor", test_document_processor),
        ("SEO Agents", test_seo_agents),
        ("Document Report Service", test_document_report_service),
        ("API Routes", test_api_routes_import),
        ("DeepSeek Router", test_deepseek_router),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} crashed: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    passed = sum(1 for _, r in results if r)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status} - {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 All portal tech components working!")
    else:
        print("\n  ⚠️  Some components need attention")

    return passed == total


if __name__ == "__main__":
    asyncio.run(run_all_tests())
