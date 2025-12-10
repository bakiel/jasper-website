#!/usr/bin/env python3
"""
JASPER Portal - Create Admin User
Run with: python scripts/create_admin.py

Creates a default super admin user for the portal.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.base import SessionLocal, init_db
from app.models.admin_user import AdminUser, AdminRole


def create_admin():
    """Create default admin user"""
    # Initialize database tables first
    init_db()

    db = SessionLocal()

    try:
        # Check if admin already exists
        existing = db.query(AdminUser).filter(
            AdminUser.email == "admin@jasperfinance.org"
        ).first()

        if existing:
            print("Admin user already exists:")
            print(f"  Email: {existing.email}")
            print(f"  Role: {existing.role.value}")
            print("")
            print("To login, use your existing password.")
            print("Or run 'python scripts/reset_admin_password.py' to reset it.")
            return

        print("Creating default super admin user...")

        # Create super admin
        admin = AdminUser(
            email="admin@jasperfinance.org",
            first_name="JASPER",
            last_name="Admin",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
            email_verified=True
        )

        # Set password - use a strong default password
        default_password = "JasperAdmin2025!"
        admin.set_password(default_password)

        db.add(admin)
        db.commit()

        print("")
        print("=" * 50)
        print("ADMIN USER CREATED SUCCESSFULLY")
        print("=" * 50)
        print("")
        print("Login credentials:")
        print(f"  Email:    admin@jasperfinance.org")
        print(f"  Password: {default_password}")
        print("")
        print("IMPORTANT: Change this password after first login!")
        print("")

    except Exception as e:
        db.rollback()
        print(f"Error creating admin: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
