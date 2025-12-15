"""
JWT utilities for Phase 5.0 authentication.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from database.models import User

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "10080"))  # 7 days

# Security scheme
security = HTTPBearer()


def create_access_token(user_id: int, email: str, token_version: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with version for revocation support.
    
    CRITICAL: sub claim MUST be string (JWT RFC 7519 requirement).
    Phase 5.3.2: Added token_version for secure logout/account-switching.
    
    Args:
        user_id: User ID to encode in 'sub' claim (will be converted to string)
        email: User email to include in token
        token_version: Token version for revocation support (Phase 5.3.2)
        expires_delta: Custom expiration time, defaults to JWT_EXPIRATION_MINUTES
    
    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    
    to_encode = {
        "sub": str(user_id),  # MUST be string per JWT RFC
        "email": email,
        "ver": token_version,  # Phase 5.3.2: Token version for revocation
        "iat": datetime.utcnow(),
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to get the current authenticated user from JWT token.
    
    Phase 5.3.2: Added token version verification for revocation support.
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
    
    Returns:
        Current authenticated User object
    
    Raises:
        HTTPException: If token is invalid, revoked, or user not found
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Convert sub from string to int (sub is always string per JWT RFC)
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Phase 5.3.2: Verify token version matches current user.token_version
    token_ver = payload.get("ver", 0)
    if token_ver != user.token_version:
        print(f"[Auth] Token version mismatch for user {user.id}: token={token_ver}, db={user.token_version}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    return user

