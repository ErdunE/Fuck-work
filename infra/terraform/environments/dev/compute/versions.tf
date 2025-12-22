# ============================================================================
# Terraform and Provider Versions
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.100.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.0"
    }
  }
}

# ============================================================================
# AWS Provider Configuration
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FuckWork"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "Compute"
      Repository  = "https://github.com/ErdunE/Fuck-work"
    }
  }
}
