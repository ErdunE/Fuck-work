"""
End-to-end integration test for Phase 2A.

Tests complete pipeline: JobSpy → Convert → Save → Verify

Prerequisites:
1. Docker must be running
2. PostgreSQL must be started: cd apps/backend && docker-compose up -d
3. Database must be initialized: python3 init_database.py
"""

import sys
from data_collection.jobspy_collector import JobSpyCollector
from data_collection.db_saver import JobSaver
from database import test_connection, SessionLocal
from database.models import Job


def verify_collection_metadata(jobs_data: list) -> bool:
    """
    Verify collection_metadata has exactly 4 fields.
    
    Args:
        jobs_data: List of job dicts
    
    Returns:
        bool: True if all jobs have valid metadata
    """
    print("\n=== Verifying Collection Metadata ===")
    
    required_fields = {'platform', 'collection_method', 'poster_expected', 'poster_present'}
    all_valid = True
    
    for i, job in enumerate(jobs_data[:5]):  # Check first 5 jobs
        metadata = job.get('collection_metadata', {})
        
        # Check field count
        if len(metadata) != 4:
            print(f"✗ Job {i}: Expected 4 fields, got {len(metadata)}")
            all_valid = False
            continue
        
        # Check field names
        missing = required_fields - set(metadata.keys())
        extra = set(metadata.keys()) - required_fields
        
        if missing or extra:
            print(f"✗ Job {i}: Missing {missing}, Extra {extra}")
            all_valid = False
            continue
        
        print(f"✓ Job {i}: {metadata['platform']}, method={metadata['collection_method']}, "
              f"poster_expected={metadata['poster_expected']}, poster_present={metadata['poster_present']}")
    
    if all_valid:
        print("\n✓ All jobs have valid 4-field collection_metadata")
    else:
        print("\n✗ Some jobs have invalid collection_metadata")
    
    return all_valid


def verify_database_contents() -> dict:
    """
    Verify saved jobs in database.
    
    Returns:
        dict: Statistics about saved jobs
    """
    print("\n=== Verifying Database Contents ===")
    
    session = SessionLocal()
    
    try:
        # Get total count
        total = session.query(Job).count()
        print(f"Total jobs in database: {total}")
        
        # Get jobs by platform
        from sqlalchemy import func
        by_platform = dict(
            session.query(
                Job.platform,
                func.count(Job.id)
            ).group_by(Job.platform).all()
        )
        
        print("\nJobs by platform:")
        for platform, count in by_platform.items():
            print(f"  {platform}: {count}")
        
        # Sample some jobs
        print("\nSample jobs:")
        sample_jobs = session.query(Job).limit(3).all()
        for job in sample_jobs:
            print(f"  - {job.company_name}: {job.title[:50]}...")
            print(f"    Platform: {job.platform}, URL: {job.url[:50]}...")
            print(f"    Metadata: {job.collection_metadata}")
        
        return {
            'total': total,
            'by_platform': by_platform,
        }
        
    finally:
        session.close()


def test_deduplication() -> bool:
    """
    Test URL deduplication by trying to save same jobs twice.
    
    Returns:
        bool: True if deduplication works
    """
    print("\n=== Testing Deduplication ===")
    
    # Scrape a small set
    collector = JobSpyCollector()
    df = collector.collect(
        search_term="Software Engineer",
        location="United States",
        results_wanted=5,
        sites=["indeed"]
    )
    
    jobs = collector.convert_to_jobdata(df)
    
    # Save first time
    saver = JobSaver()
    stats1 = saver.save_jobs(jobs)
    print(f"First save: {stats1['saved']} saved, {stats1['duplicates']} duplicates")
    
    # Try to save again (should all be duplicates)
    stats2 = saver.save_jobs(jobs)
    print(f"Second save: {stats2['saved']} saved, {stats2['duplicates']} duplicates")
    
    # Verify
    if stats2['duplicates'] == len(jobs) and stats2['saved'] == 0:
        print("✓ Deduplication works correctly")
        return True
    else:
        print("✗ Deduplication failed")
        return False


def main():
    """Run full integration test"""
    
    print("=" * 60)
    print("Phase 2A Integration Test")
    print("=" * 60)
    
    # Step 1: Check database connection
    print("\nStep 1: Checking database connection...")
    if not test_connection():
        print("\n" + "=" * 60)
        print("ERROR: Cannot connect to database")
        print("=" * 60)
        print("\nPlease ensure:")
        print("1. Docker is running")
        print("2. PostgreSQL is started: cd apps/backend && docker-compose up -d")
        print("3. Database is initialized: python3 init_database.py")
        print("\nSkipping integration test (database required)")
        return False
    
    # Step 2: Collect with JobSpy
    print("\nStep 2: Collecting jobs with JobSpy...")
    collector = JobSpyCollector()
    
    try:
        df = collector.collect(
            search_term="Software Engineer New Grad",
            location="United States",
            hours_old=24,
            results_wanted=20,
            sites=["linkedin", "indeed"]
        )
        print(f"✓ Collected {len(df)} jobs")
    except Exception as e:
        print(f"✗ JobSpy collection failed: {e}")
        return False
    
    # Step 3: Convert to JobData
    print("\nStep 3: Converting to JobData format...")
    try:
        jobs = collector.convert_to_jobdata(df)
        print(f"✓ Converted {len(jobs)} jobs")
    except Exception as e:
        print(f"✗ Conversion failed: {e}")
        return False
    
    # Step 4: Verify metadata structure
    if not verify_collection_metadata(jobs):
        return False
    
    # Step 5: Save to database
    print("\nStep 5: Saving to database...")
    try:
        saver = JobSaver()
        stats = saver.save_jobs(jobs)
        print(f"✓ Saved: {stats['saved']}, Duplicates: {stats['duplicates']}, Errors: {stats['errors']}")
    except Exception as e:
        print(f"✗ Save failed: {e}")
        return False
    
    # Step 6: Verify database contents
    db_stats = verify_database_contents()
    
    # Step 7: Test deduplication
    if not test_deduplication():
        return False
    
    # Success
    print("\n" + "=" * 60)
    print("✓ Integration Test PASSED")
    print("=" * 60)
    print(f"\nSummary:")
    print(f"  - Scraped {len(df)} jobs from JobSpy")
    print(f"  - Converted {len(jobs)} jobs to JobData format")
    print(f"  - Saved {stats['saved']} new jobs to database")
    print(f"  - Total jobs in database: {db_stats['total']}")
    print(f"  - Platforms: {', '.join(db_stats['by_platform'].keys())}")
    print(f"  - Deduplication: ✓ Working")
    print(f"  - Metadata structure: ✓ Valid (4 fields)")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

