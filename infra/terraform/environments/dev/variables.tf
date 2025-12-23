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
