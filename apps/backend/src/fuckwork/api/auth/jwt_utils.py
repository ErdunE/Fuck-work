"""
JWT utilities for authentication.
Supports both legacy JWT and Cognito JWT tokens.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.fuckwork.database import AutomationPreference, User, UserProfile, get_db

from .cognito import COGNITO_USER_POOL_ID, verify_cognito_token

# Legacy JWT Configuration (for backward compatibility during migration)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "10080"))  # 7 days

# Auth mode: 'cognito' or 'legacy'
AUTH_MODE = os.getenv("AUTH_MODE", "cognito")

# Security scheme
security = HTTPBearer(auto_error=False)


def create_access_token(
    user_id: int,
    email: str,
    token_version: int,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a legacy JWT access token.
    Only used for backward compatibility.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)

    to_encode = {
        "sub": str(user_id),
        "email": email,
        "ver": token_version,
        "iat": datetime.utcnow(),
        "exp": expire,
        "type": "legacy",  # Mark as legacy token
    }

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_legacy_token(token: str) -> dict:
    """
    Verify a legacy JWT token.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid legacy token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_or_create_user_from_cognito(db: Session, cognito_sub: str, email: str) -> User:
    """
    Get existing user or create new one from Cognito info.
    Uses cognito_sub as the unique identifier.
    """
    # First try to find by cognito_sub (stored in a field we'll add)
    # For now, use email as the lookup since we're migrating
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Update cognito_sub if not set (migration path)
        if not user.cognito_sub:
            user.cognito_sub = cognito_sub
            db.commit()
        return user

    # Create new user
    print(f"[Auth] Creating new user for Cognito sub: {cognito_sub}, email: {email}")

    user = User(
        email=email,
        cognito_sub=cognito_sub,
        password_hash=None,  # No password - using Cognito
        is_active=True,
    )
    db.add(user)
    db.flush()

    # Create empty profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)

    # Create default automation preferences
    automation_prefs = AutomationPreference(
        user_id=user.id,
        auto_fill_after_login=True,
        auto_submit_when_ready=False,
        require_review_before_submit=True,
        sync_source="web",
    )
    db.add(automation_prefs)

    db.commit()
    db.refresh(user)

    print(f"[Auth] Created user {user.id} for {email}")
    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    fw_session: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user.
    Supports both Cognito and legacy JWT tokens.
    """
    # Get token from Bearer header or cookie
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif fw_session:
        token = fw_session

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Determine token type and verify
    if AUTH_MODE == "cognito" and COGNITO_USER_POOL_ID:
        # Try Cognito token first
        try:
            payload = verify_cognito_token(token)

            # Get or create local user
            cognito_sub = payload.get("sub")
            email = payload.get("email")

            if not cognito_sub or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token claims",
                )

            user = get_or_create_user_from_cognito(db, cognito_sub, email)
            return user

        except HTTPException:
            # If Cognito fails, try legacy token as fallback
            if AUTH_MODE == "cognito":
                raise  # In Cognito mode, don't fall back

    # Legacy token verification
    payload = verify_legacy_token(token)

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    # Legacy token version check
    token_ver = payload.get("ver", 0)
    if token_ver != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    return user


# Extension token functions (keep for extension compatibility)
def create_extension_token(user: User, expires_delta: timedelta = timedelta(minutes=15)) -> str:
    """Create a short-lived JWT token for browser extension."""
    expire = datetime.utcnow() + expires_delta

    to_encode = {
        "sub": str(user.id),
        "email": user.email,
        "scope": "extension",
        "iat": datetime.utcnow(),
        "exp": expire,
    }

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_extension_token(token: str) -> dict:
    """Verify an extension JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid extension token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("scope") != "extension":
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


async def get_current_user_from_extension_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current user from extension Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Extension token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_extension_token(token)

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    return user
