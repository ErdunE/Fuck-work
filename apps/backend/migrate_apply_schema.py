"""
Add apply task queue and status tracking schema.
Phase 3.5 migration.
"""

from database import engine
from database.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_apply_schema():
    """Create apply_tasks and apply_events tables"""
    
    logger.info("Creating apply task queue and event tracking tables...")
    
    try:
        # This will create only new tables that don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Apply schema migration complete")
        logger.info("  - apply_tasks table created")
        logger.info("  - apply_events table created")
        return True
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = migrate_apply_schema()
    exit(0 if success else 1)

