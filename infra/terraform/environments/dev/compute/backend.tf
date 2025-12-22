# ============================================================================
# Terraform Backend Configuration
# ============================================================================
# This configures where Terraform stores its state file
# We use the same S3 bucket and DynamoDB table as the IAM configuration

terraform {
  backend "s3" {
    # S3 bucket for state storage
    bucket = "fuckwork-terraform-state-302222527269"
    
    # State file path (different from IAM)
    key = "dev/compute/terraform.tfstate"
    
    # AWS region
    region = "us-east-1"
    
    # Encryption
    encrypt = true
    kms_key_id = "arn:aws:kms:us-east-1:302222527269:key/9b911f43-e48f-483c-a403-b4bd3eb31fdd"
    
    # State locking with DynamoDB
    dynamodb_table = "fuckwork-terraform-locks"
  }
}
