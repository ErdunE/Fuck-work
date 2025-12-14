"""
SQLAlchemy ORM models for FuckWork Phase 2A.

Minimal schema with 4-field collection_metadata.
"""

from sqlalchemy import Column, Integer, String, Text, Float, TIMESTAMP, ForeignKey, Boolean, Date, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Job(Base):
    """
    Job posting model.
    
    Contains basic job information plus Phase 1 authenticity scoring results
    and Phase 2A minimal collection metadata.
    """
    __tablename__ = 'jobs'
    
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
            'id': self.id,
            'job_id': self.job_id,
            'title': self.title,
            'company_name': self.company_name,
            'location': self.location,
            'url': self.url,
            'platform': self.platform,
            'jd_text': self.jd_text,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None,
            'authenticity_score': self.authenticity_score,
            'authenticity_level': self.authenticity_level,
            'confidence': self.confidence,
            'red_flags': self.red_flags,
            'positive_signals': self.positive_signals,
            'collection_metadata': self.collection_metadata,
            'poster_info': self.poster_info,
            'company_info': self.company_info,
            'platform_metadata': self.platform_metadata,
            'derived_signals': self.derived_signals,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
        }


# Phase 3.3: User Profile & Knowledge Foundation

class User(Base):
    """
    User account - minimal for now.
    No authentication in this phase.
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    education = relationship("UserEducation", back_populates="user", cascade="all, delete-orphan")
    experience = relationship("UserExperience", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    knowledge_entries = relationship("UserKnowledgeEntry", back_populates="user", cascade="all, delete-orphan")
    apply_tasks = relationship("ApplyTask", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class UserProfile(Base):
    """
    User core profile - structured data for ATS autofill.
    """
    __tablename__ = 'user_profiles'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    
    # Personal info
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    
    # Location
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(100))
    
    # Work authorization
    work_authorization = Column(String(100))
    visa_status = Column(String(100))
    
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
    __tablename__ = 'user_education'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
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
    __tablename__ = 'user_experience'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
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
    __tablename__ = 'user_projects'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
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
    __tablename__ = 'user_skills'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
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
    __tablename__ = 'user_knowledge_entries'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
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
    __tablename__ = 'apply_tasks'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    job_id = Column(String(255), nullable=False, index=True)
    
    # Status management
    status = Column(String(20), nullable=False, default='queued', index=True)
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
        Index('idx_apply_tasks_queue_order', 'user_id', 'status', 'priority', 'created_at'),
    )
    
    def __repr__(self):
        return f"<ApplyTask(id={self.id}, job_id='{self.job_id}', status='{self.status}')>"


class ApplyEvent(Base):
    """
    Apply event - audit log for status transitions.
    Tracks every state change with reason and debug details.
    """
    __tablename__ = 'apply_events'
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('apply_tasks.id'), nullable=False, index=True)
    
    from_status = Column(String(20), nullable=False)
    to_status = Column(String(20), nullable=False)
    reason = Column(String(500))
    details = Column(JSONB)
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationship
    task = relationship("ApplyTask", back_populates="events")
    
    def __repr__(self):
        return f"<ApplyEvent(id={self.id}, task_id={self.task_id}, {self.from_status} -> {self.to_status})>"

