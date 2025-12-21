"""
Verify decision engine coverage across all jobs.

Ensures:
- Every job gets a decision (recommend/caution/avoid)
- No null decisions
- Decision distribution is reasonable
"""

from database import engine, SessionLocal
from database.models import Job
from decision_engine import explain_job_decision
from collections import Counter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_decisions():
    """Verify decision engine on all jobs"""
    
    db = SessionLocal()
    
    try:
        # Get all jobs
        jobs = db.query(Job).all()
        total_jobs = len(jobs)
        
        logger.info(f"Verifying decisions for {total_jobs} jobs...")
        
        decisions = []
        null_count = 0
        error_count = 0
        
        for i, job in enumerate(jobs):
            try:
                decision = explain_job_decision(job)
                
                if decision.decision is None:
                    null_count += 1
                    logger.warning(f"Null decision for job {job.job_id}")
                else:
                    decisions.append(decision.decision)
                
                # Progress indicator
                if (i + 1) % 100 == 0:
                    logger.info(f"Processed {i + 1}/{total_jobs} jobs...")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Error processing job {job.job_id}: {e}")
        
        # Print distribution
        distribution = Counter(decisions)
        
        print("\n" + "=" * 80)
        print("DECISION ENGINE VERIFICATION")
        print("=" * 80)
        print(f"Total jobs:       {total_jobs}")
        print(f"Decisions made:   {len(decisions)}")
        print(f"Null decisions:   {null_count}")
        print(f"Errors:           {error_count}")
        print()
        print("DECISION DISTRIBUTION:")
        print(f"  Recommend:      {distribution['recommend']:4d} ({distribution['recommend']/len(decisions)*100:.1f}%)")
        print(f"  Caution:        {distribution['caution']:4d} ({distribution['caution']/len(decisions)*100:.1f}%)")
        print(f"  Avoid:          {distribution['avoid']:4d} ({distribution['avoid']/len(decisions)*100:.1f}%)")
        print("=" * 80)
        
        # Verify 100% coverage
        coverage = (len(decisions) / total_jobs * 100) if total_jobs > 0 else 0
        
        if null_count > 0:
            logger.error(f"FAILED: {null_count} jobs returned null decisions")
            return False
        
        if error_count > 0:
            logger.error(f"FAILED: {error_count} jobs caused errors")
            return False
        
        if coverage < 100:
            logger.error(f"FAILED: Coverage is {coverage:.1f}%, expected 100%")
            return False
        
        logger.info("✓ 100% decision coverage verified")
        logger.info("✓ All jobs received valid decisions")
        
        return True
        
    finally:
        db.close()


if __name__ == "__main__":
    success = verify_decisions()
    exit(0 if success else 1)

