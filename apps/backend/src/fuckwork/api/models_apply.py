"""
Pydantic models for apply task queue and orchestration APIs.
Phase 3.5 - Apply Pipeline.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


# Request Models


class ApplyQueueRequest(BaseModel):
    """Queue multiple jobs for application"""

    user_id: int = Field(..., description="User ID")
    job_ids: List[str] = Field(
        ..., min_length=1, max_length=100, description="List of job IDs to queue"
    )
    priority_strategy: Literal["decision_then_newest", "newest", "highest_score"] = (
        Field("decision_then_newest", description="How to prioritize tasks")
    )
    allow_duplicates: bool = Field(
        False, description="Allow queuing jobs already in queue"
    )

    @field_validator("job_ids")
    def validate_job_ids(cls, v):
        if not v:
            raise ValueError("job_ids cannot be empty")
        if len(v) != len(set(v)):
            raise ValueError("job_ids contains duplicates")
        return v


class ApplyTransitionRequest(BaseModel):
    """Transition task to new status"""

    to_status: Literal[
        "queued", "in_progress", "needs_user", "success", "failed", "canceled"
    ] = Field(..., description="Target status")
    reason: Optional[str] = Field(
        None, max_length=500, description="Reason for transition"
    )
    details: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


# Response Models


class ApplyTaskResponse(BaseModel):
    """Apply task details"""

    id: int
    user_id: int
    job_id: str
    status: str
    priority: int
    attempt_count: int
    last_error: Optional[str]
    task_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplyTaskListResponse(BaseModel):
    """List of apply tasks with pagination"""

    tasks: List[ApplyTaskResponse]
    total: int
    limit: int
    offset: int


class ApplyEventResponse(BaseModel):
    """Apply event details"""

    id: int
    task_id: int
    from_status: str
    to_status: str
    reason: Optional[str]
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ApplyTransitionResponse(BaseModel):
    """Result of status transition"""

    task: ApplyTaskResponse
    event_id: int
    message: str
