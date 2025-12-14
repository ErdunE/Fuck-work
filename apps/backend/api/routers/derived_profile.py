"""
Derived Profile API for Phase 5.2.1.

This endpoint computes ATS-ready answers from raw profile data.
Extension autofill MUST use this endpoint exclusively.

Architecture:
  Raw Facts Storage (user_profiles, user_education, user_experience, user_skills)
           ↓
     Derived Profile Service (server-side computation)
           ↓
     GET /api/users/me/derived-profile
           ↓
     Autofill Engine (extension)
"""

from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from database.models import User, UserProfile, UserEducation, UserExperience, UserSkill
from api.auth import get_current_user

router = APIRouter(prefix="/api/users/me", tags=["derived-profile"])


# Response Model

class DerivedProfile(BaseModel):
    """
    ATS-ready profile derived from raw profile data.
    This is the ONLY profile format that autofill should use.
    """
    # Identity
    legal_name: Optional[str] = None
    
    # Education (computed)
    highest_degree: Optional[str] = None  # PhD, MS, BS, AS, or None
    graduation_year: Optional[int] = None
    
    # Experience (computed)
    years_of_experience: Optional[int] = None
    
    # Compliance (normalized + direct)
    work_authorization_status: Optional[str] = None
    willing_to_relocate: bool = False
    government_employment_flag: bool = False
    
    # Skills (normalized)
    normalized_skills: List[str] = []
    
    # Contact (passthrough for convenience)
    primary_email: Optional[str] = None
    phone: Optional[str] = None
    
    # Location (passthrough)
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Professional Links (passthrough)
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None


# Computation Functions

def compute_legal_name(profile: Optional[UserProfile]) -> Optional[str]:
    """Compute legal name from profile."""
    if not profile:
        return None
    
    # Prefer full_name if set
    if profile.full_name and profile.full_name.strip():
        return profile.full_name.strip()
    
    # Otherwise construct from first + last
    if profile.first_name and profile.last_name:
        return f"{profile.first_name.strip()} {profile.last_name.strip()}"
    
    # Fallback to whatever is available
    if profile.first_name:
        return profile.first_name.strip()
    if profile.last_name:
        return profile.last_name.strip()
    
    return None


def compute_highest_degree(education_records: List[UserEducation]) -> Optional[str]:
    """
    Compute highest degree from education records.
    Returns: PhD, MS, BS, AS, or None
    """
    if not education_records:
        return None
    
    degree_hierarchy = {
        'PhD': 4,
        'MS': 3,
        'BS': 2,
        'AS': 1
    }
    
    highest_level = 0
    highest_degree = None
    
    for edu in education_records:
        if not edu.degree:
            continue
        
        degree_lower = edu.degree.lower()
        
        # Detect degree level
        if 'phd' in degree_lower or 'doctorate' in degree_lower or 'ph.d' in degree_lower:
            level = degree_hierarchy['PhD']
            degree_name = 'PhD'
        elif 'master' in degree_lower or 'ms' in degree_lower or 'ma' in degree_lower or 'mba' in degree_lower or 'm.s' in degree_lower or 'm.a' in degree_lower:
            level = degree_hierarchy['MS']
            degree_name = 'MS'
        elif 'bachelor' in degree_lower or 'bs' in degree_lower or 'ba' in degree_lower or 'b.s' in degree_lower or 'b.a' in degree_lower:
            level = degree_hierarchy['BS']
            degree_name = 'BS'
        elif 'associate' in degree_lower or 'as' in degree_lower or 'a.s' in degree_lower:
            level = degree_hierarchy['AS']
            degree_name = 'AS'
        else:
            continue
        
        if level > highest_level:
            highest_level = level
            highest_degree = degree_name
    
    return highest_degree


def compute_graduation_year(education_records: List[UserEducation]) -> Optional[int]:
    """Compute graduation year from most recent education record."""
    if not education_records:
        return None
    
    most_recent_year = None
    
    for edu in education_records:
        if edu.end_date:
            year = edu.end_date.year
            if most_recent_year is None or year > most_recent_year:
                most_recent_year = year
    
    return most_recent_year


