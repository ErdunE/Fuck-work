"""
Database connection and session management for FuckWork.
Provides SQLAlchemy engine, session factory, and model exports.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database URL from environment or default to local dev
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://fuckwork:fuckwork_dev@localhost:5432/fuckwork"
)

# Create engine with connection pooling
engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10, pool_pre_ping=True, echo=False)

# Session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Import models (after engine is created)
from .models import (  # noqa: E402
    ActiveApplySession,
    ApplyEvent,
    ApplyRun,
    ApplyTask,
    AutomationEvent,
    AutomationPreference,
    Base,
    Job,
    ObservabilityEvent,
    User,
    UserEducation,
    UserExperience,
    UserKnowledgeEntry,
    UserProfile,
    UserProject,
    UserSkill,
)


def get_db():
    """Dependency function for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database schema."""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def test_connection():
    """Test database connection."""
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


# Export everything
__all__ = [
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "test_connection",
    "Base",
    "Job",
    "User",
    "UserProfile",
    "UserEducation",
    "UserExperience",
    "UserProject",
    "UserSkill",
    "UserKnowledgeEntry",
    "ApplyTask",
    "ApplyEvent",
    "ApplyRun",
    "AutomationPreference",
    "AutomationEvent",
    "ActiveApplySession",
    "ObservabilityEvent",
]
