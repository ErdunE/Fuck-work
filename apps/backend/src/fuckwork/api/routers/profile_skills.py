"""
Skills CRUD endpoints - Skills 页面
Phase 7.0 - 简化版，只需要 skill_name
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserSkill, get_db

router = APIRouter(prefix="/api/users/me/skills", tags=["profile", "skills"])


# =============================================================================
# Request/Response Models - 简化版
# =============================================================================


class SkillRequest(BaseModel):
    """Skill 请求 - 只需要技能名"""
    skill_name: str


class SkillResponse(BaseModel):
    """Skill 响应"""
    id: int
    skill_name: str

    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    """Skill 列表响应"""
    skills: List[SkillResponse]
    total: int


class BulkSkillRequest(BaseModel):
    """批量技能请求"""
    skills: List[str]  # 直接传技能名列表，如 ["Python", "React", "SQL"]


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=SkillListResponse)
def list_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有技能"""
    skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == current_user.id)
        .order_by(UserSkill.id)
        .all()
    )
    return SkillListResponse(
        skills=[SkillResponse.model_validate(s) for s in skills],
        total=len(skills),
    )


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    request: SkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新技能"""
    # 检查重复
    existing = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_name == request.skill_name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{request.skill_name}' already exists",
        )

    skill = UserSkill(
        user_id=current_user.id,
        skill_name=request.skill_name,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)

    return SkillResponse.model_validate(skill)


@router.post("/bulk", response_model=SkillListResponse)
def bulk_update_skills(
    request: BulkSkillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    批量更新技能 - 替换所有现有技能
    前端可以直接传 ["Python", "React", "SQL"]
    """
    # 删除所有现有技能
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()

    # 添加新技能（去重）
    new_skills = []
    seen = set()
    for skill_name in request.skills:
        if skill_name not in seen:
            seen.add(skill_name)
            skill = UserSkill(
                user_id=current_user.id,
                skill_name=skill_name,
            )
            db.add(skill)
            new_skills.append(skill)

    db.commit()

    # 刷新获取 ID
    for skill in new_skills:
        db.refresh(skill)

    return SkillListResponse(
        skills=[SkillResponse.model_validate(s) for s in new_skills],
        total=len(new_skills),
    )


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除技能"""
    skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.id == skill_id,
            UserSkill.user_id == current_user.id
        )
        .first()
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )

    db.delete(skill)
    db.commit()

    return None


@router.delete("/by-name/{skill_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill_by_name(
    skill_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """按名称删除技能（前端可能更方便用这个）"""
    skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.skill_name == skill_name,
            UserSkill.user_id == current_user.id
        )
        .first()
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill '{skill_name}' not found"
        )

    db.delete(skill)
    db.commit()

    return None