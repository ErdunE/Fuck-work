"""
Database connection and session management for FuckWork Phase 2A.

Provides SQLAlchemy engine and session factory for PostgreSQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Database URL from environment or default to local dev
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://fuckwork:fuckwork_dev@localhost:5432/fuckwork"
)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before use
    echo=False  # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)


def get_db():
    """
    Dependency function for FastAPI endpoints.
    
    Yields a database session and ensures proper cleanup.
    
    Usage:
        @app.get("/jobs")
        def get_jobs(db: Session = Depends(get_db)):
            return db.query(Job).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database schema.
    
    Creates all tables defined in models if they don't exist.
    """
    from database.models import Base
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def test_connection():
    """
    Test database connection.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

