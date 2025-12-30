"""
Job Preferences CRUD endpoints - Preferences 页面
Phase 7.0 - 匹配前端字段和新数据库结构
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserJobPreferences, get_db

router = APIRouter(prefix="/api/users/me/job-preferences", tags=["profile", "job-preferences"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class JobPreferencesRequest(BaseModel):
    """Job Preferences 请求"""

    # JOB PREFERENCES section
    desired_titles: Optional[List[str]] = None  # ["Software Engineer", "Product Manager"]
    desired_industries: Optional[List[str]] = None  # ["Technology", "Finance"]
    desired_company_sizes: Optional[List[str]] = (
        None  # ["Startup", "Small", "Medium", "Large", "Enterprise"]
    )

    # COMPENSATION section
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: Optional[str] = "USD"
    salary_period: Optional[str] = "yearly"  # "yearly", "monthly", "hourly"
    salary_negotiable: Optional[bool] = True

    # LOCATION & WORK MODE section
    preferred_locations: Optional[List[str]] = None  # ["San Francisco", "New York", "Remote"]
    work_modes: Optional[List[str]] = None  # ["Remote", "Hybrid", "On-site"]
    willing_to_relocate: Optional[str] = None  # "yes", "no", "for_the_right_opportunity"
    relocation_locations: Optional[List[str]] = None  # ["Seattle", "Austin"]

    # EMPLOYMENT DETAILS section
    employment_types: Optional[List[str]] = None  # ["Full-time", "Part-time", "Contract", etc.]
    available_start_date: Optional[str] = None  # "immediately", "2_weeks", "1_month", etc.
    travel_percentage: Optional[str] = None  # "no_travel", "up_to_25", "up_to_50", etc.

    # WORK AUTHORIZATION section
    work_auth_countries: Optional[List[str]] = None  # ["United States", "Canada"]
    requires_sponsorship: Optional[str] = None  # "yes", "no", "not_applicable"

    # APPLICATION QUESTIONS section
    age_over_18: Optional[bool] = None
    has_drivers_license: Optional[bool] = None
    has_reliable_transportation: Optional[bool] = None
    background_check_consent: Optional[bool] = None
    drug_test_consent: Optional[bool] = None

    # EQUAL EMPLOYMENT OPPORTUNITY section
    eeo_gender: Optional[str] = None  # "Male", "Female", "Non-binary", etc.
    eeo_sexual_orientation: Optional[str] = None  # "Heterosexual", "Gay", etc.
    eeo_veteran_status: Optional[str] = None  # "Not a veteran", "Disabled Veteran", etc.
    eeo_disability_status: Optional[str] = None  # "Yes", "No", "Prefer not to disclose"
    eeo_race_ethnicity: Optional[List[str]] = None  # ["Asian", "White", etc.] - 多选


class JobPreferencesResponse(BaseModel):
    """Job Preferences 响应"""

    id: int
    user_id: int

    # JOB PREFERENCES
    desired_titles: Optional[List[str]] = None
    desired_industries: Optional[List[str]] = None
    desired_company_sizes: Optional[List[str]] = None

    # COMPENSATION
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: Optional[str] = "USD"
    salary_period: Optional[str] = "yearly"
    salary_negotiable: Optional[bool] = True

    # LOCATION & WORK MODE
    preferred_locations: Optional[List[str]] = None
    work_modes: Optional[List[str]] = None
    willing_to_relocate: Optional[str] = None
    relocation_locations: Optional[List[str]] = None

    # EMPLOYMENT DETAILS
    employment_types: Optional[List[str]] = None
    available_start_date: Optional[str] = None
    travel_percentage: Optional[str] = None

    # WORK AUTHORIZATION
    work_auth_countries: Optional[List[str]] = None
    requires_sponsorship: Optional[str] = None

    # APPLICATION QUESTIONS
    age_over_18: Optional[bool] = None
    has_drivers_license: Optional[bool] = None
    has_reliable_transportation: Optional[bool] = None
    background_check_consent: Optional[bool] = None
    drug_test_consent: Optional[bool] = None

    # EEO
    eeo_gender: Optional[str] = None
    eeo_sexual_orientation: Optional[str] = None
    eeo_veteran_status: Optional[str] = None
    eeo_disability_status: Optional[str] = None
    eeo_race_ethnicity: Optional[List[str]] = None

    class Config:
        from_attributes = True


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=JobPreferencesResponse)
def get_job_preferences(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """获取当前用户的求职偏好"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        # 创建空的偏好设置
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return JobPreferencesResponse.model_validate(preferences)


