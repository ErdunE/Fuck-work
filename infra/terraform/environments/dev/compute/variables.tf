# ============================================================================
# Project Configuration
# ============================================================================

variable "project" {
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

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

# ============================================================================
# Networking Configuration
# ============================================================================

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
  description = "Availability zone"
  type        = string
  default     = "us-east-1a"
}

variable "allowed_ssh_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into instances"
  type        = list(string)
  # ⚠️ IMPORTANT: Change this to your IP for security!
  # Get your IP: curl ifconfig.me
  # Then set: ["YOUR.IP.ADDRESS/32"]
}

# ============================================================================
# EC2 Configuration
# ============================================================================

variable "backend_instance_type" {
  description = "EC2 instance type for backend"
  type        = string
  default     = "t3.micro" # 2 vCPU, 1GB RAM - $7.59/month
}

variable "jobspy_instance_type" {
  description = "EC2 instance type for jobspy"
  type        = string
  default     = "t3.nano" # 2 vCPU, 0.5GB RAM - $0.0052/hour
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
  # Generate with: ssh-keygen -t ed25519 -C "fuckwork-dev" -f ~/.ssh/fuckwork-dev
  # Then paste content of ~/.ssh/fuckwork-dev.pub here
}

# ============================================================================
# Database Configuration
# ============================================================================

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
  # Generate with: openssl rand -base64 32
}

# ============================================================================
# Common Tags
# ============================================================================

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "FuckWork"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Owner       = "ErdunE"
  }
}
