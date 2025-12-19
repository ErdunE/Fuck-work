"""
Phase 5.3.2: Auth Bridge Hardening - Database Migration

Adds token_version column to users table for secure token revocation.
Enables logout and account-switching security.

Run this migration:
    python3 migrate_phase5_3_2.py
"""

import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run Phase 5.3.2 database migration"""
    print("Phase 5.3.2: Auth Bridge Hardening Migration")
    print("=" * 60)
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # ============================================================
            # Add token_version column to users table
            # ============================================================
            print("\n[1/1] Adding token_version column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
            """))
            print("✓ token_version column added")
            
            # Create index
            print("\n   Creating index for token_version...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_token_version 
                ON users(token_version);
            """))
            print("   ✓ idx_users_token_version")
            
            # Commit transaction
            trans.commit()
            
            print("\n" + "=" * 60)
            print("✅ Phase 5.3.2 migration completed successfully!")
            print("\nColumn added:")
            print("  • users.token_version (INTEGER, default 1)")
            print("\nIndex created:")
            print("  • idx_users_token_version")
            print("\nPurpose:")
            print("  Enables secure token revocation on logout and account switching")
            print("  Prevents cross-user session contamination")
            print("=" * 60)
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            print("Transaction rolled back.")
            sys.exit(1)

if __name__ == "__main__":
    run_migration()

