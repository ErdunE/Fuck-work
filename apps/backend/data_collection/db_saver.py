"""
Save JobSpy results to database with URL deduplication.

Provides simple, robust job persistence with automatic duplicate detection.
"""

from typing import List, Dict
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from database.models import Job


class JobSaver:
    """
    Saves jobs to database with deduplication.
    
    Key Features:
    - URL-based deduplication (skip if URL already exists)
    - Transaction safety (rollback on errors)
    - Statistics tracking (saved/duplicates/errors)
    - Graceful error handling
    """
    
    def __init__(self):
        """Initialize JobSaver"""
        pass
    
    def save_jobs(self, jobs: List[Dict]) -> Dict:
        """
        Save jobs to database.
        
        Deduplication strategy: Skip if URL already exists.
        This is simple and effective for preventing duplicate job postings.
        
        Args:
            jobs: List of job dicts from JobSpyCollector.convert_to_jobdata()
        
        Returns:
            Stats dict with counts:
            {
                'saved': int,        # Number of new jobs saved
                'duplicates': int,   # Number of duplicate URLs skipped
                'errors': int        # Number of jobs that failed to save
            }
        
        Example:
            >>> from data_collection.jobspy_collector import JobSpyCollector
            >>> from data_collection.db_saver import JobSaver
            >>> 
            >>> collector = JobSpyCollector()
            >>> df = collector.collect(results_wanted=10)
            >>> jobs = collector.convert_to_jobdata(df)
            >>> 
            >>> saver = JobSaver()
            >>> stats = saver.save_jobs(jobs)
            >>> print(f"Saved: {stats['saved']}, Duplicates: {stats['duplicates']}")
        """
        session = SessionLocal()
        
        stats = {
            'saved': 0,
            'duplicates': 0,
            'errors': 0,
        }
        
        try:
            for job_data in jobs:
                try:
                    # Check if URL already exists (deduplication)
                    existing = session.query(Job).filter(
                        Job.url == job_data['url']
                    ).first()
                    
                    if existing:
                        stats['duplicates'] += 1
                        continue
                    
                    # Create new job
                    job = Job(**job_data)
                    session.add(job)
                    stats['saved'] += 1
                    
                except Exception as e:
                    print(f"Error saving job {job_data.get('job_id', 'unknown')}: {e}")
                    stats['errors'] += 1
                    # Continue processing other jobs
            
            # Commit all jobs at once (more efficient)
            session.commit()
            
            print(f"✓ Save complete: {stats['saved']} new, {stats['duplicates']} duplicates, {stats['errors']} errors")
            
        except Exception as e:
            # Rollback on transaction error
            session.rollback()
            print(f"✗ Transaction failed, rolling back: {e}")
            raise
            
        finally:
            session.close()
        
        return stats
    
    def save_single_job(self, job_data: Dict) -> bool:
        """
        Save a single job to database.
        
        Args:
            job_data: Single job dict from JobSpyCollector
        
        Returns:
            bool: True if saved, False if duplicate or error
        
        Example:
            >>> saver = JobSaver()
            >>> job = {
            ...     'job_id': 'linkedin_123456',
            ...     'title': 'Software Engineer',
            ...     'company_name': 'Google',
            ...     'url': 'https://linkedin.com/jobs/123456',
            ...     # ... other fields
            ... }
            >>> success = saver.save_single_job(job)
        """
        session = SessionLocal()
        
        try:
            # Check for duplicate
            existing = session.query(Job).filter(
                Job.url == job_data['url']
            ).first()
            
            if existing:
                print(f"Duplicate URL: {job_data['url']}")
                return False
            
            # Save job
            job = Job(**job_data)
            session.add(job)
            session.commit()
            
            print(f"✓ Saved job: {job_data.get('job_id')}")
            return True
            
        except Exception as e:
            session.rollback()
            print(f"✗ Failed to save job: {e}")
            return False
            
        finally:
            session.close()
    
    def get_stats(self) -> Dict:
        """
        Get database statistics.
        
        Returns:
            Dict with job counts by platform and overall stats
        
        Example:
            >>> saver = JobSaver()
            >>> stats = saver.get_stats()
            >>> print(f"Total jobs: {stats['total']}")
            >>> print(f"By platform: {stats['by_platform']}")
        """
        session = SessionLocal()
        
        try:
            # Total jobs
            total = session.query(Job).count()
            
            # Jobs by platform
            from sqlalchemy import func
            by_platform = dict(
                session.query(
                    Job.platform,
                    func.count(Job.id)
                ).group_by(Job.platform).all()
            )
            
            # Jobs scored vs unscored
            scored = session.query(Job).filter(
                Job.authenticity_score.isnot(None)
            ).count()
            unscored = total - scored
            
            return {
                'total': total,
                'scored': scored,
                'unscored': unscored,
                'by_platform': by_platform,
            }
            
        finally:
            session.close()
    
    def deduplicate_existing(self) -> Dict:
        """
        Remove duplicate jobs from database (by URL).
        
        Keeps the most recent entry for each URL.
        
        Returns:
            Dict with number of duplicates removed
        
        Example:
            >>> saver = JobSaver()
            >>> result = saver.deduplicate_existing()
            >>> print(f"Removed {result['removed']} duplicates")
        """
        session = SessionLocal()
        
        try:
            # Find duplicate URLs
            from sqlalchemy import func
            duplicates = session.query(
                Job.url,
                func.count(Job.id).label('count')
            ).group_by(Job.url).having(
                func.count(Job.id) > 1
            ).all()
            
            removed = 0
            
            for url, count in duplicates:
                # Get all jobs with this URL, ordered by created_at
                jobs = session.query(Job).filter(
                    Job.url == url
                ).order_by(Job.created_at.desc()).all()
                
                # Keep the most recent, delete the rest
                for job in jobs[1:]:
                    session.delete(job)
                    removed += 1
            
            session.commit()
            
            print(f"✓ Removed {removed} duplicate jobs")
            
            return {
                'removed': removed,
                'duplicate_urls': len(duplicates),
            }
            
        except Exception as e:
            session.rollback()
            print(f"✗ Deduplication failed: {e}")
            raise
            
        finally:
            session.close()

