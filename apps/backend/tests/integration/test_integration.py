"""
Integration test using reusable pipeline (Phase 2A Stage 8).
"""

from pipeline.run_pipeline import run_full_pipeline
from database import test_connection
import sys


def test_integration():
    """Test complete pipeline"""
    
    print("=" * 60)
    print("Phase 2A Integration Test")
    print("=" * 60)
    
    # Check database connection
    print("\nChecking database connection...")
    if not test_connection():
        print("\n✗ Database not available. Skipping test.")
        print("  Please start PostgreSQL: docker-compose up -d")
        return False
    
    # Run pipeline
    print("\nRunning pipeline...")
    try:
        stats = run_full_pipeline(
            search_term="Software Engineer New Grad",
            location="United States",
            hours_old=24,
            results_wanted=20,
            sites=["linkedin", "indeed"]
        )
        
        # Validate results
        print("\n" + "=" * 60)
        print("✓ Integration Test PASSED")
        print("=" * 60)
        print(f"\nPipeline Statistics:")
        print(f"  - Collected: {stats['collected']}")
        print(f"  - Saved: {stats['saved']}")
        print(f"  - Duplicates: {stats['duplicates']}")
        print(f"  - Scored: {stats['scored']}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_integration()
    sys.exit(0 if success else 1)
