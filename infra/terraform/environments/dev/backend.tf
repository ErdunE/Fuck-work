terraform {
  backend "s3" {
    bucket         = "fuckwork-terraform-state-302222527269"
    key            = "dev/iam/terraform.tfstate"
    region         = "us-east-1"
    
    # DynamoDB table for state locking
    dynamodb_table = "fuckwork-terraform-locks"
    
    # Encryption
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:302222527269:key/9b911f43-e48f-483c-a403-b4bd3eb31fdd"
  }
}
