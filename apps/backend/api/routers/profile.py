"""
User Profile API endpoints for Phase 5.0 Web Control Plane.
Authoritative source of truth for autofill operations.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from database.models import User, UserProfile
from api.auth import get_current_user

router = APIRouter(prefix="/api/users/me", tags=["profile"])


# Request/Response Models

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
    
    return ProfileResponse.from_orm(profile)


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

