"""
JASPER CRM - Core CRM Service
Business logic for companies, contacts, projects
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload

from app.models.company import Company, CompanyStatus, Industry
from app.models.contact import Contact
from app.models.project import Project, ProjectStage, Package, PACKAGE_PRICING
from app.models.milestone import Milestone
from app.models.invoice import Invoice, InvoiceType, InvoiceStatus
from app.models.interaction import Interaction, InteractionType
from app.models.magic_link import MagicLink


class CRMService:
    """
    Core CRM operations for JASPER.
    Handles companies, contacts, projects, and pipeline management.
    """

    def __init__(self, db: Session):
        self.db = db

    # ============================================
    # COMPANY OPERATIONS
    # ============================================

    def create_company(
        self,
        name: str,
        industry: Industry = Industry.OTHER,
        country: str = "South Africa",
        lead_source: str = None,
        **kwargs
    ) -> Company:
        """Create a new company/client"""
        company = Company(
            name=name,
            industry=industry,
            country=country,
            status=CompanyStatus.LEAD,
            lead_source=lead_source,
            **kwargs
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def get_company(self, company_id: int) -> Optional[Company]:
        """Get company by ID with relationships"""
        return self.db.execute(
            select(Company)
            .where(Company.id == company_id)
            .options(
                selectinload(Company.contacts),
                selectinload(Company.projects),
            )
        ).scalar_one_or_none()

    def get_companies(
        self,
        status: CompanyStatus = None,
        industry: Industry = None,
        search: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Company]:
        """Get companies with filters"""
        query = select(Company)

        if status:
            query = query.where(Company.status == status)
        if industry:
            query = query.where(Company.industry == industry)
        if search:
            query = query.where(
                or_(
                    Company.name.ilike(f"%{search}%"),
                    Company.email.ilike(f"%{search}%")
                )
            )

        query = query.order_by(Company.created_at.desc())
        query = query.limit(limit).offset(offset)

        return list(self.db.execute(query).scalars().all())

    def update_company(self, company_id: int, **updates) -> Optional[Company]:
        """Update company details"""
        company = self.get_company(company_id)
        if not company:
            return None

        for key, value in updates.items():
            if hasattr(company, key):
                setattr(company, key, value)

        self.db.commit()
        self.db.refresh(company)
        return company

    def update_company_status(
        self,
        company_id: int,
        new_status: CompanyStatus,
        updated_by: str
    ) -> Optional[Company]:
        """Update company status with logging"""
        company = self.get_company(company_id)
        if not company:
            return None

        old_status = company.status
        company.status = new_status
        self.db.commit()

        # Log the change
        interaction = Interaction.add_note(
            company_id=company_id,
            subject=f"Status changed: {old_status.value} → {new_status.value}",
            content=f"Company status updated by {updated_by}",
            created_by=updated_by,
            internal=True
        )
        self.db.add(interaction)
        self.db.commit()

        return company

    # ============================================
    # CONTACT OPERATIONS
    # ============================================

    def create_contact(
        self,
        company_id: int,
        first_name: str,
        last_name: str,
        email: str,
        is_primary: bool = False,
        **kwargs
    ) -> Contact:
        """Create a new contact"""
        # If this is primary, unset other primary contacts
        if is_primary:
            self.db.execute(
                select(Contact)
                .where(Contact.company_id == company_id)
                .where(Contact.is_primary == True)
            )
            for contact in self.db.execute(
                select(Contact).where(
                    and_(Contact.company_id == company_id, Contact.is_primary == True)
                )
            ).scalars():
                contact.is_primary = False

        contact = Contact(
            company_id=company_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            is_primary=is_primary,
            **kwargs
        )
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def get_contact_by_email(self, email: str) -> Optional[Contact]:
        """Get contact by email address"""
        return self.db.execute(
            select(Contact)
            .where(Contact.email == email)
            .options(selectinload(Contact.company))
        ).scalar_one_or_none()

    def get_contact(self, contact_id: int) -> Optional[Contact]:
        """Get contact by ID"""
        return self.db.execute(
            select(Contact)
            .where(Contact.id == contact_id)
            .options(selectinload(Contact.company))
        ).scalar_one_or_none()

    def enable_portal_access(self, contact_id: int) -> Optional[Contact]:
        """Enable portal access for a contact"""
        contact = self.db.query(Contact).filter(Contact.id == contact_id).first()
        if contact:
            contact.portal_access = True
            self.db.commit()
            self.db.refresh(contact)
        return contact

    # ============================================
    # PROJECT OPERATIONS
    # ============================================

    def create_project(
        self,
        company_id: int,
        name: str,
        package: Package = Package.GROWTH,
        contact_id: int = None,
        **kwargs
    ) -> Project:
        """Create a new project"""
        # Generate reference
        year = datetime.now().year
        count = self.db.execute(
            select(func.count(Project.id))
            .where(Project.reference.like(f"JASP-{year}-%"))
        ).scalar() or 0
        reference = Project.generate_reference(year, count + 1)

        # Get package pricing
        package_info = PACKAGE_PRICING.get(package, PACKAGE_PRICING[Package.GROWTH])

        project = Project(
            company_id=company_id,
            contact_id=contact_id,
            name=name,
            reference=reference,
            package=package,
            value=package_info["price"] or 12000,
            revision_rounds_total=package_info["revision_rounds"] or 2,
            stage=ProjectStage.INQUIRY,
            **kwargs
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        # Update company status to prospect
        company = self.get_company(company_id)
        if company and company.status == CompanyStatus.LEAD:
            company.status = CompanyStatus.PROSPECT
            self.db.commit()

        return project

    def get_project(self, project_id: int) -> Optional[Project]:
        """Get project by ID with relationships"""
        return self.db.execute(
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.company),
                selectinload(Project.contact),
                selectinload(Project.milestones),
                selectinload(Project.invoices),
                selectinload(Project.documents),
            )
        ).scalar_one_or_none()

    def get_project_by_reference(self, reference: str) -> Optional[Project]:
        """Get project by reference number"""
        return self.db.execute(
            select(Project)
            .where(Project.reference == reference)
            .options(selectinload(Project.company))
        ).scalar_one_or_none()

    def get_projects_by_stage(self, stage: ProjectStage) -> List[Project]:
        """Get all projects at a specific stage"""
        return list(self.db.execute(
            select(Project)
            .where(Project.stage == stage)
            .options(selectinload(Project.company))
            .order_by(Project.stage_changed_at.desc())
        ).scalars().all())

    def advance_project_stage(
        self,
        project_id: int,
        advanced_by: str
    ) -> Optional[Project]:
        """Move project to next pipeline stage"""
        project = self.get_project(project_id)
        if not project:
            return None

        old_stage = project.stage
        new_stage = project.advance_stage()

        if old_stage != new_stage:
            # Log stage change
            interaction = Interaction.log_stage_change(
                project_id=project_id,
                company_id=project.company_id,
                from_stage=old_stage.value,
                to_stage=new_stage.value,
                created_by=advanced_by
            )
            self.db.add(interaction)

            # If moving to production, create milestones
            if new_stage == ProjectStage.PRODUCTION:
                self._create_project_milestones(project)
                project.start_date = date.today()

            # Update company status if needed
            if new_stage == ProjectStage.DEPOSIT:
                company = self.get_company(project.company_id)
                if company:
                    company.status = CompanyStatus.CLIENT

            self.db.commit()

        return project

    def set_project_stage(
        self,
        project_id: int,
        stage: ProjectStage,
        set_by: str
    ) -> Optional[Project]:
        """Set project to specific stage"""
        project = self.get_project(project_id)
        if not project:
            return None

        old_stage = project.stage
        if old_stage == stage:
            return project

        project.stage = stage
        project.stage_changed_at = datetime.utcnow()

        # Log stage change
        interaction = Interaction.log_stage_change(
            project_id=project_id,
            company_id=project.company_id,
            from_stage=old_stage.value,
            to_stage=stage.value,
            created_by=set_by
        )
        self.db.add(interaction)
        self.db.commit()

        return project

    def _create_project_milestones(self, project: Project):
        """Create default milestones for project"""
        milestones = Milestone.create_default_milestones(
            project_id=project.id,
            package=project.package.value,
            start_date=project.start_date or date.today()
        )
        for milestone in milestones:
            self.db.add(milestone)

    # ============================================
    # INVOICE OPERATIONS
    # ============================================

    def create_deposit_invoice(self, project_id: int) -> Invoice:
        """Create 50% deposit invoice for project"""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Generate invoice number
        year = datetime.now().year
        count = self.db.execute(
            select(func.count(Invoice.id))
            .where(Invoice.invoice_number.like(f"INV-{year}-%"))
        ).scalar() or 0

        invoice = Invoice(
            project_id=project_id,
            invoice_number=Invoice.generate_number(year, count + 1),
            invoice_type=InvoiceType.DEPOSIT,
            amount=project.deposit_amount,
            currency=project.currency.value,
            final_amount=project.deposit_amount,
            due_date=date.today() + timedelta(days=7)
        )
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def create_final_invoice(self, project_id: int) -> Invoice:
        """Create 50% final invoice for project"""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        year = datetime.now().year
        count = self.db.execute(
            select(func.count(Invoice.id))
            .where(Invoice.invoice_number.like(f"INV-{year}-%"))
        ).scalar() or 0

        invoice = Invoice(
            project_id=project_id,
            invoice_number=Invoice.generate_number(year, count + 1),
            invoice_type=InvoiceType.FINAL,
            amount=project.final_amount,
            currency=project.currency.value,
            final_amount=project.final_amount,
            due_date=date.today() + timedelta(days=14)
        )
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def mark_invoice_paid(
        self,
        invoice_id: int,
        payment_method: str,
        reference: str = None
    ) -> Optional[Invoice]:
        """Mark invoice as paid"""
        from app.models.invoice import PaymentMethod

        invoice = self.db.get(Invoice, invoice_id)
        if not invoice:
            return None

        method = PaymentMethod(payment_method)
        invoice.mark_paid(method, reference)

        # Log payment
        project = self.get_project(invoice.project_id)
        if project:
            interaction = Interaction.log_invoice_paid(
                project_id=project.id,
                company_id=project.company_id,
                invoice_number=invoice.invoice_number,
                amount=invoice.final_amount,
                currency=invoice.currency,
                payment_method=payment_method
            )
            self.db.add(interaction)

            # If deposit paid, advance to production
            if invoice.invoice_type == InvoiceType.DEPOSIT:
                self.set_project_stage(
                    project.id,
                    ProjectStage.PRODUCTION,
                    "system"
                )

        self.db.commit()
        return invoice

    # ============================================
    # PIPELINE ANALYTICS
    # ============================================

    def get_pipeline_summary(self) -> Dict[str, Any]:
        """Get pipeline overview stats"""
        stages = {}
        for stage in ProjectStage:
            count = self.db.execute(
                select(func.count(Project.id))
                .where(Project.stage == stage)
            ).scalar() or 0

            value = self.db.execute(
                select(func.sum(Project.value))
                .where(Project.stage == stage)
            ).scalar() or 0

            stages[stage.value] = {
                "count": count,
                "value": value
            }

        total_count = sum(s["count"] for s in stages.values())
        total_value = sum(s["value"] for s in stages.values())

        return {
            "stages": stages,
            "total_count": total_count,
            "total_value": total_value,
            "active_projects": stages.get("production", {}).get("count", 0) +
                              stages.get("draft", {}).get("count", 0)
        }

    def get_revenue_stats(self, year: int = None) -> Dict[str, Any]:
        """Get revenue statistics"""
        if year is None:
            year = datetime.now().year

        # Paid invoices this year
        paid_invoices = self.db.execute(
            select(Invoice)
            .where(Invoice.status == InvoiceStatus.PAID)
            .where(func.extract('year', Invoice.paid_at) == year)
        ).scalars().all()

        total_revenue = sum(inv.final_amount for inv in paid_invoices)
        invoice_count = len(paid_invoices)

        # Group by month
        monthly = {}
        for inv in paid_invoices:
            month = inv.paid_at.month
            if month not in monthly:
                monthly[month] = 0
            monthly[month] += inv.final_amount

        return {
            "year": year,
            "total_revenue": total_revenue,
            "invoice_count": invoice_count,
            "monthly": monthly,
            "average_invoice": total_revenue / invoice_count if invoice_count > 0 else 0
        }

    # ============================================
    # MAGIC LINK AUTH
    # ============================================

    def create_magic_link(
        self,
        email: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Optional[MagicLink]:
        """Create magic link for contact login"""
        contact = self.get_contact_by_email(email)
        if not contact or not contact.portal_access:
            return None

        magic_link = MagicLink.create_for_contact(
            contact_id=contact.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(magic_link)
        self.db.commit()
        self.db.refresh(magic_link)
        return magic_link

    def verify_magic_link(self, token: str) -> Optional[Contact]:
        """Verify magic link and return contact"""
        magic_link = self.db.execute(
            select(MagicLink)
            .where(MagicLink.token == token)
            .options(selectinload(MagicLink.contact))
        ).scalar_one_or_none()

        if not magic_link or not magic_link.is_valid:
            return None

        # Mark as used
        magic_link.mark_used()

        # Update contact last login
        contact = magic_link.contact
        contact.last_login = datetime.utcnow()

        # Log portal login
        interaction = Interaction.log_portal_login(
            contact_id=contact.id,
            company_id=contact.company_id
        )
        self.db.add(interaction)
        self.db.commit()

        return contact


# Import for type hints
from datetime import timedelta
