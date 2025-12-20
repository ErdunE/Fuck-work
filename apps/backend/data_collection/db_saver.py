"""
Save JobSpy results to database with URL deduplication.

Provides simple, robust job persistence with automatic duplicate detection.
FIXED: Individual commit per job to handle duplicates gracefully.
"""

from typing import List, Dict
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from database.models import Job
from sqlalchemy.exc import IntegrityError


class JobSaver:
    """
    Saves jobs to database with deduplication.
    
    Key Features:
    - URL-based deduplication (skip if URL already exists)
    - Individual commit per job (handles duplicates gracefully)
    - Statistics tracking (saved/duplicates/errors)
    - Graceful error handling
    """
    
    def __init__(self):
        """Initialize JobSaver"""
        pass
    
    def save_jobs(self, jobs: List[Dict]) -> Dict:
        """
        Save jobs to database with individual commits.
        
        Deduplication strategy:
        1. Check if URL already exists
        2. If yes, skip (duplicate)
        3. If no, try to save
        4. If unique constraint violation, skip (duplicate by job_id)
        
        Args:
            jobs: List of job dicts from JobSpyCollector.convert_to_jobdata()
        
        Returns:
            Stats dict with counts
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
                    # Check if URL already exists (primary deduplication)
                    existing = session.query(Job).filter(
                        Job.url == job_data['url']
                    ).first()
                    
                    if existing:
                        stats['duplicates'] += 1
                        continue
                    
                    # Create and save new job
                    job = Job(**job_data)
                    session.add(job)
                    session.commit()  # ✅ Commit immediately
                    stats['saved'] += 1
                    
                except IntegrityError as e:
                    # Duplicate job_id (secondary deduplication)
                    session.rollback()
                    stats['duplicates'] += 1
                    
                except Exception as e:
                    # Other errors
                    session.rollback()
                    print(f"Error saving job {job_data.get('job_id', 'unknown')}: {e}")
                    stats['errors'] += 1
            
            print(f"✓ Save complete: {stats['saved']} new, {stats['duplicates']} duplicates, {stats['errors']} errors")
            
        finally:
            session.close()
        
        return stats
    
    def save_single_job(self, job_data: Dict) -> bool:
        """Save a single job to database."""
        session = SessionLocal()
        
        try:
            # Check for duplicate
            existing = session.query(Job).filter(
                Job.url == job_data['url']
            ).first()
            
            if existing:
                return False
            
            # Save job
            job = Job(**job_data)
            session.add(job)
            session.commit()
            return True
            
        except IntegrityError:
            session.rollback()
            return False
            
        except Exception as e:
            session.rollback()
            print(f"✗ Failed to save job: {e}")
            return False
            
        finally:
            session.close()
    
    def get_stats(self) -> Dict:
        """Get database statistics."""
        session = SessionLocal()
        
        try:
            total = session.query(Job).count()
            
            from sqlalchemy import func
            by_platform = dict(
                session.query(
                    Job.platform,
                    func.count(Job.id)
                ).group_by(Job.platform).all()
            )
            
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
        """Remove duplicate jobs from database (by URL)."""
        session = SessionLocal()
        
        try:
            from sqlalchemy import func
            duplicates = session.query(
                Job.url,
                func.count(Job.id).label('count')
            ).group_by(Job.url).having(
                func.count(Job.id) > 1
            ).all()
            
            removed = 0
            
            for url, count in duplicates:
                jobs = session.query(Job).filter(
                    Job.url == url
                ).order_by(Job.created_at.desc()).all()
                
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
