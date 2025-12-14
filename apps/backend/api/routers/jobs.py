"""
Job search endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from database.models import Job
from ..models import JobSearchRequest, JobSearchResponse, JobResponse, JobDecisionResponse, JobDecisionExplanation, DecisionSummary
from ..services.job_service import JobService
from decision_engine import explain_job_decision

router = APIRouter()


@router.post("/search", response_model=JobSearchResponse)
def search_jobs(
    request: JobSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search jobs with filtering, sorting, and pagination.
    
    **Filters:**
    - `min_score`, `max_score`: Authenticity score range (0-100)
    - `job_level`: intern, new_grad, junior, mid, senior, staff
    - `employment_type`: full_time, internship, contract, part_time
    - `work_mode`: remote, hybrid, onsite
    - `visa_signal`: explicit_yes, explicit_no, unclear
    - `states`: US state codes (e.g., ["CA", "NY"])
    - `country`: Country name
    - `min_salary`, `max_salary`: Salary range
    - `platforms`: Platform names (e.g., ["LinkedIn", "Indeed"])
    - `posted_days_ago`: Posted within last N days
    
    **Sorting:**
    - `newest`: Most recently posted (default)
    - `highest_score`: Highest authenticity score first
    - `highest_salary`: Highest salary first
    
    **Pagination:**
    - `limit`: Results per page (1-100, default 20)
    - `offset`: Number of results to skip (default 0)
    """
    try:
        # Execute search
        jobs, total = JobService.search_jobs(
            db=db,
            filters=request.filters,
            sort_by=request.sort_by,
            limit=request.limit,
            offset=request.offset
        )
        
        # Convert to response models
        job_responses = []
        for job in jobs:
            # Extract derived signals
            derived = job.derived_signals or {}
            geo = derived.get('geo', {})
            salary = derived.get('salary', {})
            
            # Generate lightweight decision summary (Phase 3.2)
            decision = explain_job_decision(job)
            decision_summary = DecisionSummary(
                decision=decision.decision,
                score=job.authenticity_score
            )
            
            job_responses.append(JobResponse(
                id=job.id,
                job_id=job.job_id,
                title=job.title,
                company_name=job.company_name,
                location=job.location,
                url=job.url,
                platform=job.platform,
                authenticity_score=job.authenticity_score,
                authenticity_level=job.authenticity_level,
                confidence=job.confidence,
                job_level=derived.get('job_level'),
                employment_type=derived.get('employment_type'),
                work_mode=derived.get('work_mode'),
                visa_signal=derived.get('visa_signal'),
                salary_min=salary.get('min'),
                salary_max=salary.get('max'),
                salary_interval=salary.get('interval'),
                city=geo.get('city'),
                state=geo.get('state'),
                country=geo.get('country'),
                posted_date=job.posted_date,
                created_at=job.created_at,
                decision_summary=decision_summary
            ))
        
        return JobSearchResponse(
            jobs=job_responses,
            total=total,
            limit=request.limit,
            offset=request.offset,
            has_more=(request.offset + len(jobs)) < total
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific job by job_id.
    """
    job = db.query(Job).filter(Job.job_id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Extract derived signals
    derived = job.derived_signals or {}
    geo = derived.get('geo', {})
    salary = derived.get('salary', {})
    
    return JobResponse(
        id=job.id,
        job_id=job.job_id,
        title=job.title,
        company_name=job.company_name,
        location=job.location,
        url=job.url,
        platform=job.platform,
        authenticity_score=job.authenticity_score,
        authenticity_level=job.authenticity_level,
        confidence=job.confidence,
        job_level=derived.get('job_level'),
        employment_type=derived.get('employment_type'),
        work_mode=derived.get('work_mode'),
        visa_signal=derived.get('visa_signal'),
        salary_min=salary.get('min'),
        salary_max=salary.get('max'),
        salary_interval=salary.get('interval'),
        city=geo.get('city'),
        state=geo.get('state'),
        country=geo.get('country'),
        posted_date=job.posted_date,
        created_at=job.created_at
    )


@router.get("/{job_id}/decision", response_model=JobDecisionResponse)
def get_job_decision(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get decision recommendation and explanation for a specific job.
    
    Returns deterministic, rule-based explanation of why a job is
    recommended, requires caution, or should be avoided.
    
    Based on:
    - Authenticity score thresholds
    - Derived signals (level, mode, visa, salary)
    - Red flags vs positive signals
    - Confidence level
    """
    job = db.query(Job).filter(Job.job_id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Run decision engine
    decision = explain_job_decision(job)
    
    return JobDecisionResponse(
        job_id=job.job_id,
        title=job.title,
        company_name=job.company_name,
        decision=decision.decision,
        explanation=JobDecisionExplanation(
            decision=decision.decision,
            reasons=decision.reasons,
            risks=decision.risks,
            signals_used=decision.signals_used,
            confidence_level=decision.confidence_level
        )
    )

