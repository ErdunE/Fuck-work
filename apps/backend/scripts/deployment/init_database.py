"""
Database initialization script.

Run this after starting PostgreSQL with docker-compose up -d
"""

import sys
import time
from src.fuckwork.database import test_connection, init_db, engine


def wait_for_db(max_retries=10, retry_delay=2):
    """
    Wait for database to be ready.
    
    Args:
        max_retries: Maximum number of connection attempts
        retry_delay: Seconds to wait between attempts
    
    Returns:
        bool: True if database is ready, False if timeout
    """
    print("Waiting for PostgreSQL to be ready...")
    
    for attempt in range(1, max_retries + 1):
        print(f"Attempt {attempt}/{max_retries}...")
        
        if test_connection():
            return True
        
        if attempt < max_retries:
            print(f"Waiting {retry_delay} seconds before retry...")
            time.sleep(retry_delay)
    
    return False


def main():
    """Initialize database"""
    
    print("=== Database Initialization ===\n")
    
    # Wait for database to be ready
    if not wait_for_db():
        print("\n✗ Failed to connect to database after multiple attempts")
        print("\nTroubleshooting:")
        print("1. Ensure Docker is running: docker ps")
        print("2. Start PostgreSQL: cd apps/backend && docker-compose up -d")
        print("3. Check logs: docker-compose logs postgres")
        sys.exit(1)
    
    print("\n✓ Database connection established\n")
    
    # Initialize schema
    print("Creating tables...")
    try:
        init_db()
        print("✓ Tables created successfully\n")
    except Exception as e:
        print(f"✗ Failed to create tables: {e}\n")
        sys.exit(1)
    
    # Verify tables exist
    print("Verifying tables...")
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"✓ Found {len(tables)} table(s):")
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"  - {table} ({len(columns)} columns)")
        
    except Exception as e:
        print(f"✗ Failed to verify tables: {e}\n")
        sys.exit(1)
    
    print("\n=== Database Initialization Complete ===")
    print("\nYou can now:")
    print("1. Run integration tests: python3 test_integration.py")
    print("2. Start collecting jobs: python3 scheduler.py")


if __name__ == "__main__":
    main()

