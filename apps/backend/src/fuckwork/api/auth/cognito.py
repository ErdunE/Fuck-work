"""
Cognito JWT verification module.
Validates tokens issued by AWS Cognito User Pool.
"""

import os
import time
from functools import lru_cache
from typing import Any, Dict

import requests
from fastapi import HTTPException, status
from jose import JWTError, jwt

# Cognito Configuration
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "")

# Derived URLs
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_cognito_public_keys() -> Dict[str, Any]:
    """
    Fetch and cache Cognito public keys (JWKS).
    Keys are cached indefinitely - restart app to refresh.
    """
    if not COGNITO_USER_POOL_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito not configured",
        )

    try:
        response = requests.get(COGNITO_JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()

        # Convert to dict keyed by 'kid'
        keys = {}
        for key in jwks.get("keys", []):
            keys[key["kid"]] = key

        print(f"[Cognito] Loaded {len(keys)} public keys from {COGNITO_JWKS_URL}")
        return keys
    except Exception as e:
        print(f"[Cognito] Failed to fetch JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch Cognito public keys",
        )


def verify_cognito_token(token: str) -> Dict[str, Any]:
    """
    Verify a Cognito JWT token.

    Args:
        token: JWT token from Cognito

    Returns:
        Decoded token payload with claims:
        - sub: Cognito user UUID
        - email: User email
        - email_verified: Boolean
        - token_use: 'id' or 'access'
        - etc.

    Raises:
        HTTPException: If token is invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Get the key ID from token header
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")

        if not kid:
            print("[Cognito] Token missing 'kid' header")
            raise credentials_exception

        # Get public keys
        public_keys = get_cognito_public_keys()

        if kid not in public_keys:
            print(f"[Cognito] Unknown key ID: {kid}")
            # Clear cache and retry once
            get_cognito_public_keys.cache_clear()
            public_keys = get_cognito_public_keys()

            if kid not in public_keys:
                raise credentials_exception

        # Get the public key
        public_key = public_keys[kid]

        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={
                "verify_at_hash": False,  # ID tokens don't always have at_hash
            },
        )

        # Additional validations
        token_use = payload.get("token_use")
        if token_use not in ["id", "access"]:
            print(f"[Cognito] Invalid token_use: {token_use}")
            raise credentials_exception

        # Check expiration (jose should do this, but double-check)
        exp = payload.get("exp", 0)
        if time.time() > exp:
            print("[Cognito] Token expired")
            raise credentials_exception

        return payload

    except JWTError as e:
        print(f"[Cognito] JWT verification failed: {e}")
        raise credentials_exception
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Cognito] Unexpected error: {e}")
        raise credentials_exception


def get_cognito_user_info(token: str) -> Dict[str, Any]:
    """
    Extract user info from Cognito token.

    Returns:
        Dict with:
        - cognito_sub: Cognito user UUID (use as unique identifier)
        - email: User email
        - email_verified: Boolean
    """
    payload = verify_cognito_token(token)

    return {
        "cognito_sub": payload.get("sub"),
        "email": payload.get("email"),
        "email_verified": payload.get("email_verified", False),
    }
