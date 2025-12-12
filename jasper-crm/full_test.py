#!/usr/bin/env python3
"""JASPER iMail EMV - Full End-to-End Test"""

import asyncio
import sys
sys.path.insert(0, "/opt/jasper-crm")

from services.aleph_client import aleph
from services.email_generator import email_generator
from services.email_sender import email_sender
from models.email_sequence import EmailStepTemplate

async def full_test():
    print("=" * 60)
    print("JASPER iMail EMV - FULL INTEGRATION TEST")
    print("=" * 60)

    # 1. ALEPH Health
    print("\n[1] ALEPH AI Status...")
    health = await aleph.health_check()
    status = health.get("status", "unknown")
    if status == "healthy":
        models = health.get("models", {})
        embedding_model = models.get("embedding_model", "N/A")
        collections = health.get("collections", 0)
        print(f"    OK - {embedding_model}")
        print(f"    Milvus: {collections} collections")
    else:
        print(f"    FAILED: {health}")
        return False

    # 2. Embedding Test
    print("\n[2] Embedding Generation...")
    embedding = await aleph.embed("Solar farm in Limpopo seeking R50M DFI funding")
    if embedding and len(embedding) > 0:
        print(f"    OK - {len(embedding)} dimensions")
    else:
        print("    FAILED: No embedding returned")
        return False

    # 3. Email Generation Test
    print("\n[3] AI Email Generation...")
    template = EmailStepTemplate(
        step_number=1,
        delay_days=0,
        delay_hours=0,
        subject_template="Quick question about {company}",
        body_template="Hi {name},\n\nI noticed {company} is in the {sector} sector. We help companies like yours secure DFI funding.\n\nWould you be open to a quick call?\n\nBest,\nBakiel",
        use_ai_personalization=True,
        ai_tone="professional"
    )

    lead_context = {
        "name": "Bakiel",
        "company": "Test Solar Holdings",
        "sector": "renewable_energy",
        "funding_stage": "growth",
        "funding_amount": "R50M",
        "source": "website"
    }

    result = await email_generator.generate_email(template, lead_context, use_rag=True)
    if result.get("success"):
        subject = result.get("subject", "")[:50]
        rag = result.get("rag_enhanced", False)
        model = result.get("model", "N/A")
        print(f"    OK - Subject: {subject}...")
        print(f"    RAG Enhanced: {rag}")
        print(f"    Model: {model}")
        generated_body = result.get("body", "")
    else:
        error = result.get("error", "Unknown")
        print(f"    FAILED: {error}")
        return False

    # 4. SMTP Test (actual send)
    print("\n[4] SMTP Email Delivery...")
    send_result = email_sender.send_email(
        to_email="bakielisrael@gmail.com",
        subject="[TEST] JASPER iMail Full Integration Test",
        body=f"JASPER iMail EMV Full Test\n\n1. ALEPH AI: OK\n2. Embeddings: OK\n3. AI Generation: OK\n4. SMTP: Sending...\n\n--- AI Generated Email Preview ---\n{generated_body[:500]}",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0B1221; color: #E2E8F0;">
            <h2 style="color: #2C8A5B;">JASPER iMail EMV - Full Test</h2>
            <p>All systems tested and operational:</p>
            <table style="color: #E2E8F0; margin: 20px 0;">
                <tr><td>1. ALEPH AI:</td><td style="color: #22C55E;">OK</td></tr>
                <tr><td>2. Embeddings:</td><td style="color: #22C55E;">OK ({len(embedding)} dims)</td></tr>
                <tr><td>3. AI Generation:</td><td style="color: #22C55E;">OK</td></tr>
                <tr><td>4. SMTP Delivery:</td><td style="color: #22C55E;">OK</td></tr>
            </table>
            <h3 style="color: #2C8A5B;">AI Generated Email Preview:</h3>
            <div style="background: #1E293B; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <p style="white-space: pre-wrap;">{generated_body[:500]}</p>
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin-top: 20px;">Sent from JASPER iMail EMV Platform</p>
        </div>
        """
    )

    if send_result.get("success"):
        print("    OK - Email sent to bakielisrael@gmail.com")
    else:
        error = send_result.get("error", "Unknown")
        print(f"    FAILED: {error}")
        return False

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED - SYSTEM IS FULLY OPERATIONAL")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = asyncio.run(full_test())
    sys.exit(0 if success else 1)
