"""
Run massive job collection and processing (all industries, past 7 days).

This script:
1. Collects jobs across all 22 industries with 568 search queries
2. Processes data (deduplication, cleaning, skill extraction)
3. Scores all jobs with v3.1 authenticity scoring
4. Classifies all jobs

Expected: 50,000-80,000 unique jobs after deduplication.
Estimated time: 2-3 hours for collection, 30-60 min for processing.

Usage:
    # Full pipeline (collection + processing)
    python run_massive_collection.py
    
    # Process existing data only (no new collection)
    python run_massive_collection.py --process-only
    
    # Re-score all jobs with latest scoring system
    python run_massive_collection.py --rescore-all
"""

import sys
import logging
import os
import argparse
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.fuckwork.services.collection.batch_collector import BatchCollector
from src.fuckwork.services.collection.search_config import generate_search_matrix, PRESET_MASSIVE, get_search_stats
from src.fuckwork.services.scoring.scorer import AuthenticityScorer
from src.fuckwork.services.scoring.batch_scorer import RULE_TABLE_PATH
from src.fuckwork.services.classification.job_classifier import JobClassifier
from src.fuckwork.services.data_processor import JobDataProcessor
from src.fuckwork.database import SessionLocal, Job

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
        'collection_metadata': job.collection_metadata or {},
    }


def get_database_stats():
    """Get current database statistics."""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        total = db.query(Job).count()
        scored = db.query(Job).filter(Job.authenticity_score.isnot(None)).count()
        
        # Level distribution
        level_dist = dict(
            db.query(Job.authenticity_level, func.count(Job.id))
            .filter(Job.authenticity_level.isnot(None))
            .group_by(Job.authenticity_level)
            .all()
        )
        
        # Platform distribution
        platform_dist = dict(
            db.query(Job.platform, func.count(Job.id))
            .group_by(Job.platform)
            .all()
        )
        
        return {
            'total': total,
            'scored': scored,
            'unscored': total - scored,
            'level_distribution': level_dist,
            'platform_distribution': platform_dist,
        }
    finally:
        db.close()


def run_collection():
    """Step 1: Collect jobs from all platforms."""
    stats = get_search_stats('massive')
    logger.info("=" * 80)
    logger.info("STEP 1: JOB COLLECTION")
    logger.info("=" * 80)
    logger.info(f"Total queries: {stats['total_queries']}")
    logger.info(f"Categories: {stats['categories']}")
    logger.info(f"Platforms: 4 (LinkedIn, Indeed, ZipRecruiter, Glassdoor)")
    
    # Generate search matrix
    search_configs = generate_search_matrix(**PRESET_MASSIVE)
    logger.info(f"Generated {len(search_configs)} search queries")
    
    # Run batch collection
    collector = BatchCollector(delay_between_queries=4)
    collection_stats = collector.run_batch(search_configs)
    
    logger.info(f"✅ Collection complete:")
    logger.info(f"   Jobs collected: {collection_stats['total_jobs_collected']:,}")
    logger.info(f"   Jobs saved: {collection_stats['total_jobs_saved']:,}")
    logger.info(f"   Duplicates skipped: {collection_stats['total_duplicates']:,}")
    
    return collection_stats


def run_data_processing():
    """Step 2: Process data (dedup, clean, extract skills)."""
    logger.info("\n" + "=" * 80)
    logger.info("STEP 2: DATA PROCESSING")
    logger.info("=" * 80)
    logger.info("Running: deduplication, cleaning, skill extraction, experience extraction")
    
    processor = JobDataProcessor()
    stats = processor.process_all()
    
    logger.info(f"✅ Processing complete:")
    logger.info(f"   Duplicates marked: {stats['duplicates_marked']:,}")
    logger.info(f"   Nan companies marked: {stats['nan_companies_marked']:,}")
    logger.info(f"   Aggregators marked: {stats['aggregators_marked']:,}")
    logger.info(f"   Staffing firms marked: {stats['staffing_firms_marked']:,}")
    logger.info(f"   Skills extracted: {stats['skills_extracted']:,}")
    logger.info(f"   Experience extracted: {stats['experience_extracted']:,}")
    
    return stats


def run_scoring(rescore_all: bool = False):
    """Step 3: Score jobs with v3.1 authenticity scoring."""
    logger.info("\n" + "=" * 80)
    logger.info("STEP 3: AUTHENTICITY SCORING (v3.1)")
    logger.info("=" * 80)
    
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    db = SessionLocal()
    
    try:
        if rescore_all:
            jobs = db.query(Job).all()
            logger.info(f"Re-scoring ALL {len(jobs):,} jobs...")
        else:
            jobs = db.query(Job).filter(Job.authenticity_score.is_(None)).all()
            logger.info(f"Scoring {len(jobs):,} unscored jobs...")
        
        if not jobs:
            logger.info("No jobs to score.")
            return {'scored': 0, 'errors': 0}
        
        scored = 0
        errors = 0
        
        for i, job in enumerate(jobs):
            try:
                job_dict = job_to_dict(job)
                result = scorer.score_job(job_dict)
                
                job.authenticity_score = result['authenticity_score']
                job.authenticity_level = result['level']
                job.confidence = result['confidence']
                job.red_flags = result.get('red_flags', [])
                job.positive_signals = result.get('positive_signals', [])
                
                scored += 1
                
            except Exception as e:
                logger.error(f"Error scoring job {job.job_id}: {e}")
                errors += 1
            
            if (i + 1) % 1000 == 0:
                db.commit()
                logger.info(f"   Progress: {i+1:,}/{len(jobs):,} ({(i+1)*100/len(jobs):.1f}%)")
        
        db.commit()
        logger.info(f"✅ Scoring complete: {scored:,} scored, {errors:,} errors")
        
        return {'scored': scored, 'errors': errors}
        
    finally:
        db.close()


