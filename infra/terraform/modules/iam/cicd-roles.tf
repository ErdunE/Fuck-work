# ============================================================================
# Data Sources
# ============================================================================

data "aws_caller_identity" "current" {}

# ============================================================================
# CI/CD ROLES - GitHub Actions OIDC
# ============================================================================

# ----------------------------------------------------------------------------
# GitHub OIDC Provider
# ----------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = merge(var.tags, {
    Name    = "${var.project_name}-github-oidc-provider"
    Purpose = "GitHub Actions OIDC authentication"
  })
}

# ----------------------------------------------------------------------------
# GitHubActionsDeployRole - 应用部署
# ----------------------------------------------------------------------------
resource "aws_iam_role" "github_actions_deploy" {
  name        = "${var.project_name}-${var.environment}-github-actions-deploy-role"
  description = "Role for GitHub Actions to deploy applications"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              for branch in var.deploy_branches :
              "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${branch}"
            ]
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-github-actions-deploy-role"
    Purpose = "GitHub Actions deployment"
  })
}

# GitHub Actions Deploy Policy
resource "aws_iam_policy" "github_actions_deploy" {
  name        = "${var.project_name}-${var.environment}-github-actions-deploy-policy"
  description = "Policy for GitHub Actions to deploy applications"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Deploy"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2-instance-connect:SendSSHPublicKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "SSMSessionManager"
        Effect = "Allow"
        Action = [
          "ssm:StartSession",
          "ssm:TerminateSession",
          "ssm:ResumeSession",
          "ssm:DescribeSessions",
          "ssm:GetConnectionStatus"
        ]
        Resource = [
          "arn:aws:ec2:*:${var.aws_account_id}:instance/*",
          "arn:aws:ssm:*:${var.aws_account_id}:session/*"
        ]
      },
      {
        Sid    = "S3FrontendDeploy"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-frontend-${var.aws_account_id}",
          "arn:aws:s3:::${var.project_name}-${var.environment}-frontend-${var.aws_account_id}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidation"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ]
        Resource = "*"
      },
      {
        Sid    = "ParameterStoreRead"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:${var.aws_account_id}:parameter/${var.project_name}/${var.environment}/*"
      },
      {
        Sid    = "ECRPushPull"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "SSMSendCommand"
        Effect = "Allow"
        Action = [
          "ssm:SendCommand"
        ]
        Resource = [
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ssm:*::document/AWS-RunShellScript"
        ]
      },
      {
        Sid    = "SSMGetCommandInvocation"
        Effect = "Allow"
        Action = [
          "ssm:GetCommandInvocation"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "github_actions_deploy" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.github_actions_deploy.arn
}

# ----------------------------------------------------------------------------
# GitHubActionsTerraformRole - Infrastructure 部署
# ----------------------------------------------------------------------------
resource "aws_iam_role" "github_actions_terraform" {
  name        = "${var.project_name}-github-actions-terraform-role"
  description = "Role for GitHub Actions to run Terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-github-actions-terraform-role"
    Purpose = "GitHub Actions Terraform execution"
  })
}

# Allow assuming TerraformExecutionRole
resource "aws_iam_policy" "github_actions_terraform" {
  name        = "${var.project_name}-github-actions-terraform-policy"
  description = "Policy for GitHub Actions to assume Terraform execution role"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["sts:AssumeRole", "sts:TagSession"]
        Resource = aws_iam_role.terraform_execution.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::fuckwork-terraform-state-*",
          "arn:aws:s3:::fuckwork-terraform-state-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/fuckwork-terraform-locks"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "github_actions_terraform" {
  role       = aws_iam_role.github_actions_terraform.name
  policy_arn = aws_iam_policy.github_actions_terraform.arn
}
