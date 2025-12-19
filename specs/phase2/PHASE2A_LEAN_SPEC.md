# Phase 2A Lean Spec: JobSpy Integration + Platform-Aware Scoring

**Version:** 1.0 Lean  
**Date:** December 8, 2025  
**Timeline:** 2 weeks  
**Core Goal:** Scoring without false positives + Stable pipeline

---

## Design Philosophy

**What Phase 2A IS:**
- ✅ Fast cold start with JobSpy (multi-platform job scraping)
- ✅ Minimal schema to avoid premature optimization
- ✅ Platform-aware scoring to prevent false negatives
- ✅ Stable pipeline that can run for 7 days

**What Phase 2A IS NOT:**
- ❌ Perfect data quality system
- ❌ Complete explainability framework
- ❌ Data monitoring SaaS
- ❌ ML feedback loop

**Defer to Phase 3:**
- field_completeness tracking
- extraction_quality monitoring
- automatic data backfill
- data quality dashboard

---

## Core Principle: Soft Expectations

**DO NOT hard-code platform capabilities.** Use soft heuristics instead.

**❌ Wrong (Hard-coded):**
```python
CAPABILITIES = {
    "LinkedIn": {"poster_info", "company_info"},
    "Indeed": {"company_info"}
}
```

**✅ Right (Soft Heuristic):**
```python
def poster_expected(platform: str, collection_method: str) -> bool:
    """Can change anytime without schema migration"""
    if platform == "LinkedIn" and collection_method in ["extension", "api"]:
        return True
    return False
```

**Why?** Platforms change. JobSpy changes. Hard-coded capabilities = migration hell.

---

## Minimal Schema (4 Fields Only)

### Database Change

```sql
-- Add to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS 
    collection_metadata JSONB;

-- Structure (ONLY 4 fields)
{
  "platform": "LinkedIn",
  "collection_method": "jobspy_batch",
  "poster_expected": true,
  "poster_present": false
}
```

**That's it.** No field_completeness. No extraction_quality. Not yet.

---

## Implementation (10 Stages, 2 Weeks)

### Week 1: JobSpy + Database + Basic Scoring

#### Stage 1: Project Scaffolding ✅ DONE

---

#### Stage 2: Install & Test JobSpy

**Time:** 4 hours

**Tasks:**
1. Update `apps/backend/requirements.txt`
   ```
   python-jobspy>=1.1.0
   pandas>=2.0.0
   ```

2. Create test script `apps/backend/test_jobspy.py`
   ```python
   from jobspy import scrape_jobs
   
   # Test scraping
   jobs = scrape_jobs(
       site_name=["linkedin", "indeed"],
       search_term="Software Engineer New Grad",
       location="United States",
       results_wanted=10,
       hours_old=24,
       linkedin_fetch_description=True
   )
   
   print(f"Found {len(jobs)} jobs")
   print(jobs.head())
   jobs.to_csv("test_jobs.csv")
   ```

3. Run test
   ```bash
   cd apps/backend
   pip install -r requirements.txt
   python test_jobspy.py
   ```

**Acceptance:**
- ✅ Successfully scraped 10+ jobs
- ✅ CSV output contains: title, company, description, url
- ✅ No errors

**Commit:**
```
feat: integrate JobSpy for multi-platform job scraping

- Added python-jobspy dependency
- Test script validates JobSpy works
- Successfully scraped 10+ jobs from LinkedIn and Indeed

Phase 2A replaces custom scrapers with proven OSS solution.

Phase: 2A Stage 2/10
```

---

#### Stage 3: PostgreSQL + Minimal Schema

**Time:** 1 day

