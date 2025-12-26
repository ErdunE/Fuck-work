"""
Make pipeline executable as a module: python3 -m pipeline.run_pipeline
"""

import logging
import sys

from .run_pipeline import run_full_pipeline

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    try:
        stats = run_full_pipeline()
        print("\n✓ Pipeline completed successfully")
        print(f"  - Jobs collected: {stats['collected']}")
        print(f"  - Jobs saved: {stats['saved']}")
        print(f"  - Jobs scored: {stats['scored']}")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Pipeline failed: {e}")
        sys.exit(1)
