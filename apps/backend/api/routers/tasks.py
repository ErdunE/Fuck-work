"""
Apply Tasks API endpoints for Phase 5.0/5.2 Web Control Plane.
- Phase 5.0: Read-only visibility
- Phase 5.2: Add task creation capability
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from database import get_db
from database.models import User, ApplyTask, Job, ApplyRun
from api.auth import get_current_user
from api.observability_logger import log_event

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


# Phase 5.2: Task creation models
class CreateTaskRequest(BaseModel):
    """Request to create a new apply task."""
    job_id: str


class CreateTaskResponse(BaseModel):
    """Response for task creation."""
    id: int
    job_id: str
    status: str
    created_at: datetime
    message: str


class ExecuteTaskResponse(BaseModel):
    """Response for task execution."""
    run_id: int
    job_url: str
    ats_type: Optional[str] = None
    message: str


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


@router.post("/apply-tasks", response_model=CreateTaskResponse, status_code=status.HTTP_201_CREATED)
def create_apply_task(
    request: CreateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new apply task (Phase 5.2).
    
    Allows users to start an application from Web Control Plane.
    Idempotent - returns existing task if already exists for this job.
    """
    # Verify job exists
    job = db.query(Job).filter(Job.job_id == request.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{request.job_id}' not found"
        )
    
    # Check if task already exists for this user + job
    existing_task = db.query(ApplyTask).filter(
        ApplyTask.user_id == current_user.id,
        ApplyTask.job_id == request.job_id
    ).first()
    
    if existing_task:
        # Return existing task (idempotent)
        return CreateTaskResponse(
            id=existing_task.id,
            job_id=existing_task.job_id,
            status=existing_task.status,
            created_at=existing_task.created_at,
            message=f"Task already exists with status '{existing_task.status}'"
        )
    
    # Create new task
    task = ApplyTask(
        user_id=current_user.id,
        job_id=request.job_id,
        status='queued',
        priority=0,
        task_metadata={
            'company': job.company_name,
            'title': job.title,
            'platform': job.platform,
            'url': job.url,
            'created_from': 'web_control_plane'
        }
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return CreateTaskResponse(
        id=task.id,
        job_id=task.job_id,
        status=task.status,
        created_at=task.created_at,
        message="Task created successfully"
    )


@router.post("/apply-tasks/{task_id}/execute", response_model=ExecuteTaskResponse)
def execute_apply_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Execute a queued apply task.
    
    Transitions task from queued -> running and creates an observability run.
    Returns job_url for browser navigation.
    """
    # Fetch task
    task = db.query(ApplyTask).filter(
        ApplyTask.id == task_id,
        ApplyTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Validate status
    if task.status != 'queued':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task cannot be executed. Current status: {task.status}"
        )
    
    # Get job details
    job = db.query(Job).filter(Job.job_id == task.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job not found"
        )
    
    # Update task status
    task.status = 'running'
    task.updated_at = datetime.utcnow()
    
    # Create apply_run
    run = ApplyRun(
        user_id=current_user.id,
        task_id=task.id,
        job_id=task.job_id,
        initial_url=job.url,
        current_url=job.url,
        ats_kind=job.platform if job.platform else 'unknown',
        intent='unknown',
        stage='queued',
        status='in_progress'
    )
    
    db.add(run)
    db.commit()
    db.refresh(run)
    
    # Log observability event
    log_event(
        db=db,
        user_id=current_user.id,
        run_id=run.id,
        event_name='run_started',
        source='web_control_plane',
        severity='info',
        payload={
            'task_id': task.id,
            'job_id': task.job_id,
            'job_url': job.url,
            'ats_type': job.platform,
            'triggered_by': 'user_action'
        },
        url=job.url
    )
    
    return ExecuteTaskResponse(
        run_id=run.id,
        job_url=job.url,
        ats_type=job.platform,
        message="Task execution started"
    )

