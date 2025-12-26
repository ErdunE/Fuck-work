"""
Pydantic models for API requests and responses.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class JobSearchFilters(BaseModel):
    """Filter parameters for job search"""

    # Authenticity score range
    min_score: Optional[float] = Field(None, ge=0, le=100, description="Minimum authenticity score")
    max_score: Optional[float] = Field(None, ge=0, le=100, description="Maximum authenticity score")

    # Job characteristics
    job_level: Optional[List[str]] = Field(
        None, description="Job levels: intern, new_grad, junior, mid, senior, staff"
    )
    employment_type: Optional[List[str]] = Field(
        None, description="Employment types: full_time, internship, contract, part_time"
    )
    work_mode: Optional[List[str]] = Field(None, description="Work modes: remote, hybrid, onsite")
    visa_signal: Optional[List[str]] = Field(
        None, description="Visa signals: explicit_yes, explicit_no, unclear"
    )

    # Location
    states: Optional[List[str]] = Field(None, description="US states (e.g., CA, NY, WA)")
    country: Optional[str] = Field(None, description="Country")

    # Salary range
    min_salary: Optional[float] = Field(None, ge=0, description="Minimum salary")
    max_salary: Optional[float] = Field(None, ge=0, description="Maximum salary")

    # Platform
    platforms: Optional[List[str]] = Field(None, description="Platforms: LinkedIn, Indeed, etc.")

    # Date range
    posted_days_ago: Optional[int] = Field(
        None, ge=0, le=365, description="Posted within last N days"
    )

    # Tier 1: Platform Features (from platform_metadata JSONB)
    easy_apply: Optional[bool] = Field(None, description="Easy Apply jobs only")
    actively_hiring: Optional[bool] = Field(None, description="Actively hiring tag")
    max_applicants: Optional[int] = Field(None, ge=0, description="Max applicants")
    min_applicants: Optional[int] = Field(None, ge=0, description="Min applicants")
    has_views_data: Optional[bool] = Field(None, description="Has view count data")

    # Tier 2: Experience (from derived_signals JSONB)
    min_experience_years: Optional[int] = Field(None, ge=0, le=30)
    max_experience_years: Optional[int] = Field(None, ge=0, le=30)
    has_salary_info: Optional[bool] = Field(None, description="Salary disclosed")
    salary_interval: Optional[List[str]] = Field(None, description="yearly/monthly/hourly")

    # Tier 3: Computed (calculated filters)
    is_recent: Optional[bool] = Field(None, description="Posted last 3 days")
    competition_level: Optional[List[str]] = Field(None, description="low/medium/high")
    has_red_flags: Optional[bool] = Field(None, description="Has/no red flags")
    max_red_flags: Optional[int] = Field(None, ge=0)
    min_positive_signals: Optional[int] = Field(None, ge=0)

    # Tier 4: Advanced (text search & company filters)
    exclude_companies: Optional[List[str]] = Field(None)
    include_companies_only: Optional[List[str]] = Field(None)
    keywords_in_description: Optional[List[str]] = Field(None)
    exclude_keywords: Optional[List[str]] = Field(None)


class JobSearchRequest(BaseModel):
    """Job search request with filters, sorting, and pagination"""

    filters: Optional[JobSearchFilters] = None

    # Sorting
    sort_by: Literal["newest", "highest_score", "highest_salary"] = Field(
        "newest", description="Sort order"
    )

    # Pagination
    limit: int = Field(20, ge=1, le=100, description="Number of results per page")
    offset: int = Field(0, ge=0, description="Number of results to skip")


class JobResponse(BaseModel):
    """Single job response"""

    id: int
    job_id: str
    title: str
    company_name: str
    location: Optional[str]
    url: str
    platform: str

    # Authenticity scoring
    authenticity_score: Optional[float]
    authenticity_level: Optional[str]
    confidence: Optional[str]

    # Derived signals
    job_level: Optional[str]
    employment_type: Optional[str]
    work_mode: Optional[str]
    visa_signal: Optional[str]

    # Salary
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_interval: Optional[str]

    # Geo
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]

    # Dates
    posted_date: Optional[datetime]
    created_at: datetime

    # Phase 3.2: Optional decision summary (non-breaking addition)
    decision_summary: Optional["DecisionSummary"] = None

    class Config:
        from_attributes = True


class JobSearchResponse(BaseModel):
    """Job search response with pagination metadata"""

    jobs: List[JobResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


# Phase 3.2: Decision & Explainability Layer models


class DecisionSummary(BaseModel):
    """Lightweight decision summary for search results"""

    decision: Literal["recommend", "caution", "avoid"]
    score: Optional[float] = None


class JobDecisionExplanation(BaseModel):
    """Full decision explanation"""

    decision: Literal["recommend", "caution", "avoid"]
    reasons: List[str]
    risks: List[str]
    signals_used: Dict[str, Any]
    confidence_level: str


class JobDecisionResponse(BaseModel):
    """Response for decision endpoint"""

    job_id: str
    title: str
    company_name: str
    decision: str
    explanation: JobDecisionExplanation


# Resolve forward references for Pydantic v2
JobResponse.model_rebuild()
