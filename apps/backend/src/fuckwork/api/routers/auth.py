"""
Authentication API endpoints.
Supports Cognito authentication with automatic local user creation.
"""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.api.auth.jwt_utils import create_extension_token
from src.fuckwork.database import User, get_db

router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================================
# Response Models
# ============================================================================


class UserResponse(BaseModel):
    """User information response."""

    user_id: int
    email: str
    is_active: bool
    created_at: datetime


class ExtensionTokenResponse(BaseModel):
    """Extension token response."""

    token: str
    expires_in: int  # Seconds


# ============================================================================
# Endpoints
# ============================================================================


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Validates Cognito JWT token and returns user data.
    If this is the user's first login, a local user record is automatically created.

    **Authentication**: Bearer token from Cognito
    """
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.post("/extension-token", response_model=ExtensionTokenResponse)
def get_extension_token(current_user: User = Depends(get_current_user)):
    """
    Issue a short-lived JWT token for browser extension authentication.

    **Authentication Required**: Must have valid Cognito token.

    This endpoint allows the Web App to obtain a token that can be sent to the
    browser extension for API authentication.

    **Token Properties**:
    - Lifetime: 15 minutes
    - Scope: 'extension'

    Returns:
        ExtensionTokenResponse with token and expiration time in seconds
    """
    token = create_extension_token(current_user)
    print(f"[Auth] Extension token issued for user {current_user.id}")

    return ExtensionTokenResponse(token=token, expires_in=900)  # 15 minutes


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logout - increment token version to invalidate extension tokens.

    Note: Cognito tokens are managed by Cognito. This endpoint only
    invalidates extension tokens issued by this backend.
    """
    current_user.token_version += 1
    db.commit()

    print(f"[Auth] Logout for user {current_user.id}, token_version incremented")

    return {"ok": True, "message": "Logged out successfully"}


# ============================================================================
# Health Check (no auth required)
# ============================================================================


@router.get("/status")
def auth_status():
    """
    Check authentication service status.
    Returns Cognito configuration info (no secrets).
    """
    from src.fuckwork.api.auth.cognito import (
        COGNITO_CLIENT_ID,
        COGNITO_ISSUER,
        COGNITO_REGION,
        COGNITO_USER_POOL_ID,
    )
    from src.fuckwork.api.auth.jwt_utils import AUTH_MODE

    return {
        "status": "ok",
        "auth_mode": AUTH_MODE,
        "cognito_configured": bool(COGNITO_USER_POOL_ID),
        "cognito_region": COGNITO_REGION,
        "cognito_issuer": COGNITO_ISSUER if COGNITO_USER_POOL_ID else None,
        "cognito_client_id": COGNITO_CLIENT_ID if COGNITO_USER_POOL_ID else None,
    }
