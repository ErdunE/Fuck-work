"""
Education CRUD endpoints - Education 页面
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserEducation, get_db

router = APIRouter(prefix="/api/users/me/education", tags=["profile", "education"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class EducationRequest(BaseModel):
    """Education 请求"""
    school_name: str
    degree: Optional[str] = None           # "Bachelor's Degree", "Master's Degree", etc.
    field_of_study: Optional[str] = None   # "Computer Science"
    location: Optional[str] = None         # "Stanford, CA"
    start_month: Optional[str] = None      # "January", "February", etc.
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False               # "I am currently studying here"
    gpa: Optional[str] = None              # "3.8/4.0" - 字符串格式
    honors: Optional[str] = None           # "Cum Laude, Dean's List"
    coursework: Optional[str] = None       # "Data Structures, Algorithms, ..."
    activities: Optional[str] = None       # "Computer Science Club, Hackathon Team, ..."


class EducationResponse(BaseModel):
    """Education 响应"""
    id: int
    school_name: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False
    gpa: Optional[str] = None
    honors: Optional[str] = None
    coursework: Optional[str] = None
    activities: Optional[str] = None

    class Config:
        from_attributes = True


class EducationListResponse(BaseModel):
    """Education 列表响应"""
    education: List[EducationResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=EducationListResponse)
def list_education(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有教育经历"""
    education = (
        db.query(UserEducation)
        .filter(UserEducation.user_id == current_user.id)
        .order_by(UserEducation.end_year.desc().nullslast(), UserEducation.id.desc())
        .all()
    )
    return EducationListResponse(
        education=[EducationResponse.model_validate(e) for e in education],
        total=len(education),
    )


@router.post("", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def create_education(
    request: EducationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新的教育经历"""
    education = UserEducation(
        user_id=current_user.id,
        school_name=request.school_name,
        degree=request.degree,
        field_of_study=request.field_of_study,
        location=request.location,
        start_month=request.start_month,
        start_year=request.start_year,
        end_month=request.end_month,
        end_year=request.end_year,
        is_current=request.is_current,
        gpa=request.gpa,
        honors=request.honors,
        coursework=request.coursework,
        activities=request.activities,
    )
    db.add(education)
    db.commit()
    db.refresh(education)

    return EducationResponse.model_validate(education)


@router.get("/{education_id}", response_model=EducationResponse)
def get_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定的教育经历"""
    education = (
        db.query(UserEducation)
        .filter(
            UserEducation.id == education_id,
            UserEducation.user_id == current_user.id
        )
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education entry not found"
        )

    return EducationResponse.model_validate(education)


@router.put("/{education_id}", response_model=EducationResponse)
def update_education(
    education_id: int,
    request: EducationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新教育经历"""
    education = (
        db.query(UserEducation)
        .filter(
            UserEducation.id == education_id,
            UserEducation.user_id == current_user.id
        )
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education entry not found"
        )

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(education, field, value)

    db.commit()
    db.refresh(education)

    return EducationResponse.model_validate(education)


@router.delete("/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除教育经历"""
    education = (
        db.query(UserEducation)
        .filter(
            UserEducation.id == education_id,
            UserEducation.user_id == current_user.id
        )
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education entry not found"
        )

    db.delete(education)
    db.commit()

    return None