def run_classification():
    """Step 4: Classify unclassified jobs."""
    logger.info("\n" + "=" * 80)
    logger.info("STEP 4: JOB CLASSIFICATION")
    logger.info("=" * 80)
    
    db = SessionLocal()
    try:
        # Find jobs without classification
        unclassified = db.query(Job).filter(
            ~Job.derived_signals.has_key('classification')
        ).all()
        
        logger.info(f"Found {len(unclassified):,} unclassified jobs")
        
        if not unclassified:
            return {'classified': 0}
        
        classifier = JobClassifier(use_llm_fallback=False)  # Rules only for speed
        classified = 0
        
        for i, job in enumerate(unclassified):
            try:
                job_dict = {
                    'title': job.title,
                    'description': job.jd_text or "",
                    'company_name': job.company_name,
                    'company_industry': job.company_info.get('industry') if job.company_info else None,
                }
                
                classification = classifier.classify(job_dict)
                
                if classification:
                    derived = dict(job.derived_signals) if job.derived_signals else {}
                    derived['classification'] = classification
                    job.derived_signals = derived
                    classified += 1
                    
            except Exception as e:
                logger.error(f"Error classifying job {job.job_id}: {e}")
            
            if (i + 1) % 1000 == 0:
                db.commit()
                logger.info(f"   Progress: {i+1:,}/{len(unclassified):,}")
        
        db.commit()
        logger.info(f"✅ Classification complete: {classified:,} jobs classified")
        
        return {'classified': classified}
        
    finally:
        db.close()


def print_final_stats():
    """Print final database statistics."""
    logger.info("\n" + "=" * 80)
    logger.info("FINAL STATISTICS")
    logger.info("=" * 80)
    
    stats = get_database_stats()
    
    logger.info(f"Total jobs: {stats['total']:,}")
    logger.info(f"Scored: {stats['scored']:,}")
    
    logger.info(f"\nBy platform:")
    for platform, count in stats['platform_distribution'].items():
        logger.info(f"   {platform}: {count:,}")
    
    logger.info(f"\nBy authenticity level:")
    for level, count in stats['level_distribution'].items():
        pct = count * 100 / stats['scored'] if stats['scored'] > 0 else 0
        logger.info(f"   {level}: {count:,} ({pct:.1f}%)")


def main():
    parser = argparse.ArgumentParser(description='Massive job collection and processing')
    parser.add_argument('--process-only', action='store_true', 
                        help='Skip collection, only process existing data')
    parser.add_argument('--rescore-all', action='store_true',
                        help='Re-score ALL jobs (not just unscored)')
    parser.add_argument('--skip-classification', action='store_true',
                        help='Skip classification step')
    parser.add_argument('--yes', '-y', action='store_true',
                        help='Skip confirmation prompt')
    args = parser.parse_args()
    
    start_time = datetime.now()
    
    logger.info("=" * 80)
    logger.info("MASSIVE JOB COLLECTION & PROCESSING PIPELINE")
    logger.info("=" * 80)
    logger.info(f"Started at: {start_time}")
    
    # Show current stats
    stats = get_database_stats()
    logger.info(f"\nCurrent database: {stats['total']:,} jobs ({stats['scored']:,} scored)")
    
    # Confirm
    if not args.yes:
        if args.process_only:
            prompt = "Process existing data? (yes/no): "
        elif args.rescore_all:
            prompt = f"Re-score ALL {stats['total']:,} jobs? (yes/no): "
        else:
            prompt = "Start massive collection + processing? (yes/no): "
        
        response = input(prompt)
        if response.lower() != 'yes':
            logger.info("Cancelled.")
            return
    
    # Run pipeline
    if not args.process_only:
        run_collection()
    
    run_data_processing()
    run_scoring(rescore_all=args.rescore_all)
    
    if not args.skip_classification:
        run_classification()
    
    # Final stats
    print_final_stats()
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    logger.info(f"\n⏱️  Total duration: {duration}")
    logger.info("=" * 80)
    logger.info("✅ PIPELINE COMPLETE!")
    logger.info("=" * 80)


if __name__ == "__main__":
    try:
        main()
        sys.exit(0)
    except KeyboardInterrupt:
        logger.info("\n\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n\nPipeline failed: {e}", exc_info=True)
        sys.exit(1)