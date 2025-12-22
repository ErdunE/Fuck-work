"""
Batch JobSpy collection runner.

Executes multiple search queries with rate limiting and error handling.
Phase 2.6 - Coverage Expansion.
"""

import logging
import time
from typing import Dict, List, Optional
from datetime import datetime
from .jobspy_collector import JobSpyCollector
from .db_saver import JobSaver
from .search_config import generate_search_matrix, PRESET_DAILY, PRESET_HOURLY, PRESET_MASSIVE

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BatchCollector:
    """
    Batch collection runner with rate limiting.
    """
    
    def __init__(self, delay_between_queries: int = 4):
        """
        Args:
            delay_between_queries: Seconds to wait between queries (moderate: 3-5)
        """
        self.collector = JobSpyCollector()
        self.saver = JobSaver()
        self.delay = delay_between_queries
    
    def run_batch(
        self,
        search_configs: List[Dict],
        max_retries: int = 2
    ) -> Dict:
        """
        Run batch collection with rate limiting.
        
        Args:
            search_configs: List of search job configs from generate_search_matrix()
            max_retries: Max retry attempts per query
        
        Returns:
            Batch statistics
        """
        logger.info("=" * 80)
        logger.info(f"Starting Batch Collection: {len(search_configs)} queries")
        logger.info("=" * 80)
        
        stats = {
            'total_queries': len(search_configs),
            'successful_queries': 0,
            'failed_queries': 0,
            'total_jobs_collected': 0,
            'total_jobs_saved': 0,
            'total_duplicates': 0,
            'start_time': datetime.now(),
            'by_category': {},
        }
        
        for i, config in enumerate(search_configs, 1):
            category = config.get('category', 'unknown')
            
            logger.info(f"\n[{i}/{len(search_configs)}] Query: {config['search_term']}")
            logger.info(f"  Location: {config['location']}")
            logger.info(f"  Platforms: {config['sites']}")
            
            attempt = 0
            success = False
            
            while attempt < max_retries and not success:
                try:
                    # Collect
                    df = self.collector.collect(
                        search_term=config['search_term'],
                        location=config['location'],
                        hours_old=config['hours_old'],
                        results_wanted=config['results_wanted'],
                        sites=config['sites']
                    )
                    
                    if df is not None and not df.empty:
                        # Convert
                        jobs = self.collector.convert_to_jobdata(df)
                        
                        # Save
                        save_stats = self.saver.save_jobs(jobs)
                        
                        # Update stats
                        stats['successful_queries'] += 1
                        stats['total_jobs_collected'] += len(jobs)
                        stats['total_jobs_saved'] += save_stats['saved']
                        stats['total_duplicates'] += save_stats['duplicates']
                        
                        # Category stats
                        if category not in stats['by_category']:
                            stats['by_category'][category] = {
                                'queries': 0,
                                'collected': 0,
                                'saved': 0,
                            }
                        stats['by_category'][category]['queries'] += 1
                        stats['by_category'][category]['collected'] += len(jobs)
                        stats['by_category'][category]['saved'] += save_stats['saved']
                        
                        logger.info(f"  ✓ Collected {len(jobs)}, Saved {save_stats['saved']}, Duplicates {save_stats['duplicates']}")
                        success = True
                    else:
                        logger.warning(f"  ✗ No jobs returned")
                        stats['failed_queries'] += 1
                        success = True  # Don't retry if no results
                
                except Exception as e:
                    attempt += 1
                    logger.error(f"  ✗ Error (attempt {attempt}/{max_retries}): {e}")
                    
                    if attempt >= max_retries:
                        stats['failed_queries'] += 1
                    else:
                        time.sleep(self.delay * 2)  # Longer delay on error
            
            # Rate limiting delay
            if i < len(search_configs):
                logger.debug(f"  Waiting {self.delay}s before next query...")
                time.sleep(self.delay)
        
        stats['end_time'] = datetime.now()
        stats['duration_seconds'] = (stats['end_time'] - stats['start_time']).total_seconds()
        
        self._print_summary(stats)
        return stats
    
    def _print_summary(self, stats: Dict):
        """Print batch collection summary"""
        logger.info("\n" + "=" * 80)
        logger.info("Batch Collection Summary")
        logger.info("=" * 80)
        logger.info(f"Duration: {stats['duration_seconds']:.1f}s")
        logger.info(f"Queries: {stats['successful_queries']}/{stats['total_queries']} successful")
        logger.info(f"Jobs collected: {stats['total_jobs_collected']}")
        logger.info(f"Jobs saved: {stats['total_jobs_saved']}")
        logger.info(f"Duplicates: {stats['total_duplicates']}")
        
        logger.info("\nBy Category:")
        for category, cat_stats in stats['by_category'].items():
            logger.info(f"  {category:20s}: {cat_stats['queries']:3d} queries, "
                       f"{cat_stats['collected']:4d} collected, {cat_stats['saved']:4d} saved")
        
        logger.info("=" * 80)


def run_preset_batch(preset_name: str = "daily"):
    """
    Run batch collection with a preset configuration.
    
    Args:
        preset_name: 'quick', 'daily', or 'thorough'
    """
    from .search_config import PRESET_QUICK, PRESET_DAILY, PRESET_THOROUGH, PRESET_MASSIVE, PRESET_HOURLY
    
    presets = {
        'quick': PRESET_QUICK,
        'daily': PRESET_DAILY,
        'thorough': PRESET_THOROUGH,
        'massive': PRESET_MASSIVE,
        'hourly': PRESET_HOURLY,
    }
    
    if preset_name not in presets:
        raise ValueError(f"Unknown preset: {preset_name}. Use: {list(presets.keys())}")
    
    preset = presets[preset_name]
    search_configs = generate_search_matrix(**preset)
    
    logger.info(f"Running preset: {preset_name}")
    logger.info(f"Generated {len(search_configs)} search queries")
    
    collector = BatchCollector(delay_between_queries=4)  # Moderate rate limiting
    stats = collector.run_batch(search_configs)
    
    return stats


if __name__ == "__main__":
    import sys
    
    preset = sys.argv[1] if len(sys.argv) > 1 else "daily"
    
    try:
        stats = run_preset_batch(preset)
        sys.exit(0)
    except Exception as e:
        logger.error(f"Batch collection failed: {e}")
        sys.exit(1)

