variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "backend_ip" {
  description = "Backend EC2 IP address"
  type        = string
}

variable "backend_port" {
  description = "Backend EC2 port"
  type        = number
  default     = 80
}

variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
