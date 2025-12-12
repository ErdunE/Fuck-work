"""
Daily job collection scheduler.

Runs pipeline once per day at configurable time.
Phase 2A Stage 9.

Usage:
    # Start scheduler (runs daily at 8:00 AM)
    python3 scheduler.py
    
    # Run immediately for testing
    python3 scheduler.py --now
    
    # Custom schedule (modify cron_hour in code)
    # Edit start_scheduler() call in __main__

Prerequisites:
    - PostgreSQL running (docker-compose up -d)
    - Database initialized (python3 init_database.py)

The scheduler will:
    1. Collect jobs from LinkedIn, Indeed, Glassdoor, ZipRecruiter
    2. Save to database with deduplication
    3. Score all unscored jobs
    4. Log statistics
"""

import logging
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from pipeline.run_pipeline import run_full_pipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def scheduled_pipeline_run():
    """
    Run the pipeline on schedule.
    
    This is the function called by APScheduler.
    Logs start time, pipeline stats, and any errors.
    """
    logger.info("=" * 70)
    logger.info(f"Scheduled Pipeline Run Started: {datetime.now()}")
    logger.info("=" * 70)
    
    try:
        # Run the full pipeline
        stats = run_full_pipeline(
            search_term="Software Engineer New Grad",
            location="United States",
            hours_old=24,
            results_wanted=100  # 100 per platform for daily run
        )
        
        # Log results
        logger.info("=" * 70)
        logger.info("Scheduled Pipeline Run Complete")
        logger.info("=" * 70)
        logger.info(f"Summary:")
        logger.info(f"  - Jobs collected: {stats['collected']}")
        logger.info(f"  - Jobs saved: {stats['saved']}")
        logger.info(f"  - Duplicates: {stats['duplicates']}")
        logger.info(f"  - Jobs scored: {stats['scored']}")
        logger.info(f"  - Errors: {stats['errors']}")
        logger.info(f"Completed at: {datetime.now()}")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error(f"Scheduled Pipeline Run FAILED: {e}")
        logger.error("=" * 70)
        import traceback
        traceback.print_exc()


def start_scheduler(cron_hour: int = 8, cron_minute: int = 0):
    """
    Start the daily scheduler.
    
    Args:
        cron_hour: Hour to run (0-23, default 8 = 8:00 AM)
        cron_minute: Minute to run (0-59, default 0)
    
    The scheduler runs indefinitely until stopped (Ctrl+C).
    """
    logger.info("=" * 70)
    logger.info("FuckWork Phase 2A Daily Scheduler")
    logger.info("=" * 70)
    logger.info(f"Schedule: Daily at {cron_hour:02d}:{cron_minute:02d}")
    logger.info("Press Ctrl+C to stop")
    logger.info("=" * 70)
    
    # Create scheduler
    scheduler = BlockingScheduler()
    
    # Add daily job
    trigger = CronTrigger(hour=cron_hour, minute=cron_minute)
    scheduler.add_job(
        scheduled_pipeline_run,
        trigger=trigger,
        id='daily_pipeline',
        name='Daily Job Collection and Scoring',
        replace_existing=True
    )
    
    try:
        logger.info("Scheduler starting...")
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("\nScheduler stopped by user")
        scheduler.shutdown()


def run_now():
    """
    Run the pipeline immediately (for testing).
    
    Useful for manual testing without waiting for schedule.
    """
    logger.info("Running pipeline immediately (manual trigger)...")
    scheduled_pipeline_run()


if __name__ == "__main__":
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--now":
        # Run immediately for testing
        run_now()
    else:
        # Start the scheduler
        start_scheduler()

