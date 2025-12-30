"""
Volunteering CRUD endpoints - Achievements 页面 (Volunteering 部分)
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserVolunteering, get_db

router = APIRouter(prefix="/api/users/me/volunteering", tags=["profile", "volunteering"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class VolunteeringRequest(BaseModel):
    """Volunteering 请求"""
    organization: str                        # "Red Cross"
    role: Optional[str] = None               # "Volunteer Coordinator"
    cause: Optional[str] = None              # 下拉选择: "Education", "Health", etc.
    start_month: Optional[str] = None        # "January", etc.
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False                 # "I am currently volunteering here"
    description: Optional[str] = None


class VolunteeringResponse(BaseModel):
    """Volunteering 响应"""
    id: int
    organization: str
    role: Optional[str] = None
    cause: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_current: bool = False
    description: Optional[str] = None

    class Config:
        from_attributes = True


class VolunteeringListResponse(BaseModel):
    """Volunteering 列表响应"""
    volunteering: List[VolunteeringResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=VolunteeringListResponse)
def list_volunteering(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有志愿者经历"""
    volunteering = (
        db.query(UserVolunteering)
        .filter(UserVolunteering.user_id == current_user.id)
        .order_by(UserVolunteering.start_year.desc().nullslast(), UserVolunteering.id.desc())
        .all()
    )
    return VolunteeringListResponse(
        volunteering=[VolunteeringResponse.model_validate(v) for v in volunteering],
        total=len(volunteering),
    )


@router.post("", response_model=VolunteeringResponse, status_code=status.HTTP_201_CREATED)
def create_volunteering(
    request: VolunteeringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新志愿者经历"""
    volunteering = UserVolunteering(
        user_id=current_user.id,
        organization=request.organization,
        role=request.role,
        cause=request.cause,
        start_month=request.start_month,
        start_year=request.start_year,
        end_month=request.end_month,
        end_year=request.end_year,
        is_current=request.is_current,
        description=request.description,
    )
    db.add(volunteering)
    db.commit()
    db.refresh(volunteering)

    return VolunteeringResponse.model_validate(volunteering)


@router.get("/{volunteering_id}", response_model=VolunteeringResponse)
def get_volunteering(
    volunteering_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定志愿者经历"""
    volunteering = (
        db.query(UserVolunteering)
        .filter(
            UserVolunteering.id == volunteering_id,
            UserVolunteering.user_id == current_user.id,
        )
        .first()
    )

    if not volunteering:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteering entry not found"
        )

    return VolunteeringResponse.model_validate(volunteering)


@router.put("/{volunteering_id}", response_model=VolunteeringResponse)
def update_volunteering(
    volunteering_id: int,
    request: VolunteeringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新志愿者经历"""
    volunteering = (
        db.query(UserVolunteering)
        .filter(
            UserVolunteering.id == volunteering_id,
            UserVolunteering.user_id == current_user.id,
        )
        .first()
    )

    if not volunteering:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteering entry not found"
        )

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(volunteering, field, value)

    db.commit()
    db.refresh(volunteering)

    return VolunteeringResponse.model_validate(volunteering)


@router.delete("/{volunteering_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_volunteering(
    volunteering_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除志愿者经历"""
    volunteering = (
        db.query(UserVolunteering)
        .filter(
            UserVolunteering.id == volunteering_id,
            UserVolunteering.user_id == current_user.id,
        )
        .first()
    )

    if not volunteering:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteering entry not found"
        )

    db.delete(volunteering)
    db.commit()

    return None