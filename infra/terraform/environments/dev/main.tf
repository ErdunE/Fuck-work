# ============================================================================
# Data Sources
# ============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================================================
# IAM MODULE CONFIGURATION - DEV ENVIRONMENT
# ============================================================================

module "iam" {
  source = "../../modules/iam"

  project_name   = var.project_name
  environment    = var.environment
  aws_account_id = data.aws_caller_identity.current.account_id
  
  github_org      = var.github_org
  github_repo     = var.github_repo
  deploy_branches = var.deploy_branches
  
  enforce_mfa = var.enforce_mfa

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Repository  = "github.com/${var.github_org}/${var.github_repo}"
  }
}

# ============================================================================
# AUTH MODULE CONFIGURATION - Cognito with Social Login
# ============================================================================

module "auth" {
  source = "../../modules/auth"

  project_name = var.project_name
  environment  = var.environment

  # OAuth callback URLs - localhost for dev + CloudFront URL
  callback_urls = [
    "http://localhost:3000",
    "http://localhost:3000/callback",
    "http://localhost:5173",
    "http://localhost:5173/callback",
    "https://${module.cdn.cloudfront_domain_name}",
    "https://${module.cdn.cloudfront_domain_name}/callback"
  ]

  logout_urls = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://${module.cdn.cloudfront_domain_name}",
    "https://${module.cdn.cloudfront_domain_name}/login"
  ]

  # Social Login Credentials
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  facebook_app_id     = var.facebook_app_id
  facebook_app_secret = var.facebook_app_secret

  github_client_id     = var.github_client_id
  github_client_secret = var.github_client_secret

  linkedin_client_id     = var.linkedin_client_id
  linkedin_client_secret = var.linkedin_client_secret

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# CDN MODULE CONFIGURATION - CloudFront + S3 for Frontend
# ============================================================================

module "cdn" {
  source = "../../modules/cdn"

  project_name   = var.project_name
  environment    = var.environment
  aws_account_id = data.aws_caller_identity.current.account_id

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# API GATEWAY MODULE CONFIGURATION - HTTPS API Proxy
# ============================================================================

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment
  backend_ip   = var.backend_ip
  backend_port = 80

  cors_allow_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://${module.cdn.cloudfront_domain_name}"
  ]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
