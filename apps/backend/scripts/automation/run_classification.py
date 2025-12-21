"""
Run job classification on all unclassified jobs.

Usage:
    # With LLM fallback (slower, smarter)
    python run_classification.py
    
    # Rules only (faster)
    python run_classification.py --rules-only
    
    # Test on single job
    python run_classification.py --test
"""

import sys
import logging
from src.fuckwork.database import SessionLocal
from src.fuckwork.database import Job
from src.fuckwork.services.classification.job_classifier import JobClassifier, classify_unclassified_jobs
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_single_job():
    """Test classifier on a single job from database"""
    db = SessionLocal()
    
    try:
        # Get a job
        job_model = db.query(Job).first()
        
        if not job_model:
            print("No jobs in database")
            return
        
        print("=" * 70)
        print(f"Testing classification on:")
        print(f"  Title: {job_model.title}")
        print(f"  Company: {job_model.company_name}")
        print("=" * 70)
        
        # Convert to dict
        job_dict = {
            'title': job_model.title,
            'company_name': job_model.company_name,
            'jd_text': job_model.jd_text,
            'company_info': job_model.company_info,
            'derived_signals': job_model.derived_signals
        }
        
        # Classify
        classifier = JobClassifier(use_llm_fallback=True)
        result = classifier.classify(job_dict)
        
        print("\nClassification Result:")
        print(json.dumps(result, indent=2))
        
    finally:
        db.close()


def main():
    """Main classification pipeline"""
    
    # Parse args
    use_llm = '--rules-only' not in sys.argv
    test_mode = '--test' in sys.argv
    
    if test_mode:
        test_single_job()
        return
    
    logger.info("=" * 70)
    logger.info("Job Classification Pipeline")
    logger.info("=" * 70)
    logger.info(f"Mode: {'Hybrid (Rules + LLM)' if use_llm else 'Rules Only'}")
    logger.info("=" * 70)
    
    db = SessionLocal()
    
    try:
        stats = classify_unclassified_jobs(db, batch_size=100, use_llm=use_llm)
        
        logger.info("=" * 70)
        logger.info("Classification Complete")
        logger.info("=" * 70)
        logger.info(f"Total jobs: {stats['total']}")
        logger.info(f"Successfully classified: {stats['classified']}")
        logger.info(f"  - By rules: {stats['rules']}")
        logger.info(f"  - By LLM: {stats['llm']}")
        logger.info(f"Errors: {stats['errors']}")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
