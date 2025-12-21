variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fuckwork"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "deploy_branches" {
  description = "GitHub branches allowed to deploy"
  type        = list(string)
  default     = ["main", "dev"]
}

variable "enforce_mfa" {
  description = "Enforce MFA for IAM users"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
