"""
Verify enrichment coverage and quality.
"""

from database import SessionLocal
from database.models import Job
from sqlalchemy import func, text

def verify_enrichment():
    """Check enrichment coverage"""
    
    print("=" * 70)
    print("Enrichment Verification")
    print("=" * 70)
    
    session = SessionLocal()
    
    try:
        # Total jobs
        total = session.query(Job).count()
        print(f"\nTotal jobs: {total}")
        
        # Check coverage of each derived field
        fields_to_check = [
            'job_level',
            'employment_type',
            'work_mode',
            'visa_signal',
            'experience_years',
            'salary',
            'geo'
        ]
        
        print("\nField Coverage:")
        for field in fields_to_check:
            # Count jobs where derived_signals contains this field
            count = session.query(Job).filter(
                text(f"derived_signals ? '{field}'")
            ).count()
            
            percentage = (count / total * 100) if total > 0 else 0
            print(f"  {field:20s}: {count:4d}/{total} ({percentage:5.1f}%)")
        
        # Sample enriched jobs
        print("\nSample Enriched Jobs:")
        sample = session.query(Job).filter(
            text("derived_signals IS NOT NULL")
        ).limit(3).all()
        
        for i, job in enumerate(sample, 1):
            print(f"\n{i}. {job.company_name} - {job.title[:50]}")
            print(f"   Platform: {job.platform}")
            if job.derived_signals:
                print(f"   Derived signals: {list(job.derived_signals.keys())}")
                if 'job_level' in job.derived_signals:
                    print(f"     - Job level: {job.derived_signals['job_level']}")
                if 'work_mode' in job.derived_signals:
                    print(f"     - Work mode: {job.derived_signals['work_mode']}")
                if 'visa_signal' in job.derived_signals:
                    print(f"     - Visa signal: {job.derived_signals['visa_signal']}")
        
        print("\n" + "=" * 70)
        print("✓ Verification Complete")
        print("=" * 70)
        
    finally:
        session.close()


if __name__ == "__main__":
    verify_enrichment()

