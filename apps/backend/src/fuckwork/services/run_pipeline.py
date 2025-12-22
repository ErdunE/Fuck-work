"""
Reusable end-to-end pipeline for job collection and scoring.

Phase 2A Stage 8: Modular pipeline design.
"""

import logging
from typing import Dict, List, Optional
from src.fuckwork.services.collection.jobspy_collector import JobSpyCollector
from src.fuckwork.services.collection.db_saver import JobSaver
from src.fuckwork.services.scoring.scorer import AuthenticityScorer
from src.fuckwork.database import SessionLocal
from src.fuckwork.database import Job
from src.fuckwork.services.enrichment.run_enrichment import run_job_enrichment

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def run_full_pipeline(
    search_term: str = "Software Engineer New Grad",
    location: str = "United States",
    hours_old: int = 24,
    results_wanted: int = 50,
    sites: Optional[List[str]] = None,
) -> Dict:
    """
    Run complete job collection and scoring pipeline.

    Steps:
    1. Collect jobs via JobSpyCollector
    2. Convert to JobData format
    3. Save to database with deduplication
    4. Score unscored jobs using AuthenticityScorer

    Args:
        search_term: Job search keywords
        location: Geographic location
        hours_old: Only jobs posted in last X hours
        results_wanted: Number of results per platform
        sites: List of sites to scrape (default: linkedin, indeed, glassdoor, zip_recruiter)

    Returns:
        Dict with pipeline statistics
    """
    logger.info("=" * 60)
    logger.info("Starting End-to-End Pipeline")
    logger.info("=" * 60)

    stats = {
        "collected": 0,
        "converted": 0,
        "saved": 0,
        "duplicates": 0,
        "scored": 0,
        "errors": 0,
    }

    try:
        # Step 1: Collect jobs
        logger.info("Step 1: Collecting jobs with JobSpy...")
        collector = JobSpyCollector()
        df = collector.collect(
            search_term=search_term,
            location=location,
            hours_old=hours_old,
            results_wanted=results_wanted,
            sites=sites,
        )
        stats["collected"] = len(df)
        logger.info(f"✓ Collected {stats['collected']} jobs")

        # Step 2: Convert to JobData
        logger.info("Step 2: Converting to JobData format...")
        jobs = collector.convert_to_jobdata(df)
        stats["converted"] = len(jobs)
        logger.info(f"✓ Converted {stats['converted']} jobs")

        # Step 3: Save to database
        logger.info("Step 3: Saving to database...")
        saver = JobSaver()
        save_stats = saver.save_jobs(jobs)
        stats["saved"] = save_stats["saved"]
        stats["duplicates"] = save_stats["duplicates"]
        stats["errors"] = save_stats.get("errors", 0)
        logger.info(f"✓ Saved: {stats['saved']}, Duplicates: {stats['duplicates']}")

        # Step 4: Score unscored jobs
        logger.info("Step 4: Scoring unscored jobs...")
        rule_table_path = "authenticity_scoring/data/authenticity_rule_table.json"
        scorer = AuthenticityScorer(rule_table_path)

        session = SessionLocal()
        try:
            unscored = session.query(Job).filter(Job.authenticity_score is None).all()
            logger.info(f"Found {len(unscored)} unscored jobs")

            for job in unscored:
                try:
                    job_dict = {
                        "job_id": job.job_id,
                        "title": job.title,
                        "company_name": job.company_name,
                        "platform": job.platform,
                        "location": job.location,
                        "url": job.url,
                        "jd_text": job.jd_text,
                        "poster_info": job.poster_info,
                        "company_info": job.company_info,
                        "platform_metadata": job.platform_metadata,
                        "derived_signals": job.derived_signals,
                        "collection_metadata": job.collection_metadata,
                    }

                    result = scorer.score_job(job_dict)

                    job.authenticity_score = result["authenticity_score"]
                    job.authenticity_level = result["level"]
                    job.confidence = result["confidence"]
                    job.red_flags = result.get("red_flags", [])
                    job.positive_signals = result.get("positive_signals", [])

                    stats["scored"] += 1

                except Exception as e:
                    logger.warning(f"Failed to score job {job.job_id}: {e}")
                    stats["errors"] += 1

            session.commit()
            logger.info(f"✓ Scored {stats['scored']} jobs")

        finally:
            session.close()

        # Step 5: Enrich all jobs with derived signals
        logger.info("Step 5: Enriching jobs with derived signals...")
        enrichment_stats = run_job_enrichment()
        logger.info(f"✓ Enriched {enrichment_stats['enriched']} jobs")

        # Success
        logger.info("=" * 60)
        logger.info("Pipeline Complete")
        logger.info("=" * 60)
        logger.info(
            f"Summary: Collected {stats['collected']}, "
            f"Saved {stats['saved']}, "
            f"Scored {stats['scored']}"
        )

        return stats

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise


if __name__ == "__main__":
    import sys

    try:
        stats = run_full_pipeline()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        sys.exit(1)
