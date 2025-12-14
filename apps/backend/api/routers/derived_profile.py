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
from typing import Optional, List, Dict
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
    
    Phase 5.2.1 Review Fixes:
    - Includes missing_fields array for required fields that are null
    - Includes source_fields mapping for traceability
    - Work authorization split into boolean primitives
    """
    # Identity
    legal_name: Optional[str] = None
    
    # Education (computed)
    highest_degree: Optional[str] = None  # PhD, MS, BS, AS, or None
    graduation_year: Optional[int] = None
    
    # Experience (computed)
    years_of_experience: Optional[int] = None
    
    # Compliance (normalized + ATS-friendly boolean primitives)
    work_authorized_us: Optional[bool] = None  # True if authorized to work in US
    requires_sponsorship: Optional[bool] = None  # True if requires visa sponsorship
    work_auth_category: Optional[str] = None  # US_CITIZEN, GREEN_CARD, H1B, OPT, etc.
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
    
    # Metadata (Phase 5.2.1 Review Fix)
    missing_fields: List[str] = []  # Fields that are required but null/empty
    source_fields: Dict[str, List[str]] = {}  # Mapping of derived field -> raw fields used


# Computation Functions

def compute_legal_name(profile: Optional[UserProfile]) -> Optional[str]:
    """
    Compute legal name from profile (Phase 5.2.1 Review Fix).
    
    Null-safe computation:
    - Never returns "null" string or extra whitespace
    - Only returns valid trimmed string or None
    - Properly handles missing first/last names
    """
    if not profile:
        return None
    
    # Prefer full_name if set and not empty
    if profile.full_name:
        cleaned = profile.full_name.strip()
        if cleaned and cleaned.lower() != 'null' and cleaned.lower() != 'none':
            return cleaned
    
    # Otherwise construct from first + last (only if BOTH exist)
    first = profile.first_name.strip() if profile.first_name else None
    last = profile.last_name.strip() if profile.last_name else None
    
    # Check for null/none strings
    if first and first.lower() in ('null', 'none', ''):
        first = None
    if last and last.lower() in ('null', 'none', ''):
        last = None
    
    # Only concatenate if BOTH are valid
    if first and last:
        return f"{first} {last}"
    
    # Do NOT return partial names - autofill needs full legal name
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


def compute_work_authorization_primitives(raw_value: Optional[str]) -> tuple[Optional[bool], Optional[bool], Optional[str]]:
    """
    Compute work authorization as ATS-friendly boolean primitives (Phase 5.2.1 Review Fix).
    
    Returns: (work_authorized_us, requires_sponsorship, work_auth_category)
    
    Examples:
    - "US Citizen" -> (True, False, "US_CITIZEN")
    - "Green Card" -> (True, False, "GREEN_CARD")
    - "H1B" -> (True, True, "H1B")
    - "Requires Sponsorship" -> (None, True, "REQUIRES_SPONSORSHIP")
    - None/empty -> (None, None, None)
    """
    if not raw_value or not raw_value.strip():
        return (None, None, None)
    
    value_lower = raw_value.lower().strip()
    
    # US Citizen: authorized, no sponsorship needed
    if any(keyword in value_lower for keyword in ['us citizen', 'citizen', 'usc', 'u.s. citizen']):
        return (True, False, 'US_CITIZEN')
    
    # Green Card / Permanent Resident: authorized, no sponsorship needed
    if any(keyword in value_lower for keyword in ['green card', 'permanent resident', 'pr', 'greencard']):
        return (True, False, 'GREEN_CARD')
    
    # H1B: authorized (if valid), but required sponsorship initially
    if any(keyword in value_lower for keyword in ['h1b', 'h-1b', 'h 1b']):
        return (True, True, 'H1B')
    
    # OPT / F1: authorized temporarily, may need sponsorship
    if any(keyword in value_lower for keyword in ['opt', 'f1', 'f-1']):
        return (True, True, 'OPT')
    
    # Explicitly requires sponsorship (unknown status)
    if any(keyword in value_lower for keyword in ['sponsor', 'sponsorship', 'require sponsor']):
        return (None, True, 'REQUIRES_SPONSORSHIP')
    
    # Not authorized explicitly
    if any(keyword in value_lower for keyword in ['not authorized', 'no authorization', 'not eligible']):
        return (False, None, 'NOT_AUTHORIZED')
    
    # Unknown/unrecognized -> return raw normalized category only
    category = raw_value.strip().upper().replace(' ', '_')
    return (None, None, category)


def normalize_work_authorization(raw_value: Optional[str]) -> Optional[str]:
    """
    Normalize work authorization status to standard category (backward compat).
    Common ATS values: US_CITIZEN, GREEN_CARD, H1B, OPT, REQUIRES_SPONSORSHIP
    """
    _, _, category = compute_work_authorization_primitives(raw_value)
    return category


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
    Get derived ATS-ready profile (Phase 5.2.1 + Review Fixes).
    
    This endpoint computes ATS-ready answers from raw profile data.
    Extension autofill MUST use this endpoint exclusively.
    
    Data flow:
      Raw Tables → Derived Computation → ATS-Ready Response
    
    Computation is done on-the-fly (no caching).
    
    Review Fixes:
    - Includes missing_fields array
    - Includes source_fields mapping for traceability
    - Work authorization split into boolean primitives
    - Null-safe legal_name computation
    """
    # Fetch raw data
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    experience = db.query(UserExperience).filter(UserExperience.user_id == current_user.id).all()
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    
    # Compute derived fields
    legal_name = compute_legal_name(profile)
    highest_degree = compute_highest_degree(education)
    graduation_year = compute_graduation_year(education)
    years_of_experience = compute_years_of_experience(experience)
    work_authorized_us, requires_sponsorship, work_auth_category = compute_work_authorization_primitives(
        profile.work_authorization if profile else None
    )
    normalized_skills_list = extract_normalized_skills(skills)
    
    # Track missing fields (Phase 5.2.1 Review Fix)
    missing_fields = []
    if not legal_name:
        missing_fields.append('legal_name')
    if not (profile and profile.primary_email):
        missing_fields.append('primary_email')
    if not (profile and profile.phone):
        missing_fields.append('phone')
    if highest_degree is None and len(education) == 0:
        missing_fields.append('highest_degree')
    if years_of_experience is None and len(experience) == 0:
        missing_fields.append('years_of_experience')
    if work_authorized_us is None and work_auth_category is None:
        missing_fields.append('work_authorization')
    
    # Build source_fields mapping (Phase 5.2.1 Review Fix)
    source_fields = {}
    if legal_name:
        source_fields['legal_name'] = ['first_name', 'last_name', 'full_name']
    if highest_degree:
        source_fields['highest_degree'] = ['user_education.degree']
    if graduation_year:
        source_fields['graduation_year'] = ['user_education.end_date']
    if years_of_experience is not None:
        source_fields['years_of_experience'] = ['user_experience.start_date', 'user_experience.end_date', 'user_experience.is_current']
    if work_authorized_us is not None or requires_sponsorship is not None:
        source_fields['work_authorization'] = ['work_authorization']
    if normalized_skills_list:
        source_fields['normalized_skills'] = ['user_skills.skill_name']
    
    # Construct response
    derived = DerivedProfile(
        # Computed fields
        legal_name=legal_name,
        highest_degree=highest_degree,
        graduation_year=graduation_year,
        years_of_experience=years_of_experience,
        
        # Work authorization primitives (Phase 5.2.1 Review Fix)
        work_authorized_us=work_authorized_us,
        requires_sponsorship=requires_sponsorship,
        work_auth_category=work_auth_category,
        
        # Compliance flags
        willing_to_relocate=profile.willing_to_relocate if (profile and profile.willing_to_relocate is not None) else False,
        government_employment_flag=profile.government_employment_history if (profile and profile.government_employment_history is not None) else False,
        
        # Skills
        normalized_skills=normalized_skills_list,
        
        # Passthrough fields (contact/location/links)
        primary_email=profile.primary_email if profile else None,
        phone=profile.phone if profile else None,
        city=profile.city if profile else None,
        state=profile.state if profile else None,
        country=profile.country if profile else None,
        postal_code=profile.postal_code if profile else None,
        linkedin_url=profile.linkedin_url if profile else None,
        portfolio_url=profile.portfolio_url if profile else None,
        github_url=profile.github_url if profile else None,
        
        # Metadata (Phase 5.2.1 Review Fix)
        missing_fields=missing_fields,
        source_fields=source_fields
    )
    
    return derived

