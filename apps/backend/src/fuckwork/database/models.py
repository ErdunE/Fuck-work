"""
SQLAlchemy ORM models for FuckWork Phase 2A.

Minimal schema with 4-field collection_metadata.
"""

from datetime import datetime

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Job(Base):
    """
    Job posting model.

    Contains basic job information plus Phase 1 authenticity scoring results
    and Phase 2A minimal collection metadata.
    """

    __tablename__ = "jobs"

    # Primary key
    id = Column(Integer, primary_key=True)
    job_id = Column(String(255), unique=True, nullable=False, index=True)

    # Basic info (required)
    title = Column(String(500), nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    location = Column(String(255))
    url = Column(Text, unique=True, nullable=False)
    platform = Column(String(50), nullable=False, index=True)
    jd_text = Column(Text, nullable=False)
    posted_date = Column(TIMESTAMP, index=True)

    # Phase 1 scoring results
    authenticity_score = Column(Float, index=True)
    authenticity_level = Column(String(20))  # likely_real, uncertain, likely_fake
    confidence = Column(String(20))  # Low, Medium, High
    red_flags = Column(JSONB)
    positive_signals = Column(JSONB)

    # Phase 2A: Minimal collection metadata (4 fields only)
    # {
    #   "platform": "LinkedIn",
    #   "collection_method": "jobspy_batch",
    #   "poster_expected": true,
    #   "poster_present": false
    # }
    collection_metadata = Column(JSONB)

    # Poster/company/platform data (JSONB for flexibility)
    poster_info = Column(JSONB)
    company_info = Column(JSONB)
    platform_metadata = Column(JSONB)
    derived_signals = Column(JSONB)

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(TIMESTAMP)

    def __repr__(self):
        return f"<Job(id={self.id}, job_id='{self.job_id}', company='{self.company_name}', title='{self.title[:50]}...')>"

    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "job_id": self.job_id,
            "title": self.title,
            "company_name": self.company_name,
            "location": self.location,
            "url": self.url,
            "platform": self.platform,
            "jd_text": self.jd_text,
            "posted_date": self.posted_date.isoformat() if self.posted_date else None,
            "authenticity_score": self.authenticity_score,
            "authenticity_level": self.authenticity_level,
            "confidence": self.confidence,
            "red_flags": self.red_flags,
            "positive_signals": self.positive_signals,
            "collection_metadata": self.collection_metadata,
            "poster_info": self.poster_info,
            "company_info": self.company_info,
            "platform_metadata": self.platform_metadata,
            "derived_signals": self.derived_signals,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


# Phase 3.3: User Profile & Knowledge Foundation


class User(Base):
    """
    User account - Phase 5.0: JWT authentication enabled.
    Phase 5.3.2: Added token_version for secure token revocation.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255))  # Phase 5.0: nullable for stub auth
    cognito_sub = Column(String(255), unique=True, index=True)  # Cognito user UUID
    token_version = Column(
        Integer, nullable=False, default=1, index=True
    )  # Phase 5.3.2: Token revocation
    last_login_at = Column(TIMESTAMP)  # Phase 5.0: track last login
    is_active = Column(Boolean, default=True)  # Phase 5.0: soft deletion
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    education = relationship("UserEducation", back_populates="user", cascade="all, delete-orphan")
    experience = relationship("UserExperience", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    knowledge_entries = relationship(
        "UserKnowledgeEntry", back_populates="user", cascade="all, delete-orphan"
    )
    apply_tasks = relationship("ApplyTask", back_populates="user", cascade="all, delete-orphan")
    automation_preferences = relationship(
        "AutomationPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )  # Phase 5.0
    automation_events = relationship(
        "AutomationEvent", back_populates="user", cascade="all, delete-orphan"
    )  # Phase 5.0

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class UserProfile(Base):
    """
    User core profile - Phase 5.0: authoritative source for autofill operations.
    """

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    version = Column(Integer, default=1)  # Phase 5.0: for future schema migrations

    # Personal info
    first_name = Column(String(255))
    last_name = Column(String(255))
    full_name = Column(String(255))  # Phase 5.0: convenience field
    phone = Column(String(50))

    # Contact info - Phase 5.0
    primary_email = Column(String(255))
    secondary_email = Column(String(255))

    # Location
    city = Column(String(255))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))  # Phase 5.0

    # Resume & Documents - Phase 5.0
    resume_url = Column(String(1024))  # S3/cloud storage URL
    resume_filename = Column(String(255))
    resume_uploaded_at = Column(TIMESTAMP)

    # Professional - Phase 5.0
    linkedin_url = Column(String(512))
    portfolio_url = Column(String(512))
    github_url = Column(String(512))

    # Work authorization (existing)
    work_authorization = Column(String(100))
    visa_status = Column(String(100))

    # Phase 5.2: Compliance / Preferences
    willing_to_relocate = Column(Boolean)
    government_employment_history = Column(Boolean)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, name='{self.first_name} {self.last_name}')>"


class UserEducation(Base):
    """
    Education history - structured for ATS.
    """

    __tablename__ = "user_education"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    school_name = Column(String(255), nullable=False)
    degree = Column(String(100))
    major = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    gpa = Column(Float)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="education")

    def __repr__(self):
        return f"<UserEducation(id={self.id}, school='{self.school_name}', degree='{self.degree}')>"


class UserExperience(Base):
    """
    Work experience - structured for ATS.
    """

    __tablename__ = "user_experience"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    company_name = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)

    responsibilities = Column(Text)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="experience")

    def __repr__(self):
        return f"<UserExperience(id={self.id}, company='{self.company_name}', title='{self.job_title}')>"


class UserProject(Base):
    """
    Projects - structured for ATS autofill.
    """

    __tablename__ = "user_projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    project_name = Column(String(255), nullable=False)
    role = Column(String(100))
    description = Column(Text)
    tech_stack = Column(Text)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="projects")

    def __repr__(self):
        return f"<UserProject(id={self.id}, name='{self.project_name}')>"


class UserSkill(Base):
    """
    Skills - normalized but simple.
    """

    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    skill_name = Column(String(100), nullable=False)
    skill_category = Column(String(50))

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="skills")

    def __repr__(self):
        return f"<UserSkill(id={self.id}, skill='{self.skill_name}')>"


class UserKnowledgeEntry(Base):
    """
    Unstructured knowledge base - for future AI reasoning.
    NOT used for autofill.
    """

    __tablename__ = "user_knowledge_entries"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    entry_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="knowledge_entries")

    def __repr__(self):
        return f"<UserKnowledgeEntry(id={self.id}, type='{self.entry_type}')>"


# Phase 3.5: Apply Orchestration + Status Tracking


class ApplyTask(Base):
    """
    Apply task - represents a job application attempt.
    Tracks status through lifecycle: queued -> in_progress -> needs_user -> success/failed
    """

    __tablename__ = "apply_tasks"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(255), nullable=False, index=True)

    # Status management
    status = Column(String(20), nullable=False, default="queued", index=True)
    # Status values: queued | in_progress | needs_user | success | failed | canceled

    priority = Column(Integer, default=0)
    attempt_count = Column(Integer, default=0)
    last_error = Column(Text)
    task_metadata = Column(JSONB)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="apply_tasks")
    events = relationship("ApplyEvent", back_populates="task", cascade="all, delete-orphan")

    # Composite index for queue ordering
    __table_args__ = (
        Index("idx_apply_tasks_queue_order", "user_id", "status", "priority", "created_at"),
    )

    def __repr__(self):
        return f"<ApplyTask(id={self.id}, job_id='{self.job_id}', status='{self.status}')>"


class ApplyEvent(Base):
    """
    Apply event - audit log for status transitions.
    Tracks every state change with reason and debug details.
    """

    __tablename__ = "apply_events"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("apply_tasks.id"), nullable=False, index=True)

    from_status = Column(String(20), nullable=False)
    to_status = Column(String(20), nullable=False)
    reason = Column(String(500))
    details = Column(JSONB)

    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationship
    task = relationship("ApplyTask", back_populates="events")

    def __repr__(self):
        return f"<ApplyEvent(id={self.id}, task_id={self.task_id}, {self.from_status} -> {self.to_status})>"


# Phase 5.0: Web Control Plane Models


class AutomationPreference(Base):
    """
    Automation preferences - Phase 5.0: System of record for automation behavior.
    Directly corresponds to Phase 4.3 extension preferences.
    Backend is source of truth, extension polls and caches locally.
    """

    __tablename__ = "automation_preferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    version = Column(Integer, default=1)  # Schema version for future migrations

    # Global Automation Settings (maps to extension Phase 4.3)
    auto_fill_after_login = Column(Boolean, default=True)
    auto_submit_when_ready = Column(Boolean, default=False)
    require_review_before_submit = Column(Boolean, default=True)  # Safety gate

    # Future Expansion Hooks (JSONB for flexibility)
    per_ats_overrides = Column(JSONB, default={})  # {"greenhouse": {"auto_fill": false}}
    field_autofill_rules = Column(JSONB, default={})  # Custom field mappings
    submit_review_timeout_ms = Column(Integer, default=0)  # 0 = explicit confirm

    # Sync Metadata
    last_synced_at = Column(TIMESTAMP)
    sync_source = Column(String(50))  # 'web', 'extension', 'api'

    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="automation_preferences")

    def __repr__(self):
        return f"<AutomationPreference(user_id={self.user_id}, auto_fill={self.auto_fill_after_login}, auto_submit={self.auto_submit_when_ready})>"


class AutomationEvent(Base):
    """
    Automation event - Phase 5.0: Audit log for automation decisions and actions.
    Developer-grade debugging to replace browser console.
    Immutable audit log (INSERT only, no UPDATE/DELETE).
    """

    __tablename__ = "automation_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)  # SET NULL on user delete
    task_id = Column(Integer, ForeignKey("apply_tasks.id"), index=True)  # SET NULL on task delete
    session_id = Column(String(255), index=True)  # From apply_session.task_id

    # Event Classification
    event_type = Column(
        String(100), nullable=False
    )  # 'autofill_triggered', 'submit_approved', 'detection_result'
    event_category = Column(String(50))  # 'automation', 'detection', 'user_action'

    # Detection Context (from Phase 4.1.4.2)
    detection_id = Column(String(255), index=True)  # Correlation ID
    page_url = Column(Text)
    page_intent = Column(String(50))  # From page_intent_classifier
    ats_kind = Column(String(100))
    apply_stage = Column(String(100))

    # Automation Decisions
    automation_decision = Column(
        String(100)
    )  # 'autofill_executed', 'submit_blocked', 'user_canceled'
    decision_reason = Column(Text)  # Why this decision was made

    # Preferences Snapshot (at time of event)
    preferences_snapshot = Column(JSONB)  # Record effective preferences

    # Payload
    event_payload = Column(JSONB)  # Full event data

    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="automation_events")
    task = relationship("ApplyTask")

    # Composite indexes for fast queries
    __table_args__ = (Index("idx_automation_events_type_category", "event_type", "event_category"),)

    def __repr__(self):
        return f"<AutomationEvent(id={self.id}, type='{self.event_type}', decision='{self.automation_decision}')>"


# Phase 5.3.0: Observability Console Models


class ApplyRun(Base):
    """
    Apply Run - Phase 5.3.0 Observability Console.

    Represents one end-to-end application attempt/run with full observability.
    Each run tracks state through detection → autofill → submit flow.
    Correlated with observability_events for timeline reconstruction.
    """

    __tablename__ = "apply_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)  # run_id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(255), nullable=True)
    task_id = Column(Integer, nullable=True, index=True)

    # URLs
    initial_url = Column(Text, nullable=False)
    current_url = Column(Text, nullable=False)

    # ATS detection results
    ats_kind = Column(
        String(100), nullable=True, index=True
    )  # greenhouse, workday, lever, linkedin_easy_apply, unknown
    intent = Column(String(100), nullable=True)  # application_form, login_required, unknown
    stage = Column(
        String(100), nullable=True
    )  # analyzing, ready_to_fill, filling, filled, ready_to_submit, manual_review, blocked, completed

    # Run status
    status = Column(
        String(50), nullable=False, default="in_progress", index=True
    )  # in_progress, success, failed, abandoned

    # Autofill metrics
    fill_rate = Column(Float, nullable=True)
    fields_attempted = Column(Integer, default=0)
    fields_filled = Column(Integer, default=0)
    fields_skipped = Column(Integer, default=0)

    # Error tracking
    failure_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    ended_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    events = relationship("ObservabilityEvent", back_populates="run", cascade="all, delete-orphan")

    # Composite indexes for querying
    __table_args__ = (
        Index("idx_apply_runs_user_created", "user_id", "created_at"),
        Index("idx_apply_runs_status_created", "status", "created_at"),
    )

    def __repr__(self):
        return f"<ApplyRun(id={self.id}, status='{self.status}', ats='{self.ats_kind}')>"


class ObservabilityEvent(Base):
    """
    Observability Event - Phase 5.3.0 Observability Console.

    Append-only structured event stream for full system observability.
    Captures events from extension, backend, and web app with structured payloads.
    Enables timeline reconstruction and debugging of apply runs.
    """

    __tablename__ = "observability_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("apply_runs.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Event metadata
    source = Column(String(20), nullable=False)  # extension, backend, web
    severity = Column(String(10), nullable=False)  # debug, info, warn, error
    event_name = Column(String(100), nullable=False, index=True)
    event_version = Column(Integer, default=1)

    # Event context
    ts = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    url = Column(Text, nullable=True)

    # Extensible payload
    payload = Column(JSONB, default={})

    # Correlation keys
    dedup_key = Column(String(255), nullable=True)
    request_id = Column(String(100), nullable=True)
    detection_id = Column(String(100), nullable=True)
    page_id = Column(String(100), nullable=True)

    # Relationships
    run = relationship("ApplyRun", back_populates="events")
    user = relationship("User", foreign_keys=[user_id])

    # Composite indexes for efficient querying
    __table_args__ = (
        Index("idx_observability_events_run_ts", "run_id", "ts"),
        Index("idx_observability_events_event_ts", "event_name", "ts"),
        Index(
            "idx_observability_events_payload", "payload", postgresql_using="gin"
        ),  # GIN index for JSONB
    )

    def __repr__(self):
        return (
            f"<ObservabilityEvent(id={self.id}, event='{self.event_name}', source='{self.source}')>"
        )


class ActiveApplySession(Base):
    """
    Active Apply Session - Phase 5.3.1 Session Bridge.

    One active session per user. Enables extension to deterministically
    attach to the correct apply run when user opens job from Control Plane.

    TTL: 2 hours default. Expired sessions are automatically cleaned on read.
    """

    __tablename__ = "active_apply_sessions"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    task_id = Column(Integer, ForeignKey("apply_tasks.id"), nullable=False, index=True)
    run_id = Column(Integer, ForeignKey("apply_runs.id"), nullable=False, index=True)
    job_url = Column(Text, nullable=False)
    ats_type = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    expires_at = Column(TIMESTAMP, nullable=False, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    task = relationship("ApplyTask", foreign_keys=[task_id])
    run = relationship("ApplyRun", foreign_keys=[run_id])

    def __repr__(self):
        return f"<ActiveApplySession(user_id={self.user_id}, run_id={self.run_id}, task_id={self.task_id})>"
