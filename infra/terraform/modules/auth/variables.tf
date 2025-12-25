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
