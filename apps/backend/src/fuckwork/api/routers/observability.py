"""
Observability API Router - Phase 5.3.0

Production-grade observability system for tracking application runs and events.
Provides structured event streaming, timeline reconstruction, and debugging capabilities.

Endpoints:
- POST /api/observability/runs/start - Start a new apply run
- POST /api/observability/events/batch - Batch insert events
- GET /api/observability/runs - List runs with filters
- GET /api/observability/runs/{run_id} - Get run details
- GET /api/observability/runs/{run_id}/events - Get run events timeline
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.fuckwork.database import get_db
from src.fuckwork.database import User, ApplyRun, ObservabilityEvent
from src.fuckwork.api.auth import get_current_user

router = APIRouter(prefix="/api/observability", tags=["observability"])


# ============================================================
# Request/Response Models
# ============================================================

class StartRunRequest(BaseModel):
    """Request to start a new observability run"""
    task_id: Optional[int] = None
    job_id: Optional[str] = None
    initial_url: str
    current_url: str
    ats_kind: Optional[str] = None
    intent: Optional[str] = None
    stage: Optional[str] = None


class StartRunResponse(BaseModel):
    """Response with newly created or existing run_id"""
    run_id: int


class EventPayload(BaseModel):
    """Single event payload for batch insert"""
    source: str  # extension, backend, web
    severity: str  # debug, info, warn, error
    event_name: str
    event_version: int = 1
    url: Optional[str] = None
    payload: Dict[str, Any] = {}
    dedup_key: Optional[str] = None
    detection_id: Optional[str] = None
    page_id: Optional[str] = None


class BatchEventsRequest(BaseModel):
    """Request to batch insert multiple events"""
    run_id: int
    events: List[EventPayload]


class BatchEventsResponse(BaseModel):
    """Response confirming batch event insertion"""
    ok: bool
    inserted: int


class RunListItem(BaseModel):
    """Single run item for list view"""
    id: int
    task_id: Optional[int] = None
    job_id: Optional[str] = None
    ats_kind: Optional[str] = None
    intent: Optional[str] = None
    stage: Optional[str] = None
    status: str
    fill_rate: Optional[float] = None
    fields_attempted: int
    fields_filled: int
    fields_skipped: int
    current_url: str
    created_at: datetime
    ended_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class RunListResponse(BaseModel):
    """Response with list of runs and pagination"""
    runs: List[RunListItem]
    total: int
    limit: int
    offset: int


class RunDetail(BaseModel):
    """Detailed run information including event summary"""
    id: int
    user_id: int
    task_id: Optional[int] = None
    job_id: Optional[str] = None
    initial_url: str
    current_url: str
    ats_kind: Optional[str] = None
    intent: Optional[str] = None
    stage: Optional[str] = None
    status: str
    fill_rate: Optional[float] = None
    fields_attempted: int
    fields_filled: int
    fields_skipped: int
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ended_at: Optional[datetime] = None
    
    # Event summary
    event_count: int
    first_event_ts: Optional[datetime] = None
    last_event_ts: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EventItem(BaseModel):
    """Single event for timeline display"""
    id: int
    source: str
    severity: str
    event_name: str
    event_version: int
    ts: datetime
    url: Optional[str] = None
    payload: Dict[str, Any]
    detection_id: Optional[str] = None
    page_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class RunEventsResponse(BaseModel):
    """Response with run events timeline"""
    events: List[EventItem]
    total: int


# ============================================================
# Endpoints
# ============================================================

@router.post("/runs/start", response_model=StartRunResponse)
def start_run(
    request: StartRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new observability run (Phase 5.3.0).
    
    Idempotent: If an in_progress run exists for the same task_id + current_url
    within the last 10 minutes, returns existing run_id.
    Otherwise, creates a new run.
    """
    # Check for recent in_progress run (idempotency)
    if request.task_id:
        cutoff_time = datetime.utcnow() - timedelta(minutes=10)
        existing_run = db.query(ApplyRun).filter(
            ApplyRun.user_id == current_user.id,
            ApplyRun.task_id == request.task_id,
            ApplyRun.current_url == request.current_url,
            ApplyRun.status == 'in_progress',
            ApplyRun.created_at >= cutoff_time
        ).first()
        
        if existing_run:
            # Update existing run with latest context
            existing_run.ats_kind = request.ats_kind or existing_run.ats_kind
            existing_run.intent = request.intent or existing_run.intent
            existing_run.stage = request.stage or existing_run.stage
            existing_run.updated_at = datetime.utcnow()
            db.commit()
            
            return StartRunResponse(run_id=existing_run.id)
    
    # Create new run
    new_run = ApplyRun(
        user_id=current_user.id,
        job_id=request.job_id,
        task_id=request.task_id,
        initial_url=request.initial_url,
        current_url=request.current_url,
        ats_kind=request.ats_kind,
        intent=request.intent,
        stage=request.stage,
        status='in_progress'
    )
    
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    
    return StartRunResponse(run_id=new_run.id)


