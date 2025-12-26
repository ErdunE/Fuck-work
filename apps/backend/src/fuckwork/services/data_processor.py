"""
Comprehensive data processing pipeline for jobs.

This module handles:
1. Deduplication (cross-platform, content-based)
2. Data cleaning (nan companies, aggregators, staffing firms)
3. Data enrichment (skills extraction, experience parsing)
4. Quality scoring (data completeness)

Usage:
    processor = JobDataProcessor()
    stats = processor.process_all()
"""

import hashlib
import logging
import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from src.fuckwork.database import Job, SessionLocal
from src.fuckwork.services.skills_config import (
    SKILLS_BY_INDUSTRY,
    SOFT_SKILLS,
    detect_industry_from_skills,
    get_all_skills_flat,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Constants
# ============================================================================

AGGREGATORS = [
    "Lensa",
    "Jobgether",
    "ZipRecruiter",
    "Dice",
    "Hired",
    "Ladders",
    "Wellfound",
    "AngelList",
]

STAFFING_FIRMS = [
    "Robert Half",
    "Jobot",
    "Insight Global",
    "Apex Systems",
    "TEKsystems",
    "Kforce",
    "Randstad",
    "Adecco",
    "CyberCoders",
    "Kelly Services",
    "ManpowerGroup",
    "Hays",
    "Aerotek",
    "Phyton Talent",
    "Crawford Thomas",
    "Modis",
    "Experis",
    "Collabera",
    "Synergis",
    "Motion Recruitment",
]

# Experience patterns (expanded)
EXPERIENCE_PATTERNS = [
    # "5+ years of experience"
    (r"(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)", "min_only"),
    # "3-5 years of experience"
    (r"(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)", "range"),
    # "minimum 5 years"
    (r"(?:minimum|at least|requires?)\s+(\d+)\s*(?:years?|yrs?)", "min_only"),
    # "5 years in/with"
    (r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|with|of|working)", "min_only"),
    # "experience: 5+ years"
    (r"experience[:\s]+(\d+)\+?\s*(?:years?|yrs?)", "min_only"),
]


class JobDataProcessor:
    """
    Comprehensive job data processor for all 22 industries.
    """

    def __init__(self, session: Optional[Session] = None):
        self.session = session
        self._owns_session = session is None
        if self._owns_session:
            self.session = SessionLocal()

        # Pre-compile skill patterns for performance
        self.all_skills = get_all_skills_flat()
        self.skill_patterns = self._compile_skill_patterns()

        self.stats = {
            "total_jobs": 0,
            "duplicates_marked": 0,
            "nan_companies_marked": 0,
            "aggregators_marked": 0,
            "staffing_firms_marked": 0,
            "skills_extracted": 0,
            "experience_extracted": 0,
            "completeness_calculated": 0,
            "errors": 0,
        }

    def _compile_skill_patterns(self) -> Dict[str, re.Pattern]:
        """Pre-compile regex patterns for all skills."""
        patterns = {}
        for skill in self.all_skills:
            # Escape special regex characters
            escaped = re.escape(skill)
            # Word boundary matching (case insensitive)
            patterns[skill] = re.compile(r"\b" + escaped + r"\b", re.IGNORECASE)
        return patterns

    def process_all(self, batch_size: int = 500) -> Dict:
        """
        Run complete processing pipeline.
        """
        logger.info("=" * 70)
        logger.info("STARTING DATA PROCESSING PIPELINE")
        logger.info("=" * 70)

        try:
            self.stats["total_jobs"] = self.session.query(Job).count()
            logger.info(f"Total jobs in database: {self.stats['total_jobs']:,}")

            # Step 1: Mark duplicates
            logger.info("\n[Step 1/6] Marking duplicates...")
            self._mark_duplicates()

            # Step 2: Mark nan companies
            logger.info("\n[Step 2/6] Marking nan companies...")
            self._mark_nan_companies()

            # Step 3: Mark aggregators and staffing firms
            logger.info("\n[Step 3/6] Marking aggregators and staffing firms...")
            self._mark_low_quality_sources()

            # Step 4: Extract skills (batch processing)
            logger.info("\n[Step 4/6] Extracting skills from JD...")
            self._extract_skills_batch(batch_size)

            # Step 5: Extract experience requirements
            logger.info("\n[Step 5/6] Extracting experience requirements...")
            self._extract_experience_batch(batch_size)

            # Step 6: Calculate data completeness
            logger.info("\n[Step 6/6] Calculating data completeness...")
            self._calculate_completeness_batch(batch_size)

            self.session.commit()

            logger.info("\n" + "=" * 70)
            logger.info("PROCESSING COMPLETE")
            logger.info("=" * 70)
            for key, value in self.stats.items():
                logger.info(f"  {key}: {value:,}")

            return self.stats

        except Exception as e:
            logger.error(f"Processing failed: {e}")
            self.session.rollback()
            raise
        finally:
            if self._owns_session:
                self.session.close()

    # ========================================================================
    # Step 1: Deduplication
    # ========================================================================

    def _mark_duplicates(self):
        """
        Mark duplicate jobs without deleting them.

        Strategy:
        1. Group by content hash (company + title + location)
        2. Keep newest as canonical, mark rest as duplicates
        """
        logger.info("  Loading jobs for deduplication...")

        jobs = self.session.query(
            Job.id,
            Job.job_id,
            Job.title,
            Job.company_name,
            Job.location,
            Job.platform,
            Job.created_at,
        ).all()

        # Group by content hash
        content_groups = defaultdict(list)
        for job in jobs:
            content_hash = self._get_content_hash(job.company_name, job.title, job.location)
            content_groups[content_hash].append(job)

        duplicates_count = 0
        cross_platform = 0
        same_platform = 0

        for content_hash, group in content_groups.items():
            if len(group) <= 1:
                continue

            # Sort by created_at descending (newest first)
            group.sort(key=lambda x: x.created_at or datetime.min, reverse=True)

            # First one is canonical
            canonical = group[0]

            for dup in group[1:]:
                job = self.session.query(Job).filter(Job.id == dup.id).first()
                if job:
                    derived = dict(job.derived_signals) if job.derived_signals else {}
                    derived["is_duplicate"] = True
                    derived["canonical_job_id"] = canonical.job_id

                    if dup.platform != canonical.platform:
                        derived["duplicate_reason"] = "cross_platform"
                        cross_platform += 1
                    else:
                        derived["duplicate_reason"] = "same_platform"
                        same_platform += 1

                    job.derived_signals = derived
                    duplicates_count += 1

        self.stats["duplicates_marked"] = duplicates_count
        logger.info(
            f"  ✓ Marked {duplicates_count} duplicates (cross-platform: {cross_platform}, same-platform: {same_platform})"
        )

    def _get_content_hash(self, company: str, title: str, location: str) -> str:
        """Generate content hash for deduplication."""
        company = (company or "").lower().strip()
        title = (title or "").lower().strip()
        location = (location or "").lower().strip()

        # Normalize company name
        company = re.sub(r"\s+(inc|llc|ltd|corp|corporation|co|company)\.?$", "", company)
        company = re.sub(r"[^\w\s]", "", company)

        # Normalize title
        title = re.sub(r"\s*[-–]\s*remote\s*$", "", title, flags=re.I)
        title = re.sub(r"\s*\([^)]*\)\s*$", "", title)  # Remove trailing parentheses

        # Normalize location
        location = re.sub(r",\s*(us|usa|united states)$", "", location, flags=re.I)

        key = f"{company}|{title}|{location}"
        return hashlib.md5(key.encode()).hexdigest()

    # ========================================================================
    # Step 2: Clean nan companies
    # ========================================================================

    def _mark_nan_companies(self):
        """Mark jobs with 'nan' or empty company names."""
        nan_jobs = (
            self.session.query(Job)
            .filter(
                or_(
                    Job.company_name == "nan",
                    Job.company_name == "NaN",
                    Job.company_name == "",
                    Job.company_name.is_(None),
                )
            )
            .all()
        )

        for job in nan_jobs:
            derived = dict(job.derived_signals) if job.derived_signals else {}
            if "data_quality" not in derived:
                derived["data_quality"] = {}
            derived["data_quality"]["missing_company"] = True
            job.derived_signals = derived

        self.stats["nan_companies_marked"] = len(nan_jobs)
        logger.info(f"  ✓ Marked {len(nan_jobs)} jobs with missing company")

    # ========================================================================
    # Step 3: Mark low quality sources
    # ========================================================================

    def _mark_low_quality_sources(self):
        """Mark jobs from aggregators and staffing firms."""

        # Process in batches to avoid memory issues
        offset = 0
        batch_size = 1000
        aggregator_count = 0
        staffing_count = 0

        while True:
            jobs = self.session.query(Job).offset(offset).limit(batch_size).all()
            if not jobs:
                break

            for job in jobs:
                company_lower = (job.company_name or "").lower()

                is_aggregator = any(agg.lower() in company_lower for agg in AGGREGATORS)
                is_staffing = any(sf.lower() in company_lower for sf in STAFFING_FIRMS)

                if is_aggregator or is_staffing:
                    derived = dict(job.derived_signals) if job.derived_signals else {}
                    company_info = dict(job.company_info) if job.company_info else {}

                    if is_aggregator:
                        company_info["is_aggregator"] = True
                        derived["source_type"] = "aggregator"
                        aggregator_count += 1

                    if is_staffing:
                        company_info["is_staffing_firm"] = True
                        derived["source_type"] = "staffing_firm"
                        staffing_count += 1

                    job.company_info = company_info
                    job.derived_signals = derived

            offset += batch_size
            if offset % 10000 == 0:
                self.session.commit()
                logger.info(f"    Processed {offset} jobs...")

        self.stats["aggregators_marked"] = aggregator_count
        self.stats["staffing_firms_marked"] = staffing_count
        logger.info(
            f"  ✓ Marked {aggregator_count} aggregator jobs, {staffing_count} staffing firm jobs"
        )

    # ========================================================================
    # Step 4: Extract skills
    # ========================================================================

    def _extract_skills_batch(self, batch_size: int):
        """Extract skills from JD text for all jobs."""
        offset = 0
        extracted_count = 0

        while True:
            jobs = self.session.query(Job).offset(offset).limit(batch_size).all()
            if not jobs:
                break

            for job in jobs:
                skills = self._extract_skills(job.jd_text, job.derived_signals)
                if skills["all"]:
                    derived = dict(job.derived_signals) if job.derived_signals else {}
                    derived["skills"] = skills
                    job.derived_signals = derived
                    extracted_count += 1

            offset += batch_size
            if offset % 5000 == 0:
                self.session.commit()
                logger.info(
                    f"    Processed {offset} jobs, extracted skills for {extracted_count}..."
                )

        self.stats["skills_extracted"] = extracted_count
        logger.info(f"  ✓ Extracted skills for {extracted_count} jobs")

    def _extract_skills(self, jd_text: str, derived_signals: dict = None) -> Dict:
        """
        Extract skills from JD text using industry-aware matching.
        """
        if not jd_text:
            return {"all": [], "technical": [], "soft": [], "count": 0}

        jd_lower = jd_text.lower()
        found_skills = set()

        # Extract using pre-compiled patterns
        for skill, pattern in self.skill_patterns.items():
            if pattern.search(jd_lower):
                found_skills.add(skill)

        # Categorize skills
        soft_skills = [s for s in found_skills if s in [x.lower() for x in SOFT_SKILLS]]
        technical_skills = [s for s in found_skills if s not in soft_skills]

        return {
            "all": sorted(found_skills),
            "technical": sorted(technical_skills),
            "soft": sorted(soft_skills),
            "count": len(found_skills),
        }

    # ========================================================================
    # Step 5: Extract experience
    # ========================================================================

    def _extract_experience_batch(self, batch_size: int):
        """Extract experience requirements from JD text."""
        offset = 0
        extracted_count = 0

        while True:
            jobs = self.session.query(Job).offset(offset).limit(batch_size).all()
            if not jobs:
                break

            for job in jobs:
                exp = self._extract_experience(job.jd_text)
                if exp:
                    derived = dict(job.derived_signals) if job.derived_signals else {}
                    derived["experience_years"] = exp
                    job.derived_signals = derived
                    extracted_count += 1

            offset += batch_size
            if offset % 5000 == 0:
                self.session.commit()
                logger.info(
                    f"    Processed {offset} jobs, extracted experience for {extracted_count}..."
                )

        self.stats["experience_extracted"] = extracted_count
        logger.info(f"  ✓ Extracted experience for {extracted_count} jobs")

    def _extract_experience(self, jd_text: str) -> Optional[Dict]:
        """Extract experience years from JD text."""
        if not jd_text:
            return None

        jd_lower = jd_text.lower()

        for pattern, pattern_type in EXPERIENCE_PATTERNS:
            match = re.search(pattern, jd_lower)
            if match:
                groups = match.groups()
                if pattern_type == "range" and len(groups) == 2:
                    return {"min": int(groups[0]), "max": int(groups[1])}
                elif len(groups) >= 1:
                    years = int(groups[0])
                    return {"min": years, "max": None}

        return None

    # ========================================================================
    # Step 6: Calculate data completeness
    # ========================================================================

    def _calculate_completeness_batch(self, batch_size: int):
        """Calculate data completeness score for all jobs."""
        offset = 0
        calculated_count = 0

        while True:
            jobs = self.session.query(Job).offset(offset).limit(batch_size).all()
            if not jobs:
                break

            for job in jobs:
                completeness = self._calculate_completeness(job)
                derived = dict(job.derived_signals) if job.derived_signals else {}
                if "data_quality" not in derived:
                    derived["data_quality"] = {}
                derived["data_quality"]["completeness"] = completeness
                job.derived_signals = derived
                calculated_count += 1

            offset += batch_size
            if offset % 5000 == 0:
                self.session.commit()
                logger.info(f"    Processed {offset} jobs...")

        self.stats["completeness_calculated"] = calculated_count
        logger.info(f"  ✓ Calculated completeness for {calculated_count} jobs")

    def _calculate_completeness(self, job: Job) -> float:
        """Calculate data completeness score (0-1)."""
        derived = job.derived_signals or {}

        checks = [
            bool(job.title and len(job.title) > 3),
            bool(job.company_name and job.company_name not in ["nan", "NaN", ""]),
            bool(job.location and len(job.location) > 2),
            bool(job.jd_text and len(job.jd_text) > 200),
            bool(derived.get("salary", {}).get("min") or derived.get("salary", {}).get("max")),
            bool(derived.get("job_level")),
            bool(derived.get("work_mode")),
            bool(derived.get("skills", {}).get("count", 0) > 0),
            bool(derived.get("classification", {}).get("category")),
            bool(derived.get("geo", {}).get("state")),
        ]

        score = sum(checks) / len(checks)
        return round(score, 2)


# ============================================================================
# CLI Entry Point
# ============================================================================


def main():
    """Run data processing from command line."""
    import sys

    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    print("=" * 70)
    print("JOB DATA PROCESSOR - All 22 Industries")
    print("=" * 70)
    print("\nThis will process all jobs in the database:")
    print("  1. Mark duplicate jobs (cross-platform & same-platform)")
    print("  2. Mark jobs with missing company names")
    print("  3. Mark aggregators and staffing firms")
    print("  4. Extract skills from JD (878 skills across 22 industries)")
    print("  5. Extract experience requirements")
    print("  6. Calculate data completeness score")
    print()

    confirm = input("Continue? (yes/no): ")
    if confirm.lower() != "yes":
        print("Cancelled.")
        return

    processor = JobDataProcessor()
    stats = processor.process_all()

    print("\n✅ Processing complete!")
    return stats


if __name__ == "__main__":
    main()
