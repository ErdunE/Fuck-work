"""
Dataset analysis and distribution statistics.

Phase 2.6 - Coverage analysis.
"""

from database import SessionLocal
from database.models import Job
from sqlalchemy import func, text
from typing import Dict
import json


def analyze_dataset() -> Dict:
    """
    Analyze full dataset distribution.
    
    Returns:
        Dict with comprehensive statistics
    """
    session = SessionLocal()
    
    try:
        stats = {
            'total_jobs': 0,
            'platforms': {},
            'job_levels': {},
            'work_modes': {},
            'employment_types': {},
            'visa_signals': {},
            'salary_availability': {},
            'geo_distribution': {},
        }
        
        # Total jobs
        stats['total_jobs'] = session.query(Job).count()
        
        # Platform distribution
        platform_counts = session.query(
            Job.platform, func.count(Job.id)
        ).group_by(Job.platform).all()
        
        for platform, count in platform_counts:
            stats['platforms'][platform] = count
        
        # Job level distribution (from derived_signals)
        jobs_with_signals = session.query(Job).filter(
            text("derived_signals IS NOT NULL")
        ).all()
        
        for job in jobs_with_signals:
            if job.derived_signals:
                # Job level
                level = job.derived_signals.get('job_level')
                if level:
                    stats['job_levels'][level] = stats['job_levels'].get(level, 0) + 1
                
                # Work mode
                work_mode = job.derived_signals.get('work_mode')
                if work_mode:
                    stats['work_modes'][work_mode] = stats['work_modes'].get(work_mode, 0) + 1
                
                # Employment type
                emp_type = job.derived_signals.get('employment_type')
                if emp_type:
                    stats['employment_types'][emp_type] = stats['employment_types'].get(emp_type, 0) + 1
                
                # Visa signal
                visa = job.derived_signals.get('visa_signal')
                if visa:
                    stats['visa_signals'][visa] = stats['visa_signals'].get(visa, 0) + 1
                
                # Salary availability
                salary = job.derived_signals.get('salary', {})
                has_min = salary.get('min') is not None
                has_max = salary.get('max') is not None
                
                if has_min or has_max:
                    stats['salary_availability']['with_salary'] = stats['salary_availability'].get('with_salary', 0) + 1
                else:
                    stats['salary_availability']['no_salary'] = stats['salary_availability'].get('no_salary', 0) + 1
                
                # Geo distribution (states)
                geo = job.derived_signals.get('geo', {})
                state = geo.get('state')
                if state:
                    stats['geo_distribution'][state] = stats['geo_distribution'].get(state, 0) + 1
        
        return stats
        
    finally:
        session.close()


def print_distribution(stats: Dict):
    """Print formatted distribution statistics"""
    
    print("=" * 80)
    print("Dataset Distribution Analysis")
    print("=" * 80)
    
    print(f"\nTotal Jobs: {stats['total_jobs']:,}")
    
    # Platform distribution
    print("\n" + "-" * 80)
    print("Platform Distribution:")
    print("-" * 80)
    for platform, count in sorted(stats['platforms'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / stats['total_jobs'] * 100) if stats['total_jobs'] > 0 else 0
        print(f"  {platform:20s}: {count:5,} ({percentage:5.1f}%)")
    
    # Job level distribution
    print("\n" + "-" * 80)
    print("Job Level Distribution:")
    print("-" * 80)
    for level, count in sorted(stats['job_levels'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / stats['total_jobs'] * 100) if stats['total_jobs'] > 0 else 0
        print(f"  {level:20s}: {count:5,} ({percentage:5.1f}%)")
    
    # Work mode distribution
    print("\n" + "-" * 80)
    print("Work Mode Distribution:")
    print("-" * 80)
    for mode, count in sorted(stats['work_modes'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / stats['total_jobs'] * 100) if stats['total_jobs'] > 0 else 0
        print(f"  {mode:20s}: {count:5,} ({percentage:5.1f}%)")
    
    # Visa signal breakdown
    print("\n" + "-" * 80)
    print("Visa Signal Breakdown:")
    print("-" * 80)
    for signal, count in sorted(stats['visa_signals'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / stats['total_jobs'] * 100) if stats['total_jobs'] > 0 else 0
        print(f"  {signal:20s}: {count:5,} ({percentage:5.1f}%)")
    
    # Salary availability
    print("\n" + "-" * 80)
    print("Salary Availability:")
    print("-" * 80)
    total_checked = sum(stats['salary_availability'].values())
    for status, count in stats['salary_availability'].items():
        percentage = (count / total_checked * 100) if total_checked > 0 else 0
        print(f"  {status:20s}: {count:5,} ({percentage:5.1f}%)")
    
    # Top states
    print("\n" + "-" * 80)
    print("Top 10 States:")
    print("-" * 80)
    top_states = sorted(stats['geo_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]
    for state, count in top_states:
        print(f"  {state:20s}: {count:5,}")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    stats = analyze_dataset()
    print_distribution(stats)
    
    # Optionally save to JSON
    with open('dataset_stats.json', 'w') as f:
        json.dump(stats, f, indent=2)
    print("\n✓ Stats saved to dataset_stats.json")

