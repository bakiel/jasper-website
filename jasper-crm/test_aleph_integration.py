#!/usr/bin/env python3
"""Test ALEPH AI integration with JASPER iMail"""

import asyncio
import sys
sys.path.insert(0, "/opt/jasper-crm")

from services.aleph_client import aleph

async def test_aleph():
    print("=" * 60)
    print("JASPER iMail + ALEPH AI Integration Test")
    print("=" * 60)

    # 1. Test health check
    print("\n[1] Testing ALEPH health check...")
    health = await aleph.health_check()
    print(f"    Status: {health}")

    # 2. Test embedding
    print("\n[2] Testing text embedding...")
    test_text = "Agricultural processing plant in Eastern Cape seeking R15M for expansion"
    embedding = await aleph.embed(test_text)
    if embedding:
        print(f"    Embedding generated: {len(embedding)} dimensions")
        print(f"    Sample values: [{embedding[0]:.4f}, {embedding[1]:.4f}, ...]")
    else:
        print("    Embedding failed or ALEPH unavailable")

    # 3. Test reply classification
    print("\n[3] Testing reply classification...")
    test_reply = "Thanks for reaching out! I would love to schedule a call next week to discuss further."
    classification = await aleph.classify_reply(test_reply)
    print(f"    Reply: '{test_reply[:50]}...'")
    print(f"    Intent: {classification.get('intent', 'N/A')}")
    print(f"    Confidence: {classification.get('confidence', 0):.0%}")
    print(f"    Suggested: {classification.get('suggested_action', 'N/A')}")

    # 4. Test semantic search (will return empty if no leads indexed yet)
    print("\n[4] Testing semantic search...")
    results = await aleph.find_similar_leads(
        lead_context="Solar farm project in Limpopo, R50M investment needed",
        top_k=3
    )
    print(f"    Similar leads found: {len(results)}")

    print("\n" + "=" * 60)
    print("Integration test complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_aleph())
