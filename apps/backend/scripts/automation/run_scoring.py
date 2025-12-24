"""
Continuous scoring and data processing service.

Runs every 5 minutes to:
1. Process new jobs (dedup, clean, extract skills)
2. Score unscored jobs with v3.1 authenticity scoring

Usage:
    python run_scoring.py                  # Normal mode (every 5 minutes)
    python run_scoring.py --once           # Run once and exit
    python run_scoring.py --interval 60    # Custom interval (seconds)
"""

import sys
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.fuckwork.services.scoring.batch_scorer import score_unscored_jobs
from src.fuckwork.services.data_processor import JobDataProcessor
from src.fuckwork.database import SessionLocal, Job

# Configure logging with detailed timestamps
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("ScoringService")


def get_stats():
    """Get current database statistics."""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        
        total = db.query(Job).count()
        scored = db.query(Job).filter(Job.authenticity_score.isnot(None)).count()
        unscored = total - scored
        
        # Count jobs needing processing (no skills extracted)
        needs_processing = db.query(Job).filter(
            ~Job.derived_signals.has_key('skills')
        ).count() if total > 0 else 0
        
        return {
            'total': total,
            'scored': scored,
            'unscored': unscored,
            'needs_processing': needs_processing,
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {'total': 0, 'scored': 0, 'unscored': 0, 'needs_processing': 0}
    finally:
        db.close()


def run_processing_for_new_jobs():
    """
    Run data processing on jobs that haven't been processed yet.
    Only processes jobs without skills extracted (new jobs).
    """
    logger.info("🔧 Checking for jobs needing data processing...")
    
    db = SessionLocal()
    try:
        # Find jobs without skills (indicates not yet processed)
        new_jobs = db.query(Job).filter(
            ~Job.derived_signals.has_key('skills')
        ).limit(500).all()  # Process in batches of 500
        
        if not new_jobs:
            logger.info("   No new jobs need processing")
            return {'processed': 0}
        
        logger.info(f"   Found {len(new_jobs)} jobs needing processing")
        
        # Import here to avoid circular imports
        from src.fuckwork.services.skills_config import get_all_skills_flat, SOFT_SKILLS
        import re
        
        all_skills = get_all_skills_flat()
        skill_patterns = {}
        for skill in all_skills:
            escaped = re.escape(skill)
            skill_patterns[skill] = re.compile(r'\b' + escaped + r'\b', re.IGNORECASE)
        
        processed = 0
        
        for job in new_jobs:
            try:
                derived = dict(job.derived_signals) if job.derived_signals else {}
                jd_text = job.jd_text or ""
                jd_lower = jd_text.lower()
                
                # Extract skills
                found_skills = set()
                for skill, pattern in skill_patterns.items():
                    if pattern.search(jd_lower):
                        found_skills.add(skill)
                
                soft = [s for s in found_skills if s in [x.lower() for x in SOFT_SKILLS]]
                technical = [s for s in found_skills if s not in soft]
                
                derived['skills'] = {
                    'all': sorted(found_skills),
                    'technical': sorted(technical),
                    'soft': sorted(soft),
                    'count': len(found_skills)
                }
                
                # Extract experience
                exp_patterns = [
                    (r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)', 'min'),
                    (r'(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)', 'range'),
                ]
                
                for pattern, ptype in exp_patterns:
                    match = re.search(pattern, jd_lower)
                    if match:
                        if ptype == 'range':
                            derived['experience_years'] = {
                                'min': int(match.group(1)),
                                'max': int(match.group(2))
                            }
                        else:
                            derived['experience_years'] = {
                                'min': int(match.group(1)),
                                'max': None
                            }
                        break
                
                # Mark company type
                company_lower = (job.company_name or '').lower()
                aggregators = ['lensa', 'jobgether', 'ziprecruiter', 'dice']
                staffing = ['robert half', 'jobot', 'insight global', 'apex systems', 
                           'teksystems', 'kforce', 'randstad', 'cybercoders']
                
                if any(a in company_lower for a in aggregators):
                    derived['source_type'] = 'aggregator'
                elif any(s in company_lower for s in staffing):
                    derived['source_type'] = 'staffing_firm'
                
                # Mark nan company
                if job.company_name in ['nan', 'NaN', '', None]:
                    if 'data_quality' not in derived:
                        derived['data_quality'] = {}
                    derived['data_quality']['missing_company'] = True
                
                job.derived_signals = derived
                processed += 1
                
            except Exception as e:
                logger.error(f"   Error processing job {job.job_id}: {e}")
        
        db.commit()
        logger.info(f"   ✅ Processed {processed} jobs (skills, experience, company type)")
        
        return {'processed': processed}
        
    except Exception as e:
        logger.error(f"   ❌ Processing error: {e}")
        db.rollback()
        return {'processed': 0, 'error': str(e)}
    finally:
        db.close()


def run_iteration(iteration: int):
    """Run a single iteration of processing + scoring."""
    start_time = datetime.now()
    
    logger.info("=" * 70)
    logger.info(f"ITERATION #{iteration} | Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)
    
    # Get current stats
    stats = get_stats()
    logger.info(f"📊 Database: {stats['total']:,} total | {stats['scored']:,} scored | {stats['unscored']:,} unscored")
    
    # Step 1: Process new jobs
    processing_result = run_processing_for_new_jobs()
    
    # Step 2: Score unscored jobs
    logger.info("🎯 Scoring unscored jobs...")
    scoring_result = score_unscored_jobs(limit=500)  # Score up to 500 per iteration
    
    logger.info(f"   ✅ Scored: {scoring_result.get('scored', 0)} jobs")
    if scoring_result.get('skipped', 0) > 0:
        logger.info(f"   ⏭️  Skipped: {scoring_result.get('skipped', 0)} jobs")
    
    # Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info("-" * 70)
    logger.info(f"✅ Iteration #{iteration} complete | Duration: {duration:.1f}s")
    logger.info(f"   Processed: {processing_result.get('processed', 0)} | Scored: {scoring_result.get('scored', 0)}")
    
    return {
        'iteration': iteration,
        'processed': processing_result.get('processed', 0),
        'scored': scoring_result.get('scored', 0),
        'duration': duration,
    }


def main():
    parser = argparse.ArgumentParser(description='Continuous scoring and data processing service')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--interval', type=int, default=300, help='Interval between runs (seconds, default: 300)')
    args = parser.parse_args()
    
    logger.info("=" * 70)
    logger.info("🚀 SCORING & PROCESSING SERVICE")
    logger.info("=" * 70)
    logger.info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Mode: {'Single run' if args.once else f'Continuous (every {args.interval}s)'}")
    logger.info(f"Features: v3.1 scoring, skill extraction (878 skills), experience parsing")
    logger.info("=" * 70)
    
    iteration = 0
    
    while True:
        iteration += 1
        
        try:
            result = run_iteration(iteration)
            
        except Exception as e:
            logger.error(f"❌ Iteration #{iteration} failed: {e}", exc_info=True)
        
        if args.once:
            logger.info("\n🏁 Single run complete. Exiting.")
            break
        
        logger.info(f"\n⏰ Next run in {args.interval} seconds...")
        time.sleep(args.interval)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n\n🛑 Service stopped by user.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"\n\n💥 Service crashed: {e}", exc_info=True)
        sys.exit(1)