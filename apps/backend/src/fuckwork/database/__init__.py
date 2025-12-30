"""
Database connection and session management for FuckWork.
Phase 7.0 - Clean Profile Support matching frontend.
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
    Base,
    Job,
    User,
    UserProfile,
    UserResume,
    UserExperience,
    UserEducation,
    UserSkill,
    UserLanguage,
    UserProject,
    UserCertification,
    UserAward,
    UserPublication,
    UserVolunteering,
    UserJobPreferences,
)

# Legacy models - 这些表已被删除，但某些旧代码还在引用
# 创建空的占位类，后续需要清理这些旧代码
from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime


class AutomationPreference(Base):
    """Legacy - 占位类"""
    __tablename__ = "automation_preferences"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    version = Column(Integer, default=1)
    auto_fill_after_login = Column(Boolean, default=True)
    auto_submit_when_ready = Column(Boolean, default=False)
    require_review_before_submit = Column(Boolean, default=True)
    per_ats_overrides = Column(JSONB, default={})
    field_autofill_rules = Column(JSONB, default={})
    submit_review_timeout_ms = Column(Integer, default=0)
    last_synced_at = Column(TIMESTAMP)
    sync_source = Column(String(50))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class AutomationEvent(Base):
    """Legacy - 占位类"""
    __tablename__ = "automation_events"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer)
    session_id = Column(String(255))
    event_type = Column(String(100))
    event_category = Column(String(50))
    detection_id = Column(String(255))
    page_url = Column(Text)
    page_intent = Column(String(50))
    ats_kind = Column(String(100))
    apply_stage = Column(String(100))
    automation_decision = Column(String(100))
    decision_reason = Column(Text)
    preferences_snapshot = Column(JSONB)
    event_payload = Column(JSONB)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class ApplyTask(Base):
    """Legacy - 占位类"""
    __tablename__ = "apply_tasks"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(String(255))
    status = Column(String(20), default="queued")
    priority = Column(Integer, default=0)
    attempt_count = Column(Integer, default=0)
    last_error = Column(Text)
    task_metadata = Column(JSONB)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class ApplyRun(Base):
    """Legacy - 占位类"""
    __tablename__ = "apply_runs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(String(255))
    task_id = Column(Integer)
    initial_url = Column(Text)
    current_url = Column(Text)
    ats_kind = Column(String(100))
    intent = Column(String(100))
    stage = Column(String(100))
    status = Column(String(50), default="in_progress")
    fill_rate = Column(Integer)
    fields_attempted = Column(Integer, default=0)
    fields_filled = Column(Integer, default=0)
    fields_skipped = Column(Integer, default=0)
    failure_reason = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    ended_at = Column(TIMESTAMP)


class ObservabilityEvent(Base):
    """Legacy - 占位类"""
    __tablename__ = "observability_events"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    run_id = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    source = Column(String(20))
    severity = Column(String(10))
    event_name = Column(String(100))
    event_version = Column(Integer, default=1)
    ts = Column(TIMESTAMP, default=datetime.utcnow)
    url = Column(Text)
    payload = Column(JSONB, default={})
    dedup_key = Column(String(255))
    request_id = Column(String(100))
    detection_id = Column(String(100))
    page_id = Column(String(100))


class ActiveApplySession(Base):
    """Legacy - 占位类"""
    __tablename__ = "active_apply_sessions"
    __table_args__ = {'extend_existing': True}
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    task_id = Column(Integer)
    run_id = Column(Integer)
    job_url = Column(Text)
    ats_type = Column(String(100))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    expires_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)


class ApplyEvent(Base):
    """Legacy - 占位类"""
    __tablename__ = "apply_events"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    from_status = Column(String(20))
    to_status = Column(String(20))
    reason = Column(String(500))
    details = Column(JSONB)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class UserKnowledgeEntry(Base):
    """Legacy - 占位类"""
    __tablename__ = "user_knowledge_entries"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entry_type = Column(String(50))
    content = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


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
    "UserResume",
    "UserExperience",
    "UserEducation",
    "UserSkill",
    "UserLanguage",
    "UserProject",
    "UserCertification",
    "UserAward",
    "UserPublication",
    "UserVolunteering",
    "UserJobPreferences",
    # Legacy models (for backward compatibility)
    "AutomationPreference",
    "AutomationEvent",
    "ApplyTask",
    "ApplyRun",
    "ObservabilityEvent",
    "ActiveApplySession",
    "ApplyEvent",
    "UserKnowledgeEntry",
]