**Tasks:**
1. Create `apps/backend/docker-compose.yml`
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:16
       environment:
         POSTGRES_DB: fuckwork
         POSTGRES_USER: fuckwork
         POSTGRES_PASSWORD: fuckwork_dev
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. Create `apps/backend/database/schema.sql`
   ```sql
   CREATE TABLE IF NOT EXISTS jobs (
       id SERIAL PRIMARY KEY,
       job_id VARCHAR(255) UNIQUE NOT NULL,
       
       -- Basic info
       title VARCHAR(500) NOT NULL,
       company_name VARCHAR(255) NOT NULL,
       location VARCHAR(255),
       url TEXT UNIQUE NOT NULL,
       platform VARCHAR(50) NOT NULL,
       jd_text TEXT NOT NULL,
       posted_date TIMESTAMP,
       
       -- Phase 1 scoring results
       authenticity_score FLOAT,
       authenticity_level VARCHAR(20),
       confidence VARCHAR(20),
       red_flags JSONB,
       
       -- Phase 2A: Minimal metadata (4 fields only)
       collection_metadata JSONB,
       
       -- Poster/company (JSONB for flexibility)
       poster_info JSONB,
       company_info JSONB,
       platform_metadata JSONB,
       derived_signals JSONB,
       
       -- Timestamps
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       expires_at TIMESTAMP
   );
   
   -- Indexes
   CREATE INDEX idx_jobs_platform ON jobs(platform);
   CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
   CREATE INDEX idx_jobs_score ON jobs(authenticity_score);
   CREATE UNIQUE INDEX idx_jobs_url ON jobs(url);
   ```

3. Create `apps/backend/database/models.py`
   ```python
   from sqlalchemy import Column, Integer, String, Text, Float, TIMESTAMP, JSON
   from sqlalchemy.ext.declarative import declarative_base
   
   Base = declarative_base()
   
   class Job(Base):
       __tablename__ = 'jobs'
       
       id = Column(Integer, primary_key=True)
       job_id = Column(String(255), unique=True, nullable=False)
       title = Column(String(500), nullable=False)
       company_name = Column(String(255), nullable=False)
       location = Column(String(255))
       url = Column(Text, unique=True, nullable=False)
       platform = Column(String(50), nullable=False)
       jd_text = Column(Text, nullable=False)
       posted_date = Column(TIMESTAMP)
       
       authenticity_score = Column(Float)
       authenticity_level = Column(String(20))
       confidence = Column(String(20))
       red_flags = Column(JSON)
       
       collection_metadata = Column(JSON)
       poster_info = Column(JSON)
       company_info = Column(JSON)
       platform_metadata = Column(JSON)
       derived_signals = Column(JSON)
       
       created_at = Column(TIMESTAMP)
       updated_at = Column(TIMESTAMP)
       expires_at = Column(TIMESTAMP)
   ```

4. Create `apps/backend/database/__init__.py`
   ```python
   from sqlalchemy import create_engine
   from sqlalchemy.orm import sessionmaker
   import os
   
   DATABASE_URL = os.getenv(
       "DATABASE_URL", 
       "postgresql://fuckwork:fuckwork_dev@localhost:5432/fuckwork"
   )
   
   engine = create_engine(DATABASE_URL)
   SessionLocal = sessionmaker(bind=engine)
   
   def get_db():
       db = SessionLocal()
       try:
           yield db
       finally:
           db.close()
   ```

5. Initialize database
   ```bash
   docker-compose up -d
   python -c "from database import engine; from database.models import Base; Base.metadata.create_all(engine)"
   ```

**Acceptance:**
- ✅ PostgreSQL running on port 5432
- ✅ All tables created
- ✅ Python can connect and query

**Commit:**
```
feat: add PostgreSQL database with minimal schema

- Docker Compose for local Postgres
- Minimal schema: jobs table with 4-field collection_metadata
- SQLAlchemy models
- Connection management

Database ready for JobSpy data ingestion.

Phase: 2A Stage 3/10
```

---

#### Stage 4: Soft Heuristics (Platform Utils)

**Time:** 4 hours

**Tasks:**
Create `apps/backend/platform_utils.py`

