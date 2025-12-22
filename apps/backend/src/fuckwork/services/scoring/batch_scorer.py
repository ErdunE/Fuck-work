"""
Batch scoring service for processing unscored jobs.
"""
import logging
from typing import Dict
from pathlib import Path

from src.fuckwork.database import SessionLocal, Job
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
        unscored_jobs = session.query(Job).filter(
            Job.authenticity_score.is_(None)
        ).limit(limit).all()
        
        total = len(unscored_jobs)
        logger.info(f"Found {total} unscored jobs")
        
        if total == 0:
            return {"scored": 0, "skipped": 0}
        
        for job in unscored_jobs:
            try:
                # Prepare job data
                job_data = {
                    "job_id": job.job_id,
                    "jd_text": job.jd_text or "",
                    "title": job.title,
                    "company_name": job.company_name,
                }
                
                # Score the job
                result = scorer.score_job(job_data)
                
                # Update database
                job.authenticity_score = result["authenticity_score"]
                job.authenticity_level = result["level"]
                job.confidence = result["confidence"]
                
                scored += 1
                
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
