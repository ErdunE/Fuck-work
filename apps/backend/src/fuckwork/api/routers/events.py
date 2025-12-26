"""
Automation Events API endpoints for Phase 5.0 Web Control Plane.
Audit log for automation decisions and actions.
Developer-grade debugging to replace browser console.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import AutomationEvent, User, get_db

router = APIRouter(prefix="/api/users/me", tags=["automation-events"])


# Request/Response Models


class AutomationEventCreateRequest(BaseModel):
    """Request to create automation event (from extension)."""

    task_id: Optional[int] = None
    session_id: Optional[str] = None
    event_type: str  # 'autofill_triggered', 'submit_approved', 'detection_result'
    event_category: Optional[str] = None  # 'automation', 'detection', 'user_action'
    detection_id: Optional[str] = None
    page_url: Optional[str] = None
    page_intent: Optional[str] = None
    ats_kind: Optional[str] = None
    apply_stage: Optional[str] = None
    automation_decision: Optional[str] = None
    decision_reason: Optional[str] = None
    preferences_snapshot: Optional[dict] = None
    event_payload: Optional[dict] = None


class AutomationEventResponse(BaseModel):
    """Automation event response."""

    id: int
    user_id: Optional[int] = None
    task_id: Optional[int] = None
    session_id: Optional[str] = None
    event_type: str
    event_category: Optional[str] = None
    detection_id: Optional[str] = None
    page_url: Optional[str] = None
    page_intent: Optional[str] = None
    ats_kind: Optional[str] = None
    apply_stage: Optional[str] = None
    automation_decision: Optional[str] = None
    decision_reason: Optional[str] = None
    preferences_snapshot: Optional[dict] = None
    event_payload: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationEventCreateResponse(BaseModel):
    """Response after creating event."""

    event_id: int
    created_at: datetime
    message: str


class AutomationEventsListResponse(BaseModel):
    """Paginated list of automation events."""

    events: List[AutomationEventResponse]
    total: int
    limit: int
    offset: int


# Endpoints


@router.post(
    "/automation-events",
    response_model=AutomationEventCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_event(
    request: AutomationEventCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create automation event (called by extension).

    Immutable audit log - INSERT only, no UPDATE/DELETE.
    Extension logs all automation decisions here for debugging.
    """
    event = AutomationEvent(
        user_id=current_user.id,
        task_id=request.task_id,
        session_id=request.session_id,
        event_type=request.event_type,
        event_category=request.event_category,
        detection_id=request.detection_id,
        page_url=request.page_url,
        page_intent=request.page_intent,
        ats_kind=request.ats_kind,
        apply_stage=request.apply_stage,
        automation_decision=request.automation_decision,
        decision_reason=request.decision_reason,
        preferences_snapshot=request.preferences_snapshot,
        event_payload=request.event_payload,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return AutomationEventCreateResponse(
        event_id=event.id,
        created_at=event.created_at,
        message="Event logged successfully",
    )


@router.get("/automation-events", response_model=AutomationEventsListResponse)
def get_automation_events(
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    event_category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=500, description="Maximum events to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get automation events for current user.

    Developer-grade debugging view to replace browser console.
    Supports filtering by task, session, event type.
    """
    # Base query
    query = db.query(AutomationEvent).filter(AutomationEvent.user_id == current_user.id)

    # Apply filters
    if task_id:
        query = query.filter(AutomationEvent.task_id == task_id)
    if session_id:
        query = query.filter(AutomationEvent.session_id == session_id)
    if event_type:
        query = query.filter(AutomationEvent.event_type == event_type)
    if event_category:
        query = query.filter(AutomationEvent.event_category == event_category)

    # Get total count
    total = query.count()

    # Get paginated results (most recent first)
    events = query.order_by(desc(AutomationEvent.created_at)).offset(offset).limit(limit).all()

    return AutomationEventsListResponse(
        events=[AutomationEventResponse.from_orm(e) for e in events],
        total=total,
        limit=limit,
        offset=offset,
    )
