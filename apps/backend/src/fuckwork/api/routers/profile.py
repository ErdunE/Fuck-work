"""
User Profile API endpoints for Phase 5.0 Web Control Plane.
Authoritative source of truth for autofill operations.
"""

from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from src.fuckwork.database import get_db
from src.fuckwork.database import User, UserProfile, UserEducation, UserExperience, UserProject, UserSkill
from src.fuckwork.api.auth import get_current_user

router = APIRouter(prefix="/api/users/me", tags=["profile"])


# Request/Response Models

# Phase 5.2: Nested collection models
class EducationItem(BaseModel):
    """Education entry."""
    id: int
    school_name: str
    degree: Optional[str] = None
    major: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[float] = None
    
    class Config:
        from_attributes = True


class ExperienceItem(BaseModel):
    """Work experience entry."""
    id: int
    company_name: str
    job_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    responsibilities: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProjectItem(BaseModel):
    """Project entry."""
    id: int
    project_name: str
    role: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    
    class Config:
        from_attributes = True


class SkillItem(BaseModel):
    """Skill entry."""
    id: int
    skill_name: str
    skill_category: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    """User profile response."""
    id: int
    user_id: int
    version: int
    
    # Personal Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    
    # Contact Information
    primary_email: Optional[str] = None
    secondary_email: Optional[str] = None
    phone: Optional[str] = None
    
    # Resume & Documents
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_uploaded_at: Optional[datetime] = None
    
    # Location
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Professional
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    
    # Work Authorization
    work_authorization: Optional[str] = None
    visa_status: Optional[str] = None
    
    # Phase 5.2: ATS-complete collections
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    skills: List[SkillItem] = []
    
    # Phase 5.2: Compliance preferences
    willing_to_relocate: Optional[bool] = None
    government_employment_history: Optional[bool] = None
    
    # Metadata
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """User profile update request (all fields optional for partial updates)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    primary_email: Optional[EmailStr] = None
    secondary_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    work_authorization: Optional[str] = None
    visa_status: Optional[str] = None
    # Phase 5.2: Compliance fields
    willing_to_relocate: Optional[bool] = None
    government_employment_history: Optional[bool] = None


class ProfileUpdateResponse(BaseModel):
    """Profile update response."""
    id: int
    updated_at: datetime
    message: str


# Endpoints

@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile.
    
    Phase 5.2: Now includes education, experience, projects, skills collections.
    Authoritative source for autofill operations.
    Extension fetches this to fill application forms.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create empty profile if it doesn't exist
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Phase 5.2: Fetch related collections (SQLAlchemy relationships handle joins)
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    experience = db.query(UserExperience).filter(UserExperience.user_id == current_user.id).all()
    projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).all()
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    
    # Build response with collections
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        version=profile.version,
        first_name=profile.first_name,
        last_name=profile.last_name,
        full_name=profile.full_name,
        primary_email=profile.primary_email,
        secondary_email=profile.secondary_email,
        phone=profile.phone,
        resume_url=profile.resume_url,
        resume_filename=profile.resume_filename,
        resume_uploaded_at=profile.resume_uploaded_at,
        city=profile.city,
        state=profile.state,
        country=profile.country,
        postal_code=profile.postal_code,
        linkedin_url=profile.linkedin_url,
        portfolio_url=profile.portfolio_url,
        github_url=profile.github_url,
        work_authorization=profile.work_authorization,
        visa_status=profile.visa_status,
        willing_to_relocate=profile.willing_to_relocate if hasattr(profile, 'willing_to_relocate') else None,
        government_employment_history=profile.government_employment_history if hasattr(profile, 'government_employment_history') else None,
        updated_at=profile.updated_at,
        education=[EducationItem.from_orm(e) for e in education],
        experience=[ExperienceItem.from_orm(e) for e in experience],
        projects=[ProjectItem.from_orm(p) for p in projects],
        skills=[SkillItem.from_orm(s) for s in skills]
    )


@router.put("/profile", response_model=ProfileUpdateResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    Supports partial updates - only provided fields are updated.
    Timestamps updated automatically.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create profile if it doesn't exist
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update only provided fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # Auto-update full_name if first/last provided
    if 'first_name' in update_data or 'last_name' in update_data:
        if profile.first_name and profile.last_name:
            profile.full_name = f"{profile.first_name} {profile.last_name}"
    
    # Track resume upload time
    if 'resume_url' in update_data and update_data['resume_url']:
        profile.resume_uploaded_at = datetime.utcnow()
    
    profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    
    return ProfileUpdateResponse(
        id=profile.id,
        updated_at=profile.updated_at,
        message="Profile updated successfully"
    )

