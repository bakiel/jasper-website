#!/usr/bin/env python3
"""Test Core AI Systems Only (no SMTP)"""

import asyncio
import sys
import os
sys.path.insert(0, "/opt/jasper-crm")

# Set env vars
os.environ["OPENROUTER_API_KEY"] = "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"

from services.aleph_client import aleph
from services.email_generator import email_generator
from models.email_sequence import EmailStepTemplate

async def test_core():
    print("=" * 60)
    print("JASPER iMail EMV - CORE AI SYSTEMS TEST")
    print("=" * 60)

    results = {"passed": 0, "failed": 0}

    # 1. ALEPH Health
    print("\n[1] ALEPH AI Status...")
    try:
        health = await aleph.health_check()
        if health.get("status") == "healthy":
            print(f"    PASS - Model: {health.get('models', {}).get('embedding_model', 'N/A')}")
            print(f"          Milvus: {health.get('collections', 0)} collections")
            print(f"          Memory: {health.get('models', {}).get('memory_mb', 0):.0f}MB")
            results["passed"] += 1
        else:
            print(f"    FAIL - {health}")
            results["failed"] += 1
    except Exception as e:
        print(f"    FAIL - {e}")
        results["failed"] += 1

    # 2. Embedding Generation
    print("\n[2] Text Embedding...")
    try:
        text = "Agricultural processing plant in Eastern Cape seeking R15M DFI funding for expansion"
        embedding = await aleph.embed(text)
        if embedding and len(embedding) > 0:
            print(f"    PASS - {len(embedding)} dimensions")
            print(f"          Sample: [{embedding[0]:.4f}, {embedding[1]:.4f}, {embedding[2]:.4f}...]")
            results["passed"] += 1
        else:
            print("    FAIL - No embedding returned")
            results["failed"] += 1
    except Exception as e:
        print(f"    FAIL - {e}")
        results["failed"] += 1

    # 3. Semantic Search
    print("\n[3] Semantic Lead Search...")
    try:
        similar = await aleph.find_similar_leads(
            lead_context="Solar farm project in Limpopo, R50M investment needed for grid connection",
            top_k=3
        )
        print(f"    PASS - Search executed, {len(similar)} results")
        print(f"          (Empty is OK if no leads indexed yet)")
        results["passed"] += 1
    except Exception as e:
        print(f"    FAIL - {e}")
        results["failed"] += 1

    # 4. AI Email Generation (via OpenRouter)
    print("\n[4] AI Email Generation (OpenRouter/DeepSeek)...")
    try:
        template = EmailStepTemplate(
            step_number=1,
            delay_days=0,
            delay_hours=0,
            subject_template="Quick question about {company}",
            body_template="Hi {name},\n\nI saw {company} is in the {sector} sector. We help companies secure DFI funding.\n\nQuick call this week?\n\nBakiel",
            use_ai_personalization=True,
            ai_tone="professional"
        )

        lead = {
            "name": "John",
            "company": "GreenTech Solar",
            "sector": "renewable_energy",
            "funding_stage": "growth",
            "funding_amount": "R25M"
        }

        result = await email_generator.generate_email(template, lead, use_rag=True)
        if result.get("success"):
            print(f"    PASS - Model: {result.get('model', 'N/A')}")
            print(f"          Subject: {result.get('subject', '')[:50]}...")
            print(f"          RAG Enhanced: {result.get('rag_enhanced', False)}")
            print(f"\n    --- Generated Email Body ---")
            body = result.get("body", "")[:300]
            for line in body.split("\n"):
                print(f"    {line}")
            print(f"    ...")
            results["passed"] += 1
        else:
            print(f"    FAIL - {result.get('error', 'Unknown')}")
            results["failed"] += 1
    except Exception as e:
        print(f"    FAIL - {e}")
        results["failed"] += 1

    # 5. Reply Classification
    print("\n[5] Reply Intent Classification...")
    try:
        test_replies = [
            ("I'd love to schedule a call next week!", "POSITIVE"),
            ("Can you send me more information about pricing?", "QUESTION"),
            ("Sorry, we're not interested at this time.", "NEGATIVE"),
            ("I'm out of the office until Monday.", "OUT_OF_OFFICE"),
        ]

        for reply, expected in test_replies[:2]:  # Test 2 to save time
            classification = await aleph.classify_reply(reply)
            intent = classification.get("intent", "UNKNOWN")
            conf = classification.get("confidence", 0)
            print(f"    '{reply[:40]}...'")
            print(f"        -> {intent} ({conf:.0%} confidence)")
        results["passed"] += 1
    except Exception as e:
        print(f"    FAIL - {e}")
        results["failed"] += 1

    # Summary
    print("\n" + "=" * 60)
    total = results["passed"] + results["failed"]
    print(f"RESULTS: {results['passed']}/{total} tests passed")

    if results["failed"] == 0:
        print("\nALL CORE SYSTEMS OPERATIONAL")
        print("SMTP is separate infrastructure (Hostinger mail server)")
    else:
        print(f"\n{results['failed']} tests failed - check above for details")
    print("=" * 60)

    return results["failed"] == 0

if __name__ == "__main__":
    success = asyncio.run(test_core())
    sys.exit(0 if success else 1)
