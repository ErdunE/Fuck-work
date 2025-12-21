"""
Active Session API Router - Phase 5.3.1

Enables deterministic session handoff from Web Control Plane to Extension.
One active session per user with TTL. Extension fetches this to bind to the correct run.

Endpoints:
- POST /api/users/me/active-session - Set active session (upsert)
- GET /api/users/me/active-session - Get active session
- DELETE /api/users/me/active-session - Clear active session
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.fuckwork.database import get_db
from src.fuckwork.database import User, ActiveApplySession, ApplyTask, ApplyRun
from src.fuckwork.api.auth import get_current_user
from src.fuckwork.api.observability_logger import log_event

router = APIRouter(prefix="/api/users/me", tags=["active-session"])

SESSION_TTL_HOURS = 2  # Configurable


# ============================================================
# Request/Response Models
# ============================================================

class SetActiveSessionRequest(BaseModel):
    """Request to set active apply session"""
    task_id: int
    run_id: int
    job_url: str
    ats_type: Optional[str] = None


class ActiveSessionResponse(BaseModel):
    """Response for active session (get/set)"""
    active: bool
    task_id: Optional[int] = None
    run_id: Optional[int] = None
    job_url: Optional[str] = None
    ats_type: Optional[str] = None
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


# ============================================================
# Endpoints
# ============================================================

@router.post("/active-session", response_model=ActiveSessionResponse)
def set_active_session(
    request: SetActiveSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Set active apply session for current user (Phase 5.3.1).
    
    Validates task and run ownership, then creates/updates the active session.
    One active session per user. Previous session is replaced.
    """
    # Validate task belongs to user
    task = db.query(ApplyTask).filter(
        ApplyTask.id == request.task_id,
        ApplyTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or does not belong to user"
        )
    
    # Validate run belongs to user and matches task
    run = db.query(ApplyRun).filter(
        ApplyRun.id == request.run_id,
        ApplyRun.user_id == current_user.id,
        ApplyRun.task_id == request.task_id
    ).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found or does not match task"
        )
    
    # Calculate expiration
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS)
    
    # Upsert active session (one per user)
    existing = db.query(ActiveApplySession).filter(
        ActiveApplySession.user_id == current_user.id
    ).first()
    
    if existing:
        # Update existing
        existing.task_id = request.task_id
        existing.run_id = request.run_id
        existing.job_url = request.job_url
        existing.ats_type = request.ats_type
        existing.expires_at = expires_at
        existing.updated_at = datetime.utcnow()
    else:
        # Create new
        session = ActiveApplySession(
            user_id=current_user.id,
            task_id=request.task_id,
            run_id=request.run_id,
            job_url=request.job_url,
            ats_type=request.ats_type,
            expires_at=expires_at
        )
        db.add(session)
    
    db.commit()
    
    # Refresh to get final state
    db.refresh(existing if existing else session)
    final_session = existing if existing else session
    
    # Log observability event
    log_event(
        db=db,
        user_id=current_user.id,
        run_id=request.run_id,
        event_name='session_set',
        source='web_control_plane',
        severity='info',
        payload={
            'task_id': request.task_id,
            'run_id': request.run_id,
            'job_url': request.job_url,
            'ats_type': request.ats_type
        }
    )
    
    print(f"[Active Session] Set for user {current_user.id}: run_id={request.run_id}, task_id={request.task_id}")
    
    return ActiveSessionResponse(
        active=True,
        task_id=final_session.task_id,
        run_id=final_session.run_id,
        job_url=final_session.job_url,
        ats_type=final_session.ats_type,
        created_at=final_session.created_at,
        expires_at=final_session.expires_at
    )


@router.get("/active-session", response_model=ActiveSessionResponse)
def get_active_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get active apply session for current user (Phase 5.3.1).
    
    Returns active session if exists and not expired.
    Automatically deletes expired sessions.
    """
    session = db.query(ActiveApplySession).filter(
        ActiveApplySession.user_id == current_user.id
    ).first()
    
    # Check if expired
    if session and session.expires_at < datetime.utcnow():
        # Delete expired session
        db.delete(session)
        db.commit()
        session = None
        print(f"[Active Session] Expired session deleted for user {current_user.id}")
    
    if not session:
        return ActiveSessionResponse(active=False)
    
    print(f"[Active Session] Retrieved for user {current_user.id}: run_id={session.run_id}, task_id={session.task_id}")
    
    return ActiveSessionResponse(
        active=True,
        task_id=session.task_id,
        run_id=session.run_id,
        job_url=session.job_url,
        ats_type=session.ats_type,
        created_at=session.created_at,
        expires_at=session.expires_at
    )


@router.delete("/active-session")
def clear_active_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear active apply session for current user (Phase 5.3.1).
    
    Removes the active session and logs a session_cleared event.
    """
    session = db.query(ActiveApplySession).filter(
        ActiveApplySession.user_id == current_user.id
    ).first()
    
    if session:
        run_id = session.run_id
        db.delete(session)
        db.commit()
        
        # Log observability event
        log_event(
            db=db,
            user_id=current_user.id,
            run_id=run_id,
            event_name='session_cleared',
            source='web_control_plane',
            severity='info',
            payload={'reason': 'manual_clear'}
        )
        
        print(f"[Active Session] Cleared for user {current_user.id}: run_id={run_id}")
        
        return {"ok": True, "message": "Active session cleared"}
    
    return {"ok": True, "message": "No active session to clear"}

