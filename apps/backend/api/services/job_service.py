"""
Job search service with filtering and sorting.
"""

from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text, desc, asc
from datetime import datetime, timedelta
from database.models import Job
from ..models import JobSearchFilters


class JobService:
    """Service for querying jobs with filters"""
    
    @staticmethod
    def search_jobs(
        db: Session,
        filters: Optional[JobSearchFilters],
        sort_by: str,
        limit: int,
        offset: int
    ) -> Tuple[List[Job], int]:
        """
        Search jobs with filters, sorting, and pagination.
        
        Returns:
            Tuple of (jobs list, total count)
        """
        # Base query
        query = db.query(Job)
        
        # Apply filters
        if filters:
            conditions = []
            
            # Authenticity score range
            if filters.min_score is not None:
                conditions.append(Job.authenticity_score >= filters.min_score)
            if filters.max_score is not None:
                conditions.append(Job.authenticity_score <= filters.max_score)
            
            # Job level (from derived_signals)
            if filters.job_level:
                conditions.append(
                    text("derived_signals->>'job_level' = ANY(:job_levels)")
                )
                query = query.params(job_levels=filters.job_level)
            
            # Employment type
            if filters.employment_type:
                conditions.append(
                    text("derived_signals->>'employment_type' = ANY(:emp_types)")
                )
                query = query.params(emp_types=filters.employment_type)
            
            # Work mode
            if filters.work_mode:
                conditions.append(
                    text("derived_signals->>'work_mode' = ANY(:work_modes)")
                )
                query = query.params(work_modes=filters.work_mode)
            
            # Visa signal
            if filters.visa_signal:
                conditions.append(
                    text("derived_signals->>'visa_signal' = ANY(:visa_signals)")
                )
                query = query.params(visa_signals=filters.visa_signal)
            
            # State filter
            if filters.states:
                conditions.append(
                    text("derived_signals->'geo'->>'state' = ANY(:states)")
                )
                query = query.params(states=filters.states)
            
            # Country filter
            if filters.country:
                conditions.append(
                    text("derived_signals->'geo'->>'country' = :country")
                )
                query = query.params(country=filters.country)
            
            # Salary range (check both min and max)
            if filters.min_salary is not None:
                conditions.append(
                    or_(
                        text("(derived_signals->'salary'->>'min')::float >= :min_salary"),
                        text("(derived_signals->'salary'->>'max')::float >= :min_salary")
                    )
                )
                query = query.params(min_salary=filters.min_salary)
            
            if filters.max_salary is not None:
                conditions.append(
                    or_(
                        text("(derived_signals->'salary'->>'min')::float <= :max_salary"),
                        text("(derived_signals->'salary'->>'max')::float <= :max_salary")
                    )
                )
                query = query.params(max_salary=filters.max_salary)
            
            # Platform filter
            if filters.platforms:
                conditions.append(Job.platform.in_(filters.platforms))
            
            # Posted date filter
            if filters.posted_days_ago is not None:
                cutoff_date = datetime.now() - timedelta(days=filters.posted_days_ago)
                conditions.append(Job.posted_date >= cutoff_date)
            
            # Apply all conditions
            if conditions:
                query = query.filter(and_(*conditions))
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        if sort_by == "newest":
            query = query.order_by(desc(Job.posted_date))
        elif sort_by == "highest_score":
            query = query.order_by(desc(Job.authenticity_score))
        elif sort_by == "highest_salary":
            # Sort by max salary, nulls last
            query = query.order_by(
                text("(derived_signals->'salary'->>'max')::float DESC NULLS LAST")
            )
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute
        jobs = query.all()
        
        return jobs, total

