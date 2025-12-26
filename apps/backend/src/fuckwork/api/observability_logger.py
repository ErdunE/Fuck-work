"""
Observability Logger - Phase 5.3.0

Helper functions for logging observability events from backend code.
Enables structured event capture with minimal boilerplate.
"""

from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from src.fuckwork.database import ObservabilityEvent


def log_event(
    db: Session,
    user_id: int,
    run_id: Optional[int],
    event_name: str,
    source: str = "backend",
    severity: str = "info",
    payload: Dict[str, Any] = None,
    request_id: Optional[str] = None,
    url: Optional[str] = None,
) -> None:
    """
    Log an observability event from backend.

    Args:
        db: Database session
        user_id: User ID for the event
        run_id: Run ID (required for correlation)
        event_name: Event name following naming conventions
        source: Event source (default: "backend")
        severity: Event severity (debug, info, warn, error)
        payload: Structured event payload (JSON-serializable dict)
        request_id: HTTP request ID for correlation
        url: URL context for the event

    Returns:
        None (events are inserted async, failures are logged but don't raise)

    Example:
        log_event(
            db=db,
            user_id=current_user.id,
            run_id=123,
            event_name="derived_profile_served",
            payload={"missing_fields": ["legal_name"], "derived_profile_version": 1}
        )
    """
    # Can't log without run context
    if run_id is None:
        return

    # Default to empty dict if no payload
    if payload is None:
        payload = {}

    try:
        event = ObservabilityEvent(
            run_id=run_id,
            user_id=user_id,
            source=source,
            severity=severity,
            event_name=event_name,
            payload=payload,
            request_id=request_id,
            url=url,
        )
        db.add(event)
        db.commit()
    except Exception as e:
        # Log failure but don't break request flow
        print(f"[Observability Logger] Failed to log event {event_name}: {e}")
        db.rollback()
