"""
Phase 5.3.0: Observability Console - Database Migration

Creates tables for production-grade observability system:
- apply_runs: Track end-to-end application attempts/runs
- observability_events: Append-only structured event stream

Run this migration:
    python3 migrate_phase5_3.py
"""

import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run_migration():
    """Run Phase 5.3.0 database migration"""
    print("Phase 5.3.0: Observability Console Migration")
    print("=" * 60)
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # ============================================================
            # Table 1: apply_runs
            # ============================================================
            print("\n[1/2] Creating apply_runs table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS apply_runs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    job_id VARCHAR(255),
                    task_id INTEGER,
                    initial_url TEXT NOT NULL,
                    current_url TEXT NOT NULL,
                    ats_kind VARCHAR(100),
                    intent VARCHAR(100),
                    stage VARCHAR(100),
                    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
                    fill_rate FLOAT,
                    fields_attempted INTEGER DEFAULT 0,
                    fields_filled INTEGER DEFAULT 0,
                    fields_skipped INTEGER DEFAULT 0,
                    failure_reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ended_at TIMESTAMP
                );
            """))
            print("✓ apply_runs table created")
            
            # Create indexes for apply_runs
            print("\n   Creating indexes for apply_runs...")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_user_id 
                ON apply_runs(user_id);
            """))
            print("   ✓ idx_apply_runs_user_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_task_id 
                ON apply_runs(task_id);
            """))
            print("   ✓ idx_apply_runs_task_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_ats_kind 
                ON apply_runs(ats_kind);
            """))
            print("   ✓ idx_apply_runs_ats_kind")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_status 
                ON apply_runs(status);
            """))
            print("   ✓ idx_apply_runs_status")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_created_at 
                ON apply_runs(created_at DESC);
            """))
            print("   ✓ idx_apply_runs_created_at")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_user_created 
                ON apply_runs(user_id, created_at DESC);
            """))
            print("   ✓ idx_apply_runs_user_created")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_apply_runs_status_created 
                ON apply_runs(status, created_at DESC);
            """))
            print("   ✓ idx_apply_runs_status_created")
            
            # ============================================================
            # Table 2: observability_events
            # ============================================================
            print("\n[2/2] Creating observability_events table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS observability_events (
                    id SERIAL PRIMARY KEY,
                    run_id INTEGER NOT NULL REFERENCES apply_runs(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    source VARCHAR(20) NOT NULL,
                    severity VARCHAR(10) NOT NULL,
                    event_name VARCHAR(100) NOT NULL,
                    event_version INTEGER DEFAULT 1,
                    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    url TEXT,
                    payload JSONB DEFAULT '{}',
                    dedup_key VARCHAR(255),
                    request_id VARCHAR(100),
                    detection_id VARCHAR(100),
                    page_id VARCHAR(100)
                );
            """))
            print("✓ observability_events table created")
            
            # Create indexes for observability_events
            print("\n   Creating indexes for observability_events...")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_run_id 
                ON observability_events(run_id);
            """))
            print("   ✓ idx_observability_events_run_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_user_id 
                ON observability_events(user_id);
            """))
            print("   ✓ idx_observability_events_user_id")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_event_name 
                ON observability_events(event_name);
            """))
            print("   ✓ idx_observability_events_event_name")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_ts 
                ON observability_events(ts);
            """))
            print("   ✓ idx_observability_events_ts")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_run_ts 
                ON observability_events(run_id, ts);
            """))
            print("   ✓ idx_observability_events_run_ts")
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_event_ts 
                ON observability_events(event_name, ts);
            """))
            print("   ✓ idx_observability_events_event_ts")
            
            # GIN index for JSONB payload (Postgres-specific)
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_observability_events_payload 
                ON observability_events USING gin(payload);
            """))
            print("   ✓ idx_observability_events_payload (GIN)")
            
            # Commit transaction
            trans.commit()
            
            print("\n" + "=" * 60)
            print("✅ Phase 5.3.0 migration completed successfully!")
            print("\nTables created:")
            print("  • apply_runs")
            print("  • observability_events")
            print("\nIndexes created: 15 total")
            print("=" * 60)
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            print("Transaction rolled back.")
            sys.exit(1)

if __name__ == "__main__":
    run_migration()

