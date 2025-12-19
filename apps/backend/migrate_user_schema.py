"""
Add user profile and knowledge foundation schema.
Phase 3.3 migration.
"""

from database import engine
from database.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_user_schema():
    """Create all user-related tables"""
    
    logger.info("Creating user profile and knowledge foundation tables...")
    
    try:
        # This will create only new tables that don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("✓ User schema migration complete")
        return True
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = migrate_user_schema()
    exit(0 if success else 1)

