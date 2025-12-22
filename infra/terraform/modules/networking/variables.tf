# ============================================================================
# Required Variables
# ============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for resources"
  type        = string
  default     = "us-east-1a"
}

variable "allowed_ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into instances"
  type        = list(string)
  default     = ["0.0.0.0/0"] # ⚠️ Change this to your IP for better security
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
