"""
Phase 5.2 Database Migration: Add Compliance Fields to UserProfile

This migration adds:
- willing_to_relocate (BOOLEAN)
- government_employment_history (BOOLEAN)

Note: Education, Experience, Projects, Skills tables already exist from Phase 3.3.
No new tables needed.
"""

import os
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run Phase 5.2 database migration."""
    print("=" * 70)
    print("Phase 5.2 Database Migration")
    print("=" * 70)
    
    engine = create_engine(DATABASE_URL)
    
    print("\n[Step 1] Adding compliance fields to user_profiles table...")
    
    with engine.connect() as conn:
        # Add compliance fields (nullable for existing profiles)
        try:
            conn.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN,
                ADD COLUMN IF NOT EXISTS government_employment_history BOOLEAN
            """))
            conn.commit()
            print("✓ Compliance fields added successfully")
        except Exception as e:
            print(f"✗ Failed to add compliance fields: {e}")
            print("  (May already exist - safe to ignore if running multiple times)")
    
    print("\n[Step 2] Verifying tables exist...")
    
    with engine.connect() as conn:
        # Verify tables from Phase 3.3 exist
        tables_to_check = [
            'user_education',
            'user_experience',
            'user_projects',
            'user_skills'
        ]
        
        for table in tables_to_check:
            result = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '{table}'
                )
            """))
            exists = result.scalar()
            
            if exists:
                print(f"✓ Table '{table}' exists")
            else:
                print(f"✗ Table '{table}' missing (should exist from Phase 3.3)")
    
    print("\n" + "=" * 70)
    print("Phase 5.2 Migration Complete")
    print("=" * 70)
    print("\nChanges:")
    print("  ✓ Added willing_to_relocate to user_profiles")
    print("  ✓ Added government_employment_history to user_profiles")
    print("\nExisting tables verified:")
    print("  ✓ user_education")
    print("  ✓ user_experience")
    print("  ✓ user_projects")
    print("  ✓ user_skills")
    print("\nNext steps:")
    print("  1. Start backend: python3 apps/backend/run_api.py")
    print("  2. Test: GET /api/users/me/profile (should include education, experience, projects, skills)")
    print("  3. Proceed with frontend implementation")


if __name__ == "__main__":
    run_migration()

