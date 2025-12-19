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
            
            # Tier 1: Platform Features
            if filters.easy_apply is not None:
                conditions.append(
                    text("(platform_metadata->>'easy_apply')::boolean = :easy_apply")
                )
                query = query.params(easy_apply=filters.easy_apply)
            
            if filters.actively_hiring is not None:
                conditions.append(
                    text("(platform_metadata->>'actively_hiring_tag')::boolean = :actively_hiring")
                )
                query = query.params(actively_hiring=filters.actively_hiring)
            
            if filters.max_applicants is not None:
                conditions.append(
                    text("(platform_metadata->>'applicants_count')::int <= :max_applicants")
                )
                query = query.params(max_applicants=filters.max_applicants)
            
            if filters.min_applicants is not None:
                conditions.append(
                    text("(platform_metadata->>'applicants_count')::int >= :min_applicants")
                )
                query = query.params(min_applicants=filters.min_applicants)
            
            if filters.has_views_data is not None:
                if filters.has_views_data:
                    conditions.append(
                        text("platform_metadata->>'views_count' IS NOT NULL")
                    )
                else:
                    conditions.append(
                        text("platform_metadata->>'views_count' IS NULL")
                    )
            
            # Tier 2: Experience Requirements
            if filters.min_experience_years is not None:
                conditions.append(
                    text("(derived_signals->'experience_years'->>'min')::int >= :min_exp")
                )
                query = query.params(min_exp=filters.min_experience_years)
            
            if filters.max_experience_years is not None:
                conditions.append(
                    text("(derived_signals->'experience_years'->>'max')::int <= :max_exp")
                )
                query = query.params(max_exp=filters.max_experience_years)
            
            if filters.has_salary_info is not None:
                if filters.has_salary_info:
                    conditions.append(
                        text("derived_signals->'salary'->>'min' IS NOT NULL")
                    )
                else:
                    conditions.append(
                        text("derived_signals->'salary'->>'min' IS NULL")
                    )
            
            if filters.salary_interval:
                conditions.append(
                    text("derived_signals->'salary'->>'interval' = ANY(:salary_intervals)")
                )
                query = query.params(salary_intervals=filters.salary_interval)
            
            # Tier 3: Computed Filters
            if filters.is_recent is not None:
                if filters.is_recent:
                    cutoff_date = datetime.now() - timedelta(days=3)
                    conditions.append(Job.posted_date >= cutoff_date)
            
            if filters.competition_level:
                # Map competition levels to applicants_count ranges
                competition_conditions = []
                for level in filters.competition_level:
                    if level == "low":
                        competition_conditions.append(
                            text("(platform_metadata->>'applicants_count')::int < 50")
                        )
                    elif level == "medium":
                        competition_conditions.append(
                            and_(
                                text("(platform_metadata->>'applicants_count')::int >= 50"),
                                text("(platform_metadata->>'applicants_count')::int <= 200")
                            )
                        )
                    elif level == "high":
                        competition_conditions.append(
                            text("(platform_metadata->>'applicants_count')::int > 200")
                        )
                if competition_conditions:
                    conditions.append(or_(*competition_conditions))
            
            if filters.has_red_flags is not None:
                if filters.has_red_flags == False:
                    # No red flags
                    conditions.append(
                        or_(
                            Job.red_flags == None,
                            text("jsonb_array_length(red_flags) = 0")
                        )
                    )
                else:
                    # Has red flags
                    conditions.append(
                        text("jsonb_array_length(red_flags) > 0")
                    )
            
            if filters.max_red_flags is not None:
                conditions.append(
                    or_(
                        Job.red_flags == None,
                        text("jsonb_array_length(red_flags) <= :max_red_flags")
                    )
                )
                query = query.params(max_red_flags=filters.max_red_flags)
            
            if filters.min_positive_signals is not None:
                conditions.append(
                    text("jsonb_array_length(positive_signals) >= :min_positive")
                )
                query = query.params(min_positive=filters.min_positive_signals)
            
            # Tier 4: Advanced Filters
            if filters.exclude_companies:
                # Case-insensitive exclusion
                conditions.append(
                    ~func.lower(Job.company_name).in_([c.lower() for c in filters.exclude_companies])
                )
            
            if filters.include_companies_only:
                # Case-insensitive inclusion
                conditions.append(
                    func.lower(Job.company_name).in_([c.lower() for c in filters.include_companies_only])
                )
            
            if filters.keywords_in_description:
                # AND logic: all keywords must be present
                for keyword in filters.keywords_in_description:
                    conditions.append(
                        Job.jd_text.ilike(f"%{keyword}%")
                    )
            
            if filters.exclude_keywords:
                # OR logic: exclude if any keyword is present
                for keyword in filters.exclude_keywords:
                    conditions.append(
                        ~Job.jd_text.ilike(f"%{keyword}%")
                    )
            
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

