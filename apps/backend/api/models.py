"""
Pydantic models for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


class JobSearchFilters(BaseModel):
    """Filter parameters for job search"""
    
    # Authenticity score range
    min_score: Optional[float] = Field(None, ge=0, le=100, description="Minimum authenticity score")
    max_score: Optional[float] = Field(None, ge=0, le=100, description="Maximum authenticity score")
    
    # Job characteristics
    job_level: Optional[List[str]] = Field(None, description="Job levels: intern, new_grad, junior, mid, senior, staff")
    employment_type: Optional[List[str]] = Field(None, description="Employment types: full_time, internship, contract, part_time")
    work_mode: Optional[List[str]] = Field(None, description="Work modes: remote, hybrid, onsite")
    visa_signal: Optional[List[str]] = Field(None, description="Visa signals: explicit_yes, explicit_no, unclear")
    
    # Location
    states: Optional[List[str]] = Field(None, description="US states (e.g., CA, NY, WA)")
    country: Optional[str] = Field(None, description="Country")
    
    # Salary range
    min_salary: Optional[float] = Field(None, ge=0, description="Minimum salary")
    max_salary: Optional[float] = Field(None, ge=0, description="Maximum salary")
    
    # Platform
    platforms: Optional[List[str]] = Field(None, description="Platforms: LinkedIn, Indeed, etc.")
    
    # Date range
    posted_days_ago: Optional[int] = Field(None, ge=0, le=365, description="Posted within last N days")


class JobSearchRequest(BaseModel):
    """Job search request with filters, sorting, and pagination"""
    
    filters: Optional[JobSearchFilters] = None
    
    # Sorting
    sort_by: Literal["newest", "highest_score", "highest_salary"] = Field(
        "newest",
        description="Sort order"
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
    decision_summary: Optional['DecisionSummary'] = None
    
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

