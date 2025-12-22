# ============================================================================
# Networking Outputs
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = module.networking.public_subnet_id
}

# ============================================================================
# EC2 Outputs
# ============================================================================

output "backend_instance_id" {
  description = "Backend EC2 instance ID"
  value       = aws_instance.backend.id
}

output "backend_public_ip" {
  description = "Backend EC2 public IP"
  value       = aws_instance.backend.public_ip
}

output "backend_private_ip" {
  description = "Backend EC2 private IP"
  value       = aws_instance.backend.private_ip
}

output "jobspy_instance_id" {
  description = "jobspy EC2 instance ID"
  value       = aws_instance.jobspy.id
}

# ============================================================================
# S3 Outputs
# ============================================================================

output "backups_bucket_name" {
  description = "S3 backups bucket name"
  value       = aws_s3_bucket.backups.id
}

output "uploads_bucket_name" {
  description = "S3 uploads bucket name"
  value       = aws_s3_bucket.uploads.id
}

# ============================================================================
# ECR Outputs
# ============================================================================

output "backend_ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "jobspy_ecr_repository_url" {
  description = "ECR repository URL for jobspy"
  value       = aws_ecr_repository.jobspy.repository_url
}

# ============================================================================
# Connection Instructions
# ============================================================================

output "ssh_command_backend" {
  description = "SSH command to connect to backend instance"
  value       = "ssh -i ~/.ssh/fuckwork-dev ec2-user@${aws_instance.backend.public_ip}"
}

output "backend_api_url" {
  description = "Backend API URL"
  value       = "http://${aws_instance.backend.public_ip}"
}

output "tableplus_connection_instructions" {
  description = "Instructions for connecting to PostgreSQL via TablePlus"
  value = <<-EOT
  
  TablePlus Connection (via SSH Tunnel):
  ========================================
  Name: FuckWork AWS
  Host: localhost
  Port: 5432
  User: fuckwork
  Password: (your postgres_password)
  Database: fuckwork
  
  ✅ Enable "Over SSH":
  SSH Host: ${aws_instance.backend.public_ip}
  SSH User: ec2-user
  SSH Key: ~/.ssh/fuckwork-dev
  
  EOT
}
