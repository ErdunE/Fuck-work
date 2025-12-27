# ============================================================================
# AWS Cognito User Pool - Authentication for FuckWork
# ============================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-users"

  # Username configuration - allow email and phone
  username_attributes      = ["email", "phone_number"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  # Email configuration (use Cognito default for now)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # SMS configuration for phone auth
  sms_configuration {
    external_id    = "${var.project_name}-${var.environment}-sms"
    sns_caller_arn = aws_iam_role.cognito_sms.arn
    sns_region     = data.aws_region.current.name
  }

  # Schema attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "phone_number"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  # MFA configuration (optional SMS)
  mfa_configuration = "OPTIONAL"
  
  software_token_mfa_configuration {
    enabled = true
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  # Verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your ${var.project_name} verification code"
    email_message        = "Your verification code is {####}"
    sms_message          = "Your ${var.project_name} code is {####}"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-user-pool"
  })
}

# ============================================================================
# IAM Role for Cognito SMS
# ============================================================================

data "aws_region" "current" {}

resource "aws_iam_role" "cognito_sms" {
  name = "${var.project_name}-${var.environment}-cognito-sms"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cognito-idp.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-${var.environment}-sms"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cognito_sms" {
  name = "${var.project_name}-${var.environment}-cognito-sms-policy"
  role = aws_iam_role.cognito_sms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "sns:Publish"
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# Cognito User Pool Client - For Frontend App
# ============================================================================

locals {
  # Build list of enabled identity providers
  identity_providers = compact([
    "COGNITO",
    var.google_client_id != "" ? "Google" : "",
    var.facebook_app_id != "" ? "Facebook" : "",
    
    var.linkedin_client_id != "" ? "LinkedIn" : "",
  ])
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.project_name}-${var.environment}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token configuration
  access_token_validity  = 1    # 1 hour
  id_token_validity      = 1    # 1 hour
  refresh_token_validity = 30   # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # No client secret (public client for SPA)
  generate_secret = false

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"

  # Supported auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  
  # Dynamic list of identity providers
  supported_identity_providers = local.identity_providers

  # Callback URLs
  callback_urls = length(var.callback_urls) > 0 ? var.callback_urls : [
    "http://localhost:3000/callback",
    "http://localhost:3000"
  ]

  logout_urls = length(var.logout_urls) > 0 ? var.logout_urls : [
    "http://localhost:3000"
  ]

  # Ensure identity providers are created first
  depends_on = [
    aws_cognito_identity_provider.google,
    aws_cognito_identity_provider.facebook,
    
    aws_cognito_identity_provider.linkedin,
  ]
}

# ============================================================================
# Cognito User Pool Domain - For Hosted UI
# ============================================================================

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}
