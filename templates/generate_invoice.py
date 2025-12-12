#!/usr/bin/env python3
"""
JASPER Financial Architecture - Invoice Generator V3
Clean, professional white-background design with Montserrat font
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from datetime import datetime, timedelta
import os
import urllib.request

# Brand colors - Clean professional palette
DARK_NAVY = HexColor('#0F172A')       # Primary text
NAVY = HexColor('#1E293B')            # Secondary text
EMERALD = HexColor('#2C8A5B')         # Brand accent
EMERALD_DARK = HexColor('#1E6B45')    # Darker accent
GRAY_600 = HexColor('#475569')        # Body text
GRAY_400 = HexColor('#94A3B8')        # Muted text
GRAY_200 = HexColor('#E2E8F0')        # Borders/lines
GRAY_100 = HexColor('#F1F5F9')        # Light backgrounds
WHITE = HexColor('#FFFFFF')

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, 'fonts')

def setup_fonts():
    """Download and register Montserrat fonts"""
    os.makedirs(FONT_DIR, exist_ok=True)

    fonts = {
        'Montserrat': 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf',
        'Montserrat-Bold': 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf',
        'Montserrat-SemiBold': 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-SemiBold.ttf',
        'Montserrat-Medium': 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Medium.ttf',
    }

    for font_name, url in fonts.items():
        font_path = os.path.join(FONT_DIR, f'{font_name}.ttf')
        if not os.path.exists(font_path):
            try:
                print(f"Downloading {font_name}...")
                urllib.request.urlretrieve(url, font_path)
            except Exception as e:
                print(f"Could not download {font_name}: {e}")
                return False

        try:
            pdfmetrics.registerFont(TTFont(font_name, font_path))
        except Exception as e:
            print(f"Could not register {font_name}: {e}")
            return False

    return True


def generate_invoice_v3(
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
    output_path: str = None
):
    """Generate a clean professional JASPER invoice PDF"""

    fonts_ok = setup_fonts()
    font_regular = 'Montserrat' if fonts_ok else 'Helvetica'
    font_bold = 'Montserrat-Bold' if fonts_ok else 'Helvetica-Bold'
    font_semi = 'Montserrat-SemiBold' if fonts_ok else 'Helvetica-Bold'
    font_medium = 'Montserrat-Medium' if fonts_ok else 'Helvetica'

    if output_path is None:
        output_path = f"Invoice_{invoice_number}.pdf"

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # White background
    c.setFillColor(WHITE)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # === HEADER SECTION ===
    y_pos = height - 25*mm

    # Logo on left
    logo_path = os.path.join(SCRIPT_DIR, 'logo.png')
    try:
        if os.path.exists(logo_path):
            logo = ImageReader(logo_path)
            c.drawImage(logo, 20*mm, y_pos - 25*mm, width=50*mm, height=50*mm,
                       preserveAspectRatio=True, mask='auto')
    except Exception as e:
        print(f"Logo error: {e}")
        c.setFillColor(DARK_NAVY)
        c.setFont(font_bold, 20)
        c.drawString(20*mm, y_pos - 5*mm, "JASPER")
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 8)
        c.drawString(20*mm, y_pos - 12*mm, "FINANCIAL ARCHITECTURE")

    # INVOICE title on right
    c.setFillColor(EMERALD)
    c.setFont(font_bold, 28)
    c.drawRightString(width - 20*mm, y_pos, "INVOICE")

    # Invoice number
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 12)
    c.drawRightString(width - 20*mm, y_pos - 12*mm, f"#{invoice_number}")

    # Dates
    today = datetime.now()
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)
    c.drawRightString(width - 20*mm, y_pos - 25*mm, f"Date: {today.strftime('%d %B %Y')}")
    c.drawRightString(width - 20*mm, y_pos - 33*mm, "Due: Upon Receipt")

    # === HORIZONTAL LINE ===
    y_pos -= 50*mm
    c.setStrokeColor(GRAY_200)
    c.setLineWidth(1)
    c.line(20*mm, y_pos, width - 20*mm, y_pos)

    # === FROM / BILL TO SECTION ===
    y_pos -= 15*mm

    # FROM
    c.setFillColor(GRAY_400)
    c.setFont(font_semi, 8)
    c.drawString(20*mm, y_pos, "FROM")

    y_pos -= 8*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 11)
    c.drawString(20*mm, y_pos, "Gahn Eden (Pty) Ltd")

    y_pos -= 6*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)
    from_lines = [
        "Reg: 2015/272887/07",
        "17 Wattle Street, Florida Park",
        "Roodepoort, 1709, South Africa",
        "models@jasperfinance.org"
    ]
    for line in from_lines:
        c.drawString(20*mm, y_pos, line)
        y_pos -= 5*mm

    # BILL TO - right side
    bill_y = height - 90*mm - 15*mm
    bill_x = width/2 + 10*mm

    c.setFillColor(GRAY_400)
    c.setFont(font_semi, 8)
    c.drawString(bill_x, bill_y, "BILL TO")

    bill_y -= 8*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 11)
    c.drawString(bill_x, bill_y, client_company)

    bill_y -= 6*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)
    c.drawString(bill_x, bill_y, client_name)
    if client_email:
        bill_y -= 5*mm
        c.drawString(bill_x, bill_y, client_email)

    # === PROJECT SECTION ===
    y_pos -= 15*mm

    c.setFillColor(GRAY_400)
    c.setFont(font_semi, 8)
    c.drawString(20*mm, y_pos, "PROJECT")

    y_pos -= 8*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_medium, 12)
    c.drawString(20*mm, y_pos, project_name)

    # === LINE ITEMS TABLE ===
    y_pos -= 20*mm

    # Table header background
    c.setFillColor(GRAY_100)
    c.rect(20*mm, y_pos - 8*mm, width - 40*mm, 12*mm, fill=1, stroke=0)

    # Table header text
    c.setFillColor(GRAY_600)
    c.setFont(font_semi, 9)
    c.drawString(25*mm, y_pos - 3*mm, "DESCRIPTION")
    c.drawRightString(width - 25*mm, y_pos - 3*mm, "AMOUNT")

    # Line item
    y_pos -= 22*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_regular, 10)

    description = f"{package_name}"
    if invoice_type and total_amount:
        description += f" - {invoice_type} (50%)"

    c.drawString(25*mm, y_pos, description)

    # Amount
    currency_symbols = {"USD": "$", "ZAR": "R", "EUR": "€", "GBP": "£"}
    symbol = currency_symbols.get(currency, "$")

    c.setFont(font_medium, 10)
    c.drawRightString(width - 25*mm, y_pos, f"{symbol}{amount:,.2f}")

    # Bottom border for line item
    y_pos -= 8*mm
    c.setStrokeColor(GRAY_200)
    c.line(20*mm, y_pos, width - 20*mm, y_pos)

    # === TOTAL SECTION ===
    y_pos -= 15*mm

    # Total background
    total_width = 80*mm
    total_x = width - 20*mm - total_width
    c.setFillColor(EMERALD)
    c.rect(total_x, y_pos - 12*mm, total_width, 20*mm, fill=1, stroke=0)

    # Total text
    c.setFillColor(WHITE)
    c.setFont(font_semi, 10)
    c.drawString(total_x + 10*mm, y_pos - 3*mm, "TOTAL DUE")

    c.setFont(font_bold, 16)
    c.drawRightString(width - 25*mm, y_pos - 4*mm, f"{symbol}{amount:,.2f}")

    # === PAYMENT SECTION ===
    y_pos -= 30*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "PAYMENT OPTIONS")

    y_pos -= 10*mm

    # Payment methods in columns
    col_width = (width - 50*mm) / 3

    methods = [
        ("CRYPTO (3% discount)", ["USDT: TGuLFWbrNo4n1bYaEjXYJLZo48CqvPj7RJ", "USDC: 0xd1c356043fc7875d38f1b29d7fca758b5299ca2d", "BTC: 12aUK98uqkordBWfmCnhyQdT52sHzXCVCX"]),
        ("PAYPAL", ["bakiel7@yahoo.com", "", ""]),
        ("FNB BANK / SWIFT", ["Gahn Eden (Pty) Ltd", "Acc: 63180306061", "Branch: 250655 SWIFT: FIRNZAJJ"])
    ]

    for i, (title, lines) in enumerate(methods):
        x = 20*mm + i * col_width

        c.setFillColor(EMERALD)
        c.setFont(font_semi, 8)
        c.drawString(x, y_pos, title)

        c.setFillColor(GRAY_600)
        # Smaller font for crypto addresses
        font_size = 5 if i == 0 else 7
        c.setFont(font_regular, font_size)
        for j, line in enumerate(lines):
            if line:
                c.drawString(x, y_pos - (6 + j*4)*mm, line)

    # === NOTE ===
    y_pos -= 25*mm
    c.setFillColor(GRAY_400)
    c.setFont(font_regular, 7)
    c.drawString(20*mm, y_pos, f"Please include invoice number {invoice_number} in payment reference.")

    # === FOOTER ===
    c.setFillColor(GRAY_200)
    c.rect(0, 0, width, 15*mm, fill=1, stroke=0)

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 8)
    c.drawCentredString(width/2, 6*mm, "JASPER Financial Architecture  •  jasperfinance.org  •  models@jasperfinance.org")

    c.save()
    print(f"Invoice V3 generated: {output_path}")
    return output_path


def generate_proposal_v3(
    client_name: str,
    client_company: str,
    project_name: str,
    project_description: str,
    package_name: str,
    price: float,
    timeline_weeks: int,
    deliverables: list,
    exclusions: list = None,
    output_path: str = None
):
    """Generate a clean professional JASPER proposal PDF"""

    fonts_ok = setup_fonts()
    font_regular = 'Montserrat' if fonts_ok else 'Helvetica'
    font_bold = 'Montserrat-Bold' if fonts_ok else 'Helvetica-Bold'
    font_semi = 'Montserrat-SemiBold' if fonts_ok else 'Helvetica-Bold'
    font_medium = 'Montserrat-Medium' if fonts_ok else 'Helvetica'

    if output_path is None:
        safe_project = project_name.replace(' ', '_').replace('/', '-')
        output_path = f"Proposal_{safe_project}_{datetime.now().strftime('%Y%m%d')}.pdf"

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # White background
    c.setFillColor(WHITE)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # === HEADER ===
    y_pos = height - 20*mm

    # Logo - smaller
    logo_path = os.path.join(SCRIPT_DIR, 'logo.png')
    try:
        if os.path.exists(logo_path):
            logo = ImageReader(logo_path)
            c.drawImage(logo, 20*mm, y_pos - 20*mm, width=38*mm, height=38*mm,
                       preserveAspectRatio=True, mask='auto')
    except Exception as e:
        print(f"Logo error: {e}")
        c.setFillColor(DARK_NAVY)
        c.setFont(font_bold, 16)
        c.drawString(20*mm, y_pos - 5*mm, "JASPER")
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 7)
        c.drawString(20*mm, y_pos - 10*mm, "FINANCIAL ARCHITECTURE")

    # PROPOSAL title
    c.setFillColor(EMERALD)
    c.setFont(font_bold, 24)
    c.drawRightString(width - 20*mm, y_pos, "PROPOSAL")

    # Dates
    today = datetime.now()
    valid_until = today + timedelta(days=14)

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)
    c.drawRightString(width - 20*mm, y_pos - 12*mm, f"Date: {today.strftime('%d %B %Y')}")
    c.drawRightString(width - 20*mm, y_pos - 20*mm, f"Valid until: {valid_until.strftime('%d %B %Y')}")

    # Line
    y_pos -= 38*mm
    c.setStrokeColor(GRAY_200)
    c.setLineWidth(1)
    c.line(20*mm, y_pos, width - 20*mm, y_pos)

    # === PREPARED FOR / PROJECT ===
    y_pos -= 10*mm

    # Prepared For
    c.setFillColor(GRAY_400)
    c.setFont(font_semi, 8)
    c.drawString(20*mm, y_pos, "PREPARED FOR")

    y_pos -= 6*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, client_company)

    y_pos -= 5*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)
    c.drawString(20*mm, y_pos, client_name)

    # Project - right side (same row as PREPARED FOR)
    proj_x = width/2 + 10*mm
    proj_y = y_pos + 11*mm

    c.setFillColor(GRAY_400)
    c.setFont(font_semi, 8)
    c.drawString(proj_x, proj_y, "PROJECT")

    proj_y -= 6*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(proj_x, proj_y, project_name[:35])

    # === PROJECT UNDERSTANDING ===
    y_pos -= 12*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "PROJECT UNDERSTANDING")

    y_pos -= 8*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 9)

    # Word wrap - more compact
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

    # === RECOMMENDED PACKAGE ===
    y_pos -= 8*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "RECOMMENDED PACKAGE")

    y_pos -= 3*mm

    # Package box with emerald border - more compact
    box_height = 18*mm
    c.setFillColor(GRAY_100)
    c.rect(20*mm, y_pos - box_height, width - 40*mm, box_height, fill=1, stroke=0)
    c.setStrokeColor(EMERALD)
    c.setLineWidth(2)
    c.line(20*mm, y_pos - box_height, 20*mm, y_pos)  # Left border accent

    # Package details
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 12)
    c.drawString(26*mm, y_pos - 7*mm, package_name)

    c.setFillColor(EMERALD)
    c.setFont(font_bold, 16)
    c.drawRightString(width - 26*mm, y_pos - 8*mm, f"${price:,.0f}")

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 8)
    c.drawString(26*mm, y_pos - 13*mm, f"Timeline: {timeline_weeks} weeks from kick-off")

    y_pos -= box_height + 8*mm

    # === DELIVERABLES ===
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "DELIVERABLES")

    y_pos -= 7*mm

    for item in deliverables[:7]:
        c.setFillColor(EMERALD)
        c.setFont(font_medium, 9)
        c.drawString(22*mm, y_pos, "•")
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 8)
        c.drawString(27*mm, y_pos, item)
        y_pos -= 5*mm

    # === PAYMENT TERMS ===
    y_pos -= 6*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "PAYMENT TERMS")

    y_pos -= 6*mm
    deposit = price / 2

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 8)
    c.drawString(20*mm, y_pos, f"• 50% Deposit: ${deposit:,.0f} – Due upon acceptance")
    y_pos -= 4.5*mm
    c.drawString(20*mm, y_pos, f"• 50% Balance: ${deposit:,.0f} – Due before final delivery")
    y_pos -= 4.5*mm
    c.drawString(20*mm, y_pos, "• Payment methods: Crypto (preferred), Wise, or Bank Transfer")

    # === NEXT STEPS ===
    y_pos -= 7*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "NEXT STEPS")

    y_pos -= 6*mm
    steps = [
        "Reply to accept this proposal",
        "Receive deposit invoice",
        "Work begins upon payment confirmation"
    ]

    for i, step in enumerate(steps, 1):
        c.setFillColor(EMERALD)
        c.setFont(font_semi, 8)
        c.drawString(22*mm, y_pos, f"{i}.")
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 8)
        c.drawString(28*mm, y_pos, step)
        y_pos -= 4.5*mm

    # === FOOTER ===
    c.setFillColor(GRAY_200)
    c.rect(0, 0, width, 18*mm, fill=1, stroke=0)

    c.setFillColor(DARK_NAVY)
    c.setFont(font_medium, 8)
    c.drawCentredString(width/2, 10*mm, "JASPER Financial Architecture  •  A service of Gahn Eden (Pty) Ltd")

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 7)
    c.drawCentredString(width/2, 5*mm, "jasperfinance.org  •  models@jasperfinance.org  •  Terms: jasperfinance.org/terms")

    c.save()
    print(f"Proposal V3 generated: {output_path}")
    return output_path


def generate_crypto_payment_page(
    invoice_number: str,
    amount: float,
    currency: str = "USD",
    output_path: str = None
):
    """Generate a crypto payment page with QR codes"""

    fonts_ok = setup_fonts()
    font_regular = 'Montserrat' if fonts_ok else 'Helvetica'
    font_bold = 'Montserrat-Bold' if fonts_ok else 'Helvetica-Bold'
    font_semi = 'Montserrat-SemiBold' if fonts_ok else 'Helvetica-Bold'
    font_medium = 'Montserrat-Medium' if fonts_ok else 'Helvetica'

    if output_path is None:
        output_path = f"Crypto_Payment_{invoice_number}.pdf"

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # White background
    c.setFillColor(WHITE)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Header
    y_pos = height - 30*mm

    # Logo
    logo_path = os.path.join(SCRIPT_DIR, 'logo.png')
    try:
        if os.path.exists(logo_path):
            logo = ImageReader(logo_path)
            c.drawImage(logo, 20*mm, y_pos - 20*mm, width=35*mm, height=35*mm,
                       preserveAspectRatio=True, mask='auto')
    except:
        pass

    # Title
    c.setFillColor(EMERALD)
    c.setFont(font_bold, 22)
    c.drawRightString(width - 20*mm, y_pos, "CRYPTO PAYMENT")

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 11)
    c.drawRightString(width - 20*mm, y_pos - 12*mm, f"Invoice: #{invoice_number}")

    # 3% discount calculation
    currency_symbols = {"USD": "$", "ZAR": "R", "EUR": "€", "GBP": "£"}
    symbol = currency_symbols.get(currency, "$")
    discounted = amount * 0.97

    c.setFillColor(EMERALD)
    c.setFont(font_bold, 14)
    c.drawRightString(width - 20*mm, y_pos - 26*mm, f"Pay: {symbol}{discounted:,.2f} (3% off)")

    # Line
    y_pos -= 50*mm
    c.setStrokeColor(GRAY_200)
    c.setLineWidth(1)
    c.line(20*mm, y_pos, width - 20*mm, y_pos)

    # QR codes section
    y_pos -= 15*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 12)
    c.drawCentredString(width/2, y_pos, "Scan QR code to pay with your preferred crypto")

    y_pos -= 15*mm

    # Three QR codes side by side
    qr_size = 45*mm
    spacing = (width - 60*mm - 3*qr_size) / 2

    cryptos = [
        ("USDT (TRC20)", "qr_usdt.png", "TGuLFWbrNo4n1bYaEjXYJLZo48CqvPj7RJ"),
        ("USDC (ERC20)", "qr_usdc.png", "0xd1c356043fc7875d38f1b29d7fca758b5299ca2d"),
        ("BTC", "qr_btc.png", "12aUK98uqkordBWfmCnhyQdT52sHzXCVCX"),
    ]

    for i, (label, qr_file, address) in enumerate(cryptos):
        x = 30*mm + i * (qr_size + spacing)

        # QR code
        qr_path = os.path.join(SCRIPT_DIR, qr_file)
        try:
            if os.path.exists(qr_path):
                qr = ImageReader(qr_path)
                c.drawImage(qr, x, y_pos - qr_size, width=qr_size, height=qr_size,
                           preserveAspectRatio=True)
        except Exception as e:
            # Draw placeholder
            c.setStrokeColor(GRAY_200)
            c.rect(x, y_pos - qr_size, qr_size, qr_size, fill=0, stroke=1)

        # Label
        c.setFillColor(EMERALD)
        c.setFont(font_semi, 10)
        c.drawCentredString(x + qr_size/2, y_pos - qr_size - 8*mm, label)

        # Address (truncated)
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 6)
        addr_short = address[:18] + "..." + address[-6:]
        c.drawCentredString(x + qr_size/2, y_pos - qr_size - 14*mm, addr_short)

    # Full addresses section
    y_pos -= qr_size + 35*mm

    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "FULL WALLET ADDRESSES")

    y_pos -= 10*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 7)

    for label, _, address in cryptos:
        c.setFillColor(EMERALD)
        c.setFont(font_semi, 8)
        c.drawString(20*mm, y_pos, f"{label}:")
        c.setFillColor(GRAY_600)
        c.setFont(font_regular, 7)
        c.drawString(55*mm, y_pos, address)
        y_pos -= 8*mm

    # Important notes
    y_pos -= 10*mm
    c.setFillColor(DARK_NAVY)
    c.setFont(font_semi, 10)
    c.drawString(20*mm, y_pos, "IMPORTANT")

    y_pos -= 8*mm
    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 8)
    notes = [
        f"• Send exactly {symbol}{discounted:,.2f} worth of crypto",
        "• USDT must be sent on TRC20 (Tron) network",
        "• USDC must be sent on ERC20 (Ethereum) network",
        "• BTC on Bitcoin mainnet only",
        f"• Include '{invoice_number}' in memo/note if possible",
        "• Email models@jasperfinance.org after payment with TX hash"
    ]
    for note in notes:
        c.drawString(20*mm, y_pos, note)
        y_pos -= 6*mm

    # Footer
    c.setFillColor(GRAY_200)
    c.rect(0, 0, width, 15*mm, fill=1, stroke=0)

    c.setFillColor(GRAY_600)
    c.setFont(font_regular, 8)
    c.drawCentredString(width/2, 6*mm, "JASPER Financial Architecture  •  jasperfinance.org  •  models@jasperfinance.org")

    c.save()
    print(f"Crypto payment page generated: {output_path}")
    return output_path


if __name__ == "__main__":
    # Generate sample invoice
    generate_invoice_v3(
        invoice_number="JASPER-2025-001",
        client_name="John Smith",
        client_company="Sunrise Energy Ltd",
        client_email="john@sunriseenergy.com",
        project_name="Sunrise Solar Farm - 50MW",
        package_name="Institutional Package",
        amount=12500.00,
        currency="USD",
        invoice_type="Deposit",
        total_amount=25000.00,
        output_path=os.path.join(SCRIPT_DIR, "invoice_v3.pdf")
    )

    # Generate sample proposal
    generate_proposal_v3(
        client_name="John Smith",
        client_company="Sunrise Energy Ltd",
        project_name="Sunrise Solar Farm - 50MW",
        project_description="A 50MW solar PV project in the Northern Cape seeking IFC funding for construction and grid connection. The project has completed feasibility and has land rights secured.",
        package_name="Institutional Package",
        price=25000,
        timeline_weeks=5,
        deliverables=[
            "28-sheet integrated financial model",
            "Full business plan (60+ pages)",
            "Executive summary",
            "Investment memorandum",
            "IFC-formatted package",
            "Model documentation",
            "2 revision rounds"
        ],
        output_path=os.path.join(SCRIPT_DIR, "proposal_v3.pdf")
    )

    # Generate crypto payment page
    generate_crypto_payment_page(
        invoice_number="JASPER-2025-001",
        amount=12500.00,
        currency="USD",
        output_path=os.path.join(SCRIPT_DIR, "crypto_payment.pdf")
    )
