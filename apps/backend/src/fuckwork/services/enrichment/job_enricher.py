"""
Job enrichment module - derives structured fields from raw job data.

Deterministic rules only (no ML).
Phase 2.5 - Data Structuring.
"""

import re
from typing import Dict, Optional


class JobEnricher:
    """
    Enriches job data with structured derived_signals.
    
    Derives 7 key fields:
    - job_level (intern/new_grad/junior/mid/senior/staff)
    - employment_type (full_time/internship/contract/part_time)
    - work_mode (remote/hybrid/onsite)
    - visa_signal (explicit_yes/explicit_no/unclear)
    - experience_years (min/max)
    - salary (min/max/interval)
    - geo (city/state/country)
    """
    
    def enrich_job(self, job_dict: Dict) -> Dict:
        """
        Main enrichment function.
        
        Args:
            job_dict: Job data with title, location, jd_text, etc.
        
        Returns:
            Dict with all derived fields for derived_signals
        """
        return {
            'job_level': self._derive_job_level(job_dict.get('title', '')),
            'employment_type': self._derive_employment_type(job_dict),
            'work_mode': self._derive_work_mode(job_dict),
            'visa_signal': self._derive_visa_signal(job_dict.get('jd_text', '')),
            'experience_years': self._derive_experience_years(job_dict.get('jd_text', '')),
            'salary': self._derive_salary(job_dict.get('platform_metadata', {})),
            'geo': self._derive_geo(job_dict.get('location', '')),
        }
    
    def _derive_job_level(self, title: str) -> str:
        """
        Derive job level from title.
        
        Priority order:
        1. intern (explicit intern keywords)
        2. new_grad (graduate/entry level)
        3. staff (staff/principal/architect)
        4. senior (senior/sr/lead)
        5. junior (junior/jr)
        6. mid (default)
        """
        title_lower = title.lower()
        
        # Intern (highest priority for accuracy)
        if any(keyword in title_lower for keyword in ["intern", "internship"]):
            return "intern"
        
        # New grad
        if any(keyword in title_lower for keyword in ["new grad", "entry level", "graduate", "entry-level"]):
            return "new_grad"
        
        # Staff (before senior to catch "Staff Engineer")
        if any(keyword in title_lower for keyword in ["staff", "principal", "architect"]):
            return "staff"
        
        # Senior
        if any(keyword in title_lower for keyword in ["senior", "sr.", "sr ", "lead"]):
            return "senior"
        
        # Junior
        if any(keyword in title_lower for keyword in ["junior", "jr.", "jr "]):
            return "junior"
        
        # Default to mid
        return "mid"
    
    def _derive_employment_type(self, job_dict: Dict) -> str:
        """
        Derive employment type.
        
        Priority:
        1. Use platform_metadata.job_type if available
        2. Check title for keywords
        3. Default to full_time
        """
        # Check platform metadata first
        platform_metadata = job_dict.get('platform_metadata', {})
        if platform_metadata and isinstance(platform_metadata, dict):
            job_type = platform_metadata.get('job_type', '').lower()
            
            if 'intern' in job_type:
                return "internship"
            elif 'contract' in job_type or 'contractor' in job_type:
                return "contract"
            elif 'part' in job_type or 'part-time' in job_type:
                return "part_time"
            elif 'full' in job_type or 'full-time' in job_type:
                return "full_time"
        
        # Fallback to title
        title = job_dict.get('title', '').lower()
        
        if 'intern' in title:
            return "internship"
        elif 'contract' in title:
            return "contract"
        elif 'part-time' in title or 'part time' in title:
            return "part_time"
        
        # Default
        return "full_time"
    
    def _derive_work_mode(self, job_dict: Dict) -> str:
        """
        Derive work mode (remote/hybrid/onsite).
        
        Check title, location, and JD text for keywords.
        """
        title = job_dict.get('title', '').lower()
        location = job_dict.get('location', '').lower()
        jd_text = job_dict.get('jd_text', '').lower()
        
        # Remote indicators
        if 'remote' in title or 'remote' in location:
            return "remote"
        
        # Check JD for remote keywords (more thorough)
        if any(keyword in jd_text for keyword in ['fully remote', '100% remote', 'work from home', 'wfh']):
            return "remote"
        
        # Hybrid indicators
        if 'hybrid' in title or 'hybrid' in jd_text:
            return "hybrid"
        
        # Default to onsite
        return "onsite"
    
    def _derive_visa_signal(self, jd_text: str) -> str:
        """
        Derive visa sponsorship signal.
        
        Returns:
            explicit_yes: Clear indication of sponsorship
            explicit_no: Clear indication of no sponsorship
            unclear: No clear indication
        """
        jd_lower = jd_text.lower()
        
        # Explicit no patterns (check first - more common)
        no_patterns = [
            "no sponsorship",
            "us citizens only",
            "no visa",
            "must be authorized to work",
            "citizenship required",
            "no visa sponsorship",
            "cannot sponsor",
            "will not sponsor",
            "us citizen required",
            "citizen only",
            "us work authorization required"
        ]
        if any(pattern in jd_lower for pattern in no_patterns):
            return "explicit_no"
        
        # Explicit yes patterns
        yes_patterns = [
            "visa sponsorship available",
            "will sponsor",
            "h1b welcome",
            "visa support",
            "sponsorship available",
            "h-1b sponsorship",
            "visa assistance",
            "provides sponsorship"
        ]
        if any(pattern in jd_lower for pattern in yes_patterns):
            return "explicit_yes"
        
        # Default to unclear
        return "unclear"
    
    def _derive_experience_years(self, jd_text: str) -> Dict[str, Optional[int]]:
        """
        Extract experience requirements from JD text.
        
        Patterns:
        - "0-2 years"
        - "3+ years"
        - "5-7 years experience"
        - "minimum 2 years"
        
        Returns:
            {"min": int | None, "max": int | None}
        """
        result = {"min": None, "max": None}
        
        # Pattern 1: "X-Y years"
        range_pattern = r'(\d+)\s*[-–]\s*(\d+)\s*(?:\+)?\s*years?'
        match = re.search(range_pattern, jd_text.lower())
        if match:
            result["min"] = int(match.group(1))
            result["max"] = int(match.group(2))
            return result
        
        # Pattern 2: "X+ years"
        plus_pattern = r'(\d+)\s*\+\s*years?'
        match = re.search(plus_pattern, jd_text.lower())
        if match:
            result["min"] = int(match.group(1))
            return result
        
        # Pattern 3: "minimum/at least X years"
        min_pattern = r'(?:minimum|at least|min|minimum of)\s+(\d+)\s*years?'
        match = re.search(min_pattern, jd_text.lower())
        if match:
            result["min"] = int(match.group(1))
            return result
        
        # Pattern 4: "X years of experience"
        exp_pattern = r'(\d+)\s*years?\s+(?:of\s+)?experience'
        match = re.search(exp_pattern, jd_text.lower())
        if match:
            years = int(match.group(1))
            # Assume it's a minimum requirement
            result["min"] = years
            return result
        
        return result
    
    def _derive_salary(self, platform_metadata: Dict) -> Dict[str, Optional[float]]:
        """
        Normalize salary data from platform_metadata.
        
        Returns:
            {"min": float | None, "max": float | None, "interval": str | None}
        """
        result = {
            "min": None,
            "max": None,
            "interval": None
        }
        
        if not platform_metadata or not isinstance(platform_metadata, dict):
            return result
        
        # Extract salary fields
        min_amount = platform_metadata.get('salary_min')
        max_amount = platform_metadata.get('salary_max')
        interval = platform_metadata.get('salary_interval')
        
        # Convert to float if available
        if min_amount is not None:
            try:
                result["min"] = float(min_amount)
            except (ValueError, TypeError):
                pass
        
        if max_amount is not None:
            try:
                result["max"] = float(max_amount)
            except (ValueError, TypeError):
                pass
        
        # Normalize interval
        if interval:
            interval_lower = str(interval).lower()
            if 'year' in interval_lower or 'annual' in interval_lower:
                result["interval"] = "yearly"
            elif 'hour' in interval_lower:
                result["interval"] = "hourly"
            elif 'month' in interval_lower:
                result["interval"] = "monthly"
        
        return result
    
    def _derive_geo(self, location: str) -> Dict[str, Optional[str]]:
        """
        Parse location string into structured geo data.
        
        Handles formats:
        - "San Francisco, CA, USA"
        - "San Francisco, CA"
        - "Remote"
        - "New York, NY"
        
        Returns:
            {"city": str | None, "state": str | None, "country": str | None}
        """
        result = {
            "city": None,
            "state": None,
            "country": None
        }
        
        if not location or not location.strip():
            return result
        
        # Handle "Remote" or similar
        if location.lower().strip() in ['remote', 'anywhere', 'worldwide']:
            result["city"] = "Remote"
            return result
        
        # Split by comma
        parts = [part.strip() for part in location.split(',')]
        
        if len(parts) == 1:
            # Just city or state
            result["city"] = parts[0]
        elif len(parts) == 2:
            # City, State
            result["city"] = parts[0]
            result["state"] = parts[1]
        elif len(parts) >= 3:
            # City, State, Country
            result["city"] = parts[0]
            result["state"] = parts[1]
            result["country"] = parts[2]
        
        return result