```python
"""
Soft heuristics for platform capabilities.

These are NOT hard truths. They can change anytime without schema migration.
"""

def poster_expected(platform: str, collection_method: str = "jobspy_batch") -> bool:
    """
    Soft expectation: Does this platform + method likely have poster info?
    
    This is a heuristic, not a constant.
    Can be adjusted anytime without breaking schema.
    
    Args:
        platform: LinkedIn, Indeed, Glassdoor, etc.
        collection_method: jobspy_batch, extension_manual, api_direct
    
    Returns:
        bool: True if poster info is expected
    """
    platform = platform.lower()
    
    # LinkedIn usually has poster
    if platform == "linkedin":
        # Extension/API more reliable than JobSpy batch
        if collection_method in ["extension_manual", "api_direct"]:
            return True
        # JobSpy batch: depends on upstream, assume True for now
        return True
    
    # Other platforms typically don't show poster
    return False


def company_info_expected(platform: str) -> bool:
    """
    Does this platform typically provide company information?
    
    Most platforms have company info except aggregators.
    """
    platform = platform.lower()
    
    # Google Jobs is an aggregator, often lacks detailed company info
    if platform == "google":
        return False
    
    # GitHub job lists may have minimal company info
    if platform == "github":
        return False
    
    # LinkedIn, Indeed, Glassdoor, ZipRecruiter all have company info
    return True


def should_use_recruiter_rules(collection_meta: dict) -> bool:
    """
    Should A-series (recruiter) rules be applied?
    
    Only apply if:
    1. Poster is expected on this platform
    2. Poster data is actually present
    
    Args:
        collection_meta: The collection_metadata dict from job
    
    Returns:
        bool: True if recruiter rules should be used
    """
    poster_exp = collection_meta.get('poster_expected', False)
    poster_pres = collection_meta.get('poster_present', False)
    
    # Only use recruiter rules if both expected AND present
    return poster_exp and poster_pres
```

**Acceptance:**
- ✅ Functions exist and have clear docstrings
- ✅ Logic is simple and adjustable
- ✅ No hard-coded constants

**Commit:**
```
feat: add soft heuristics for platform capabilities

- poster_expected() - soft expectation, not hard truth
- company_info_expected() - platform capability check
- should_use_recruiter_rules() - helper for rule engine

These are heuristics, can change without schema migration.

Phase: 2A Stage 4/10
```

---

#### Stage 5: JobSpy → JobData Converter

**Time:** 1 day

**Tasks:**
Create `apps/backend/data_collection/jobspy_collector.py`

