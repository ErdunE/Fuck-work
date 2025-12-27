variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "callback_urls" {
  description = "Allowed callback URLs for OAuth"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "Allowed logout URLs"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# Social Login Credentials
# ============================================================================

# Google
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

# Facebook
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

# GitHub
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

# LinkedIn
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

# SMS/Phone Authentication
variable "enable_sms_auth" {
  description = "Enable SMS/Phone number authentication"
  type        = bool
  default     = false
}
