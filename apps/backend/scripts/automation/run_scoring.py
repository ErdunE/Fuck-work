"""
Continuous scoring service.
Runs every 5 minutes to score new jobs.
"""
import time
import logging
from src.fuckwork.services.scoring.batch_scorer import score_unscored_jobs

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("=" * 80)
    logger.info("🎯 Starting Scoring Service")
    logger.info("=" * 80)
    logger.info("Will score unscored jobs every 5 minutes")
    
    iteration = 0
    
    while True:
        iteration += 1
        try:
            logger.info(f"\n{'='*80}")
            logger.info(f"Iteration #{iteration}")
            logger.info(f"{'='*80}")
            logger.info("🔍 Checking for unscored jobs...")
            
            result = score_unscored_jobs()
            
            logger.info(f"✅ Scored: {result.get('scored', 0)} jobs")
            logger.info(f"⏭️  Skipped: {result.get('skipped', 0)} jobs (already scored)")
            logger.info(f"📊 Total processed: {result.get('scored', 0) + result.get('skipped', 0)}")
            
        except Exception as e:
            logger.error(f"❌ Error in scoring: {e}", exc_info=True)
        
        logger.info(f"⏰ Waiting 5 minutes until next check...")
        time.sleep(300)  # 5 minutes

if __name__ == "__main__":
    main()
