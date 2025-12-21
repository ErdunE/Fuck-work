"""
Skills CRUD endpoints for Phase 5.2.
Manages user skills.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.fuckwork.database import get_db
from src.fuckwork.database import User, UserSkill
from src.fuckwork.api.auth import get_current_user

router = APIRouter(prefix="/api/users/me/skills", tags=["profile", "skills"])


# Request/Response Models

class SkillRequest(BaseModel):
    """Skill entry request."""
    skill_name: str
    skill_category: Optional[str] = None


class SkillResponse(BaseModel):
    """Skill entry response."""
    id: int
    skill_name: str
    skill_category: Optional[str]
    
    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    """Skill list response."""
    skills: List[SkillResponse]
    total: int


# Endpoints

@router.get("", response_model=SkillListResponse)
def list_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all skill entries for current user."""
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    return SkillListResponse(
        skills=[SkillResponse.from_orm(s) for s in skills],
        total=len(skills)
    )


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    request: SkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add new skill entry."""
    skill = UserSkill(
        user_id=current_user.id,
        skill_name=request.skill_name,
        skill_category=request.skill_category
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    
    return SkillResponse.from_orm(skill)


@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    request: SkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update skill entry."""
    skill = db.query(UserSkill).filter(
        UserSkill.id == skill_id,
        UserSkill.user_id == current_user.id
    ).first()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill entry not found"
        )
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)
    
    db.commit()
    db.refresh(skill)
    
    return SkillResponse.from_orm(skill)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete skill entry."""
    skill = db.query(UserSkill).filter(
        UserSkill.id == skill_id,
        UserSkill.user_id == current_user.id
    ).first()
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill entry not found"
        )
    
    db.delete(skill)
    db.commit()
    
    return None

