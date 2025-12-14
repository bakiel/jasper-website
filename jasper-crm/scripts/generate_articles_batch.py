#!/usr/bin/env python3
"""
JASPER CRM - Batch Article Generator
Generates 20 SEO-optimized articles for the blog.

Usage:
    python scripts/generate_articles_batch.py

Or via API:
    POST /api/v1/content/batch-generate
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import List, Dict

# CRM API Base URL
BASE_URL = "http://localhost:8001"

# 20 Article Topics for JASPER Financial Architecture
ARTICLE_TOPICS = [
    # DFI & Funding (5)
    {
        "topic": "Understanding IDC Funding: A Complete Guide for South African Entrepreneurs",
        "category": "dfi-insights",
        "seo_keywords": ["IDC funding", "South African entrepreneurs", "development finance"]
    },
    {
        "topic": "How to Apply for DBSA Infrastructure Finance in 2025",
        "category": "dfi-insights",
        "seo_keywords": ["DBSA", "infrastructure finance", "development funding"]
    },
    {
        "topic": "NEF vs IDC: Which Development Finance Institution is Right for Your Business?",
        "category": "dfi-insights",
        "seo_keywords": ["NEF funding", "IDC comparison", "black business funding"]
    },
    {
        "topic": "Green Finance: Accessing Climate Funding Through South African DFIs",
        "category": "dfi-insights",
        "seo_keywords": ["green finance", "climate funding", "sustainable investment"]
    },
    {
        "topic": "Understanding the IDC Application Process: Step-by-Step Guide",
        "category": "dfi-insights",
        "seo_keywords": ["IDC application", "funding application process", "DFI requirements"]
    },

    # Financial Modeling (5)
    {
        "topic": "Building a Financial Model for DFI Applications: Best Practices",
        "category": "financial-modeling",
        "seo_keywords": ["financial model", "DFI application", "business plan financials"]
    },
    {
        "topic": "Key Financial Ratios DFIs Look for in Funding Applications",
        "category": "financial-modeling",
        "seo_keywords": ["financial ratios", "DFI requirements", "debt service coverage"]
    },
    {
        "topic": "Sensitivity Analysis: How to Stress Test Your Business Model",
        "category": "financial-modeling",
        "seo_keywords": ["sensitivity analysis", "financial stress test", "risk assessment"]
    },
    {
        "topic": "Understanding IRR and NPV for Infrastructure Projects",
        "category": "financial-modeling",
        "seo_keywords": ["IRR calculation", "NPV analysis", "infrastructure investment"]
    },
    {
        "topic": "Cash Flow Projections: Common Mistakes to Avoid",
        "category": "financial-modeling",
        "seo_keywords": ["cash flow projection", "financial forecasting", "business planning"]
    },

    # Infrastructure Finance (5)
    {
        "topic": "Renewable Energy Project Finance in South Africa: A 2025 Overview",
        "category": "infrastructure-finance",
        "seo_keywords": ["renewable energy finance", "solar project funding", "REIPPP"]
    },
    {
        "topic": "Water Infrastructure Funding Opportunities in South Africa",
        "category": "infrastructure-finance",
        "seo_keywords": ["water infrastructure", "municipal funding", "infrastructure development"]
    },
    {
        "topic": "Transport and Logistics Infrastructure: Funding Sources and Strategies",
        "category": "infrastructure-finance",
        "seo_keywords": ["transport infrastructure", "logistics funding", "port development"]
    },
    {
        "topic": "Agricultural Processing Infrastructure: IDC Funding Opportunities",
        "category": "infrastructure-finance",
        "seo_keywords": ["agri-processing", "agricultural infrastructure", "food processing finance"]
    },
    {
        "topic": "Smart City Infrastructure: Technology Investment Opportunities",
        "category": "infrastructure-finance",
        "seo_keywords": ["smart city", "urban infrastructure", "technology investment"]
    },

    # Case Studies & Industry News (5)
    {
        "topic": "Success Story: How a Township Manufacturer Secured R50M in IDC Funding",
        "category": "case-studies",
        "seo_keywords": ["IDC success story", "township manufacturing", "funding case study"]
    },
    {
        "topic": "From Startup to Scale-up: Navigating Growth Finance in South Africa",
        "category": "case-studies",
        "seo_keywords": ["startup funding", "growth finance", "scaling business"]
    },
    {
        "topic": "Women-Owned Businesses: Accessing Dedicated DFI Funding Streams",
        "category": "industry-news",
        "seo_keywords": ["women entrepreneurs", "female business funding", "gender-lens investing"]
    },
    {
        "topic": "2025 DFI Trends: What's New in Development Finance",
        "category": "industry-news",
        "seo_keywords": ["DFI trends 2025", "development finance news", "funding landscape"]
    },
    {
        "topic": "Digital Transformation: How AI is Changing Financial Advisory Services",
        "category": "industry-news",
        "seo_keywords": ["AI financial advisory", "digital transformation", "fintech innovation"]
    },
]


async def generate_article(client: httpx.AsyncClient, topic_data: Dict, index: int) -> Dict:
    """Generate a single article via the CRM API."""
    print(f"\n[{index + 1}/20] Generating: {topic_data['topic'][:50]}...")

    try:
        response = await client.post(
            f"{BASE_URL}/api/v1/content/generate-seo-optimized",
            json={
                "topic": topic_data["topic"],
                "category": topic_data["category"],
                "target_seo_score": 70,
                "auto_optimize": True,
                "publish_immediately": False  # Save as draft first
            },
            timeout=120.0  # 2 minute timeout per article
        )

        if response.status_code == 200:
            result = response.json()
            print(f"    ✅ Generated successfully!")
            print(f"    SEO Score: {result.get('seo_score', {}).get('final', 'N/A')}")
            return {
                "success": True,
                "topic": topic_data["topic"],
                "title": result.get("title"),
                "seo_score": result.get("seo_score", {}).get("final"),
                "published": result.get("published", False),
                "generated_at": result.get("generated_at")
            }
        else:
            print(f"    ❌ Error: {response.status_code}")
            return {
                "success": False,
                "topic": topic_data["topic"],
                "error": f"HTTP {response.status_code}: {response.text[:200]}"
            }

    except httpx.TimeoutException:
        print(f"    ⏰ Timeout - article generation took too long")
        return {
            "success": False,
            "topic": topic_data["topic"],
            "error": "Timeout"
        }
    except Exception as e:
        print(f"    ❌ Exception: {str(e)}")
        return {
            "success": False,
            "topic": topic_data["topic"],
            "error": str(e)
        }


async def generate_all_articles():
    """Generate all 20 articles."""
    print("=" * 60)
    print("JASPER CRM - Batch Article Generator")
    print("=" * 60)
    print(f"Starting generation of {len(ARTICLE_TOPICS)} articles...")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    results = []

    async with httpx.AsyncClient() as client:
        # Check API is running
        try:
            health = await client.get(f"{BASE_URL}/health")
            if health.status_code != 200:
                print("❌ CRM API is not responding. Please start the server first.")
                return
            print("✅ CRM API is healthy\n")
        except Exception as e:
            print(f"❌ Cannot connect to CRM API at {BASE_URL}")
            print(f"   Error: {e}")
            print("   Please start the server: python -m uvicorn app.main:app --port 8001")
            return

        # Generate articles sequentially (to avoid overloading the AI)
        for i, topic_data in enumerate(ARTICLE_TOPICS):
            result = await generate_article(client, topic_data, i)
            results.append(result)

            # Small delay between articles
            if i < len(ARTICLE_TOPICS) - 1:
                await asyncio.sleep(2)

    # Summary
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)

    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]

    print(f"\n✅ Successful: {len(successful)}/{len(ARTICLE_TOPICS)}")
    print(f"❌ Failed: {len(failed)}/{len(ARTICLE_TOPICS)}")

    if successful:
        avg_score = sum(r.get("seo_score", 0) or 0 for r in successful) / len(successful)
        print(f"📊 Average SEO Score: {avg_score:.1f}")

    if failed:
        print("\nFailed articles:")
        for f in failed:
            print(f"  - {f['topic'][:50]}... ({f.get('error', 'Unknown error')})")

    # Save results to file
    results_file = f"/tmp/jasper_articles_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n📁 Results saved to: {results_file}")

    return results


if __name__ == "__main__":
    asyncio.run(generate_all_articles())
