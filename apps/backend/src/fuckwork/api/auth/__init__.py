"""
Authentication module.
Supports Cognito JWT and legacy JWT tokens.
"""

from .cognito import get_cognito_user_info, verify_cognito_token
from .jwt_utils import (
    create_access_token,
    create_extension_token,
    get_current_user,
    get_current_user_from_extension_token,
    verify_extension_token,
)
from .password import hash_password, verify_password

__all__ = [
    "create_access_token",
    "get_current_user",
    "create_extension_token",
    "verify_extension_token",
    "get_current_user_from_extension_token",
    "hash_password",
    "verify_password",
    "verify_cognito_token",
    "get_cognito_user_info",
]
