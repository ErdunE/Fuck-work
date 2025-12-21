"""
Add database indexes for query optimization.
"""

from src.fuckwork.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_indexes():
    """Add indexes for Phase 3.1 query layer"""
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_job_level ON jobs ((derived_signals->>'job_level'))",
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_employment_type ON jobs ((derived_signals->>'employment_type'))",
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_work_mode ON jobs ((derived_signals->>'work_mode'))",
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_visa_signal ON jobs ((derived_signals->>'visa_signal'))",
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_geo_state ON jobs ((derived_signals->'geo'->>'state'))",
        "CREATE INDEX IF NOT EXISTS idx_jobs_score_posted ON jobs (authenticity_score DESC, posted_date DESC)",
        "CREATE INDEX IF NOT EXISTS idx_derived_signals_gin ON jobs USING GIN (derived_signals)",
    ]
    
    with engine.connect() as conn:
        for idx_sql in indexes:
            try:
                logger.info(f"Creating index: {idx_sql[:80]}...")
                conn.execute(text(idx_sql))
                conn.commit()
                logger.info("✓ Index created")
            except Exception as e:
                logger.warning(f"Index creation warning: {e}")
    
    logger.info("All indexes processed")

if __name__ == "__main__":
    add_indexes()

