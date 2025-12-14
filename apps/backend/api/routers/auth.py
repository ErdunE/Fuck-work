"""
Authentication API endpoints for Phase 5.0 Web Control Plane.
Provides user registration, login, and token validation.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from database.models import User, UserProfile, AutomationPreference
from api.auth import create_access_token, verify_password, hash_password, get_current_user

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
    """JWT token response."""
    access_token: str
    token_type: str
    user_id: int
    email: str


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
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and issue JWT token.
    
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
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Create JWT token (sub MUST be string per JWT RFC)
    access_token = create_access_token(
        user_id=user.id,
        email=user.email
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Validates JWT token and returns user data.
    """
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