```python
"""
JobSpy collector: Converts JobSpy DataFrame to our JobData format.

Minimal metadata approach - only 4 fields in collection_metadata.
"""

from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict
from datetime import datetime, timedelta
from platform_utils import poster_expected, company_info_expected


class JobSpyCollector:
    """
    Collects jobs using JobSpy library.
    
    Supports: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Google Jobs
    """
    
    def collect(self, 
                search_term: str = "Software Engineer New Grad",
                location: str = "United States",
                hours_old: int = 24,
                results_wanted: int = 50) -> pd.DataFrame:
        """
        Scrape jobs from multiple platforms.
        
        Args:
            search_term: Job search keywords
            location: Geographic location
            hours_old: Only jobs posted in last X hours
            results_wanted: Number of results per platform
        
        Returns:
            DataFrame with all scraped jobs
        """
        jobs = scrape_jobs(
            site_name=["linkedin", "indeed", "glassdoor", "zip_recruiter"],
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            hours_old=hours_old,
            country_indeed='USA',
            linkedin_fetch_description=True,  # Get full descriptions
        )
        
        return jobs
    
    def convert_to_jobdata(self, df: pd.DataFrame) -> List[Dict]:
        """
        Convert JobSpy DataFrame to JobData format.
        
        Key point: MINIMAL metadata (4 fields only).
        
        Args:
            df: JobSpy DataFrame
        
        Returns:
            List of job dicts ready for database
        """
        jobs = []
        
        for _, row in df.iterrows():
            platform = self._normalize_platform(row['site'])
            collection_method = "jobspy_batch"
            
            # Use soft heuristics
            poster_exp = poster_expected(platform, collection_method)
            poster_pres = pd.notna(row.get('poster_name'))
            
            # Build job dict
            job = {
                'job_id': f"{platform.lower()}_{hash(row['job_url']) % 1000000}",
                'title': row['title'],
                'company_name': row['company'],
                'location': self._format_location(row),
                'url': row['job_url'],
                'platform': platform,
                'jd_text': row.get('description', ''),
                'posted_date': self._parse_date(row.get('date_posted')),
                
                # Poster info (if present)
                'poster_info': self._extract_poster_info(row) if poster_pres else None,
                
                # Company info (basic)
                'company_info': {
                    'website_domain': row.get('company_url'),
                    'size_employees': None,
                    'glassdoor_rating': None,
                },
                
                # Platform metadata (from JobSpy)
                'platform_metadata': {
                    'job_type': row.get('job_type'),
                    'salary_min': row.get('min_amount'),
                    'salary_max': row.get('max_amount'),
                    'salary_interval': row.get('interval'),
                },
                
                # Derived signals (placeholder)
                'derived_signals': {},
                
                # MINIMAL collection metadata (ONLY 4 fields)
                'collection_metadata': {
                    'platform': platform,
                    'collection_method': collection_method,
                    'poster_expected': poster_exp,
                    'poster_present': poster_pres,
                },
                
                # Expiration
                'expires_at': self._calculate_expiration(row.get('date_posted')),
            }
            
            jobs.append(job)
        
        return jobs
    
    def _normalize_platform(self, site: str) -> str:
        """Normalize platform name"""
        mapping = {
            'linkedin': 'LinkedIn',
            'indeed': 'Indeed',
            'glassdoor': 'Glassdoor',
            'zip_recruiter': 'ZipRecruiter',
            'google': 'Google',
        }
        return mapping.get(site.lower(), site.capitalize())
    
    def _format_location(self, row: pd.Series) -> str:
        """Format location from city/state"""
        city = row.get('city', '')
        state = row.get('state', '')
        return f"{city}, {state}".strip(', ')
    
    def _parse_date(self, date_val) -> datetime:
        """Parse date, default to now if missing"""
        if pd.isna(date_val):
            return datetime.now()
        
        if isinstance(date_val, str):
            try:
                return datetime.fromisoformat(date_val)
            except:
                return datetime.now()
        
        return date_val
    
    def _extract_poster_info(self, row: pd.Series) -> Dict:
        """Extract poster info if available"""
        return {
            'name': row.get('poster_name'),
            'title': row.get('poster_title'),
            'company': row.get('company'),
        }
    
    def _calculate_expiration(self, posted_date) -> datetime:
        """Calculate when job should expire (30 days from posting)"""
        if pd.isna(posted_date):
            posted_date = datetime.now()
        
        return posted_date + timedelta(days=30)
```

**Acceptance:**
- ✅ Converts JobSpy DataFrame to JobData format
- ✅ collection_metadata has exactly 4 fields
- ✅ Uses soft heuristics from platform_utils
- ✅ Handles missing fields gracefully

**Commit:**
```
feat: add JobSpy to JobData converter

- JobSpyCollector class
- Minimal metadata (4 fields only)
- Uses soft heuristics for platform capabilities
- Handles missing fields gracefully

Tested on sample JobSpy output.

Phase: 2A Stage 5/10
```

---

#### Stage 6: Save to Database + Deduplication

**Time:** 4 hours

**Tasks:**
Create `apps/backend/data_collection/db_saver.py`

```python
"""
Save JobSpy results to database with URL deduplication.
"""

from typing import List, Dict
from database import SessionLocal
from database.models import Job
from datetime import datetime


class JobSaver:
    """Saves jobs to database with deduplication"""
    
    def save_jobs(self, jobs: List[Dict]) -> Dict:
        """
        Save jobs to database.
        
        Deduplication: Skip if URL already exists.
        
        Args:
            jobs: List of job dicts from JobSpyCollector
        
        Returns:
            Stats dict: {saved: int, duplicates: int, errors: int}
        """
        session = SessionLocal()
        
        stats = {
            'saved': 0,
            'duplicates': 0,
            'errors': 0,
        }
        
        try:
            for job_data in jobs:
                # Check if URL already exists (deduplication)
                existing = session.query(Job).filter(
                    Job.url == job_data['url']
                ).first()
                
                if existing:
                    stats['duplicates'] += 1
                    continue
                
                try:
                    # Create new job
                    job = Job(**job_data)
                    session.add(job)
                    stats['saved'] += 1
                    
                except Exception as e:
                    print(f"Error saving job {job_data.get('job_id')}: {e}")
                    stats['errors'] += 1
            
            session.commit()
            
        finally:
            session.close()
        
        return stats
```

