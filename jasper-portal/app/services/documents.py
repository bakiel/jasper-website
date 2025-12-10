"""
JASPER Client Portal - Document Generation Service
Generates PDF invoices, proposals, and crypto payment pages using V3 templates
"""

from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

from app.core.config import get_settings, DesignSystem

settings = get_settings()
design = DesignSystem()

# Brand colors from design system
DARK_NAVY = HexColor(design.COLORS["carbon_black"])
NAVY = HexColor(design.COLORS["navy"])
EMERALD = HexColor(design.COLORS["emerald"])
EMERALD_DARK = HexColor(design.COLORS["emerald_dark"])
GRAY_600 = HexColor(design.COLORS["gray"])
GRAY_400 = HexColor(design.COLORS["gray"])
GRAY_200 = HexColor(design.COLORS["gray_light"])
GRAY_100 = HexColor(design.COLORS["gray_100"])
WHITE = HexColor(design.COLORS["white"])

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
TEMPLATES_DIR = BASE_DIR.parent / "templates"
FONTS_DIR = TEMPLATES_DIR / "fonts"
OUTPUT_DIR = Path(settings.UPLOAD_DIR) / "documents"

# Thread pool for PDF generation
executor = ThreadPoolExecutor(max_workers=4)


class DocumentService:
    """
    Service for generating PDF documents.
    Uses JASPER design system and V3 templates.
    """

    def __init__(self):
        self.fonts_loaded = False
        self._ensure_directories()

    def _ensure_directories(self):
        """Ensure output directories exist"""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def _load_fonts(self) -> bool:
        """Load Montserrat fonts for PDF generation"""
        if self.fonts_loaded:
            return True

        FONTS_DIR.mkdir(parents=True, exist_ok=True)

        fonts = {
            'Montserrat': 'Montserrat-Regular.ttf',
            'Montserrat-Bold': 'Montserrat-Bold.ttf',
            'Montserrat-SemiBold': 'Montserrat-SemiBold.ttf',
            'Montserrat-Medium': 'Montserrat-Medium.ttf',
        }

        for font_name, font_file in fonts.items():
            font_path = FONTS_DIR / font_file
            if font_path.exists():
                try:
                    pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
                except Exception:
                    return False
            else:
                return False

        self.fonts_loaded = True
        return True

    def _get_fonts(self) -> Dict[str, str]:
        """Get font names, falling back to Helvetica if Montserrat unavailable"""
        if self._load_fonts():
            return {
                'regular': 'Montserrat',
                'bold': 'Montserrat-Bold',
                'semi': 'Montserrat-SemiBold',
                'medium': 'Montserrat-Medium',
            }
        return {
            'regular': 'Helvetica',
            'bold': 'Helvetica-Bold',
            'semi': 'Helvetica-Bold',
            'medium': 'Helvetica',
        }

    def _get_currency_symbol(self, currency: str) -> str:
        """Get currency symbol"""
        symbols = {"USD": "$", "ZAR": "R", "EUR": "€", "GBP": "£"}
        return symbols.get(currency, "$")

    def _draw_logo(self, c: canvas.Canvas, x: float, y: float, size: float = 50):
        """Draw logo or fallback text"""
        logo_path = TEMPLATES_DIR / "logo.png"
        fonts = self._get_fonts()

        try:
            if logo_path.exists():
                logo = ImageReader(str(logo_path))
                c.drawImage(logo, x, y - size*mm, width=size*mm, height=size*mm,
                           preserveAspectRatio=True, mask='auto')
            else:
                raise FileNotFoundError()
        except Exception:
            c.setFillColor(DARK_NAVY)
            c.setFont(fonts['bold'], 20)
            c.drawString(x, y - 5*mm, "JASPER")
            c.setFillColor(GRAY_600)
            c.setFont(fonts['regular'], 8)
            c.drawString(x, y - 12*mm, "FINANCIAL ARCHITECTURE")

    async def generate_invoice(
        self,
        invoice_number: str,
        client_name: str,
        client_company: str,
        client_email: str = "",
        project_name: str = "",
        package_name: str = "",
        amount: float = 0,
        currency: str = "USD",
        invoice_type: str = "Deposit",
        total_amount: float = None,
        output_filename: str = None
    ) -> str:
        """
        Generate invoice PDF asynchronously.
        Returns path to generated PDF.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._generate_invoice_sync,
            invoice_number, client_name, client_company, client_email,
            project_name, package_name, amount, currency, invoice_type,
            total_amount, output_filename
        )

    def _generate_invoice_sync(
        self,
        invoice_number: str,
        client_name: str,
        client_company: str,
        client_email: str,
        project_name: str,
        package_name: str,
        amount: float,
        currency: str,
        invoice_type: str,
        total_amount: float,
        output_filename: str
    ) -> str:
        """Synchronous invoice generation"""
        fonts = self._get_fonts()

        if output_filename is None:
            output_filename = f"Invoice_{invoice_number}.pdf"

        output_path = OUTPUT_DIR / output_filename
        c = canvas.Canvas(str(output_path), pagesize=A4)
        width, height = A4

        # White background
        c.setFillColor(WHITE)
        c.rect(0, 0, width, height, fill=1, stroke=0)

        # Header
        y_pos = height - 25*mm
        self._draw_logo(c, 20*mm, y_pos)

        # INVOICE title
        c.setFillColor(EMERALD)
        c.setFont(fonts['bold'], 28)
        c.drawRightString(width - 20*mm, y_pos, "INVOICE")

        # Invoice number
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 12)
        c.drawRightString(width - 20*mm, y_pos - 12*mm, f"#{invoice_number}")

        # Dates
        today = datetime.now()
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)
        c.drawRightString(width - 20*mm, y_pos - 25*mm, f"Date: {today.strftime('%d %B %Y')}")
        c.drawRightString(width - 20*mm, y_pos - 33*mm, "Due: Upon Receipt")

        # Horizontal line
        y_pos -= 50*mm
        c.setStrokeColor(GRAY_200)
        c.setLineWidth(1)
        c.line(20*mm, y_pos, width - 20*mm, y_pos)

        # FROM section
        y_pos -= 15*mm
        c.setFillColor(GRAY_400)
        c.setFont(fonts['semi'], 8)
        c.drawString(20*mm, y_pos, "FROM")

        y_pos -= 8*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 11)
        c.drawString(20*mm, y_pos, settings.COMPANY_NAME)

        y_pos -= 6*mm
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)
        from_lines = [
            f"Reg: {settings.COMPANY_REG}",
            settings.COMPANY_ADDRESS.split(",")[0] + "," + settings.COMPANY_ADDRESS.split(",")[1],
            ", ".join(settings.COMPANY_ADDRESS.split(",")[2:]),
            settings.COMPANY_EMAIL
        ]
        for line in from_lines:
            c.drawString(20*mm, y_pos, line.strip())
            y_pos -= 5*mm

        # BILL TO section
        bill_y = height - 90*mm - 15*mm
        bill_x = width/2 + 10*mm

        c.setFillColor(GRAY_400)
        c.setFont(fonts['semi'], 8)
        c.drawString(bill_x, bill_y, "BILL TO")

        bill_y -= 8*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 11)
        c.drawString(bill_x, bill_y, client_company)

        bill_y -= 6*mm
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)
        c.drawString(bill_x, bill_y, client_name)
        if client_email:
            bill_y -= 5*mm
            c.drawString(bill_x, bill_y, client_email)

        # PROJECT section
        y_pos -= 15*mm
        c.setFillColor(GRAY_400)
        c.setFont(fonts['semi'], 8)
        c.drawString(20*mm, y_pos, "PROJECT")

        y_pos -= 8*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['medium'], 12)
        c.drawString(20*mm, y_pos, project_name)

        # Line items table
        y_pos -= 20*mm

        # Table header background
        c.setFillColor(GRAY_100)
        c.rect(20*mm, y_pos - 8*mm, width - 40*mm, 12*mm, fill=1, stroke=0)

        # Table header text
        c.setFillColor(GRAY_600)
        c.setFont(fonts['semi'], 9)
        c.drawString(25*mm, y_pos - 3*mm, "DESCRIPTION")
        c.drawRightString(width - 25*mm, y_pos - 3*mm, "AMOUNT")

        # Line item
        y_pos -= 22*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['regular'], 10)

        description = f"{package_name}"
        if invoice_type and total_amount:
            description += f" - {invoice_type} (50%)"

        c.drawString(25*mm, y_pos, description)

        # Amount
        symbol = self._get_currency_symbol(currency)
        c.setFont(fonts['medium'], 10)
        c.drawRightString(width - 25*mm, y_pos, f"{symbol}{amount:,.2f}")

        # Bottom border for line item
        y_pos -= 8*mm
        c.setStrokeColor(GRAY_200)
        c.line(20*mm, y_pos, width - 20*mm, y_pos)

        # Total section
        y_pos -= 15*mm
        total_width = 80*mm
        total_x = width - 20*mm - total_width
        c.setFillColor(EMERALD)
        c.rect(total_x, y_pos - 12*mm, total_width, 20*mm, fill=1, stroke=0)

        c.setFillColor(WHITE)
        c.setFont(fonts['semi'], 10)
        c.drawString(total_x + 10*mm, y_pos - 3*mm, "TOTAL DUE")

        c.setFont(fonts['bold'], 16)
        c.drawRightString(width - 25*mm, y_pos - 4*mm, f"{symbol}{amount:,.2f}")

        # Payment section
        y_pos -= 30*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "PAYMENT OPTIONS")

        y_pos -= 10*mm
        col_width = (width - 50*mm) / 3

        methods = [
            ("CRYPTO (3% discount)", [
                f"USDT: {settings.USDT_TRC20}",
                f"USDC: {settings.USDC_ERC20}",
                f"BTC: {settings.BTC_ADDRESS}"
            ]),
            ("PAYPAL", [settings.PAYPAL_EMAIL, "", ""]),
            ("FNB BANK / SWIFT", [
                settings.COMPANY_NAME,
                f"Acc: {settings.FNB_ACCOUNT}",
                f"Branch: {settings.FNB_BRANCH} SWIFT: {settings.FNB_SWIFT}"
            ])
        ]

        for i, (title, lines) in enumerate(methods):
            x = 20*mm + i * col_width

            c.setFillColor(EMERALD)
            c.setFont(fonts['semi'], 8)
            c.drawString(x, y_pos, title)

            c.setFillColor(GRAY_600)
            font_size = 5 if i == 0 else 7
            c.setFont(fonts['regular'], font_size)
            for j, line in enumerate(lines):
                if line:
                    c.drawString(x, y_pos - (6 + j*4)*mm, line)

        # Note
        y_pos -= 25*mm
        c.setFillColor(GRAY_400)
        c.setFont(fonts['regular'], 7)
        c.drawString(20*mm, y_pos, f"Please include invoice number {invoice_number} in payment reference.")

        # Footer
        c.setFillColor(GRAY_200)
        c.rect(0, 0, width, 15*mm, fill=1, stroke=0)

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 8)
        c.drawCentredString(width/2, 6*mm,
            f"JASPER Financial Architecture  •  {settings.COMPANY_WEBSITE}  •  {settings.COMPANY_EMAIL}")

        c.save()
        return str(output_path)

    async def generate_proposal(
        self,
        client_name: str,
        client_company: str,
        project_name: str,
        project_description: str,
        package_name: str,
        price: float,
        timeline_weeks: int,
        deliverables: List[str],
        exclusions: List[str] = None,
        output_filename: str = None
    ) -> str:
        """
        Generate proposal PDF asynchronously.
        Returns path to generated PDF.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._generate_proposal_sync,
            client_name, client_company, project_name, project_description,
            package_name, price, timeline_weeks, deliverables, exclusions,
            output_filename
        )

    def _generate_proposal_sync(
        self,
        client_name: str,
        client_company: str,
        project_name: str,
        project_description: str,
        package_name: str,
        price: float,
        timeline_weeks: int,
        deliverables: List[str],
        exclusions: List[str],
        output_filename: str
    ) -> str:
        """Synchronous proposal generation"""
        fonts = self._get_fonts()

        if output_filename is None:
            safe_project = project_name.replace(' ', '_').replace('/', '-')
            output_filename = f"Proposal_{safe_project}_{datetime.now().strftime('%Y%m%d')}.pdf"

        output_path = OUTPUT_DIR / output_filename
        c = canvas.Canvas(str(output_path), pagesize=A4)
        width, height = A4

        # White background
        c.setFillColor(WHITE)
        c.rect(0, 0, width, height, fill=1, stroke=0)

        # Header
        y_pos = height - 20*mm
        self._draw_logo(c, 20*mm, y_pos, size=38)

        # PROPOSAL title
        c.setFillColor(EMERALD)
        c.setFont(fonts['bold'], 24)
        c.drawRightString(width - 20*mm, y_pos, "PROPOSAL")

        # Dates
        today = datetime.now()
        valid_until = today + timedelta(days=14)

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)
        c.drawRightString(width - 20*mm, y_pos - 12*mm, f"Date: {today.strftime('%d %B %Y')}")
        c.drawRightString(width - 20*mm, y_pos - 20*mm, f"Valid until: {valid_until.strftime('%d %B %Y')}")

        # Line
        y_pos -= 38*mm
        c.setStrokeColor(GRAY_200)
        c.setLineWidth(1)
        c.line(20*mm, y_pos, width - 20*mm, y_pos)

        # PREPARED FOR section
        y_pos -= 10*mm
        c.setFillColor(GRAY_400)
        c.setFont(fonts['semi'], 8)
        c.drawString(20*mm, y_pos, "PREPARED FOR")

        y_pos -= 6*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, client_company)

        y_pos -= 5*mm
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)
        c.drawString(20*mm, y_pos, client_name)

        # PROJECT - right side
        proj_x = width/2 + 10*mm
        proj_y = y_pos + 11*mm

        c.setFillColor(GRAY_400)
        c.setFont(fonts['semi'], 8)
        c.drawString(proj_x, proj_y, "PROJECT")

        proj_y -= 6*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(proj_x, proj_y, project_name[:35])

        # PROJECT UNDERSTANDING
        y_pos -= 12*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "PROJECT UNDERSTANDING")

        y_pos -= 8*mm
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 9)

        # Word wrap
        max_chars = 100
        words = project_description.split()
        lines = []
        current = ""
        for word in words:
            if len(current) + len(word) + 1 <= max_chars:
                current = current + " " + word if current else word
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)

        for line in lines[:2]:
            c.drawString(20*mm, y_pos, line)
            y_pos -= 4.5*mm

        # RECOMMENDED PACKAGE
        y_pos -= 8*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "RECOMMENDED PACKAGE")

        y_pos -= 3*mm

        # Package box
        box_height = 18*mm
        c.setFillColor(GRAY_100)
        c.rect(20*mm, y_pos - box_height, width - 40*mm, box_height, fill=1, stroke=0)
        c.setStrokeColor(EMERALD)
        c.setLineWidth(2)
        c.line(20*mm, y_pos - box_height, 20*mm, y_pos)

        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 12)
        c.drawString(26*mm, y_pos - 7*mm, package_name)

        c.setFillColor(EMERALD)
        c.setFont(fonts['bold'], 16)
        c.drawRightString(width - 26*mm, y_pos - 8*mm, f"${price:,.0f}")

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 8)
        c.drawString(26*mm, y_pos - 13*mm, f"Timeline: {timeline_weeks} weeks from kick-off")

        y_pos -= box_height + 8*mm

        # DELIVERABLES
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "DELIVERABLES")

        y_pos -= 7*mm
        for item in deliverables[:7]:
            c.setFillColor(EMERALD)
            c.setFont(fonts['medium'], 9)
            c.drawString(22*mm, y_pos, "•")
            c.setFillColor(GRAY_600)
            c.setFont(fonts['regular'], 8)
            c.drawString(27*mm, y_pos, item)
            y_pos -= 5*mm

        # PAYMENT TERMS
        y_pos -= 6*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "PAYMENT TERMS")

        y_pos -= 6*mm
        deposit = price / 2

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 8)
        c.drawString(20*mm, y_pos, f"• 50% Deposit: ${deposit:,.0f} – Due upon acceptance")
        y_pos -= 4.5*mm
        c.drawString(20*mm, y_pos, f"• 50% Balance: ${deposit:,.0f} – Due before final delivery")
        y_pos -= 4.5*mm
        c.drawString(20*mm, y_pos, "• Payment methods: Crypto (preferred), Wise, or Bank Transfer")

        # NEXT STEPS
        y_pos -= 7*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "NEXT STEPS")

        y_pos -= 6*mm
        steps = [
            "Reply to accept this proposal",
            "Receive deposit invoice",
            "Work begins upon payment confirmation"
        ]

        for i, step in enumerate(steps, 1):
            c.setFillColor(EMERALD)
            c.setFont(fonts['semi'], 8)
            c.drawString(22*mm, y_pos, f"{i}.")
            c.setFillColor(GRAY_600)
            c.setFont(fonts['regular'], 8)
            c.drawString(28*mm, y_pos, step)
            y_pos -= 4.5*mm

        # Footer
        c.setFillColor(GRAY_200)
        c.rect(0, 0, width, 18*mm, fill=1, stroke=0)

        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['medium'], 8)
        c.drawCentredString(width/2, 10*mm,
            f"JASPER Financial Architecture  •  A service of {settings.COMPANY_NAME}")

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 7)
        c.drawCentredString(width/2, 5*mm,
            f"{settings.COMPANY_WEBSITE}  •  {settings.COMPANY_EMAIL}  •  Terms: {settings.COMPANY_WEBSITE}/terms")

        c.save()
        return str(output_path)

    async def generate_crypto_payment_page(
        self,
        invoice_number: str,
        amount: float,
        currency: str = "USD",
        output_filename: str = None
    ) -> str:
        """
        Generate crypto payment page with QR codes.
        Shows 3% discount and wallet addresses.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._generate_crypto_payment_sync,
            invoice_number, amount, currency, output_filename
        )

    def _generate_crypto_payment_sync(
        self,
        invoice_number: str,
        amount: float,
        currency: str,
        output_filename: str
    ) -> str:
        """Synchronous crypto payment page generation"""
        fonts = self._get_fonts()

        if output_filename is None:
            output_filename = f"Crypto_Payment_{invoice_number}.pdf"

        output_path = OUTPUT_DIR / output_filename
        c = canvas.Canvas(str(output_path), pagesize=A4)
        width, height = A4

        # White background
        c.setFillColor(WHITE)
        c.rect(0, 0, width, height, fill=1, stroke=0)

        # Header
        y_pos = height - 30*mm
        self._draw_logo(c, 20*mm, y_pos, size=35)

        # Title
        c.setFillColor(EMERALD)
        c.setFont(fonts['bold'], 22)
        c.drawRightString(width - 20*mm, y_pos, "CRYPTO PAYMENT")

        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 11)
        c.drawRightString(width - 20*mm, y_pos - 12*mm, f"Invoice: #{invoice_number}")

        # 3% discount calculation
        symbol = self._get_currency_symbol(currency)
        discounted = amount * (1 - settings.CRYPTO_DISCOUNT)

        c.setFillColor(EMERALD)
        c.setFont(fonts['bold'], 14)
        c.drawRightString(width - 20*mm, y_pos - 26*mm,
            f"Pay: {symbol}{discounted:,.2f} ({int(settings.CRYPTO_DISCOUNT * 100)}% off)")

        # Line
        y_pos -= 50*mm
        c.setStrokeColor(GRAY_200)
        c.setLineWidth(1)
        c.line(20*mm, y_pos, width - 20*mm, y_pos)

        # Instructions
        y_pos -= 15*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 12)
        c.drawCentredString(width/2, y_pos, "Scan QR code to pay with your preferred crypto")

        y_pos -= 15*mm

        # Crypto addresses
        cryptos = [
            ("USDT (TRC20)", settings.USDT_TRC20),
            ("USDC (ERC20)", settings.USDC_ERC20),
            ("BTC", settings.BTC_ADDRESS),
        ]

        qr_size = 45*mm
        spacing = (width - 60*mm - 3*qr_size) / 2

        for i, (label, address) in enumerate(cryptos):
            x = 30*mm + i * (qr_size + spacing)

            # QR placeholder
            qr_path = TEMPLATES_DIR / f"qr_{label.split()[0].lower()}.png"
            try:
                if qr_path.exists():
                    qr = ImageReader(str(qr_path))
                    c.drawImage(qr, x, y_pos - qr_size, width=qr_size, height=qr_size,
                               preserveAspectRatio=True)
                else:
                    c.setStrokeColor(GRAY_200)
                    c.rect(x, y_pos - qr_size, qr_size, qr_size, fill=0, stroke=1)
            except Exception:
                c.setStrokeColor(GRAY_200)
                c.rect(x, y_pos - qr_size, qr_size, qr_size, fill=0, stroke=1)

            # Label
            c.setFillColor(EMERALD)
            c.setFont(fonts['semi'], 10)
            c.drawCentredString(x + qr_size/2, y_pos - qr_size - 8*mm, label)

            # Address (truncated)
            c.setFillColor(GRAY_600)
            c.setFont(fonts['regular'], 6)
            addr_short = address[:18] + "..." + address[-6:]
            c.drawCentredString(x + qr_size/2, y_pos - qr_size - 14*mm, addr_short)

        # Full addresses section
        y_pos -= qr_size + 35*mm

        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "FULL WALLET ADDRESSES")

        y_pos -= 10*mm
        for label, address in cryptos:
            c.setFillColor(EMERALD)
            c.setFont(fonts['semi'], 8)
            c.drawString(20*mm, y_pos, f"{label}:")
            c.setFillColor(GRAY_600)
            c.setFont(fonts['regular'], 7)
            c.drawString(55*mm, y_pos, address)
            y_pos -= 8*mm

        # Important notes
        y_pos -= 10*mm
        c.setFillColor(DARK_NAVY)
        c.setFont(fonts['semi'], 10)
        c.drawString(20*mm, y_pos, "IMPORTANT")

        y_pos -= 8*mm
        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 8)
        notes = [
            f"• Send exactly {symbol}{discounted:,.2f} worth of crypto",
            "• USDT must be sent on TRC20 (Tron) network",
            "• USDC must be sent on ERC20 (Ethereum) network",
            "• BTC on Bitcoin mainnet only",
            f"• Include '{invoice_number}' in memo/note if possible",
            f"• Email {settings.COMPANY_EMAIL} after payment with TX hash"
        ]
        for note in notes:
            c.drawString(20*mm, y_pos, note)
            y_pos -= 6*mm

        # Footer
        c.setFillColor(GRAY_200)
        c.rect(0, 0, width, 15*mm, fill=1, stroke=0)

        c.setFillColor(GRAY_600)
        c.setFont(fonts['regular'], 8)
        c.drawCentredString(width/2, 6*mm,
            f"JASPER Financial Architecture  •  {settings.COMPANY_WEBSITE}  •  {settings.COMPANY_EMAIL}")

        c.save()
        return str(output_path)


# Singleton instance
document_service = DocumentService()
