"""
User Profile API endpoints - Personal Info 页面
Phase 7.0 - 匹配前端字段
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import (
    User,
    UserAward,
    UserCertification,
    UserEducation,
    UserExperience,
    UserLanguage,
    UserProfile,
    UserProject,
    UserPublication,
    UserResume,
    UserSkill,
    UserVolunteering,
    get_db,
)

router = APIRouter(prefix="/api/users/me", tags=["profile"])


# =============================================================================
# Pydantic Models - 匹配前端字段
# =============================================================================


class OtherUrl(BaseModel):
    """其他链接"""

    label: str
    url: str


class ProfileResponse(BaseModel):
    """Profile 响应 - Personal Info 页面"""

    id: int
    user_id: int

    # Basic Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    email: Optional[str] = None

    # Contact
    phone_country_code: Optional[str] = None
    phone_number: Optional[str] = None

    # Location
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    postal_code: Optional[str] = None

    # Online Presence
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    other_urls: Optional[List[OtherUrl]] = None

    # About
    professional_summary: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    """Profile 更新请求"""

    # Basic Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    email: Optional[EmailStr] = None

    # Contact
    phone_country_code: Optional[str] = None
    phone_number: Optional[str] = None

    # Location
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    postal_code: Optional[str] = None

    # Online Presence
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    other_urls: Optional[List[OtherUrl]] = None

    # About
    professional_summary: Optional[str] = None


# =============================================================================
# 子集合的响应模型（用于完整 Profile 响应）
# =============================================================================


class EducationItem(BaseModel):
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


class ExperienceItem(BaseModel):
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


class SkillItem(BaseModel):
    id: int
    skill_name: str

    class Config:
        from_attributes = True


class LanguageItem(BaseModel):
    id: int
    language_name: str
    proficiency: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectItem(BaseModel):
    id: int
    project_name: str
    role: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_ongoing: bool = False
    project_url: Optional[str] = None
    repo_url: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None

    class Config:
        from_attributes = True


class CertificationItem(BaseModel):
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


class AwardItem(BaseModel):
    id: int
    title: str
    issuer: Optional[str] = None
    received_month: Optional[str] = None
    received_year: Optional[int] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PublicationItem(BaseModel):
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


class VolunteeringItem(BaseModel):
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


class ResumeItem(BaseModel):
    id: int
    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_default: bool = False
    is_cover_letter: bool = False
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FullProfileResponse(BaseModel):
    """完整 Profile 响应 - 包含所有子集合"""

    # Profile 基本信息
    id: int
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    email: Optional[str] = None
    phone_country_code: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    postal_code: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    other_urls: Optional[List[OtherUrl]] = None
    professional_summary: Optional[str] = None

    # Collections
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    skills: List[SkillItem] = []
    languages: List[LanguageItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    awards: List[AwardItem] = []
    publications: List[PublicationItem] = []
    volunteering: List[VolunteeringItem] = []
    resumes: List[ResumeItem] = []

    class Config:
        from_attributes = True


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/profile", response_model=FullProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    获取当前用户的完整 Profile（包含所有子集合）
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        # 如果没有 profile，创建一个空的
        profile = UserProfile(
            user_id=current_user.id, email=current_user.email  # 从 users 表继承 email
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # 获取所有子集合
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    experience = db.query(UserExperience).filter(UserExperience.user_id == current_user.id).all()
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    languages = db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).all()
    projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).all()
    certifications = (
        db.query(UserCertification).filter(UserCertification.user_id == current_user.id).all()
    )
    awards = db.query(UserAward).filter(UserAward.user_id == current_user.id).all()
    publications = (
        db.query(UserPublication).filter(UserPublication.user_id == current_user.id).all()
    )
    volunteering = (
        db.query(UserVolunteering).filter(UserVolunteering.user_id == current_user.id).all()
    )
    resumes = db.query(UserResume).filter(UserResume.user_id == current_user.id).all()

    # 构建响应
    return FullProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        preferred_name=profile.preferred_name,
        email=profile.email,
        phone_country_code=profile.phone_country_code,
        phone_number=profile.phone_number,
        country=profile.country,
        state=profile.state,
        city=profile.city,
        street_address=profile.street_address,
        apartment=profile.apartment,
        postal_code=profile.postal_code,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        website_url=profile.website_url,
        other_urls=profile.other_urls,
        professional_summary=profile.professional_summary,
        education=[EducationItem.model_validate(e) for e in education],
        experience=[ExperienceItem.model_validate(e) for e in experience],
        skills=[SkillItem.model_validate(s) for s in skills],
        languages=[LanguageItem.model_validate(l) for l in languages],
        projects=[ProjectItem.model_validate(p) for p in projects],
        certifications=[CertificationItem.model_validate(c) for c in certifications],
        awards=[AwardItem.model_validate(a) for a in awards],
        publications=[PublicationItem.model_validate(p) for p in publications],
        volunteering=[VolunteeringItem.model_validate(v) for v in volunteering],
        resumes=[ResumeItem.model_validate(r) for r in resumes],
    )


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    更新当前用户的 Profile（Personal Info）
    支持部分更新 - 只更新提供的字段
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        # 创建新 profile
        profile = UserProfile(user_id=current_user.id, email=current_user.email)
        db.add(profile)

    # 更新提供的字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return ProfileResponse.model_validate(profile)


@router.get("/profile/personal-info", response_model=ProfileResponse)
def get_personal_info(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    获取 Personal Info 页面数据（不包含子集合）
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        profile = UserProfile(user_id=current_user.id, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return ProfileResponse.model_validate(profile)
