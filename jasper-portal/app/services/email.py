"""
JASPER Client Portal - Email Service
Design-aligned email templates using existing iMail infrastructure
"""

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import aiosmtplib
from jinja2 import Template

from app.core.config import get_settings, design

settings = get_settings()


# ============================================
# EMAIL TEMPLATES (Design-Aligned)
# ============================================

BASE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: {{ colors.dark_navy }};
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: {{ colors.white }};
        }
        .header {
            background: {{ colors.dark_navy }};
            padding: 24px;
            text-align: center;
        }
        .logo {
            max-height: 50px;
        }
        .content {
            padding: 32px 24px;
        }
        .footer {
            background: {{ colors.gray_100 }};
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: {{ colors.gray_600 }};
        }
        h1, h2, h3 {
            color: {{ colors.dark_navy }};
            margin-top: 0;
        }
        .btn {
            display: inline-block;
            background: {{ colors.emerald }};
            color: {{ colors.white }} !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 16px 0;
        }
        .btn:hover {
            background: {{ colors.emerald_dark }};
        }
        .highlight {
            color: {{ colors.emerald }};
            font-weight: 600;
        }
        .divider {
            height: 1px;
            background: {{ colors.gray_200 }};
            margin: 24px 0;
        }
        .info-box {
            background: {{ colors.gray_100 }};
            border-left: 4px solid {{ colors.emerald }};
            padding: 16px;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://jasperfinance.org/logo-white.png" alt="JASPER" class="logo">
        </div>
        <div class="content">
            {{ content }}
        </div>
        <div class="footer">
            <p><strong>JASPER Financial Architecture</strong></p>
            <p>A service of {{ company_name }}</p>
            <p>{{ company_address }}</p>
            <p><a href="https://jasperfinance.org" style="color: {{ colors.emerald }};">jasperfinance.org</a></p>
        </div>
    </div>
</body>
</html>
"""

TEMPLATES = {
    "magic_link": """
        <h2>Login to Your Portal</h2>
        <p>Hello {{ first_name }},</p>
        <p>Click the button below to securely log in to your JASPER Client Portal:</p>
        <p style="text-align: center;">
            <a href="{{ magic_link }}" class="btn">Access Your Portal</a>
        </p>
        <p style="font-size: 13px; color: {{ colors.gray_600 }};">
            This link expires in {{ expires_minutes }} minutes. If you didn't request this, you can safely ignore this email.
        </p>
    """,

    "welcome": """
        <h2>Welcome to JASPER</h2>
        <p>Hello {{ first_name }},</p>
        <p>Thank you for your inquiry about {{ project_type }} financial modelling services.</p>
        <p>We've received your information and a member of our team will be in touch within 24 hours to discuss your project requirements.</p>
        <div class="info-box">
            <strong>What happens next?</strong>
            <ol style="margin: 8px 0; padding-left: 20px;">
                <li>Our team reviews your inquiry</li>
                <li>We schedule a brief qualification call</li>
                <li>You receive a tailored proposal</li>
            </ol>
        </div>
        <p>In the meantime, feel free to explore our <a href="https://jasperfinance.org/services" style="color: {{ colors.emerald }};">services</a> and <a href="https://jasperfinance.org/portfolio" style="color: {{ colors.emerald }};">portfolio</a>.</p>
        <p>Best regards,<br><span class="highlight">The JASPER Team</span></p>
    """,

    "intake_reminder": """
        <h2>Complete Your Intake Form</h2>
        <p>Hello {{ first_name }},</p>
        <p>To prepare your customised proposal, we need some additional information about your project.</p>
        <p style="text-align: center;">
            <a href="{{ intake_url }}" class="btn">Complete Intake Form</a>
        </p>
        <p>The form takes approximately 10-15 minutes and covers:</p>
        <ul style="color: {{ colors.gray_600 }};">
            <li>Project technical details</li>
            <li>Funding requirements</li>
            <li>Timeline expectations</li>
            <li>Available documentation</li>
        </ul>
        <p>If you have any questions, simply reply to this email.</p>
    """,

    "proposal_sent": """
        <h2>Your Proposal is Ready</h2>
        <p>Hello {{ first_name }},</p>
        <p>We've prepared a detailed proposal for your <span class="highlight">{{ project_name }}</span> project.</p>
        <div class="info-box">
            <strong>Recommended Package:</strong> {{ package_name }}<br>
            <strong>Investment:</strong> ${{ price | number_format }}<br>
            <strong>Timeline:</strong> {{ timeline_weeks }} weeks
        </div>
        <p style="text-align: center;">
            <a href="{{ proposal_url }}" class="btn">View Proposal</a>
        </p>
        <p>This proposal is valid for 14 days. To proceed, simply reply to confirm acceptance and we'll send your deposit invoice.</p>
    """,

    "invoice_created": """
        <h2>Invoice #{{ invoice_number }}</h2>
        <p>Hello {{ first_name }},</p>
        <p>Please find attached your invoice for {{ project_name }}.</p>
        <div class="info-box">
            <strong>Invoice:</strong> #{{ invoice_number }}<br>
            <strong>Amount:</strong> {{ currency }} {{ amount | number_format }}<br>
            <strong>Due:</strong> {{ due_date }}<br>
            <strong>Type:</strong> {{ invoice_type }}
        </div>
        <p style="text-align: center;">
            <a href="{{ invoice_url }}" class="btn">View Invoice</a>
        </p>
        <p><strong>Payment Options:</strong></p>
        <ul>
            <li><span class="highlight">Crypto (3% discount)</span> - USDT, USDC, or BTC</li>
            <li>PayPal - {{ paypal_email }}</li>
            <li>Bank Transfer - FNB (details on invoice)</li>
        </ul>
    """,

    "payment_received": """
        <h2>Payment Confirmed</h2>
        <p>Hello {{ first_name }},</p>
        <p>We've received your payment for invoice <span class="highlight">#{{ invoice_number }}</span>.</p>
        <div class="info-box">
            <strong>Amount:</strong> {{ currency }} {{ amount | number_format }}<br>
            <strong>Method:</strong> {{ payment_method }}<br>
            <strong>Date:</strong> {{ paid_date }}
            {% if crypto_discount %}
            <br><strong>Crypto Discount Applied:</strong> 3%
            {% endif %}
        </div>
        {% if invoice_type == 'deposit' %}
        <p>Your project is now in production! We'll schedule your kick-off call within 48 hours.</p>
        {% else %}
        <p>Thank you for your payment. Your project deliverables will be released shortly.</p>
        {% endif %}
    """,

    "project_update": """
        <h2>Project Update: {{ project_name }}</h2>
        <p>Hello {{ first_name }},</p>
        <p>Here's an update on your project progress:</p>
        <div class="info-box">
            <strong>Current Status:</strong> {{ status }}<br>
            <strong>Progress:</strong> {{ progress }}%<br>
            <strong>Next Milestone:</strong> {{ next_milestone }}
        </div>
        <p style="text-align: center;">
            <a href="{{ dashboard_url }}" class="btn">View Dashboard</a>
        </p>
        {% if notes %}
        <p><strong>Notes:</strong></p>
        <p style="color: {{ colors.gray_600 }};">{{ notes }}</p>
        {% endif %}
    """,

    "draft_ready": """
        <h2>Draft Ready for Review</h2>
        <p>Hello {{ first_name }},</p>
        <p>Great news! The first draft of your <span class="highlight">{{ project_name }}</span> deliverables is ready for review.</p>
        <p style="text-align: center;">
            <a href="{{ documents_url }}" class="btn">Review Documents</a>
        </p>
        <p>Please review the following:</p>
        <ul>
            {% for doc in documents %}
            <li>{{ doc }}</li>
            {% endfor %}
        </ul>
        <p>Once you've reviewed, please provide your feedback within 5 business days. You have {{ revision_rounds }} revision round(s) included in your package.</p>
    """,

    "final_delivery": """
        <h2>Project Complete!</h2>
        <p>Hello {{ first_name }},</p>
        <p>Congratulations! Your <span class="highlight">{{ project_name }}</span> project is complete.</p>
        <p style="text-align: center;">
            <a href="{{ documents_url }}" class="btn">Download Deliverables</a>
        </p>
        <p>Your final deliverables include:</p>
        <ul>
            {% for doc in documents %}
            <li>{{ doc }}</li>
            {% endfor %}
        </ul>
        <div class="divider"></div>
        <p>We'd love to hear about your experience! Please take a moment to share your feedback:</p>
        <p style="text-align: center;">
            <a href="{{ feedback_url }}" style="color: {{ colors.emerald }};">Share Feedback</a>
        </p>
        <p>Thank you for choosing JASPER. We wish you every success with your project!</p>
    """
}


# ============================================
# EMAIL SERVICE
# ============================================

class EmailService:
    """Email service using design-aligned templates"""

    def __init__(self):
        self.colors = design.COLORS
        self.company_name = settings.COMPANY_NAME
        self.company_address = settings.COMPANY_ADDRESS

    async def send_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        attachments: list = None
    ) -> bool:
        """Send a design-aligned email"""

        # Get template
        template_content = TEMPLATES.get(template_name)
        if not template_content:
            raise ValueError(f"Unknown template: {template_name}")

        # Render template with context
        content_template = Template(template_content)
        rendered_content = content_template.render(
            colors=self.colors,
            **context
        )

        # Render base template
        base_template = Template(BASE_TEMPLATE)
        html_body = base_template.render(
            colors=self.colors,
            company_name=self.company_name,
            company_address=self.company_address,
            content=rendered_content
        )

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
        message["To"] = to_email

        # Add HTML body
        message.attach(MIMEText(html_body, "html"))

        # Send email
        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True
            )
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
            return False

    # Convenience methods for common emails
    async def send_magic_link(self, email: str, first_name: str, magic_link: str):
        return await self.send_email(
            to_email=email,
            subject="Login to JASPER Portal",
            template_name="magic_link",
            context={
                "first_name": first_name,
                "magic_link": magic_link,
                "expires_minutes": settings.MAGIC_LINK_EXPIRE_MINUTES
            }
        )

    async def send_welcome(self, email: str, first_name: str, project_type: str = ""):
        return await self.send_email(
            to_email=email,
            subject="Welcome to JASPER Financial Architecture",
            template_name="welcome",
            context={
                "first_name": first_name,
                "project_type": project_type or "project"
            }
        )

    async def send_proposal(
        self,
        email: str,
        first_name: str,
        project_name: str,
        package_name: str,
        price: float,
        timeline_weeks: int,
        proposal_url: str
    ):
        return await self.send_email(
            to_email=email,
            subject=f"Your JASPER Proposal - {project_name}",
            template_name="proposal_sent",
            context={
                "first_name": first_name,
                "project_name": project_name,
                "package_name": package_name,
                "price": price,
                "timeline_weeks": timeline_weeks,
                "proposal_url": proposal_url
            }
        )

    async def send_invoice(
        self,
        email: str,
        first_name: str,
        invoice_number: str,
        project_name: str,
        amount: float,
        currency: str,
        due_date: str,
        invoice_type: str,
        invoice_url: str
    ):
        return await self.send_email(
            to_email=email,
            subject=f"Invoice #{invoice_number} - JASPER",
            template_name="invoice_created",
            context={
                "first_name": first_name,
                "invoice_number": invoice_number,
                "project_name": project_name,
                "amount": amount,
                "currency": currency,
                "due_date": due_date,
                "invoice_type": invoice_type.title(),
                "invoice_url": invoice_url,
                "paypal_email": settings.PAYPAL_EMAIL
            }
        )

    async def send_payment_confirmation(
        self,
        email: str,
        first_name: str,
        invoice_number: str,
        amount: float,
        currency: str,
        payment_method: str,
        paid_date: str,
        invoice_type: str,
        crypto_discount: bool = False
    ):
        return await self.send_email(
            to_email=email,
            subject=f"Payment Received - Invoice #{invoice_number}",
            template_name="payment_received",
            context={
                "first_name": first_name,
                "invoice_number": invoice_number,
                "amount": amount,
                "currency": currency,
                "payment_method": payment_method,
                "paid_date": paid_date,
                "invoice_type": invoice_type,
                "crypto_discount": crypto_discount
            }
        )


# Singleton instance
email_service = EmailService()