**Acceptance:**
- ✅ Saves jobs to database
- ✅ URL deduplication works
- ✅ Returns stats
- ✅ No crashes on duplicate URLs

**Commit:**
```
feat: add database saver with URL deduplication

- JobSaver class
- URL-based deduplication
- Stats tracking (saved/duplicates/errors)

Tested with sample jobs.

Phase: 2A Stage 6/10
```

---

#### Stage 7: Platform-Aware Weight Adjustment (Fusion Layer)

**Time:** 1 day

**CRITICAL: Do NOT modify rule_engine.py**

**Tasks:**
Modify `apps/backend/authenticity_scoring/score_fusion.py`

```python
"""
Score fusion with platform-aware weight adjustment.

KEY: We adjust weights in fusion layer, NOT in rule engine.
This keeps rule engine unchanged (low risk).
"""

import math
from typing import List, Dict


class ScoreFusion:
    """
    Fuses activated rules into final score.
    
    NEW: Platform-aware weight adjustment.
    """
    
    def __init__(self, dampening_factor: float = 1.8):
        self.dampening_factor = dampening_factor
    
    def calculate_score(self, activated_rules: List[Dict], 
                       job_data: Dict) -> Dict:
        """
        Calculate final authenticity score.
        
        NEW: Adjusts rule weights based on platform capabilities.
        
        Args:
            activated_rules: Rules that fired
            job_data: Complete job data including collection_metadata
        
        Returns:
            {
                'authenticity_score': float,
                'level': str,
                'confidence': str,
                'explanation': str
            }
        """
        # Get platform metadata
        collection_meta = job_data.get('collection_metadata', {})
        
        # Calculate penalty sum with platform-aware weights
        total_penalty = 0.0
        adjusted_rules = []
        
        for rule in activated_rules:
            # Adjust weight based on platform
            adjusted_weight = self._adjust_weight_for_platform(
                rule,
                collection_meta
            )
            
            total_penalty += adjusted_weight
            
            # Track adjusted rules for explanation
            adjusted_rules.append({
                **rule,
                'original_weight': rule['weight'],
                'adjusted_weight': adjusted_weight,
            })
        
        # Calculate score with exponential dampening
        score = 100 * math.exp(-total_penalty * self.dampening_factor)
        score = max(0, min(100, score))
        
        # Determine level
        if score >= 80:
            level = "likely_real"
        elif score >= 55:
            level = "uncertain"
        else:
            level = "likely_fake"
        
        # Determine confidence
        if len(activated_rules) >= 5:
            confidence = "High"
        elif len(activated_rules) >= 2:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        return {
            'authenticity_score': round(score, 1),
            'level': level,
            'confidence': confidence,
            'activated_rules': adjusted_rules,
        }
    
    def _adjust_weight_for_platform(self, rule: Dict, 
                                    collection_meta: Dict) -> float:
        """
        Adjust rule weight based on platform capabilities.
        
        KEY LOGIC:
        - A-series (Recruiter) rules: Only apply if poster expected AND present
        - Other rules: Keep original weight
        
        Args:
            rule: Rule dict with rule_id and weight
            collection_meta: Platform metadata with poster_expected/present
        
        Returns:
            Adjusted weight (0 if should skip rule)
        """
        rule_id = rule['rule_id']
        base_weight = rule['weight']
        
        # A-series rules (Recruiter signals)
        if rule_id.startswith('A'):
            poster_expected = collection_meta.get('poster_expected', False)
            poster_present = collection_meta.get('poster_present', False)
            
            # If poster not expected (e.g., Indeed), skip rule entirely
            if not poster_expected:
                return 0.0
            
            # If poster expected but not present (extraction failure), reduce weight
            if not poster_present:
                return base_weight * 0.5
        
        # All other rules: keep original weight
        return base_weight
```

