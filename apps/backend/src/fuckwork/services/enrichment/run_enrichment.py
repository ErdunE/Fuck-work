"""
Batch job enrichment pipeline.

Enriches all jobs in database with structured derived_signals.
Phase 2.5.
"""

import logging
from typing import Dict
from sqlalchemy.orm.attributes import flag_modified
from src.fuckwork.database import SessionLocal
from src.fuckwork.database import Job
from .job_enricher import JobEnricher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_job_enrichment(batch_size: int = 100) -> Dict:
    """
    Enrich all jobs with derived_signals.

    Idempotent: Safe to run multiple times.

    Args:
        batch_size: Process jobs in batches (for memory efficiency)

    Returns:
        Stats dict with enrichment counts
    """
    logger.info("=" * 70)
    logger.info("Starting Job Enrichment Pipeline")
    logger.info("=" * 70)

    enricher = JobEnricher()
    session = SessionLocal()

    stats = {"total": 0, "enriched": 0, "errors": 0}

    try:
        # Get total count
        total = session.query(Job).count()
        stats["total"] = total
        logger.info(f"Found {total} jobs to enrich")

        # Process in batches
        offset = 0
        while offset < total:
            jobs = session.query(Job).offset(offset).limit(batch_size).all()

            if not jobs:
                break

            logger.info(f"Processing batch {offset}-{offset + len(jobs)}...")

            for job in jobs:
                try:
                    # Convert to dict
                    job_dict = {
                        "job_id": job.job_id,
                        "title": job.title,
                        "company_name": job.company_name,
                        "platform": job.platform,
                        "location": job.location,
                        "jd_text": job.jd_text,
                        "platform_metadata": job.platform_metadata,
                    }

                    # Enrich
                    enriched_signals = enricher.enrich_job(job_dict)

                    # Merge with existing derived_signals (preserve authenticity scoring signals)
                    if job.derived_signals is None:
                        job.derived_signals = {}

                    # Update with enriched data
                    job.derived_signals.update(enriched_signals)

                    # Mark field as modified for SQLAlchemy to detect changes
                    flag_modified(job, "derived_signals")

                    stats["enriched"] += 1

                except Exception as e:
                    logger.warning(f"Failed to enrich job {job.job_id}: {e}")
                    stats["errors"] += 1

            session.commit()
            offset += batch_size

        logger.info("=" * 70)
        logger.info("Job Enrichment Complete")
        logger.info("=" * 70)
        logger.info("Summary:")
        logger.info(f"  - Total jobs: {stats['total']}")
        logger.info(f"  - Enriched: {stats['enriched']}")
        logger.info(f"  - Errors: {stats['errors']}")

    finally:
        session.close()

    return stats


if __name__ == "__main__":
    import sys

    try:
        stats = run_job_enrichment()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Enrichment failed: {e}")
        sys.exit(1)
