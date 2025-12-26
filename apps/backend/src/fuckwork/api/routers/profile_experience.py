"""
Experience CRUD endpoints for Phase 5.2.
Manages user work experience history.
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserExperience, get_db

router = APIRouter(prefix="/api/users/me/experience", tags=["profile", "experience"])


# Request/Response Models


class ExperienceRequest(BaseModel):
    """Experience entry request."""

    company_name: str
    job_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    responsibilities: Optional[str] = None


class ExperienceResponse(BaseModel):
    """Experience entry response."""

    id: int
    company_name: str
    job_title: str
    start_date: Optional[date]
    end_date: Optional[date]
    is_current: bool
    responsibilities: Optional[str]

    class Config:
        from_attributes = True


class ExperienceListResponse(BaseModel):
    """Experience list response."""

    experience: List[ExperienceResponse]
    total: int


# Endpoints


@router.get("", response_model=ExperienceListResponse)
def list_experience(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all experience entries for current user."""
    experience = db.query(UserExperience).filter(UserExperience.user_id == current_user.id).all()
    return ExperienceListResponse(
        experience=[ExperienceResponse.from_orm(e) for e in experience],
        total=len(experience),
    )


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def create_experience(
    request: ExperienceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new experience entry."""
    experience = UserExperience(
        user_id=current_user.id,
        company_name=request.company_name,
        job_title=request.job_title,
        start_date=request.start_date,
        end_date=request.end_date,
        is_current=request.is_current,
        responsibilities=request.responsibilities,
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return ExperienceResponse.from_orm(experience)


@router.put("/{experience_id}", response_model=ExperienceResponse)
def update_experience(
    experience_id: int,
    request: ExperienceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update experience entry."""
    experience = (
        db.query(UserExperience)
        .filter(
            UserExperience.id == experience_id,
            UserExperience.user_id == current_user.id,
        )
        .first()
    )

    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Experience entry not found"
        )

    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(experience, field, value)

    db.commit()
    db.refresh(experience)

    return ExperienceResponse.from_orm(experience)


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete experience entry."""
    experience = (
        db.query(UserExperience)
        .filter(
            UserExperience.id == experience_id,
            UserExperience.user_id == current_user.id,
        )
        .first()
    )

    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Experience entry not found"
        )

    db.delete(experience)
    db.commit()

    return None