**Acceptance:**
- ✅ A-series rules return weight=0 for Indeed jobs
- ✅ A-series rules return full weight for LinkedIn jobs with poster
- ✅ rule_engine.py is NOT modified
- ✅ All Phase 1 tests still pass

**Commit:**
```
feat: add platform-aware weight adjustment in fusion layer

- Adjusts A-series (recruiter) rule weights based on platform
- If poster not expected (Indeed, etc.) → weight = 0
- If poster expected but missing → weight * 0.5
- DOES NOT modify rule_engine.py (low risk)

Tested with LinkedIn and Indeed samples.

Phase: 2A Stage 7/10
```

---

### Week 2: Integration + Scheduler + Validation

#### Stage 8: End-to-End Integration Test

**Time:** 1 day

**Tasks:**
Create `apps/backend/test_integration.py`

```python
"""
End-to-end integration test.

JobSpy → Convert → Save → Score → Verify
"""

from data_collection.jobspy_collector import JobSpyCollector
from data_collection.db_saver import JobSaver
from authenticity_scoring.scorer import AuthenticityScorer
from database import SessionLocal
from database.models import Job


def test_full_pipeline():
    """Test complete pipeline"""
    
    print("=== Phase 2A Integration Test ===\n")
    
    # 1. Collect with JobSpy
    print("Step 1: Collecting jobs with JobSpy...")
    collector = JobSpyCollector()
    df = collector.collect(
        search_term="Software Engineer",
        location="United States",
        hours_old=24,
        results_wanted=20
    )
    print(f"✓ Collected {len(df)} jobs\n")
    
    # 2. Convert to JobData
    print("Step 2: Converting to JobData format...")
    jobs = collector.convert_to_jobdata(df)
    print(f"✓ Converted {len(jobs)} jobs\n")
    
    # 3. Save to database
    print("Step 3: Saving to database...")
    saver = JobSaver()
    stats = saver.save_jobs(jobs)
    print(f"✓ Saved: {stats['saved']}, Duplicates: {stats['duplicates']}, Errors: {stats['errors']}\n")
    
    # 4. Score unscored jobs
    print("Step 4: Scoring jobs...")
    scorer = AuthenticityScorer("authenticity_scoring/data/authenticity_rule_table.json")
    session = SessionLocal()
    
    unscored = session.query(Job).filter(Job.authenticity_score == None).all()
    print(f"Found {len(unscored)} unscored jobs")
    
    for job in unscored:
        job_dict = {
            'job_id': job.job_id,
            'title': job.title,
            'company_name': job.company_name,
            'platform': job.platform,
            'jd_text': job.jd_text,
            'poster_info': job.poster_info,
            'company_info': job.company_info,
            'platform_metadata': job.platform_metadata,
            'derived_signals': job.derived_signals,
            'collection_metadata': job.collection_metadata,  # NEW
        }
        
        result = scorer.score_job(job_dict)
        
        job.authenticity_score = result['authenticity_score']
        job.authenticity_level = result['level']
        job.confidence = result['confidence']
        job.red_flags = result.get('red_flags', [])
    
    session.commit()
    session.close()
    print(f"✓ Scored {len(unscored)} jobs\n")
    
    # 5. Verify results
    print("Step 5: Verifying results...")
    session = SessionLocal()
    
    linkedin_jobs = session.query(Job).filter(Job.platform == "LinkedIn").limit(5).all()
    indeed_jobs = session.query(Job).filter(Job.platform == "Indeed").limit(5).all()
    
    print("LinkedIn jobs (should use recruiter rules):")
    for job in linkedin_jobs:
        print(f"  {job.company_name}: Score {job.authenticity_score}")
    
    print("\nIndeed jobs (should skip recruiter rules):")
    for job in indeed_jobs:
        print(f"  {job.company_name}: Score {job.authenticity_score}")
    
    session.close()
    
    print("\n=== Integration Test Complete ===")


if __name__ == "__main__":
    test_full_pipeline()
```

