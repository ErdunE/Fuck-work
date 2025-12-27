variable "project_name" {
  description = "Project name"
  type        = string
  default     = "fuckwork"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "ErdunE"
}

variable "github_repo" {
  description = "GitHub repository"
  type        = string
  default     = "Fuck-work"
}

variable "deploy_branches" {
  description = "Branches allowed to deploy"
  type        = list(string)
  default     = ["main", "dev"]
}

variable "enforce_mfa" {
  description = "Enforce MFA for IAM users"
  type        = bool
  default     = true
}

# ============================================================================
# Social Login OAuth Credentials
# ============================================================================

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "facebook_app_id" {
  description = "Facebook App ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "facebook_app_secret" {
  description = "Facebook App Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_client_id" {
  description = "GitHub OAuth Client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_client_secret" {
  description = "GitHub OAuth Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "linkedin_client_id" {
  description = "LinkedIn Client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "linkedin_client_secret" {
  description = "LinkedIn Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}
