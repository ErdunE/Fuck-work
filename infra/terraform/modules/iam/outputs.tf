# ============================================================================
# OUTPUTS
# ============================================================================

# ----------------------------------------------------------------------------
# Service Roles
# ----------------------------------------------------------------------------
output "terraform_execution_role_arn" {
  description = "ARN of Terraform execution role"
  value       = aws_iam_role.terraform_execution.arn
}

output "ec2_backend_role_arn" {
  description = "ARN of EC2 backend role"
  value       = aws_iam_role.ec2_backend.arn
}

output "ec2_backend_instance_profile_arn" {
  description = "ARN of EC2 backend instance profile"
  value       = aws_iam_instance_profile.ec2_backend.arn
}

output "ec2_backend_instance_profile_name" {
  description = "Name of EC2 backend instance profile"
  value       = aws_iam_instance_profile.ec2_backend.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of RDS monitoring role"
  value       = aws_iam_role.rds_monitoring.arn
}

# ----------------------------------------------------------------------------
# CI/CD Roles
# ----------------------------------------------------------------------------
output "github_oidc_provider_arn" {
  description = "ARN of GitHub OIDC provider"
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_actions_deploy_role_arn" {
  description = "ARN of GitHub Actions deploy role"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "github_actions_terraform_role_arn" {
  description = "ARN of GitHub Actions Terraform role"
  value       = aws_iam_role.github_actions_terraform.arn
}

# ----------------------------------------------------------------------------
# IAM Groups
# ----------------------------------------------------------------------------
output "administrators_group_name" {
  description = "Name of administrators group"
  value       = aws_iam_group.administrators.name
}

output "backend_developers_group_name" {
  description = "Name of backend developers group"
  value       = aws_iam_group.backend_developers.name
}

output "frontend_developers_group_name" {
  description = "Name of frontend developers group"
  value       = aws_iam_group.frontend_developers.name
}

output "devops_group_name" {
  description = "Name of DevOps group"
  value       = aws_iam_group.devops.name
}

output "readonly_group_name" {
  description = "Name of readonly group"
  value       = aws_iam_group.readonly.name
}
