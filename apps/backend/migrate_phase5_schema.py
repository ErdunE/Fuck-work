"""
Phase 5.0 Database Migration Script
Adds Web Control Plane tables and columns.

Run this after Phase 4.3 to add:
- User authentication fields (password_hash, last_login_at, is_active)
- Extended user_profiles fields (resume, professional links, etc.)
- automation_preferences table (CRITICAL - system of record)
- automation_events table (audit log for debugging)
"""

import sys
from sqlalchemy import text
from database import engine, SessionLocal, test_connection


def check_column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    db = SessionLocal()
    try:
        result = db.execute(text(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='{table_name}' 
            AND column_name='{column_name}'
        """))
        return result.fetchone() is not None
    finally:
        db.close()


def check_table_exists(table_name):
    """Check if a table exists."""
    db = SessionLocal()
    try:
        result = db.execute(text(f"""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='{table_name}'
        """))
        return result.fetchone() is not None
    finally:
        db.close()


def migrate_users_table():
    """Add Phase 5.0 authentication fields to users table."""
    print("\n=== Migrating users table ===")
    
    db = SessionLocal()
    try:
        # Add password_hash column
        if not check_column_exists('users', 'password_hash'):
            print("Adding password_hash column...")
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN password_hash VARCHAR(255)
            """))
            db.commit()
            print("✓ Added password_hash")
        else:
            print("✓ password_hash already exists")
        
        # Add last_login_at column
        if not check_column_exists('users', 'last_login_at'):
            print("Adding last_login_at column...")
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_login_at TIMESTAMP
            """))
            db.commit()
            print("✓ Added last_login_at")
        else:
            print("✓ last_login_at already exists")
        
        # Add is_active column
        if not check_column_exists('users', 'is_active'):
            print("Adding is_active column...")
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
            """))
            db.commit()
            print("✓ Added is_active")
        else:
            print("✓ is_active already exists")
            
    except Exception as e:
        print(f"✗ Error migrating users table: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def migrate_user_profiles_table():
    """Add Phase 5.0 fields to user_profiles table."""
    print("\n=== Migrating user_profiles table ===")
    
    db = SessionLocal()
    try:
        # Add version column
        if not check_column_exists('user_profiles', 'version'):
            print("Adding version column...")
            db.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN version INTEGER DEFAULT 1
            """))
            db.commit()
            print("✓ Added version")
        else:
            print("✓ version already exists")
        
        # Add full_name column
        if not check_column_exists('user_profiles', 'full_name'):
            print("Adding full_name column...")
            db.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN full_name VARCHAR(255)
            """))
            db.commit()
            print("✓ Added full_name")
        else:
            print("✓ full_name already exists")
        
        # Add primary_email column
        if not check_column_exists('user_profiles', 'primary_email'):
            print("Adding primary_email column...")
            db.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN primary_email VARCHAR(255)
            """))
            db.commit()
            print("✓ Added primary_email")
        else:
            print("✓ primary_email already exists")
        
        # Add secondary_email column
        if not check_column_exists('user_profiles', 'secondary_email'):
            print("Adding secondary_email column...")
            db.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN secondary_email VARCHAR(255)
            """))
            db.commit()
            print("✓ Added secondary_email")
        else:
            print("✓ secondary_email already exists")
        
        # Add postal_code column
        if not check_column_exists('user_profiles', 'postal_code'):
            print("Adding postal_code column...")
            db.execute(text("""
                ALTER TABLE user_profiles 
                ADD COLUMN postal_code VARCHAR(20)
            """))
            db.commit()
            print("✓ Added postal_code")
        else:
            print("✓ postal_code already exists")
        
        # Add resume fields
        for field in ['resume_url', 'resume_filename', 'resume_uploaded_at']:
            if not check_column_exists('user_profiles', field):
                print(f"Adding {field} column...")
                if field == 'resume_url':
                    db.execute(text(f"""
                        ALTER TABLE user_profiles 
                        ADD COLUMN {field} VARCHAR(1024)
                    """))
                elif field == 'resume_filename':
                    db.execute(text(f"""
                        ALTER TABLE user_profiles 
                        ADD COLUMN {field} VARCHAR(255)
                    """))
                else:  # resume_uploaded_at
                    db.execute(text(f"""
                        ALTER TABLE user_profiles 
                        ADD COLUMN {field} TIMESTAMP
                    """))
                db.commit()
                print(f"✓ Added {field}")
            else:
                print(f"✓ {field} already exists")
        
        # Add professional URL fields
        for field in ['linkedin_url', 'portfolio_url', 'github_url']:
            if not check_column_exists('user_profiles', field):
                print(f"Adding {field} column...")
                db.execute(text(f"""
                    ALTER TABLE user_profiles 
                    ADD COLUMN {field} VARCHAR(512)
                """))
                db.commit()
                print(f"✓ Added {field}")
            else:
                print(f"✓ {field} already exists")
                
        # Extend existing VARCHAR columns
        print("Extending VARCHAR column lengths...")
        db.execute(text("""
            ALTER TABLE user_profiles 
            ALTER COLUMN first_name TYPE VARCHAR(255),
            ALTER COLUMN last_name TYPE VARCHAR(255),
            ALTER COLUMN city TYPE VARCHAR(255)
        """))
        db.commit()
        print("✓ Extended VARCHAR columns")
            
    except Exception as e:
        print(f"✗ Error migrating user_profiles table: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_automation_preferences_table():
    """Create automation_preferences table (CRITICAL for Phase 5.0)."""
    print("\n=== Creating automation_preferences table ===")
    
    if check_table_exists('automation_preferences'):
        print("✓ automation_preferences table already exists")
        return
    
    db = SessionLocal()
    try:
        db.execute(text("""
            CREATE TABLE automation_preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                version INTEGER DEFAULT 1,
                
                -- Global Automation Settings
                auto_fill_after_login BOOLEAN DEFAULT TRUE,
                auto_submit_when_ready BOOLEAN DEFAULT FALSE,
                require_review_before_submit BOOLEAN DEFAULT TRUE,
                
                -- Future Expansion Hooks
                per_ats_overrides JSONB DEFAULT '{}',
                field_autofill_rules JSONB DEFAULT '{}',
                submit_review_timeout_ms INTEGER DEFAULT 0,
                
                -- Sync Metadata
                last_synced_at TIMESTAMP,
                sync_source VARCHAR(50),
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT unique_user_automation_prefs UNIQUE(user_id)
            )
        """))
        
        # Create index
        db.execute(text("""
            CREATE INDEX idx_automation_prefs_user_id ON automation_preferences(user_id)
        """))
        
        db.commit()
        print("✓ Created automation_preferences table")
        
    except Exception as e:
        print(f"✗ Error creating automation_preferences table: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_automation_events_table():
    """Create automation_events table (audit log)."""
    print("\n=== Creating automation_events table ===")
    
    if check_table_exists('automation_events'):
        print("✓ automation_events table already exists")
        return
    
    db = SessionLocal()
    try:
        db.execute(text("""
            CREATE TABLE automation_events (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                task_id INTEGER REFERENCES apply_tasks(id) ON DELETE SET NULL,
                session_id VARCHAR(255),
                
                -- Event Classification
                event_type VARCHAR(100) NOT NULL,
                event_category VARCHAR(50),
                
                -- Detection Context
                detection_id VARCHAR(255),
                page_url TEXT,
                page_intent VARCHAR(50),
                ats_kind VARCHAR(100),
                apply_stage VARCHAR(100),
                
                -- Automation Decisions
                automation_decision VARCHAR(100),
                decision_reason TEXT,
                
                -- Preferences Snapshot
                preferences_snapshot JSONB,
                
                -- Payload
                event_payload JSONB,
                
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        
        # Create indexes
        indexes = [
            "CREATE INDEX idx_automation_events_user_id ON automation_events(user_id)",
            "CREATE INDEX idx_automation_events_task_id ON automation_events(task_id)",
            "CREATE INDEX idx_automation_events_session_id ON automation_events(session_id)",
            "CREATE INDEX idx_automation_events_detection_id ON automation_events(detection_id)",
            "CREATE INDEX idx_automation_events_type_category ON automation_events(event_type, event_category)",
            "CREATE INDEX idx_automation_events_created_at ON automation_events(created_at DESC)"
        ]
        
        for idx_sql in indexes:
            db.execute(text(idx_sql))
        
        db.commit()
        print("✓ Created automation_events table with indexes")
        
    except Exception as e:
        print(f"✗ Error creating automation_events table: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def verify_migration():
    """Verify all tables and columns exist."""
    print("\n=== Verifying Migration ===")
    
    required_tables = [
        'users',
        'user_profiles',
        'automation_preferences',
        'automation_events',
        'apply_tasks'
    ]
    
    for table in required_tables:
        if check_table_exists(table):
            print(f"✓ Table {table} exists")
        else:
            print(f"✗ Table {table} missing!")
            return False
    
    # Check critical columns
    critical_columns = [
        ('users', 'password_hash'),
        ('users', 'is_active'),
        ('user_profiles', 'version'),
        ('user_profiles', 'resume_url'),
        ('automation_preferences', 'auto_fill_after_login'),
        ('automation_events', 'detection_id')
    ]
    
    for table, column in critical_columns:
        if check_column_exists(table, column):
            print(f"✓ Column {table}.{column} exists")
        else:
            print(f"✗ Column {table}.{column} missing!")
            return False
    
    return True


def main():
    """Run Phase 5.0 migration."""
    print("=" * 60)
    print("Phase 5.0 Database Migration")
    print("Web Control Plane - System of Record")
    print("=" * 60)
    
    # Test connection
    if not test_connection():
        print("\n✗ Cannot connect to database")
        print("\nEnsure PostgreSQL is running:")
        print("  cd apps/backend && docker-compose up -d")
        sys.exit(1)
    
    try:
        # Run migrations
        migrate_users_table()
        migrate_user_profiles_table()
        create_automation_preferences_table()
        create_automation_events_table()
        
        # Verify
        if verify_migration():
            print("\n" + "=" * 60)
            print("✓ Phase 5.0 Migration Complete")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Implement authentication endpoints")
            print("2. Update extension to poll preferences")
            print("3. Build React web control plane")
        else:
            print("\n✗ Migration verification failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