def compute_years_of_experience(experience_records: List[UserExperience]) -> Optional[int]:
    """
    Compute total years of experience from experience records.
    Sums all experience durations and returns years (rounded).
    """
    if not experience_records:
        return None
    
    total_months = 0
    today = date.today()
    
    for exp in experience_records:
        if not exp.start_date:
            continue
        
        # Determine end date
        if exp.is_current:
            end = today
        elif exp.end_date:
            end = exp.end_date
        else:
            continue
        
        # Calculate months
        months = (end.year - exp.start_date.year) * 12 + (end.month - exp.start_date.month)
        if months > 0:
            total_months += months
    
    if total_months == 0:
        return None
    
    # Convert to years (rounded)
    years = round(total_months / 12)
    return years if years > 0 else 1  # Minimum 1 year if any experience


def normalize_work_authorization(raw_value: Optional[str]) -> Optional[str]:
    """
    Normalize work authorization status to standard values.
    Common ATS values: US_CITIZEN, GREEN_CARD, H1B, OPT, REQUIRES_SPONSORSHIP
    """
    if not raw_value:
        return None
    
    value_lower = raw_value.lower().strip()
    
    # US Citizen
    if any(keyword in value_lower for keyword in ['us citizen', 'citizen', 'usc', 'u.s. citizen']):
        return 'US_CITIZEN'
    
    # Green Card
    if any(keyword in value_lower for keyword in ['green card', 'permanent resident', 'pr', 'greencard']):
        return 'GREEN_CARD'
    
    # H1B
    if any(keyword in value_lower for keyword in ['h1b', 'h-1b', 'h 1b']):
        return 'H1B'
    
    # OPT / F1
    if any(keyword in value_lower for keyword in ['opt', 'f1', 'f-1']):
        return 'OPT'
    
    # Requires Sponsorship
    if any(keyword in value_lower for keyword in ['sponsor', 'sponsorship', 'require sponsor']):
        return 'REQUIRES_SPONSORSHIP'
    
    # If not recognized, return raw value (uppercase, normalized)
    return raw_value.strip().upper().replace(' ', '_')


def extract_normalized_skills(skill_records: List[UserSkill]) -> List[str]:
    """
    Extract and normalize skills from skill records.
    Returns deduplicated, lowercase, trimmed list.
    """
    if not skill_records:
        return []
    
    skills = []
    seen = set()
    
    for skill in skill_records:
        if not skill.skill_name:
            continue
        
        # Normalize: lowercase, trim
        normalized = skill.skill_name.lower().strip()
        
        # Deduplicate
        if normalized and normalized not in seen:
            skills.append(normalized)
            seen.add(normalized)
    
    return skills


# Endpoint

@router.get("/derived-profile", response_model=DerivedProfile)
def get_derived_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get derived ATS-ready profile (Phase 5.2.1).
    
    This endpoint computes ATS-ready answers from raw profile data.
    Extension autofill MUST use this endpoint exclusively.
    
    Data flow:
      Raw Tables → Derived Computation → ATS-Ready Response
    
    Computation is done on-the-fly (no caching).
    """
    # Fetch raw data
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    experience = db.query(UserExperience).filter(UserExperience.user_id == current_user.id).all()
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    
    # Compute derived fields
    derived = DerivedProfile(
        # Computed fields
        legal_name=compute_legal_name(profile),
        highest_degree=compute_highest_degree(education),
        graduation_year=compute_graduation_year(education),
        years_of_experience=compute_years_of_experience(experience),
        work_authorization_status=normalize_work_authorization(profile.work_authorization if profile else None),
        willing_to_relocate=profile.willing_to_relocate if (profile and profile.willing_to_relocate is not None) else False,
        government_employment_flag=profile.government_employment_history if (profile and profile.government_employment_history is not None) else False,
        normalized_skills=extract_normalized_skills(skills),
        
        # Passthrough fields (contact/location/links)
        primary_email=profile.primary_email if profile else None,
        phone=profile.phone if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        country=profile.country if profile else None,
        postal_code=profile.postal_code if profile else None,
        linkedin_url=profile.linkedin_url if profile else None,
        portfolio_url=profile.portfolio_url if profile else None,
        github_url=profile.github_url if profile else None
    )
    
    return derived

