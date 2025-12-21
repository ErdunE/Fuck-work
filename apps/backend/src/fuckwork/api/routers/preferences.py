"""
Automation Preferences API endpoints for Phase 5.0 Web Control Plane.
CRITICAL: System of record for automation behavior.
Extension polls these preferences and caches locally.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.fuckwork.database import get_db
from src.fuckwork.database import User, AutomationPreference
from src.fuckwork.api.auth import get_current_user

router = APIRouter(prefix="/api/users/me", tags=["automation-preferences"])


# Request/Response Models

class AutomationPreferencesResponse(BaseModel):
    """Automation preferences response."""
    id: int
    user_id: int
    version: int
    
    # Global Automation Settings
    auto_fill_after_login: bool
    auto_submit_when_ready: bool
    require_review_before_submit: bool
    
    # Future Expansion Hooks
    per_ats_overrides: dict
    field_autofill_rules: dict
    submit_review_timeout_ms: int
    
    # Sync Metadata
    last_synced_at: Optional[datetime] = None
    sync_source: Optional[str] = None
    
    # Metadata
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AutomationPreferencesUpdateRequest(BaseModel):
    """Automation preferences update request (partial updates supported)."""
    auto_fill_after_login: Optional[bool] = None
    auto_submit_when_ready: Optional[bool] = None
    require_review_before_submit: Optional[bool] = None
    per_ats_overrides: Optional[dict] = None
    field_autofill_rules: Optional[dict] = None
    submit_review_timeout_ms: Optional[int] = None
    sync_source: Optional[str] = None  # 'web', 'extension', 'api'


class AutomationPreferencesUpdateResponse(BaseModel):
    """Automation preferences update response."""
    id: int
    updated_at: datetime
    last_synced_at: datetime
    message: str


# Endpoints

@router.get("/automation-preferences", response_model=AutomationPreferencesResponse)
def get_automation_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's automation preferences.
    
    Extension polls this endpoint every 5 minutes.
    Backend is the source of truth, extension caches locally.
    """
    prefs = db.query(AutomationPreference).filter(
        AutomationPreference.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create default preferences if they don't exist
        prefs = AutomationPreference(
            user_id=current_user.id,
            auto_fill_after_login=True,
            auto_submit_when_ready=False,
            require_review_before_submit=True,
            sync_source='auto_created'
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return AutomationPreferencesResponse.from_orm(prefs)


@router.put("/automation-preferences", response_model=AutomationPreferencesUpdateResponse)
def update_automation_preferences(
    request: AutomationPreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's automation preferences.
    
    Supports partial updates.
    Sets last_synced_at to NOW() to signal change to polling extension.
    """
    prefs = db.query(AutomationPreference).filter(
        AutomationPreference.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create preferences if they don't exist
        prefs = AutomationPreference(user_id=current_user.id)
        db.add(prefs)
    
    # Update only provided fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prefs, field, value)
    
    # Update sync timestamps
    now = datetime.utcnow()
    prefs.updated_at = now
    prefs.last_synced_at = now
    
    db.commit()
    db.refresh(prefs)
    
    return AutomationPreferencesUpdateResponse(
        id=prefs.id,
        updated_at=prefs.updated_at,
        last_synced_at=prefs.last_synced_at,
        message="Preferences updated successfully"
    )

