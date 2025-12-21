"""
Run massive job collection (all industries, past 7 days).

This script collects jobs across all 22 industries with 568 search queries.
Expected: 50,000-80,000 unique jobs after deduplication.
Estimated time: 2-3 hours.
"""

import sys
import logging
import os
from src.fuckwork.services.collection.batch_collector import BatchCollector
from src.fuckwork.services.collection.search_config import generate_search_matrix, PRESET_MASSIVE, get_search_stats
from src.fuckwork.services.scoring.scorer import AuthenticityScorer
from data_enrichment.run_enrichment import run_job_enrichment
from src.fuckwork.services.classification.job_classifier import JobClassifier
from src.fuckwork.database import SessionLocal
from src.fuckwork.database import Job

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def job_to_dict(job: Job) -> dict:
    """Convert Job object to dict for scorer"""
    return {
        'job_id': job.job_id,
        'title': job.title,
        'company_name': job.company_name,
        'location': job.location,
        'url': job.url,
        'platform': job.platform,
        'jd_text': job.jd_text,
        'posted_date': job.posted_date,
        'company_info': job.company_info or {},
        'platform_metadata': job.platform_metadata or {},
        'derived_signals': job.derived_signals or {},
        'poster_info': job.poster_info or {},
    }


def run_massive_collection():
    """
    Run massive collection across all industries.
    
    Steps:
    1. Generate 568 search queries from PRESET_MASSIVE
    2. Collect jobs from all platforms (4-5 sec delay per query)
    3. Score all new jobs
    4. Enrich all new jobs
    5. Classify all new jobs
    """
    
    # Print stats
    stats = get_search_stats('massive')
    logger.info("=" * 80)
    logger.info("MASSIVE COLLECTION - All Industries, Past 7 Days")
    logger.info("=" * 80)
    logger.info(f"Total queries: {stats['total_queries']}")
    logger.info(f"Categories: {stats['categories']}")
    logger.info(f"Platforms: 4 (LinkedIn, Indeed, ZipRecruiter, Glassdoor)")
    logger.info(f"Time window: Past 7 days")
    logger.info(f"Expected jobs (before dedup): {stats['max_total_jobs']:,}")
    logger.info(f"Expected jobs (after dedup): ~50,000-80,000")
    logger.info(f"Estimated time: 2-3 hours")
    logger.info("=" * 80)
    
    # Confirm
    response = input("\nStart massive collection? (yes/no): ")
    if response.lower() != 'yes':
        logger.info("Collection cancelled.")
        return
    
    # Generate search matrix
    logger.info("\nGenerating search matrix...")
    search_configs = generate_search_matrix(**PRESET_MASSIVE)
    logger.info(f"Generated {len(search_configs)} search queries")
    
    # Run batch collection
    logger.info("\nStarting batch collection...")
    collector = BatchCollector(delay_between_queries=4)
    collection_stats = collector.run_batch(search_configs)
    
    logger.info("\n" + "=" * 80)
    logger.info("STEP 1: Collection Complete")
    logger.info("=" * 80)
    logger.info(f"Jobs collected: {collection_stats['total_jobs_collected']}")
    logger.info(f"Jobs saved: {collection_stats['total_jobs_saved']}")
    logger.info(f"Duplicates skipped: {collection_stats['total_duplicates']}")
    
    # Score unscored jobs
    logger.info("\n" + "=" * 80)
    logger.info("STEP 2: Scoring Jobs")
    logger.info("=" * 80)
    
    # Get rule table path
    rule_table_path = os.path.join(
        os.path.dirname(__file__),
        'authenticity_scoring',
        'data',
        'authenticity_rule_table.json'
    )
    
    db = SessionLocal()
    try:
        unscored_jobs = db.query(Job).filter(Job.authenticity_score == None).all()
        logger.info(f"Found {len(unscored_jobs)} unscored jobs")
        
        if unscored_jobs:
            scorer = AuthenticityScorer(rule_table_path)
            scored_count = 0
            
            for job in unscored_jobs:
                job_dict = job_to_dict(job)
                result = scorer.score_job(job_dict)
                
                if result:
                    # Map scorer results to database fields
                    job.authenticity_score = result['authenticity_score']  # ✅ FIXED
                    job.authenticity_level = result['level']  # ✅ FIXED
                    job.confidence = result['confidence']
                    job.decision_summary = result['summary']  # ✅ Map summary to decision_summary
                    job.red_flags = result['red_flags']
                    job.positive_signals = result['positive_signals']
                    
                    # Set decision based on level
                    if result['level'] == 'authentic':
                        job.decision = 'recommended'
                    elif result['level'] == 'uncertain':
                        job.decision = 'caution'
                    else:
                        job.decision = 'avoid'
                    
                    scored_count += 1
                    
                    if scored_count % 100 == 0:
                        logger.info(f"Scored {scored_count}/{len(unscored_jobs)} jobs...")
                        db.commit()
            
            db.commit()
            logger.info(f"Scoring complete: {scored_count} jobs scored")
    finally:
        db.close()
    
    # Enrich jobs
    logger.info("\n" + "=" * 80)
    logger.info("STEP 3: Enriching Jobs")
    logger.info("=" * 80)
    
    enrichment_stats = run_job_enrichment()
    logger.info(f"Jobs enriched: {enrichment_stats['enriched']}")
    
    # Classify jobs
    logger.info("\n" + "=" * 80)
    logger.info("STEP 4: Classifying Jobs")
    logger.info("=" * 80)
    
    db = SessionLocal()
    try:
        unclassified_jobs = db.query(Job).filter(
            ~Job.derived_signals.has_key('classification')
        ).all()
        logger.info(f"Found {len(unclassified_jobs)} unclassified jobs")
        
        if unclassified_jobs:
            classifier = JobClassifier(use_llm_fallback=True)
            classified_count = 0
            
            for job in unclassified_jobs:
                # Prepare job dict for classifier
                job_dict = {
                    'title': job.title,
                    'description': job.jd_text or "",
                    'company_name': job.company_name,
                    'company_industry': job.company_info.get('industry') if job.company_info else None,
                    'job_function': job.derived_signals.get('job_function') if job.derived_signals else None
                }
                
                classification = classifier.classify(job_dict)
                
                if classification:
                    if job.derived_signals is None:
                        job.derived_signals = {}
                    job.derived_signals['classification'] = classification
                    classified_count += 1
                    
                    if classified_count % 100 == 0:
                        logger.info(f"Classified {classified_count}/{len(unclassified_jobs)} jobs...")
                        db.commit()
            
            db.commit()
            logger.info(f"Classification complete: {classified_count} jobs classified")
    finally:
        db.close()
    
    # Final summary
    db = SessionLocal()
    try:
        total_jobs = db.query(Job).count()
        scored_jobs = db.query(Job).filter(Job.authenticity_score != None).count()
        classified_jobs = db.query(Job).filter(
            Job.derived_signals.has_key('classification')
        ).count()
        
        logger.info("\n" + "=" * 80)
        logger.info("MASSIVE COLLECTION COMPLETE!")
        logger.info("=" * 80)
        logger.info(f"Total jobs in database: {total_jobs:,}")
        logger.info(f"Scored jobs: {scored_jobs:,}")
        logger.info(f"Classified jobs: {classified_jobs:,}")
        logger.info(f"Duration: {collection_stats['duration_seconds']/3600:.2f} hours")
        logger.info("=" * 80)
    finally:
        db.close()


if __name__ == "__main__":
    try:
        run_massive_collection()
        sys.exit(0)
    except KeyboardInterrupt:
        logger.info("\n\nCollection interrupted by user.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n\nCollection failed: {e}", exc_info=True)
        sys.exit(1)
