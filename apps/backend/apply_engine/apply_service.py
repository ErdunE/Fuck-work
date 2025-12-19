"""
Core apply task management service.
Handles task creation, priority assignment, and status transitions.
"""

from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc, func
from database.models import ApplyTask, ApplyEvent, Job, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PriorityStrategy:
    """Priority calculation strategies"""
    DECISION_THEN_NEWEST = "decision_then_newest"
    NEWEST = "newest"
    HIGHEST_SCORE = "highest_score"


# Valid status transitions
VALID_TRANSITIONS = {
    "queued": ["in_progress", "canceled"],
    "in_progress": ["needs_user", "failed", "canceled"],
    "needs_user": ["success", "failed", "in_progress"],
    "success": [],  # Terminal state
    "failed": ["queued"],  # Allow retry
    "canceled": []  # Terminal state
}


def calculate_priority(job: Job, strategy: str) -> int:
    """
    Calculate task priority based on strategy.
    Higher number = higher priority (processed first).
    
    Args:
        job: Job object
        strategy: Priority strategy name
        
    Returns:
        Priority value (0-1000)
    """
    if strategy == PriorityStrategy.DECISION_THEN_NEWEST:
        # Priority based on decision + recency
        decision_map = {
            "recommend": 1000,
            "caution": 500,
            "avoid": 100
        }
        
        # Get decision from derived_signals
        decision = "caution"  # default
        if job.derived_signals and isinstance(job.derived_signals, dict):
            decision_summary = job.derived_signals.get("decision_summary", {})
            decision = decision_summary.get("decision", "caution")
        
        base_priority = decision_map.get(decision, 500)
        
        # Add recency bonus (0-99 based on days ago)
        if job.posted_date:
            days_ago = (datetime.utcnow() - job.posted_date).days
            recency_bonus = max(0, 99 - min(days_ago, 99))
            return base_priority + recency_bonus
        
        return base_priority
    
    elif strategy == PriorityStrategy.NEWEST:
        # Priority based solely on recency
        if job.posted_date:
            days_ago = (datetime.utcnow() - job.posted_date).days
            return 1000 - min(days_ago, 999)
        return 500
    
    elif strategy == PriorityStrategy.HIGHEST_SCORE:
        # Priority based on authenticity score
        if job.authenticity_score:
            return int(job.authenticity_score * 10)
        return 0
    
    return 0


def create_tasks_from_job_ids(
    db: Session,
    user_id: int,
    job_ids: List[str],
    priority_strategy: str = PriorityStrategy.DECISION_THEN_NEWEST,
    allow_duplicates: bool = False
) -> List[ApplyTask]:
    """
    Create apply tasks from job IDs.
    
    Args:
        db: Database session
        user_id: User ID
        job_ids: List of job IDs to queue
        priority_strategy: How to calculate priority
        allow_duplicates: Allow queuing jobs already in queue
        
    Returns:
        List of created ApplyTask objects
        
    Raises:
        ValueError: If user doesn't exist or jobs not found
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    # Fetch jobs
    jobs = db.query(Job).filter(Job.job_id.in_(job_ids)).all()
    if not jobs:
        raise ValueError("No jobs found for provided job_ids")
    
    jobs_by_id = {job.job_id: job for job in jobs}
    
    # Check for existing tasks
    if not allow_duplicates:
        existing = db.query(ApplyTask).filter(
            and_(
                ApplyTask.user_id == user_id,
                ApplyTask.job_id.in_(job_ids),
                ApplyTask.status.in_(["queued", "in_progress", "needs_user"])
            )
        ).all()
        existing_job_ids = {task.job_id for task in existing}
        job_ids = [jid for jid in job_ids if jid not in existing_job_ids]
        
        if not job_ids:
            logger.info(f"All jobs already queued for user {user_id}")
            return []
    
    # Create tasks
    tasks = []
    for job_id in job_ids:
        job = jobs_by_id.get(job_id)
        if not job:
            logger.warning(f"Job {job_id} not found in database, skipping")
            continue
        
        priority = calculate_priority(job, priority_strategy)
        
        task = ApplyTask(
            user_id=user_id,
            job_id=job_id,
            status="queued",
            priority=priority,
            attempt_count=0,
            task_metadata={"priority_strategy": priority_strategy}
        )
        db.add(task)
        tasks.append(task)
        
        # Create initial event
        event = ApplyEvent(
            task=task,
            from_status="none",
            to_status="queued",
            reason="Task created",
            details={"priority": priority, "strategy": priority_strategy}
        )
        db.add(event)
    
    db.commit()
    
    for task in tasks:
        db.refresh(task)
    
    logger.info(f"Created {len(tasks)} apply tasks for user {user_id}")
    return tasks


def list_tasks(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[ApplyTask], int]:
    """
    List apply tasks for user.
    
    Args:
        db: Database session
        user_id: User ID
        status: Optional status filter
        limit: Max results
        offset: Pagination offset
        
    Returns:
        Tuple of (tasks, total_count)
    """
    query = db.query(ApplyTask).filter(ApplyTask.user_id == user_id)
    
    if status:
        query = query.filter(ApplyTask.status == status)
    
    total = query.count()
    
    # Order by priority desc, then created_at asc (FIFO within priority)
    tasks = query.order_by(
        desc(ApplyTask.priority),
        asc(ApplyTask.created_at)
    ).limit(limit).offset(offset).all()
    
    return tasks, total


def get_task(db: Session, task_id: int) -> Optional[ApplyTask]:
    """
    Get single apply task by ID.
    
    Args:
        db: Database session
        task_id: Task ID
        
    Returns:
        ApplyTask or None
    """
    return db.query(ApplyTask).filter(ApplyTask.id == task_id).first()


def transition_task(
    db: Session,
    task_id: int,
    to_status: str,
    reason: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Tuple[ApplyTask, ApplyEvent]:
    """
    Transition task to new status.
    
    Args:
        db: Database session
        task_id: Task ID
        to_status: Target status
        reason: Optional reason
        details: Optional metadata
        
    Returns:
        Tuple of (updated_task, created_event)
        
    Raises:
        ValueError: If task not found or transition invalid
    """
    task = get_task(db, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    
    from_status = task.status
    
    # Validate transition
    if to_status not in VALID_TRANSITIONS.get(from_status, []):
        raise ValueError(
            f"Invalid transition: {from_status} -> {to_status}. "
            f"Valid transitions from {from_status}: {VALID_TRANSITIONS.get(from_status, [])}"
        )
    
    # Special validations
    if to_status == "failed" and not reason:
        raise ValueError("reason is required when transitioning to failed")
    
    # Update task
    task.status = to_status
    task.updated_at = datetime.utcnow()
    
    # Increment attempt count when moving to in_progress
    if to_status == "in_progress":
        task.attempt_count += 1
    
    # Store error if failed
    if to_status == "failed":
        task.last_error = reason
    
    # Create event
    event = ApplyEvent(
        task_id=task_id,
        from_status=from_status,
        to_status=to_status,
        reason=reason,
        details=details or {}
    )
    db.add(event)
    
    db.commit()
    db.refresh(task)
    db.refresh(event)
    
    logger.info(f"Task {task_id}: {from_status} -> {to_status}")
    
    return task, event

