"""
Pydantic models for user profile and knowledge APIs.
Phase 3.3 - User Foundation Layer.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, date


# User Account

class UserCreate(BaseModel):
    """Create new user"""
    email: EmailStr


class UserResponse(BaseModel):
    """User account response"""
    id: int
    email: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Core Profile

class UserProfileUpdate(BaseModel):
    """Update user core profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    work_authorization: Optional[str] = None
    visa_status: Optional[str] = None


class UserProfileResponse(BaseModel):
    """User profile response"""
    id: int
    user_id: int
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    work_authorization: Optional[str]
    visa_status: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Education

class EducationCreate(BaseModel):
    """Add education entry"""
    school_name: str
    degree: Optional[str] = None
    major: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)


class EducationResponse(BaseModel):
    """Education entry response"""
    id: int
    user_id: int
    school_name: str
    degree: Optional[str]
    major: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    gpa: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Experience

class ExperienceCreate(BaseModel):
    """Add work experience entry"""
    company_name: str
    job_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    responsibilities: Optional[str] = None


class ExperienceResponse(BaseModel):
    """Work experience response"""
    id: int
    user_id: int
    company_name: str
    job_title: str
    start_date: Optional[date]
    end_date: Optional[date]
    is_current: bool
    responsibilities: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Projects

class ProjectCreate(BaseModel):
    """Add project entry"""
    project_name: str
    role: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project response"""
    id: int
    user_id: int
    project_name: str
    role: Optional[str]
    description: Optional[str]
    tech_stack: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Skills

class SkillCreate(BaseModel):
    """Add skill entry"""
    skill_name: str
    skill_category: Optional[str] = None


class SkillResponse(BaseModel):
    """Skill response"""
    id: int
    user_id: int
    skill_name: str
    skill_category: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Knowledge Base

class KnowledgeEntryCreate(BaseModel):
    """Add knowledge entry"""
    entry_type: Literal[
        "self_introduction",
        "project_deep_dive",
        "leadership_story",
        "failure_story",
        "technical_explanation",
        "custom_note"
    ]
    content: str


class KnowledgeEntryResponse(BaseModel):
    """Knowledge entry response"""
    id: int
    user_id: int
    entry_type: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Full User Profile

class FullUserProfileResponse(BaseModel):
    """Complete user profile with all data"""
    user: UserResponse
    profile: Optional[UserProfileResponse]
    education: List[EducationResponse]
    experience: List[ExperienceResponse]
    projects: List[ProjectResponse]
    skills: List[SkillResponse]
    knowledge_entries: List[KnowledgeEntryResponse]

