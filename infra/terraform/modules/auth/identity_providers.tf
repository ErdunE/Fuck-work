# ============================================================================
# Cognito Identity Providers - Social Login
# ============================================================================

# Google Identity Provider (Native Cognito Support)
resource "aws_cognito_identity_provider" "google" {
  count = var.google_client_id != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "email openid profile"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
    picture  = "picture"
  }
}

# Facebook Identity Provider (Native Cognito Support)
resource "aws_cognito_identity_provider" "facebook" {
  count = var.facebook_app_id != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Facebook"
  provider_type = "Facebook"

  provider_details = {
    client_id         = var.facebook_app_id
    client_secret     = var.facebook_app_secret
    authorize_scopes  = "email,public_profile"
    api_version       = "v18.0"
  }

  attribute_mapping = {
    email    = "email"
    username = "id"
    name     = "name"
  }
}

# LinkedIn Identity Provider (OIDC)
# Using LinkedIn's OpenID Connect implementation
resource "aws_cognito_identity_provider" "linkedin" {
  count = var.linkedin_client_id != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "LinkedIn"
  provider_type = "OIDC"

  provider_details = {
    client_id                     = var.linkedin_client_id
    client_secret                 = var.linkedin_client_secret
    authorize_scopes              = "openid profile email"
    attributes_request_method     = "GET"
    oidc_issuer                   = "https://www.linkedin.com/oauth"
    authorize_url                 = "https://www.linkedin.com/oauth/v2/authorization"
    token_url                     = "https://www.linkedin.com/oauth/v2/accessToken"
    attributes_url                = "https://api.linkedin.com/v2/userinfo"
    jwks_uri                      = "https://www.linkedin.com/oauth/openid/jwks"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

# NOTE: GitHub is NOT included because:
# - GitHub does not support standard OIDC
# - Cognito does not natively support GitHub
# - Would require a Lambda@Edge or API Gateway middleware
# If GitHub login is needed in the future, consider using a Lambda function
# to handle the OAuth flow and exchange tokens.
