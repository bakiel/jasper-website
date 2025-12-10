# JASPER Client Portal

Professional client management system for JASPER Financial Architecture.

## Features

- **Passwordless Authentication** - Magic link login via email
- **Client Onboarding** - 8-stage pipeline workflow
- **Project Management** - Track projects, milestones, deliverables
- **Invoicing** - Generate invoices with crypto payment support (3% discount)
- **Document Management** - Secure upload/download system
- **Admin Dashboard** - Analytics, pipeline view, client management
- **Email Automation** - Design-aligned email templates

## Tech Stack

- **Backend**: FastAPI + Pydantic
- **Database**: PostgreSQL
- **Auth**: JWT + Magic Links
- **Email**: SMTP (Hostinger)
- **Design System**: JASPER brand (Emerald #2C8A5B, Montserrat font)

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Design System

All components use the JASPER brand guidelines:

```python
COLORS = {
    "emerald": "#2C8A5B",      # Primary accent
    "dark_navy": "#0F172A",    # Primary text
    "gray_600": "#475569",     # Body text
    "gray_100": "#F1F5F9",     # Backgrounds
}

FONTS = {
    "primary": "Montserrat",
    "weights": {"regular": 400, "semibold": 600, "bold": 700}
}
```

## Project Structure

```
jasper-portal/
├── app/
│   ├── api/           # API route handlers
│   ├── core/          # Config, design system
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── main.py        # FastAPI app
├── templates/         # Email templates
├── static/           # CSS, JS, images
└── tests/            # Test suite
```

## Payment Methods

- **Crypto** (3% discount): USDT (TRC20), USDC (ERC20), BTC
- **PayPal**: bakiel7@yahoo.com
- **Bank Transfer**: FNB South Africa

## Deployment

Designed for Hostinger VPS (srv1145603):
- 2 CPU cores, 8GB RAM
- PostgreSQL 16
- Nginx reverse proxy
- SSL via Let's Encrypt
