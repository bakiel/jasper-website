"""
iMail Client Service
Sends branded emails via iMail EMV (localhost:3003)
"""

import os
import httpx
from typing import Optional, Dict, Any, List

IMAIL_URL = os.getenv("IMAIL_URL", "http://localhost:3003")
IMAIL_API_KEY = os.getenv("IMAIL_API_KEY", "")


async def send_email(
    to: str | List[str],
    subject: str,
    template: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
    html: Optional[str] = None,
    text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send branded email via iMail EMV service
    
    Args:
        to: Recipient email(s)
        subject: Email subject
        template: Template name (welcome, notification, verification, lead_alert, invoice)
        data: Template data (varies by template)
        html: Raw HTML (if not using template)
        text: Plain text version
    
    Returns:
        Dict with success status, tracking_id, and results
    """
    if not IMAIL_API_KEY:
        return {"success": False, "error": "IMAIL_API_KEY not configured"}
    
    payload = {
        "to": to,
        "subject": subject,
    }
    
    if template:
        payload["template"] = template
        payload["data"] = data or {}
    elif html:
        payload["html"] = html
        payload["text"] = text or ""
    else:
        return {"success": False, "error": "Either template or html content required"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{IMAIL_URL}/api/imail/send",
                json=payload,
                headers={"X-API-Key": IMAIL_API_KEY}
            )
            return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


async def send_lead_alert(
    lead_name: str,
    lead_email: str,
    company: str,
    source: str = "Website Contact Form",
    admin_email: str = "admin@jasperfinance.org"
) -> Dict[str, Any]:
    """Send branded lead alert to admin"""
    return await send_email(
        to=admin_email,
        subject=f"New Lead: {company} - {lead_name}",
        template="lead_alert",
        data={
            "leadName": lead_name,
            "leadEmail": lead_email,
            "company": company,
            "source": source,
            "crmUrl": "https://jasperfinance.org/admin/leads"
        }
    )


async def send_lead_confirmation(
    to: str,
    name: str
) -> Dict[str, Any]:
    """Send branded confirmation to the lead"""
    return await send_email(
        to=to,
        subject="Thank you for contacting JASPER Financial Architecture",
        template="notification",
        data={
            "title": f"Thank you, {name}\!",
            "message": "We have received your inquiry and our team will review it shortly. A JASPER specialist will contact you within 24-48 business hours to discuss how we can help with your project finance needs.",
            "actionUrl": "https://jasperfinance.org"
        }
    )


async def send_notification(
    to: str,
    title: str,
    message: str,
    action_url: Optional[str] = None
) -> Dict[str, Any]:
    """Send branded notification email"""
    return await send_email(
        to=to,
        subject=title,
        template="notification",
        data={
            "title": title,
            "message": message,
            "actionUrl": action_url
        }
    )
