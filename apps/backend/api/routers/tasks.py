"""
Apply Tasks Visibility API endpoints for Phase 5.0 Web Control Plane.
Read-only visibility into what the system is doing.
NO editing, NO retry buttons yet - visibility only.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from database import get_db
from database.models import User, ApplyTask
from api.auth import get_current_user

router = APIRouter(prefix="/api/users/me", tags=["apply-tasks"])


# Request/Response Models

class ApplyTaskSummary(BaseModel):
    """Summary view of apply task."""
    id: int
    job_id: str
    status: str
    priority: int
    
    # Extracted from task_metadata JSONB (may be None)
    company: Optional[str] = None
    source: Optional[str] = None
    current_stage: Optional[str] = None
    last_action: Optional[str] = None
    blocked_reason: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApplyTaskDetail(BaseModel):
    """Detailed view of apply task with full metadata."""
    id: int
    job_id: str
    status: str
    priority: int
    attempt_count: int
    last_error: Optional[str] = None
    task_metadata: Optional[dict] = None  # Full JSONB
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApplyTasksListResponse(BaseModel):
    """Paginated list of apply tasks."""
    tasks: List[ApplyTaskSummary]
    total: int
    limit: int
    offset: int


# Helper Functions

def extract_task_summary(task: ApplyTask) -> ApplyTaskSummary:
    """Extract summary fields from task metadata."""
    metadata = task.task_metadata or {}
    
    # Try to extract common fields from JSONB
    company = None
    source = None
    current_stage = None
    last_action = None
    blocked_reason = None
    
    if isinstance(metadata, dict):
        company = metadata.get('company')
        source = metadata.get('source') or metadata.get('platform')
        
        # Try to get current stage from various keys
        current_stage = (
            metadata.get('current_stage') or
            metadata.get('apply_stage') or
            metadata.get('stage')
        )
        
        # Try to get last action
        last_detection = metadata.get('last_detection', {})
        if isinstance(last_detection, dict):
            current_stage = current_stage or last_detection.get('stage')
        
        # Try to get session info
        session = metadata.get('session', {})
        if isinstance(session, dict):
            last_action = f"Recheck count: {session.get('recheck_count', 0)}"
        
        # Check for blocked/needs_user reason
        if task.status == 'needs_user':
            last_action = metadata.get('user_action_intent') or "Needs user action"
        elif task.last_error:
            blocked_reason = task.last_error
    
    return ApplyTaskSummary(
        id=task.id,
        job_id=task.job_id,
        status=task.status,
        priority=task.priority,
        company=company,
        source=source,
        current_stage=current_stage,
        last_action=last_action,
        blocked_reason=blocked_reason,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


# Endpoints

@router.get("/apply-tasks", response_model=ApplyTasksListResponse)
def get_apply_tasks(
    status: Optional[str] = Query(None, description="Filter by status: queued, in_progress, needs_user, success, failed, canceled"),
    limit: int = Query(50, ge=1, le=200, description="Maximum tasks to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's apply tasks (read-only visibility).
    
    Shows what the system is doing and why.
    NO editing or retry functionality in Phase 5.0.
    """
    # Base query
    query = db.query(ApplyTask).filter(
        ApplyTask.user_id == current_user.id
    )
    
    # Apply status filter
    if status:
        query = query.filter(ApplyTask.status == status)
    
    # Get total count
    total = query.count()
    
    # Get paginated results (most recent first)
    tasks = query.order_by(desc(ApplyTask.updated_at)).offset(offset).limit(limit).all()
    
    # Extract summaries
    summaries = [extract_task_summary(task) for task in tasks]
    
    return ApplyTasksListResponse(
        tasks=summaries,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/apply-tasks/{task_id}", response_model=ApplyTaskDetail)
def get_apply_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific apply task.
    
    Shows full metadata including detection results, session info, etc.
    """
    task = db.query(ApplyTask).filter(
        ApplyTask.id == task_id,
        ApplyTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return ApplyTaskDetail.from_orm(task)