**Acceptance:**
- ✅ Full pipeline runs without errors
- ✅ Jobs are collected, saved, and scored
- ✅ LinkedIn jobs show recruiter rules in red_flags
- ✅ Indeed jobs don't show recruiter rules (weight=0)

**Commit:**
```
feat: add end-to-end integration test

- Tests complete pipeline: JobSpy → Convert → Save → Score
- Verifies platform-aware scoring works
- LinkedIn jobs: recruiter rules active
- Indeed jobs: recruiter rules skipped

All tests pass.

Phase: 2A Stage 8/10
```

---

#### Stage 9: Daily Scheduler

**Time:** 1 day

**Tasks:**
Create `apps/backend/scheduler.py`

```python
"""
Daily job collection scheduler.

Runs every day at 8:00 AM.
"""

from apscheduler.schedulers.blocking import BlockingScheduler
from data_collection.jobspy_collector import JobSpyCollector
from data_collection.db_saver import JobSaver
from authenticity_scoring.scorer import AuthenticityScorer
from database import SessionLocal
from database.models import Job
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def daily_collection():
    """
    Daily job collection and scoring.
    
    Runs at 8:00 AM every day.
    """
    logger.info(f"=== Daily Collection Started: {datetime.now()} ===")
    
    try:
        # 1. Collect jobs
        logger.info("Step 1: Collecting jobs with JobSpy...")
        collector = JobSpyCollector()
        df = collector.collect(
            search_term="Software Engineer New Grad",
            location="United States",
            hours_old=24,
            results_wanted=100  # 100 per platform = 400 total
        )
        logger.info(f"✓ Collected {len(df)} jobs")
        
        # 2. Convert
        logger.info("Step 2: Converting to JobData...")
        jobs = collector.convert_to_jobdata(df)
        logger.info(f"✓ Converted {len(jobs)} jobs")
        
        # 3. Save
        logger.info("Step 3: Saving to database...")
        saver = JobSaver()
        stats = saver.save_jobs(jobs)
        logger.info(f"✓ Saved: {stats['saved']}, Duplicates: {stats['duplicates']}")
        
        # 4. Score
        logger.info("Step 4: Scoring unscored jobs...")
        scorer = AuthenticityScorer("authenticity_scoring/data/authenticity_rule_table.json")
        session = SessionLocal()
        
        unscored = session.query(Job).filter(Job.authenticity_score == None).all()
        logger.info(f"Found {len(unscored)} unscored jobs")
        
        for job in unscored:
            job_dict = {
                'job_id': job.job_id,
                'title': job.title,
                'company_name': job.company_name,
                'platform': job.platform,
                'jd_text': job.jd_text,
                'poster_info': job.poster_info,
                'company_info': job.company_info,
                'platform_metadata': job.platform_metadata,
                'derived_signals': job.derived_signals,
                'collection_metadata': job.collection_metadata,
            }
            
            result = scorer.score_job(job_dict)
            
            job.authenticity_score = result['authenticity_score']
            job.authenticity_level = result['level']
            job.confidence = result['confidence']
            job.red_flags = result.get('red_flags', [])
        
        session.commit()
        session.close()
        logger.info(f"✓ Scored {len(unscored)} jobs")
        
        logger.info(f"=== Daily Collection Complete: {datetime.now()} ===")
        
    except Exception as e:
        logger.error(f"Daily collection failed: {e}")
        raise


def start_scheduler():
    """Start the scheduler"""
    scheduler = BlockingScheduler()
    
    # Run every day at 8:00 AM
    scheduler.add_job(
        daily_collection,
        'cron',
        hour=8,
        minute=0,
        id='daily_collection'
    )
    
    logger.info("Scheduler started. Daily collection at 8:00 AM.")
    scheduler.start()


if __name__ == "__main__":
    # For testing, run immediately
    daily_collection()
    
    # Then start scheduler
    # start_scheduler()
```

**Acceptance:**
- ✅ Scheduler runs daily at 8:00 AM
- ✅ Collects, saves, and scores jobs
- ✅ Logs all steps
- ✅ Handles errors gracefully

