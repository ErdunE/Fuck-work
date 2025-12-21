# ============================================================================
# IAM GROUPS - Team Member Access
# ============================================================================

# ----------------------------------------------------------------------------
# 1. Administrators Group
# ----------------------------------------------------------------------------
resource "aws_iam_group" "administrators" {
  name = "${var.project_name}-administrators"
  path = "/"
}

resource "aws_iam_group_policy_attachment" "administrators" {
  group      = aws_iam_group.administrators.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ----------------------------------------------------------------------------
# 2. Backend Developers Group
# ----------------------------------------------------------------------------
resource "aws_iam_group" "backend_developers" {
  name = "${var.project_name}-backend-developers"
  path = "/"
}

resource "aws_iam_policy" "backend_developers" {
  name        = "${var.project_name}-backend-developers-policy"
  description = "Policy for backend developers"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Access"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = var.environment
          }
        }
      },
      {
        Sid    = "RDSAccess"
        Effect = "Allow"
        Action = [
          "rds:Describe*",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:*:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}/*"
      },
      {
        Sid    = "SSMSessionManager"
        Effect = "Allow"
        Action = [
          "ssm:StartSession"
        ]
        Resource = [
          "arn:aws:ec2:*:${var.aws_account_id}:instance/*",
          "arn:aws:ssm:*::document/AWS-StartSSHSession"
        ]
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = var.environment
          }
        }
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "backend_developers" {
  group      = aws_iam_group.backend_developers.name
  policy_arn = aws_iam_policy.backend_developers.arn
}

# ----------------------------------------------------------------------------
# 3. Frontend Developers Group
# ----------------------------------------------------------------------------
resource "aws_iam_group" "frontend_developers" {
  name = "${var.project_name}-frontend-developers"
  path = "/"
}

resource "aws_iam_policy" "frontend_developers" {
  name        = "${var.project_name}-frontend-developers-policy"
  description = "Policy for frontend developers"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3FrontendAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-frontend",
          "arn:aws:s3:::${var.project_name}-${var.environment}-frontend/*"
        ]
      },
      {
        Sid    = "CloudFrontAccess"
        Effect = "Allow"
        Action = [
          "cloudfront:GetDistribution",
          "cloudfront:GetInvalidation",
          "cloudfront:CreateInvalidation",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "frontend_developers" {
  group      = aws_iam_group.frontend_developers.name
  policy_arn = aws_iam_policy.frontend_developers.arn
}

# ----------------------------------------------------------------------------
# 4. DevOps Group
# ----------------------------------------------------------------------------
resource "aws_iam_group" "devops" {
  name = "${var.project_name}-devops"
  path = "/"
}

resource "aws_iam_policy" "devops" {
  name        = "${var.project_name}-devops-policy"
  description = "Policy for DevOps team"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeInfraRoles"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = [
          aws_iam_role.terraform_execution.arn
        ]
      },
      {
        Sid    = "FullInfraAccess"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "cloudwatch:*",
          "logs:*",
          "ssm:*",
          "ses:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "devops" {
  group      = aws_iam_group.devops.name
  policy_arn = aws_iam_policy.devops.arn
}

# ----------------------------------------------------------------------------
# 5. ReadOnly Group
# ----------------------------------------------------------------------------
resource "aws_iam_group" "readonly" {
  name = "${var.project_name}-readonly"
  path = "/"
}

resource "aws_iam_group_policy_attachment" "readonly" {
  group      = aws_iam_group.readonly.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}
