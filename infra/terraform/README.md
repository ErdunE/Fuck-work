# FuckWork Infrastructure - Terraform IAM Configuration

## 📋 Overview

This directory contains Terraform configurations for managing AWS IAM resources for the FuckWork project.

## 🏗️ Architecture
```
infra/terraform/
├── modules/iam/              # IAM module (reusable)
│   ├── service-roles.tf     # AWS service roles (EC2, RDS, etc.)
│   ├── cicd-roles.tf        # GitHub Actions OIDC roles
│   ├── groups.tf            # IAM user groups
│   ├── policies.tf          # Reusable policies (MFA, etc.)
│   ├── variables.tf         # Module variables
│   └── outputs.tf           # Module outputs
│
├── environments/dev/         # Dev environment configuration
│   ├── main.tf              # Main configuration
│   ├── backend.tf           # Terraform backend (S3 + DynamoDB)
│   ├── variables.tf         # Environment variables
│   ├── terraform.tfvars     # Variable values
│   └── outputs.tf           # Environment outputs
│
└── scripts/                  # Helper scripts
    └── create-admin-user.sh # Create IAM admin user
```

## 🔑 Resources Created

### Service Roles
- **TerraformExecutionRole**: For Terraform to manage infrastructure
- **EC2BackendRole**: For backend application runtime
- **RDSMonitoringRole**: For RDS enhanced monitoring

### CI/CD Roles
- **GitHub OIDC Provider**: Passwordless authentication for GitHub Actions
- **GitHubActionsDeployRole**: For application deployment
- **GitHubActionsTerraformRole**: For infrastructure deployment

### IAM Groups
- **Administrators**: Full AWS access
- **BackendDevelopers**: Backend-specific access (EC2, RDS, logs)
- **FrontendDevelopers**: Frontend-specific access (S3, CloudFront)
- **DevOps**: Infrastructure management access
- **ReadOnly**: Read-only access to all resources

## 🚀 Quick Start

### Prerequisites

1. AWS CLI configured with root credentials
2. Terraform installed (>= 1.0)
3. Backend infrastructure created:
   - ✅ S3 bucket: `fuckwork-terraform-state-302222527269`
   - ✅ DynamoDB table: `fuckwork-terraform-locks`
   - ✅ KMS key: `9b911f43-e48f-483c-a403-b4bd3eb31fdd`

### Step 1: Create IAM Admin User

**⚠️ Run this ONCE with root credentials:**
```bash
cd ~/Desktop/Fuck-work/infra/terraform/scripts
./create-admin-user.sh
```

This will:
- Create IAM user `erdun-admin`
- Generate access keys
- Set up console password

**Save the credentials shown!**

### Step 2: Configure AWS CLI with Admin User
```bash
aws configure --profile erdun-admin
# Enter the Access Key ID and Secret Access Key from Step 1
# Default region: us-east-1
# Default output format: json
```

### Step 3: Switch to Admin Profile
```bash
export AWS_PROFILE=erdun-admin
aws sts get-caller-identity
```

You should see `erdun-admin` instead of `root`.

### Step 4: Run Terraform
```bash
cd ~/Desktop/Fuck-work/infra/terraform/environments/dev

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply changes
terraform apply
```

### Step 5: Add Admin User to Administrators Group

Via AWS Console:
1. Go to IAM → Users → erdun-admin
2. Groups tab → Add user to groups
3. Select `fuckwork-administrators`
4. Click Add to groups

### Step 6: Enable MFA

Via AWS Console:
1. Go to IAM → Users → erdun-admin
2. Security credentials tab
3. Manage → Assign MFA device
4. Follow the setup wizard

## 📊 Outputs

After `terraform apply`, you'll get these important ARNs:
```
terraform_execution_role_arn        = "arn:aws:iam::302222527269:role/fuckwork-dev-terraform-execution-role"
ec2_backend_instance_profile_name   = "fuckwork-dev-ec2-backend-profile"
rds_monitoring_role_arn            = "arn:aws:iam::302222527269:role/fuckwork-dev-rds-monitoring-role"
github_actions_deploy_role_arn     = "arn:aws:iam::302222527269:role/fuckwork-dev-github-actions-deploy-role"
github_actions_terraform_role_arn  = "arn:aws:iam::302222527269:role/fuckwork-github-actions-terraform-role"

iam_groups = {
  administrators      = "fuckwork-administrators"
  backend_developers  = "fuckwork-backend-developers"
  frontend_developers = "fuckwork-frontend-developers"
  devops             = "fuckwork-devops"
  readonly           = "fuckwork-readonly"
}
```

## 🔐 Security Features

✅ **MFA Enforcement**: All IAM users must enable MFA
✅ **Strong Password Policy**: 14+ chars, complexity requirements, 90-day rotation
✅ **OIDC Authentication**: Passwordless GitHub Actions deployment
✅ **Least Privilege**: Role-based access control
✅ **Encrypted State**: Terraform state encrypted with KMS
✅ **State Locking**: DynamoDB prevents concurrent modifications

## 🧑‍🤝‍🧑 Adding Team Members

### Create New IAM User
```bash
aws iam create-user --user-name john-doe
aws iam create-login-profile --user-name john-doe --password "TempPassword123!" --password-reset-required
```

### Add to Appropriate Group
```bash
# Backend developer
aws iam add-user-to-group --user-name john-doe --group-name fuckwork-backend-developers

# Frontend developer
aws iam add-user-to-group --user-name john-doe --group-name fuckwork-frontend-developers

# DevOps engineer
aws iam add-user-to-group --user-name john-doe --group-name fuckwork-devops
```

### Send Welcome Email
```
Subject: AWS Account Access - FuckWork Project

Hi [Name],

Your AWS account has been created:

Console URL: https://302222527269.signin.aws.amazon.com/console
Username: [username]
Temporary Password: [password]

Next steps:
1. Log in and change your password
2. Enable MFA (required within 24 hours)
3. Review your permissions

Questions? Contact DevOps team.
```

## 🔄 Updating Infrastructure
```bash
cd ~/Desktop/Fuck-work/infra/terraform/environments/dev

# Review changes
terraform plan

# Apply updates
terraform apply
```

## 🗑️ Cleanup (Development Only)

**⚠️ WARNING: This destroys all IAM resources!**
```bash
terraform destroy
```

## 📚 References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## 🆘 Troubleshooting

### "Access Denied" when running Terraform

- Ensure you're using the admin profile: `export AWS_PROFILE=erdun-admin`
- Check your credentials: `aws sts get-caller-identity`

### "Backend initialization required"
```bash
terraform init -reconfigure
```

### MFA errors

- Ensure MFA is enabled for your user
- Try getting a new MFA session token

### State lock error
```bash
# Force unlock (use carefully!)
terraform force-unlock [LOCK_ID]
```
