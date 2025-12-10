#!/usr/bin/env python3
"""
JASPER Portal - Seed Sample Data
Run with: python scripts/seed_data.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, date, timedelta
from app.models.base import SessionLocal
from app.models.company import Company, CompanyStatus, Industry
from app.models.contact import Contact
from app.models.project import Project, ProjectStage, Package, Currency
from app.models.milestone import Milestone
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.interaction import Interaction, InteractionType


def seed_database():
    """Insert sample data for testing"""
    db = SessionLocal()

    try:
        # Check if data already exists
        existing = db.query(Company).first()
        if existing:
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database with sample data...")

        # ============================================
        # COMPANY 1: Sunrise Energy (Active Project)
        # ============================================
        sunrise = Company(
            name="Sunrise Energy Ltd",
            trading_name="Sunrise Energy",
            industry=Industry.RENEWABLE_ENERGY,
            status=CompanyStatus.CLIENT,  # Has active project
            country="South Africa",
            city="Cape Town",
            website="https://sunriseenergy.co.za",
            phone="+27 21 555 1234",
            email="info@sunriseenergy.co.za",
            lead_source="Website Inquiry",
            dfi_targets=["ifc", "afdb", "dbsa"],
            project_value_min=50000000,
            project_value_max=100000000,
            notes="50MW solar PV project in Northern Cape"
        )
        db.add(sunrise)
        db.flush()

        # Sunrise contacts
        john = Contact(
            company_id=sunrise.id,
            first_name="John",
            last_name="Smith",
            email="john@sunriseenergy.co.za",
            phone="+27 82 555 1111",
            job_title="CEO",
            is_primary=True,
            is_decision_maker=True,
            portal_access=True
        )
        sarah = Contact(
            company_id=sunrise.id,
            first_name="Sarah",
            last_name="Johnson",
            email="sarah@sunriseenergy.co.za",
            phone="+27 82 555 2222",
            job_title="CFO",
            is_decision_maker=True
        )
        db.add_all([john, sarah])
        db.flush()

        # Sunrise project (in production)
        sunrise_project = Project(
            company_id=sunrise.id,
            contact_id=john.id,
            name="Northern Cape Solar Farm - 50MW",
            reference="JASP-2025-001",
            description="50MW solar PV project seeking IFC funding for construction phase. Land secured, feasibility complete, EIA approved.",
            stage=ProjectStage.PRODUCTION,
            package=Package.INSTITUTIONAL,
            value=2500000,  # $25,000 in cents
            currency=Currency.USD,
            inquiry_date=date.today() - timedelta(days=45),
            start_date=date.today() - timedelta(days=14),
            target_completion=date.today() + timedelta(days=30),
            revision_rounds_used=0,
            revision_rounds_total=3,
            project_sector="Solar PV",
            project_location="Northern Cape, South Africa",
            funding_amount=75000000,
            target_dfis=["ifc", "afdb"]
        )
        db.add(sunrise_project)
        db.flush()

        # Sunrise milestones
        milestones = [
            Milestone(project_id=sunrise_project.id, name="Kick-off Call", order=1,
                     due_date=date.today() - timedelta(days=12), completed=True,
                     completed_date=date.today() - timedelta(days=12)),
            Milestone(project_id=sunrise_project.id, name="Data Collection Complete", order=2,
                     due_date=date.today() - timedelta(days=7), completed=True,
                     completed_date=date.today() - timedelta(days=6)),
            Milestone(project_id=sunrise_project.id, name="Financial Model v1", order=3,
                     due_date=date.today() + timedelta(days=7), completed=False),
            Milestone(project_id=sunrise_project.id, name="Business Plan Draft", order=4,
                     due_date=date.today() + timedelta(days=14), completed=False),
            Milestone(project_id=sunrise_project.id, name="Client Review", order=5,
                     due_date=date.today() + timedelta(days=21), completed=False),
            Milestone(project_id=sunrise_project.id, name="Final Delivery", order=6,
                     due_date=date.today() + timedelta(days=30), completed=False),
        ]
        db.add_all(milestones)

        # Sunrise deposit invoice (paid)
        sunrise_invoice = Invoice(
            project_id=sunrise_project.id,
            invoice_number="INV-2025-001",
            invoice_type=InvoiceType.DEPOSIT,
            amount=1250000,  # $12,500 in cents
            currency="USD",
            final_amount=1212500,  # After 3% crypto discount
            crypto_discount_applied=True,
            discount_amount=37500,
            status=InvoiceStatus.PAID,
            issue_date=date.today() - timedelta(days=14),
            due_date=date.today() - timedelta(days=7),
            paid_at=datetime.now() - timedelta(days=10)
        )
        db.add(sunrise_invoice)

        # Sunrise interactions
        interactions = [
            Interaction(company_id=sunrise.id, contact_id=john.id, project_id=sunrise_project.id,
                       interaction_type=InteractionType.EMAIL_SENT, subject="Inquiry Response",
                       content="Thank you for your interest in JASPER's services...",
                       created_by="models@jasperfinance.org",
                       created_at=datetime.now() - timedelta(days=45)),
            Interaction(company_id=sunrise.id, contact_id=john.id, project_id=sunrise_project.id,
                       interaction_type=InteractionType.VIDEO_CALL, subject="Qualification Call",
                       content="Discussed project scope, timeline, and DFI requirements.",
                       created_by="models@jasperfinance.org",
                       created_at=datetime.now() - timedelta(days=40)),
            Interaction(company_id=sunrise.id, contact_id=john.id, project_id=sunrise_project.id,
                       interaction_type=InteractionType.EMAIL_SENT, subject="Proposal Sent",
                       content="Institutional package proposal sent.",
                       created_by="models@jasperfinance.org",
                       created_at=datetime.now() - timedelta(days=20)),
        ]
        db.add_all(interactions)

        # ============================================
        # COMPANY 2: GreenGrid (Proposal Stage)
        # ============================================
        greengrid = Company(
            name="GreenGrid Infrastructure",
            industry=Industry.INFRASTRUCTURE,
            status=CompanyStatus.PROSPECT,  # Proposal stage
            country="Kenya",
            city="Nairobi",
            website="https://greengrid.co.ke",
            email="info@greengrid.co.ke",
            lead_source="Referral",
            referred_by="AfDB Contact",
            dfi_targets=["afdb", "ifc"],
            project_value_min=100000000,
            project_value_max=250000000
        )
        db.add(greengrid)
        db.flush()

        # GreenGrid contact
        grace = Contact(
            company_id=greengrid.id,
            first_name="Grace",
            last_name="Wanjiku",
            email="grace@greengrid.co.ke",
            phone="+254 722 555 333",
            job_title="Managing Director",
            is_primary=True,
            is_decision_maker=True
        )
        db.add(grace)
        db.flush()

        # GreenGrid project (proposal sent)
        greengrid_project = Project(
            company_id=greengrid.id,
            contact_id=grace.id,
            name="Nairobi Metro Grid Enhancement",
            reference="JASP-2025-002",
            description="Grid modernization project for Nairobi metropolitan area.",
            stage=ProjectStage.PROPOSAL,
            package=Package.INFRASTRUCTURE,
            value=4500000,  # $45,000
            currency=Currency.USD,
            inquiry_date=date.today() - timedelta(days=10),
            project_sector="Power Grid",
            project_location="Nairobi, Kenya",
            funding_amount=180000000,
            target_dfis=["afdb"]
        )
        db.add(greengrid_project)

        # ============================================
        # COMPANY 3: AgriVentures (Inquiry Stage)
        # ============================================
        agri = Company(
            name="AgriVentures Ghana",
            industry=Industry.AGRICULTURE,
            status=CompanyStatus.LEAD,  # Initial inquiry
            country="Ghana",
            city="Accra",
            email="hello@agriventures.gh",
            lead_source="LinkedIn",
            dfi_targets=["afc", "ifc"],
            project_value_min=10000000,
            project_value_max=25000000
        )
        db.add(agri)
        db.flush()

        # AgriVentures contact
        kwame = Contact(
            company_id=agri.id,
            first_name="Kwame",
            last_name="Mensah",
            email="kwame@agriventures.gh",
            phone="+233 24 555 4444",
            job_title="Founder",
            is_primary=True,
            is_decision_maker=True
        )
        db.add(kwame)

        # ============================================
        # COMPANY 4: BlueSea Ports (Completed)
        # ============================================
        bluesea = Company(
            name="BlueSea Port Development",
            industry=Industry.INFRASTRUCTURE,
            status=CompanyStatus.CLIENT,  # Completed project
            country="Nigeria",
            city="Lagos",
            website="https://blueseaports.ng",
            email="info@blueseaports.ng",
            lead_source="Conference",
            dfi_targets=["ifc", "afreximbank"],
            project_value_min=200000000,
            project_value_max=500000000
        )
        db.add(bluesea)
        db.flush()

        # BlueSea contact
        olumide = Contact(
            company_id=bluesea.id,
            first_name="Olumide",
            last_name="Adeyemi",
            email="olumide@blueseaports.ng",
            phone="+234 803 555 5555",
            job_title="CEO",
            is_primary=True,
            is_decision_maker=True,
            portal_access=True
        )
        db.add(olumide)
        db.flush()

        # BlueSea completed project
        bluesea_project = Project(
            company_id=bluesea.id,
            contact_id=olumide.id,
            name="Lagos Deep Water Port Phase 1",
            reference="JASP-2024-015",
            description="Deep water port expansion project.",
            stage=ProjectStage.FINAL,
            package=Package.INFRASTRUCTURE,
            value=4500000,
            currency=Currency.USD,
            inquiry_date=date.today() - timedelta(days=180),
            start_date=date.today() - timedelta(days=150),
            target_completion=date.today() - timedelta(days=60),
            actual_completion=date.today() - timedelta(days=55),
            revision_rounds_used=3,
            revision_rounds_total=4,
            project_sector="Port Infrastructure",
            project_location="Lagos, Nigeria",
            funding_amount=350000000,
            target_dfis=["ifc", "afreximbank"]
        )
        db.add(bluesea_project)
        db.flush()

        # BlueSea invoices (both paid)
        bluesea_deposit = Invoice(
            project_id=bluesea_project.id,
            invoice_number="INV-2024-029",
            invoice_type=InvoiceType.DEPOSIT,
            amount=2250000,
            currency="USD",
            final_amount=2250000,
            status=InvoiceStatus.PAID,
            issue_date=date.today() - timedelta(days=150),
            due_date=date.today() - timedelta(days=143),
            paid_at=datetime.now() - timedelta(days=145)
        )
        bluesea_final = Invoice(
            project_id=bluesea_project.id,
            invoice_number="INV-2024-042",
            invoice_type=InvoiceType.FINAL,
            amount=2250000,
            currency="USD",
            final_amount=2182500,  # 3% crypto discount
            crypto_discount_applied=True,
            discount_amount=67500,
            status=InvoiceStatus.PAID,
            issue_date=date.today() - timedelta(days=60),
            due_date=date.today() - timedelta(days=53),
            paid_at=datetime.now() - timedelta(days=52)
        )
        db.add_all([bluesea_deposit, bluesea_final])

        # Commit all data
        db.commit()
        print("✅ Sample data inserted successfully!")
        print("")
        print("Summary:")
        print(f"  - 4 Companies created")
        print(f"  - 5 Contacts created")
        print(f"  - 3 Projects created")
        print(f"  - 6 Milestones created")
        print(f"  - 3 Invoices created")
        print(f"  - 3 Interactions created")
        print("")
        print("Test accounts:")
        print("  - john@sunriseenergy.co.za (Active project)")
        print("  - olumide@blueseaports.ng (Completed project)")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