@router.post("/events/batch", response_model=BatchEventsResponse)
def batch_events(
    request: BatchEventsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch insert observability events (Phase 5.3.0).
    
    Accepts up to 200 events per batch for fast ingestion.
    Validates that run_id belongs to current user (403 if not).
    """
    # Validate run ownership
    run = db.query(ApplyRun).filter(
        ApplyRun.id == request.run_id,
        ApplyRun.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Run not found or does not belong to current user"
        )
    
    # Cap batch size
    if len(request.events) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch size exceeds 200 events"
        )
    
    # Insert events
    inserted_count = 0
    for event_data in request.events:
        event = ObservabilityEvent(
            run_id=request.run_id,
            user_id=current_user.id,
            source=event_data.source,
            severity=event_data.severity,
            event_name=event_data.event_name,
            event_version=event_data.event_version,
            url=event_data.url,
            payload=event_data.payload,
            dedup_key=event_data.dedup_key,
            detection_id=event_data.detection_id,
            page_id=event_data.page_id,
            ts=datetime.utcnow()
        )
        db.add(event)
        inserted_count += 1
    
    db.commit()
    
    return BatchEventsResponse(ok=True, inserted=inserted_count)


@router.get("/runs", response_model=RunListResponse)
def list_runs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    ats_kind: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List observability runs with filters (Phase 5.3.0).
    
    Supports pagination and filtering by status, ats_kind, and text search.
    Returns runs ordered by created_at DESC (most recent first).
    """
    # Base query
    query = db.query(ApplyRun).filter(ApplyRun.user_id == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(ApplyRun.status == status)
    
    if ats_kind:
        query = query.filter(ApplyRun.ats_kind == ats_kind)
    
    if q:
        # Simple text search on job_id and URLs
        search_term = f"%{q}%"
        query = query.filter(
            (ApplyRun.job_id.ilike(search_term)) |
            (ApplyRun.current_url.ilike(search_term)) |
            (ApplyRun.initial_url.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    runs = query.order_by(ApplyRun.created_at.desc()).limit(limit).offset(offset).all()
    
    return RunListResponse(
        runs=[RunListItem.from_orm(run) for run in runs],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/runs/{run_id}", response_model=RunDetail)
def get_run_detail(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed run information (Phase 5.3.0).
    
    Returns run details plus event summary counts.
    """
    # Fetch run
    run = db.query(ApplyRun).filter(
        ApplyRun.id == run_id,
        ApplyRun.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Get event summary
    event_count = db.query(ObservabilityEvent).filter(
        ObservabilityEvent.run_id == run_id
    ).count()
    
    first_event = db.query(ObservabilityEvent).filter(
        ObservabilityEvent.run_id == run_id
    ).order_by(ObservabilityEvent.ts.asc()).first()
    
    last_event = db.query(ObservabilityEvent).filter(
        ObservabilityEvent.run_id == run_id
    ).order_by(ObservabilityEvent.ts.desc()).first()
    
    # Construct response
    return RunDetail(
        id=run.id,
        user_id=run.user_id,
        task_id=run.task_id,
        job_id=run.job_id,
        initial_url=run.initial_url,
        current_url=run.current_url,
        ats_kind=run.ats_kind,
        intent=run.intent,
        stage=run.stage,
        status=run.status,
        fill_rate=run.fill_rate,
        fields_attempted=run.fields_attempted,
        fields_filled=run.fields_filled,
        fields_skipped=run.fields_skipped,
        failure_reason=run.failure_reason,
        created_at=run.created_at,
        updated_at=run.updated_at,
        ended_at=run.ended_at,
        event_count=event_count,
        first_event_ts=first_event.ts if first_event else None,
        last_event_ts=last_event.ts if last_event else None
    )


@router.get("/runs/{run_id}/events", response_model=RunEventsResponse)
def get_run_events(
    run_id: int,
    limit: int = Query(500, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get observability events for a run (Phase 5.3.0).
    
    Returns events ordered by timestamp ASC (chronological timeline).
    """
    # Verify run ownership
    run = db.query(ApplyRun).filter(
        ApplyRun.id == run_id,
        ApplyRun.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    
    # Fetch events
    events = db.query(ObservabilityEvent).filter(
        ObservabilityEvent.run_id == run_id
    ).order_by(ObservabilityEvent.ts.asc()).limit(limit).all()
    
    total = db.query(ObservabilityEvent).filter(
        ObservabilityEvent.run_id == run_id
    ).count()
    
    return RunEventsResponse(
        events=[EventItem.from_orm(event) for event in events],
        total=total
    )

