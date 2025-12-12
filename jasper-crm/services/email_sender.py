"""
JASPER CRM - Email Sender Service
Handles SMTP email sending with retry logic and error handling
"""

import os
import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class EmailSender:
    """SMTP Email sender with robust error handling"""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.hostinger.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "465"))
        self.smtp_user = os.getenv("SMTP_USER", "models@jasperfinance.org")
        self.smtp_pass = os.getenv("SMTP_PASS")
        self.from_name = os.getenv("SMTP_FROM_NAME", "JASPER Financial")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send an email via SMTP

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            reply_to: Optional reply-to address

        Returns:
            Dict with success status and message_id or error
        """
        if not self.smtp_pass:
            return {
                "success": False,
                "error": "SMTP_PASS not configured",
            }

        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.smtp_user}>"
            msg["To"] = to_email

            if reply_to:
                msg["Reply-To"] = reply_to

            # Add plain text
            msg.attach(MIMEText(body, "plain"))

            # Add HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            # Send via SSL
            context = ssl.create_default_context()

            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context) as server:
                server.login(self.smtp_user, self.smtp_pass)
                server.sendmail(self.smtp_user, to_email, msg.as_string())

            logger.info(f"Email sent successfully to {to_email}: {subject[:50]}...")

            return {
                "success": True,
                "message_id": msg["Message-ID"] or f"jasper-{id(msg)}",
                "to": to_email,
                "subject": subject,
            }

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return {
                "success": False,
                "error": f"Authentication failed: {str(e)}",
            }
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return {
                "success": False,
                "error": f"SMTP error: {str(e)}",
            }
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    async def send_sequence_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        body: str,
        sequence_id: str,
        step_number: int,
    ) -> Dict[str, Any]:
        """
        Send an email as part of a sequence with tracking headers
        """
        # Add tracking footer
        tracking_footer = f"\n\n---\nRef: SEQ-{sequence_id[:8]}-S{step_number}"
        full_body = body + tracking_footer

        # Create HTML version with tracking
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1E293B;">
        {body.replace(chr(10), '<br>')}
        <br><br>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
        <p style="color: #94A3B8; font-size: 12px;">Ref: SEQ-{sequence_id[:8]}-S{step_number}</p>
        </body>
        </html>
        """

        return self.send_email(
            to_email=to_email,
            subject=subject,
            body=full_body,
            html_body=html_body,
        )


# Singleton instance
email_sender = EmailSender()
