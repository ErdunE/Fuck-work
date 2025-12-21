# ============================================================================
# OUTPUTS
# ============================================================================

output "terraform_execution_role_arn" {
  description = "ARN of Terraform execution role"
  value       = module.iam.terraform_execution_role_arn
}

output "ec2_backend_instance_profile_name" {
  description = "Name of EC2 backend instance profile (use this in EC2 launch)"
  value       = module.iam.ec2_backend_instance_profile_name
}

output "rds_monitoring_role_arn" {
  description = "ARN of RDS monitoring role (use this in RDS configuration)"
  value       = module.iam.rds_monitoring_role_arn
}

output "github_actions_deploy_role_arn" {
  description = "ARN for GitHub Actions deploy workflow (add to secrets)"
  value       = module.iam.github_actions_deploy_role_arn
}

output "github_actions_terraform_role_arn" {
  description = "ARN for GitHub Actions Terraform workflow (add to secrets)"
  value       = module.iam.github_actions_terraform_role_arn
}

output "iam_groups" {
  description = "IAM group names for team members"
  value = {
    administrators      = module.iam.administrators_group_name
    backend_developers  = module.iam.backend_developers_group_name
    frontend_developers = module.iam.frontend_developers_group_name
    devops             = module.iam.devops_group_name
    readonly           = module.iam.readonly_group_name
  }
}