**Commit:**
```
feat: add daily job collection scheduler

- Runs every day at 8:00 AM
- Collects 400+ jobs (100 per platform)
- Saves and scores automatically
- Comprehensive logging

Tested with manual run.

Phase: 2A Stage 9/10
```

---

#### Stage 10: 7-Day Validation Run

**Time:** 7 days (mostly waiting)

**Tasks:**
1. Start scheduler: `python scheduler.py`
2. Monitor logs daily
3. Check database daily:
   ```sql
   SELECT 
       platform,
       COUNT(*) as total,
       AVG(authenticity_score) as avg_score
   FROM jobs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY platform;
   ```
4. Manual verification:
   - Pick 5 LinkedIn jobs, verify recruiter rules work
   - Pick 5 Indeed jobs, verify recruiter rules are skipped
5. Document any issues

**Acceptance:**
- ✅ System runs for 7 days without crashes
- ✅ Collects 500+ jobs per day
- ✅ Scoring is accurate (manual check 20 samples)
- ✅ No false positives on Indeed (recruiter rules skipped)
- ✅ Database performance is good

**Final Commit:**
```
docs: Phase 2A validation complete

- Ran continuously for 7 days
- Collected 3,500+ jobs
- Scoring accuracy validated on 20 samples
- LinkedIn: recruiter rules active
- Indeed: recruiter rules skipped (no false positives)
- Zero downtime

Phase 2A complete and stable.

Phase: 2A Stage 10/10 ✅ COMPLETE
```

---

## Acceptance Criteria (5 Must-Haves)

**Phase 2A is complete when:**

1. ✅ **JobSpy Pipeline Works**
   - Collects 500+ jobs per day
   - Saves to PostgreSQL
   - No crashes

2. ✅ **Platform-Aware Scoring Works**
   - LinkedIn jobs: A-series rules active
   - Indeed jobs: A-series rules weight=0
   - Manual verification on 20 samples

3. ✅ **System Stability**
   - Runs continuously for 7 days
   - No data corruption
   - No memory leaks

4. ✅ **Schema is Minimal**
   - collection_metadata has exactly 4 fields
   - No premature optimization
   - Easy to extend later

5. ✅ **Documentation Complete**
   - All code is documented
   - Acceptance criteria met
   - Ready for Phase 2B (Extension)

---

## What's NOT in Phase 2A

**Defer to Phase 3:**
- ❌ field_completeness monitoring
- ❌ extraction_quality metrics
- ❌ Data quality dashboard
- ❌ Automatic backfill
- ❌ ML feedback loop
- ❌ Advanced explainability

**Defer to Phase 2B:**
- ❌ Browser extension
- ❌ Manual high-quality capture
- ❌ Gold dataset creation

---

## Key Design Decisions

### 1. Soft Heuristics > Hard Constants
```python
# ✅ Good
def poster_expected(platform, method):
    if platform == "LinkedIn":
        return True
    return False

# ❌ Bad
CAPABILITIES = {"LinkedIn": ["poster"]}
```

### 2. Fusion Layer > Rule Engine
```python
# ✅ Good - adjust weight in fusion
if rule_id.startswith('A') and not poster_expected:
    weight = 0

# ❌ Bad - modify rule engine
if should_evaluate_rule(rule, platform):
    # complex logic in rule engine
```

### 3. Minimal Metadata
```python
# ✅ Good - 4 fields
{
  "platform": "LinkedIn",
  "collection_method": "jobspy",
  "poster_expected": true,
  "poster_present": false
}

# ❌ Bad - premature optimization
{
  "field_completeness": {...},
  "extraction_quality": {...},
  "confidence_scores": {...}
}
```

---

## Success Metrics

**After Phase 2A:**
- Daily job collection: 500-800 jobs
- Scoring accuracy: >75%
- False positive rate on Indeed: <5%
- System uptime: 7 days continuous
- Data quality: Good enough to validate value

**Next Steps:**
- Phase 2B: Browser extension (high-quality samples)
- Phase 3: Desktop app UI
- Phase 4: Intelligent application workflow

---

**END OF PHASE 2A LEAN SPEC**
