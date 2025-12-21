"""
Authentication API endpoints for Phase 5.0 Web Control Plane.
Provides user registration, login, and token validation.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from src.fuckwork.database import get_db
from src.fuckwork.database import User, UserProfile, AutomationPreference
from src.fuckwork.api.auth import create_access_token, verify_password, hash_password, get_current_user
from src.fuckwork.api.auth.jwt_utils import create_extension_token

router = APIRouter(prefix="/auth", tags=["authentication"])


# Request/Response Models

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str  # Optional for stub auth (Phase 5.0 accepts empty string)


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response. Phase 5.3.2: Added expires_at for extension auth."""
    access_token: str
    token_type: str
    user_id: int
    email: str
    expires_at: str  # Phase 5.3.2: ISO timestamp for extension


class UserResponse(BaseModel):
    """User information response."""
    user_id: int
    email: str
    is_active: bool
    created_at: datetime


class RegisterResponse(BaseModel):
    """Registration response."""
    user_id: int
    email: str
    message: str


# Endpoints

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    Creates user, empty profile, and default automation preferences.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    password_hash = None
    if request.password and request.password.strip():
        password_hash = hash_password(request.password)
    
    user = User(
        email=request.email,
        password_hash=password_hash,
        is_active=True
    )
    db.add(user)
    db.flush()  # Get user.id
    
    # Create empty user profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    
    # Create default automation preferences (CRITICAL for Phase 5.0)
    automation_prefs = AutomationPreference(
        user_id=user.id,
        auto_fill_after_login=True,  # Safe default
        auto_submit_when_ready=False,  # Requires opt-in
        require_review_before_submit=True,  # Safety gate
        sync_source='web'
    )
    db.add(automation_prefs)
    
    db.commit()
    db.refresh(user)
    
    return RegisterResponse(
        user_id=user.id,
        email=user.email,
        message="User created successfully"
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user and issue JWT token.
    Also sets HttpOnly cookie for browser extension auth (Phase A).
    
    For stub auth (no password set), any password is accepted.
    """
    # Get user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Verify password
    if user.password_hash:
        # Password set - must verify
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    else:
        # Stub auth - no password set, accept any password
        # This allows Phase 5.0 to work without full password management
        pass
    
    # Phase 5.3.2: Increment token version (revokes old tokens)
    user.token_version += 1
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Create JWT token (sub MUST be string per JWT RFC)
    # Phase 5.3.2: Include token_version for revocation support
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        token_version=user.token_version
    )
    
    # Calculate expiration timestamp
    from api.auth.jwt_utils import JWT_EXPIRATION_MINUTES
    expires_at = (datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)).isoformat()
    
    # Phase A: Set HttpOnly cookie for browser extension
    response.set_cookie(
        key="fw_session",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=JWT_EXPIRATION_MINUTES * 60,  # Convert minutes to seconds
        path="/"
    )
    
    print(f"[Auth] Login successful for user {user.id}, token_version={user.token_version}, cookie set")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        expires_at=expires_at
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Validates JWT token and returns user data.
    Phase 5.3.2: Also validates token version for revocation support.
    """
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Phase A: Logout by incrementing token_version and clearing session cookie.
    
    This immediately invalidates all existing JWT tokens for the user,
    including tokens stored in the extension. The extension will receive
    401 errors on next API call.
    """
    current_user.token_version += 1
    db.commit()
    
    # Phase A: Clear session cookie
    response.delete_cookie(key="fw_session", path="/")
    
    print(f"[Auth] Logout for user {current_user.id}, token_version incremented to {current_user.token_version}, cookie cleared")
    
    return {"ok": True, "message": "Logged out successfully"}


# ============================================================
# Extension Token Endpoint (Phase A: Token-Based Auth)
# ============================================================

class ExtensionTokenResponse(BaseModel):
    """Extension token response."""
    token: str
    expires_in: int  # Seconds until expiration


@router.post("/extension-token", response_model=ExtensionTokenResponse)
def get_extension_token(current_user: User = Depends(get_current_user)):
    """
    Issue a short-lived JWT token for browser extension authentication.
    
    **Authentication Required**: Must be logged in via Web App (cookie session).
    
    This endpoint allows the Web App to obtain a token that can be sent to the
    browser extension for API authentication. The extension will use this token
    in Authorization: Bearer headers.
    
    **Token Properties**:
    - Lifetime: 15 minutes
    - Scope: 'extension' (validates this is an extension token)
    - No version tracking (extensions don't need revocation support)
    
    **Flow**:
    1. User logs into Web App (receives cookie session)
    2. Web App calls this endpoint to get extension token
    3. Web App broadcasts token to extension via window.postMessage
    4. Extension stores token and uses it for API calls
    
    Returns:
        ExtensionTokenResponse with token and expiration time in seconds
    """
    # Create extension token (15 minutes validity)
    token = create_extension_token(current_user)
    
    print(f"[Auth] Extension token issued for user {current_user.id}")
    
    return ExtensionTokenResponse(
        token=token,
        expires_in=900  # 15 minutes = 900 seconds
    )

