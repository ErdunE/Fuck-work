"""
JobSpy collector: Converts JobSpy DataFrame to our JobData format.

Minimal metadata approach - only 4 fields in collection_metadata.
"""

from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.fuckwork.utils.platform_utils import poster_expected, company_info_expected, get_platform_display_name


class JobSpyCollector:
    """
    Collects jobs using JobSpy library.
    
    Supports: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Google Jobs
    
    Key Features:
    - Multi-platform scraping with single API
    - Minimal 4-field collection_metadata
    - Graceful handling of missing fields
    - URL-based deduplication support
    """
    
    def collect(self, 
                search_term: str = "Software Engineer New Grad",
                location: str = "United States",
                hours_old: int = 24,
                results_wanted: int = 50,
                sites: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Scrape jobs from multiple platforms.
        
        Args:
            search_term: Job search keywords
            location: Geographic location
            hours_old: Only jobs posted in last X hours
            results_wanted: Number of results per platform
            sites: List of sites to scrape (default: linkedin, indeed, glassdoor, zip_recruiter)
        
        Returns:
            DataFrame with all scraped jobs
        
        Example:
            >>> collector = JobSpyCollector()
            >>> jobs_df = collector.collect(
            ...     search_term="Software Engineer",
            ...     location="United States",
            ...     results_wanted=100
            ... )
            >>> print(f"Found {len(jobs_df)} jobs")
        """
        if sites is None:
            sites = ["linkedin", "indeed", "glassdoor", "zip_recruiter"]
        
        print(f"Scraping {results_wanted} jobs per platform from: {', '.join(sites)}")
        
        jobs = scrape_jobs(
            site_name=sites,
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            hours_old=hours_old,
            country_indeed='USA',
            linkedin_fetch_description=True,  # Get full descriptions
        )
        
        print(f"✓ Scraped {len(jobs)} total jobs")
        return jobs
    
    def convert_to_jobdata(self, df: pd.DataFrame) -> List[Dict]:
        """
        Convert JobSpy DataFrame to JobData format.
        
        Key point: MINIMAL metadata (4 fields only).
        
        The 4 fields in collection_metadata:
        1. platform: Platform name (LinkedIn, Indeed, etc.)
        2. collection_method: How was this collected (jobspy_batch, etc.)
        3. poster_expected: Should this platform have poster info?
        4. poster_present: Did we actually get poster info?
        
        Args:
            df: JobSpy DataFrame
        
        Returns:
            List of job dicts ready for database insertion
        
        Example:
            >>> collector = JobSpyCollector()
            >>> df = collector.collect(results_wanted=10)
            >>> jobs = collector.convert_to_jobdata(df)
            >>> print(f"Converted {len(jobs)} jobs")
            >>> # Verify metadata structure
            >>> assert 'collection_metadata' in jobs[0]
            >>> assert len(jobs[0]['collection_metadata']) == 4
        """
        jobs = []
        
        for idx, row in df.iterrows():
            try:
                job = self._convert_row(row)
                if job:
                    jobs.append(job)
            except Exception as e:
                print(f"Warning: Failed to convert row {idx}: {e}")
                continue
        
        print(f"✓ Converted {len(jobs)} jobs to JobData format")
        return jobs
    
    def _convert_row(self, row: pd.Series) -> Optional[Dict]:
        """
        Convert a single DataFrame row to JobData format.
        
        Args:
            row: Single row from JobSpy DataFrame
        
        Returns:
            Job dict or None if conversion fails
        """
        # Basic validation
        if pd.isna(row.get('job_url')) or pd.isna(row.get('title')):
            return None
        
        platform = get_platform_display_name(row['site'])
        collection_method = "jobspy_batch"
        
        # Use soft heuristics
        poster_exp = poster_expected(platform, collection_method)
        poster_pres = self._has_poster_info(row)
        
        # Build job dict
        job = {
            'job_id': self._generate_job_id(platform, row['job_url']),
            'title': str(row['title']),
            'company_name': str(row.get('company', 'Unknown')),
            'location': self._format_location(row),
            'url': str(row['job_url']),
            'platform': platform,
            'jd_text': self._extract_description(row),
            'posted_date': self._parse_date(row.get('date_posted')),
            
            # Poster info (if present)
            'poster_info': self._extract_poster_info(row) if poster_pres else None,
            
            # Company info (basic from JobSpy)
            'company_info': self._extract_company_info(row),
            
            # Platform metadata (from JobSpy)
            'platform_metadata': self._extract_platform_metadata(row),
            
            # Derived signals (from JobSpy + will be enriched by rule engine)
            'derived_signals': self._extract_derived_signals(row),
            
            # MINIMAL collection metadata (ONLY 4 fields)
            'collection_metadata': {
                'platform': platform,
                'collection_method': collection_method,
                'poster_expected': poster_exp,
                'poster_present': poster_pres,
            },
            
            # Expiration (30 days from posting)
            'expires_at': self._calculate_expiration(row.get('date_posted')),
        }
        
        return job
    
    def _generate_job_id(self, platform: str, url: str) -> str:
        """Generate unique job ID from platform and URL"""
        url_hash = hash(url) % 1000000  # 6-digit hash
        platform_short = platform.lower().replace(' ', '_')
        return f"{platform_short}_{url_hash:06d}"
    
    def _format_location(self, row: pd.Series) -> str:
        """Format location from city/state/country"""
        parts = []
        
        if pd.notna(row.get('city')):
            parts.append(str(row['city']))
        if pd.notna(row.get('state')):
            parts.append(str(row['state']))
        if pd.notna(row.get('country')):
            parts.append(str(row['country']))
        
        location = ', '.join(parts) if parts else ''
        
        # Fallback to location field if available
        if not location and pd.notna(row.get('location')):
            location = str(row['location'])
        
        return location or 'Location not specified'
    
    def _extract_description(self, row: pd.Series) -> str:
        """Extract job description text"""
        desc = row.get('description', '')
        
        if pd.isna(desc) or not desc:
            return f"Job posted by {row.get('company', 'Unknown')} for {row.get('title', 'Unknown position')}"
        
        return str(desc)
    
    def _parse_date(self, date_val) -> datetime:
        """Parse date, default to now if missing"""
        if pd.isna(date_val):
            return datetime.now()
        
        if isinstance(date_val, str):
            try:
                return datetime.fromisoformat(date_val.replace('Z', '+00:00'))
            except:
                return datetime.now()
        
        if isinstance(date_val, datetime):
            return date_val
        
        return datetime.now()
    
    def _has_poster_info(self, row: pd.Series) -> bool:
        """Check if row has poster information"""
        # Check if any poster fields are present
        poster_fields = ['poster_name', 'poster_title', 'poster_link']
        return any(pd.notna(row.get(field)) for field in poster_fields)
    
    def _extract_poster_info(self, row: pd.Series) -> Optional[Dict]:
        """Extract poster info if available"""
        if not self._has_poster_info(row):
            return None
        
        return {
            'name': str(row.get('poster_name')) if pd.notna(row.get('poster_name')) else None,
            'title': str(row.get('poster_title')) if pd.notna(row.get('poster_title')) else None,
            'company': str(row.get('company')) if pd.notna(row.get('company')) else None,
            'link': str(row.get('poster_link')) if pd.notna(row.get('poster_link')) else None,
        }
    
    def _extract_company_info(self, row: pd.Series) -> Dict:
        """Extract company information"""
        return {
            'name': str(row.get('company')) if pd.notna(row.get('company')) else None,
            'industry': str(row.get('company_industry')) if pd.notna(row.get('company_industry')) else None,
            'url': str(row.get('company_url')) if pd.notna(row.get('company_url')) else None,
            'url_direct': str(row.get('company_url_direct')) if pd.notna(row.get('company_url_direct')) else None,
            'logo': str(row.get('company_logo')) if pd.notna(row.get('company_logo')) else None,
            'num_employees': str(row.get('company_num_employees')) if pd.notna(row.get('company_num_employees')) else None,
            'revenue': str(row.get('company_revenue')) if pd.notna(row.get('company_revenue')) else None,
            'description': str(row.get('company_description')) if pd.notna(row.get('company_description')) else None,
            'rating': float(row.get('company_rating')) if pd.notna(row.get('company_rating')) else None,
            'reviews_count': int(row.get('company_reviews_count')) if pd.notna(row.get('company_reviews_count')) else None,
            'addresses': str(row.get('company_addresses')) if pd.notna(row.get('company_addresses')) else None,
        }
    
    def _extract_platform_metadata(self, row: pd.Series) -> Dict:
        """Extract platform-specific metadata"""
        metadata = {}
        
        # Job type (Full-time, Part-time, Contract, etc.)
        if pd.notna(row.get('job_type')):
            metadata['job_type'] = str(row.get('job_type'))
        
        # Salary information
        if pd.notna(row.get('min_amount')):
            metadata['salary_min'] = float(row.get('min_amount'))
        if pd.notna(row.get('max_amount')):
            metadata['salary_max'] = float(row.get('max_amount'))
        if pd.notna(row.get('interval')):
            metadata['salary_interval'] = str(row.get('interval'))
        
        # NEW: Additional JobSpy fields
        if pd.notna(row.get('id')):
            metadata['jobspy_id'] = str(row.get('id'))
        if pd.notna(row.get('job_url_direct')):
            metadata['job_url_direct'] = str(row.get('job_url_direct'))
        if pd.notna(row.get('listing_type')):
            metadata['listing_type'] = str(row.get('listing_type'))
        if pd.notna(row.get('salary_source')):
            metadata['salary_source'] = str(row.get('salary_source'))
        if pd.notna(row.get('emails')):
            metadata['emails'] = str(row.get('emails'))
        if pd.notna(row.get('vacancy_count')):
            metadata['vacancy_count'] = int(row.get('vacancy_count'))
        if pd.notna(row.get('work_from_home_type')):
            metadata['work_from_home_type'] = str(row.get('work_from_home_type'))
        
        # JobSpy metadata
        metadata['posted_days_ago'] = self._calculate_days_ago(row.get('date_posted'))
        metadata['repost_count'] = 0  # Not provided by JobSpy
        metadata['applicants_count'] = None  # Not provided by JobSpy
        metadata['views_count'] = None  # Not provided by JobSpy
        metadata['actively_hiring_tag'] = False  # Not provided by JobSpy
        metadata['easy_apply'] = self._is_easy_apply(row)
        
        return metadata
    
    def _calculate_days_ago(self, date_val) -> int:
        """Calculate how many days ago the job was posted"""
        posted_date = self._parse_date(date_val)
        days_ago = (datetime.now() - posted_date).days
        return max(0, days_ago)
    
    def _is_easy_apply(self, row: pd.Series) -> bool:
        """Check if job supports easy apply"""
        # JobSpy doesn't provide this info, default to False
        # LinkedIn jobs might have this, but not available in JobSpy output
        return False
    
    def _calculate_expiration(self, posted_date_val, days_valid: int = 30) -> datetime:
        """Calculate when job should expire (default 30 days from posting)"""
        posted_date = self._parse_date(posted_date_val)
        return posted_date + timedelta(days=days_valid)
    
    def _extract_derived_signals(self, row: pd.Series) -> Dict:
        """Extract derived signals from JobSpy"""
        signals = {}
        
        # Direct fields from JobSpy
        if pd.notna(row.get('job_level')):
            signals['job_level'] = str(row.get('job_level'))
        if pd.notna(row.get('job_function')):
            signals['job_function'] = str(row.get('job_function'))
        if pd.notna(row.get('is_remote')):
            signals['is_remote'] = bool(row.get('is_remote'))
        if pd.notna(row.get('skills')):
            signals['skills'] = str(row.get('skills'))
        if pd.notna(row.get('experience_range')):
            signals['experience_range'] = str(row.get('experience_range'))
        
        # Salary info (move from platform_metadata to derived_signals)
        salary = {}
        if pd.notna(row.get('min_amount')):
            salary['min'] = float(row.get('min_amount'))
        if pd.notna(row.get('max_amount')):
            salary['max'] = float(row.get('max_amount'))
        if pd.notna(row.get('interval')):
            salary['interval'] = str(row.get('interval'))
        if pd.notna(row.get('currency')):
            salary['currency'] = str(row.get('currency'))
        else:
            salary['currency'] = 'USD'  # Default
        
        if salary:
            signals['salary'] = salary
        
        return signals

