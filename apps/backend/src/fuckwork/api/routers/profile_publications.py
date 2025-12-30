"""
Publications CRUD endpoints - Achievements 页面 (Publications 部分)
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserPublication, get_db

router = APIRouter(prefix="/api/users/me/publications", tags=["profile", "publications"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class PublicationRequest(BaseModel):
    """Publication 请求"""

    title: str  # "Machine Learning in Healthcare"
    publisher: Optional[str] = None  # "Nature Medicine"
    publication_month: Optional[str] = None  # "January", etc.
    publication_year: Optional[int] = None
    url: Optional[str] = None  # "https://doi.org/..."
    authors: Optional[str] = None  # "John Doe, Jane Smith, et al."
    description: Optional[str] = None  # Brief description or abstract


class PublicationResponse(BaseModel):
    """Publication 响应"""

    id: int
    title: str
    publisher: Optional[str] = None
    publication_month: Optional[str] = None
    publication_year: Optional[int] = None
    url: Optional[str] = None
    authors: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PublicationListResponse(BaseModel):
    """Publication 列表响应"""

    publications: List[PublicationResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=PublicationListResponse)
def list_publications(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """获取当前用户的所有发表"""
    publications = (
        db.query(UserPublication)
        .filter(UserPublication.user_id == current_user.id)
        .order_by(UserPublication.publication_year.desc().nullslast(), UserPublication.id.desc())
        .all()
    )
    return PublicationListResponse(
        publications=[PublicationResponse.model_validate(p) for p in publications],
        total=len(publications),
    )


@router.post("", response_model=PublicationResponse, status_code=status.HTTP_201_CREATED)
def create_publication(
    request: PublicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新发表"""
    publication = UserPublication(
        user_id=current_user.id,
        title=request.title,
        publisher=request.publisher,
        publication_month=request.publication_month,
        publication_year=request.publication_year,
        url=request.url,
        authors=request.authors,
        description=request.description,
    )
    db.add(publication)
    db.commit()
    db.refresh(publication)

    return PublicationResponse.model_validate(publication)


@router.get("/{publication_id}", response_model=PublicationResponse)
def get_publication(
    publication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定发表"""
    publication = (
        db.query(UserPublication)
        .filter(
            UserPublication.id == publication_id,
            UserPublication.user_id == current_user.id,
        )
        .first()
    )

    if not publication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    return PublicationResponse.model_validate(publication)


@router.put("/{publication_id}", response_model=PublicationResponse)
def update_publication(
    publication_id: int,
    request: PublicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新发表"""
    publication = (
        db.query(UserPublication)
        .filter(
            UserPublication.id == publication_id,
            UserPublication.user_id == current_user.id,
        )
        .first()
    )

    if not publication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(publication, field, value)

    db.commit()
    db.refresh(publication)

    return PublicationResponse.model_validate(publication)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(
    publication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除发表"""
    publication = (
        db.query(UserPublication)
        .filter(
            UserPublication.id == publication_id,
            UserPublication.user_id == current_user.id,
        )
        .first()
    )

    if not publication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publication not found")

    db.delete(publication)
    db.commit()

    return None
