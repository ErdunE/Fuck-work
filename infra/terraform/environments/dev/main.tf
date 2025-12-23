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
