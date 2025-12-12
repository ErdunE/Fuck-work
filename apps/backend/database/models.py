"""
SQLAlchemy ORM models for FuckWork Phase 2A.

Minimal schema with 4-field collection_metadata.
"""

from sqlalchemy import Column, Integer, String, Text, Float, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
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

