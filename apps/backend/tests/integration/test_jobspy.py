"""
Test script for JobSpy integration.

Verifies that JobSpy can successfully scrape jobs from multiple platforms.
"""

from jobspy import scrape_jobs

def test_jobspy():
    """Test JobSpy scraping functionality"""
    
    print("=== JobSpy Test ===\n")
    print("Scraping 10 jobs from LinkedIn and Indeed...")
    
    try:
        # Scrape jobs
        jobs = scrape_jobs(
            site_name=["linkedin", "indeed"],
            search_term="Software Engineer New Grad",
            location="United States",
            results_wanted=10,
            hours_old=24,
            linkedin_fetch_description=True
        )
        
        print(f"\n✓ Successfully scraped {len(jobs)} jobs\n")
        
        # Display first few results
        print("Sample jobs:")
        print(jobs[['site', 'title', 'company', 'location']].head())
        
        # Save to CSV
        output_file = "test_jobs.csv"
        jobs.to_csv(output_file, index=False)
        print(f"\n✓ Saved results to {output_file}")
        
        # Verify required columns exist
        required_cols = ['title', 'company', 'description', 'job_url']
        missing_cols = [col for col in required_cols if col not in jobs.columns]
        
        if missing_cols:
            print(f"\n⚠ Warning: Missing columns: {missing_cols}")
        else:
            print("\n✓ All required columns present")
        
        print("\n=== Test Complete ===")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False


if __name__ == "__main__":
    test_jobspy()

