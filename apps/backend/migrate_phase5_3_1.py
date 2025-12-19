"""
Phase 5.3.1: Session Bridge - Database Migration

Creates table for active apply sessions to enable deterministic session handoff
from Web Control Plane to Extension.

Run this migration:
    python3 migrate_phase5_3_1.py
"""

import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run Phase 5.3.1 database migration"""
    print("Phase 5.3.1: Session Bridge Migration")
    print("=" * 60)
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # ============================================================
            # Table: active_apply_sessions
            # ============================================================
            print("\n[1/1] Creating active_apply_sessions table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS active_apply_sessions (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    task_id INTEGER NOT NULL REFERENCES apply_tasks(id),
                    run_id INTEGER NOT NULL REFERENCES apply_runs(id),
                    job_url TEXT NOT NULL,
                    ats_type VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("✓ active_apply_sessions table created")
            
            # Create indexes
            print("\n   Creating indexes for active_apply_sessions...")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_active_apply_sessions_run_id 
                ON active_apply_sessions(run_id);
            """))
            print("   ✓ idx_active_apply_sessions_run_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_active_apply_sessions_task_id 
                ON active_apply_sessions(task_id);
            """))
            print("   ✓ idx_active_apply_sessions_task_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_active_apply_sessions_expires 
                ON active_apply_sessions(expires_at);
            """))
            print("   ✓ idx_active_apply_sessions_expires")
            
            # Commit transaction
            trans.commit()
            
            print("\n" + "=" * 60)
            print("✅ Phase 5.3.1 migration completed successfully!")
            print("\nTable created:")
            print("  • active_apply_sessions (1 row per user)")
            print("\nIndexes created: 3 total")
            print("\nPurpose:")
            print("  Enables deterministic session handoff from Web Control Plane")
            print("  to Extension when user clicks 'Start Apply'")
            print("=" * 60)
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            print("Transaction rolled back.")
            sys.exit(1)

if __name__ == "__main__":
    run_migration()

