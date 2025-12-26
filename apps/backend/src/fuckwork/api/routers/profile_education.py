"""
Education CRUD endpoints for Phase 5.2.
Manages user education history.
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserEducation, get_db

router = APIRouter(prefix="/api/users/me/education", tags=["profile", "education"])


# Request/Response Models


class EducationRequest(BaseModel):
    """Education entry request."""

    school_name: str
    degree: Optional[str] = None
    major: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[float] = None


class EducationResponse(BaseModel):
    """Education entry response."""

    id: int
    school_name: str
    degree: Optional[str]
    major: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    gpa: Optional[float]

    class Config:
        from_attributes = True


class EducationListResponse(BaseModel):
    """Education list response."""

    education: List[EducationResponse]
    total: int


# Endpoints


@router.get("", response_model=EducationListResponse)
def list_education(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all education entries for current user."""
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    return EducationListResponse(
        education=[EducationResponse.from_orm(e) for e in education],
        total=len(education),
    )


@router.post("", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def create_education(
    request: EducationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new education entry."""
    education = UserEducation(
        user_id=current_user.id,
        school_name=request.school_name,
        degree=request.degree,
        major=request.major,
        start_date=request.start_date,
        end_date=request.end_date,
        gpa=request.gpa,
    )
    db.add(education)
    db.commit()
    db.refresh(education)

    return EducationResponse.from_orm(education)


@router.put("/{education_id}", response_model=EducationResponse)
def update_education(
    education_id: int,
    request: EducationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update education entry."""
    education = (
        db.query(UserEducation)
        .filter(UserEducation.id == education_id, UserEducation.user_id == current_user.id)
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education entry not found"
        )

    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(education, field, value)

    db.commit()
    db.refresh(education)

    return EducationResponse.from_orm(education)


@router.delete("/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete education entry."""
    education = (
        db.query(UserEducation)
        .filter(UserEducation.id == education_id, UserEducation.user_id == current_user.id)
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education entry not found"
        )

    db.delete(education)
    db.commit()

    return None
