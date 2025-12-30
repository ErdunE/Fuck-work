"""
Certifications CRUD endpoints - Achievements 页面 (Certifications 部分)
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserCertification, get_db

router = APIRouter(prefix="/api/users/me/certifications", tags=["profile", "certifications"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class CertificationRequest(BaseModel):
    """Certification 请求"""

    name: str  # "AWS Solutions Architect"
    issuing_organization: Optional[str] = None  # "Amazon Web Services"
    issue_month: Optional[str] = None  # "January", etc.
    issue_year: Optional[int] = None
    expiration_month: Optional[str] = None
    expiration_year: Optional[int] = None
    no_expiration: bool = False  # "This credential does not expire"
    credential_id: Optional[str] = None  # "ABC123XYZ"
    credential_url: Optional[str] = None  # "https://verify.example.com/..."


class CertificationResponse(BaseModel):
    """Certification 响应"""

    id: int
    name: str
    issuing_organization: Optional[str] = None
    issue_month: Optional[str] = None
    issue_year: Optional[int] = None
    expiration_month: Optional[str] = None
    expiration_year: Optional[int] = None
    no_expiration: bool = False
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

    class Config:
        from_attributes = True


class CertificationListResponse(BaseModel):
    """Certification 列表响应"""

    certifications: List[CertificationResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=CertificationListResponse)
def list_certifications(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """获取当前用户的所有证书"""
    certifications = (
        db.query(UserCertification)
        .filter(UserCertification.user_id == current_user.id)
        .order_by(UserCertification.issue_year.desc().nullslast(), UserCertification.id.desc())
        .all()
    )
    return CertificationListResponse(
        certifications=[CertificationResponse.model_validate(c) for c in certifications],
        total=len(certifications),
    )


@router.post("", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def create_certification(
    request: CertificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新证书"""
    certification = UserCertification(
        user_id=current_user.id,
        name=request.name,
        issuing_organization=request.issuing_organization,
        issue_month=request.issue_month,
        issue_year=request.issue_year,
        expiration_month=request.expiration_month,
        expiration_year=request.expiration_year,
        no_expiration=request.no_expiration,
        credential_id=request.credential_id,
        credential_url=request.credential_url,
    )
    db.add(certification)
    db.commit()
    db.refresh(certification)

    return CertificationResponse.model_validate(certification)


@router.get("/{certification_id}", response_model=CertificationResponse)
def get_certification(
    certification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定证书"""
    certification = (
        db.query(UserCertification)
        .filter(
            UserCertification.id == certification_id,
            UserCertification.user_id == current_user.id,
        )
        .first()
    )

    if not certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")

    return CertificationResponse.model_validate(certification)


@router.put("/{certification_id}", response_model=CertificationResponse)
def update_certification(
    certification_id: int,
    request: CertificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新证书"""
    certification = (
        db.query(UserCertification)
        .filter(
            UserCertification.id == certification_id,
            UserCertification.user_id == current_user.id,
        )
        .first()
    )

    if not certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(certification, field, value)

    db.commit()
    db.refresh(certification)

    return CertificationResponse.model_validate(certification)


@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    certification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除证书"""
    certification = (
        db.query(UserCertification)
        .filter(
            UserCertification.id == certification_id,
            UserCertification.user_id == current_user.id,
        )
        .first()
    )

    if not certification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")

    db.delete(certification)
    db.commit()

    return None
