"""
Batch scoring service for processing unscored jobs.
"""

import logging
from pathlib import Path
from typing import Dict

from src.fuckwork.database import Job, SessionLocal

from .scorer import AuthenticityScorer

logger = logging.getLogger(__name__)

# Rule table path
RULE_TABLE_PATH = Path(__file__).parent / "data" / "authenticity_rule_table.json"


def score_unscored_jobs(limit: int = 100) -> Dict[str, int]:
    """
    Score jobs that don't have authenticity scores yet.

    Args:
        limit: Maximum number of jobs to score in one run

    Returns:
        Dict with 'scored' and 'skipped' counts
    """
    logger.info("🔍 Checking for unscored jobs...")

    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    scored = 0
    skipped = 0

    session = SessionLocal()
    try:
        # Get jobs without scores
        unscored_jobs = (
            session.query(Job).filter(Job.authenticity_score.is_(None)).limit(limit).all()
        )

        total = len(unscored_jobs)
        logger.info(f"Found {total} unscored jobs")

        if total == 0:
            return {"scored": 0, "skipped": 0}

        for job in unscored_jobs:
            try:
                # Prepare job data with ALL available fields
                job_data = {
                    "job_id": job.job_id,
                    "jd_text": job.jd_text or "",
                    "title": job.title,
                    "company_name": job.company_name,
                    "location": job.location,
                    "platform": job.platform,
                    "url": job.url,
                    # Include all JSONB fields for rule evaluation
                    "poster_info": job.poster_info or {},
                    "company_info": job.company_info or {},
                    "platform_metadata": job.platform_metadata or {},
                    "collection_metadata": job.collection_metadata or {},
                    "derived_signals": job.derived_signals or {},
                }

                # Score the job
                result = scorer.score_job(job_data)

                # Update database with ALL scoring results
                job.authenticity_score = result["authenticity_score"]
                job.authenticity_level = result["level"]
                job.confidence = result["confidence"]
                job.red_flags = result.get("red_flags", [])
                job.positive_signals = result.get("positive_signals", [])

                scored += 1

                logger.info(
                    f"Scored job {job.job_id}: score={result['authenticity_score']}, "
                    f"level={result['level']}, confidence={result['confidence']}"
                )

                if scored % 10 == 0:
                    logger.info(f"Progress: {scored}/{total} scored")

            except Exception as e:
                logger.error(f"Error scoring job {job.job_id}: {e}")
                skipped += 1

        # Commit all changes
        session.commit()
        logger.info(f"✅ Batch complete: {scored} scored, {skipped} skipped")

    finally:
        session.close()

    return {"scored": scored, "skipped": skipped}
