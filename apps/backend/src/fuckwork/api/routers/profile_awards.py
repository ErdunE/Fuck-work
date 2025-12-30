"""
Awards CRUD endpoints - Achievements 页面 (Awards & Honors 部分)
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserAward, get_db

router = APIRouter(prefix="/api/users/me/awards", tags=["profile", "awards"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class AwardRequest(BaseModel):
    """Award 请求"""

    title: str  # "Employee of the Year"
    issuer: Optional[str] = None  # "Google"
    received_month: Optional[str] = None  # "January", etc.
    received_year: Optional[int] = None
    description: Optional[str] = None


class AwardResponse(BaseModel):
    """Award 响应"""

    id: int
    title: str
    issuer: Optional[str] = None
    received_month: Optional[str] = None
    received_year: Optional[int] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AwardListResponse(BaseModel):
    """Award 列表响应"""

    awards: List[AwardResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=AwardListResponse)
def list_awards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户的所有奖项"""
    awards = (
        db.query(UserAward)
        .filter(UserAward.user_id == current_user.id)
        .order_by(UserAward.received_year.desc().nullslast(), UserAward.id.desc())
        .all()
    )
    return AwardListResponse(
        awards=[AwardResponse.model_validate(a) for a in awards],
        total=len(awards),
    )


@router.post("", response_model=AwardResponse, status_code=status.HTTP_201_CREATED)
def create_award(
    request: AwardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新奖项"""
    award = UserAward(
        user_id=current_user.id,
        title=request.title,
        issuer=request.issuer,
        received_month=request.received_month,
        received_year=request.received_year,
        description=request.description,
    )
    db.add(award)
    db.commit()
    db.refresh(award)

    return AwardResponse.model_validate(award)


@router.get("/{award_id}", response_model=AwardResponse)
def get_award(
    award_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定奖项"""
    award = (
        db.query(UserAward)
        .filter(
            UserAward.id == award_id,
            UserAward.user_id == current_user.id,
        )
        .first()
    )

    if not award:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Award not found")

    return AwardResponse.model_validate(award)


@router.put("/{award_id}", response_model=AwardResponse)
def update_award(
    award_id: int,
    request: AwardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新奖项"""
    award = (
        db.query(UserAward)
        .filter(
            UserAward.id == award_id,
            UserAward.user_id == current_user.id,
        )
        .first()
    )

    if not award:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Award not found")

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(award, field, value)

    db.commit()
    db.refresh(award)

    return AwardResponse.model_validate(award)


@router.delete("/{award_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_award(
    award_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除奖项"""
    award = (
        db.query(UserAward)
        .filter(
            UserAward.id == award_id,
            UserAward.user_id == current_user.id,
        )
        .first()
    )

    if not award:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Award not found")

    db.delete(award)
    db.commit()

    return None
