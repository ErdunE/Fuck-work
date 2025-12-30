"""
Experience CRUD endpoints - Experience 页面
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserExperience, get_db

router = APIRouter(prefix="/api/users/me/experience", tags=["profile", "experience"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class ExperienceRequest(BaseModel):
    """Experience 请求"""

    job_title: str
    company_name: str
    employment_type: Optional[str] = (
        None  # Full-time, Part-time, Contract, Internship, Freelance, Temporary
    )
    location_type: Optional[str] = None  # On-site, Remote, Hybrid
    location: Optional[str] = None  # "San Francisco, CA"
    start_month: Optional[str] = None  # "January", "February", etc.
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False  # "I currently work here"
    description: Optional[str] = None  # Bullet points supported
    skills_used: Optional[List[str]] = None


class ExperienceResponse(BaseModel):
    """Experience 响应"""

    id: int
    job_title: str
    company_name: str
    employment_type: Optional[str] = None
    location_type: Optional[str] = None
    location: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False
    description: Optional[str] = None
    skills_used: Optional[List[str]] = None

    class Config:
        from_attributes = True


class ExperienceListResponse(BaseModel):
    """Experience 列表响应"""

    experience: List[ExperienceResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=ExperienceListResponse)
def list_experience(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户的所有工作经历"""
    experience = (
        db.query(UserExperience)
        .filter(UserExperience.user_id == current_user.id)
        .order_by(UserExperience.start_year.desc().nullslast(), UserExperience.id.desc())
        .all()
    )
    return ExperienceListResponse(
        experience=[ExperienceResponse.model_validate(e) for e in experience],
        total=len(experience),
    )


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def create_experience(
    request: ExperienceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新的工作经历"""
    experience = UserExperience(
        user_id=current_user.id,
        job_title=request.job_title,
        company_name=request.company_name,
        employment_type=request.employment_type,
        location_type=request.location_type,
        location=request.location,
        start_month=request.start_month,
        start_year=request.start_year,
        end_month=request.end_month,
        end_year=request.end_year,
        is_current=request.is_current,
        description=request.description,
        skills_used=request.skills_used,
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return ExperienceResponse.model_validate(experience)


@router.get("/{experience_id}", response_model=ExperienceResponse)
def get_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定的工作经历"""
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

    return ExperienceResponse.model_validate(experience)


@router.put("/{experience_id}", response_model=ExperienceResponse)
def update_experience(
    experience_id: int,
    request: ExperienceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新工作经历"""
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

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(experience, field, value)

    db.commit()
    db.refresh(experience)

    return ExperienceResponse.model_validate(experience)


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除工作经历"""
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