@router.put("", response_model=JobPreferencesResponse)
def update_job_preferences(
    request: JobPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新当前用户的求职偏好（支持部分更新）"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)

    # 只更新提供的字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)

    db.commit()
    db.refresh(preferences)

    return JobPreferencesResponse.model_validate(preferences)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除/重置所有求职偏好"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if preferences:
        db.delete(preferences)
        db.commit()

    return None


# =============================================================================
# 分段更新 Endpoints
# =============================================================================


@router.put("/compensation", response_model=dict)
def update_compensation(
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
    salary_currency: Optional[str] = None,
    salary_period: Optional[str] = None,
    salary_negotiable: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新薪资偏好"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)

    if min_salary is not None:
        preferences.min_salary = min_salary
    if max_salary is not None:
        preferences.max_salary = max_salary
    if salary_currency is not None:
        preferences.salary_currency = salary_currency
    if salary_period is not None:
        preferences.salary_period = salary_period
    if salary_negotiable is not None:
        preferences.salary_negotiable = salary_negotiable

    db.commit()
    db.refresh(preferences)

    return {
        "min_salary": preferences.min_salary,
        "max_salary": preferences.max_salary,
        "salary_currency": preferences.salary_currency,
        "salary_period": preferences.salary_period,
        "salary_negotiable": preferences.salary_negotiable,
    }


@router.put("/work-authorization", response_model=dict)
def update_work_authorization(
    work_auth_countries: Optional[List[str]] = None,
    requires_sponsorship: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新工作授权偏好"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)

    if work_auth_countries is not None:
        preferences.work_auth_countries = work_auth_countries
    if requires_sponsorship is not None:
        preferences.requires_sponsorship = requires_sponsorship

    db.commit()
    db.refresh(preferences)

    return {
        "work_auth_countries": preferences.work_auth_countries,
        "requires_sponsorship": preferences.requires_sponsorship,
    }


@router.put("/eeo", response_model=dict)
def update_eeo(
    eeo_gender: Optional[str] = None,
    eeo_sexual_orientation: Optional[str] = None,
    eeo_veteran_status: Optional[str] = None,
    eeo_disability_status: Optional[str] = None,
    eeo_race_ethnicity: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新 EEO 数据"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)

    if eeo_gender is not None:
        preferences.eeo_gender = eeo_gender
    if eeo_sexual_orientation is not None:
        preferences.eeo_sexual_orientation = eeo_sexual_orientation
    if eeo_veteran_status is not None:
        preferences.eeo_veteran_status = eeo_veteran_status
    if eeo_disability_status is not None:
        preferences.eeo_disability_status = eeo_disability_status
    if eeo_race_ethnicity is not None:
        preferences.eeo_race_ethnicity = eeo_race_ethnicity

    db.commit()
    db.refresh(preferences)

    return {
        "eeo_gender": preferences.eeo_gender,
        "eeo_sexual_orientation": preferences.eeo_sexual_orientation,
        "eeo_veteran_status": preferences.eeo_veteran_status,
        "eeo_disability_status": preferences.eeo_disability_status,
        "eeo_race_ethnicity": preferences.eeo_race_ethnicity,
    }


@router.put("/application-questions", response_model=dict)
def update_application_questions(
    age_over_18: Optional[bool] = None,
    has_drivers_license: Optional[bool] = None,
    has_reliable_transportation: Optional[bool] = None,
    background_check_consent: Optional[bool] = None,
    drug_test_consent: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新常见申请问题答案"""
    preferences = (
        db.query(UserJobPreferences).filter(UserJobPreferences.user_id == current_user.id).first()
    )

    if not preferences:
        preferences = UserJobPreferences(user_id=current_user.id)
        db.add(preferences)

    if age_over_18 is not None:
        preferences.age_over_18 = age_over_18
    if has_drivers_license is not None:
        preferences.has_drivers_license = has_drivers_license
    if has_reliable_transportation is not None:
        preferences.has_reliable_transportation = has_reliable_transportation
    if background_check_consent is not None:
        preferences.background_check_consent = background_check_consent
    if drug_test_consent is not None:
        preferences.drug_test_consent = drug_test_consent

    db.commit()
    db.refresh(preferences)

    return {
        "age_over_18": preferences.age_over_18,
        "has_drivers_license": preferences.has_drivers_license,
        "has_reliable_transportation": preferences.has_reliable_transportation,
        "background_check_consent": preferences.background_check_consent,
        "drug_test_consent": preferences.drug_test_consent,
    }
