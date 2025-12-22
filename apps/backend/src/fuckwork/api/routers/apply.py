"""
Apply task queue and orchestration endpoints.
Phase 3.5 - Human-in-the-loop Apply Pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from src.fuckwork.database import get_db
from src.fuckwork.database import User
from src.fuckwork.api.auth.jwt_utils import get_current_user_from_extension_token
from src.fuckwork.core.apply import (
    create_tasks_from_job_ids,
    list_tasks,
    get_task,
    transition_task,
)
from src.fuckwork.api.models_apply import (
    ApplyQueueRequest,
    ApplyTaskResponse,
    ApplyTaskListResponse,
    ApplyTransitionRequest,
    ApplyTransitionResponse,
)

router = APIRouter()


@router.post("/queue", response_model=ApplyTaskListResponse, status_code=201)
def queue_apply_tasks(request: ApplyQueueRequest, db: Session = Depends(get_db)):
    """
    Queue jobs for application.

    Creates apply tasks with deterministic priority ordering.
    Browser extension can then request next task to process.

    **Priority Strategies:**
    - `decision_then_newest`: Prioritize by job decision (recommend > caution > avoid), then recency
    - `newest`: Prioritize by posted_date (newest first)
    - `highest_score`: Prioritize by authenticity_score (highest first)
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        tasks = create_tasks_from_job_ids(
            db=db,
            user_id=request.user_id,
            job_ids=request.job_ids,
            priority_strategy=request.priority_strategy,
            allow_duplicates=request.allow_duplicates,
        )

        return ApplyTaskListResponse(
            tasks=tasks, total=len(tasks), limit=len(tasks), offset=0
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue tasks: {str(e)}")


@router.get("/tasks", response_model=ApplyTaskListResponse)
def list_apply_tasks(
    status: str = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user_from_extension_token),
    db: Session = Depends(get_db),
):
    """
    List apply tasks for authenticated user.

    Phase A: Requires extension token authentication (Authorization: Bearer).
    User ID is extracted from the token, not from query parameters.

    Returns tasks ordered by priority (desc) then created_at (asc).
    Use this to get next task to process.
    """
    try:
        tasks, total = list_tasks(
            db=db,
            user_id=current_user.id,  # From token, not query param
            status=status,
            limit=limit,
            offset=offset,
        )

        return ApplyTaskListResponse(
            tasks=tasks, total=total, limit=limit, offset=offset
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")


@router.get("/tasks/{task_id}", response_model=ApplyTaskResponse)
def get_apply_task(
    task_id: int,
    current_user: User = Depends(get_current_user_from_extension_token),
    db: Session = Depends(get_db),
):
    """
    Get single apply task by ID.

    Phase A: Requires extension token authentication.
    Verifies that the task belongs to the authenticated user.
    """
    task = get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify task ownership
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Access denied: task belongs to another user"
        )

    return task


@router.post("/tasks/{task_id}/transition", response_model=ApplyTransitionResponse)
def transition_apply_task(
    task_id: int,
    request: ApplyTransitionRequest,
    response: Response,
    current_user: User = Depends(get_current_user_from_extension_token),
    db: Session = Depends(get_db),
):
    """
    Transition task to new status.

    Phase A: Requires extension token authentication.
    Verifies that the task belongs to the authenticated user.

    **Valid Transitions:**
    - `queued` → `in_progress`, `canceled`
    - `in_progress` → `needs_user`, `failed`, `canceled`
    - `needs_user` → `success`, `failed`, `in_progress`
    - `failed` → `queued` (retry)
    - `success`, `canceled` → (terminal, no transitions)

    **Status Meanings:**
    - `queued`: Waiting to be processed
    - `in_progress`: Extension is working on it
    - `needs_user`: Extension opened page, waiting for user to review/submit
    - `success`: User successfully submitted
    - `failed`: Error occurred
    - `canceled`: User canceled
    """
    # Verify task ownership before transition
    existing_task = get_task(db, task_id)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if existing_task.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Access denied: task belongs to another user"
        )

    try:
        task, event = transition_task(
            db=db,
            task_id=task_id,
            to_status=request.to_status,
            reason=request.reason,
            details=request.details,
        )

        # Debug correlation id echo (no JSON schema change)
        try:
            if isinstance(request.details, dict) and request.details.get(
                "detection_id"
            ):
                response.headers["X-FW-Detection-Id"] = str(
                    request.details.get("detection_id")
                )
        except Exception:
            # Never fail transition due to debug header
            pass

        return ApplyTransitionResponse(
            task=task,
            event_id=event.id,
            message=f"Task transitioned: {event.from_status} → {event.to_status}",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transition failed: {str(e)}")
