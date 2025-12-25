# ============================================================================
# SERVICE ROLES - AWS Resources
# ============================================================================

# ----------------------------------------------------------------------------
# 1. TerraformExecutionRole - Terraform 使用
# ----------------------------------------------------------------------------
resource "aws_iam_role" "terraform_execution" {
  name        = "${var.project_name}-${var.environment}-terraform-execution-role"
  description = "Role for Terraform to manage infrastructure"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action = ["sts:AssumeRole", "sts:TagSession"]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "true"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-terraform-execution-role"
    Purpose = "Terraform infrastructure management"
  })
}

resource "aws_iam_role_policy_attachment" "terraform_admin" {
  role       = aws_iam_role.terraform_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ----------------------------------------------------------------------------
# 2. EC2BackendRole - Backend 应用运行时
# ----------------------------------------------------------------------------
resource "aws_iam_role" "ec2_backend" {
  name        = "${var.project_name}-${var.environment}-ec2-backend-role"
  description = "Role for EC2 instances running the backend application"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = ["sts:AssumeRole", "sts:TagSession"]
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-ec2-backend-role"
    Purpose = "Backend application runtime"
  })
}

# EC2 Backend Policy
resource "aws_iam_policy" "ec2_backend" {
  name        = "${var.project_name}-${var.environment}-ec2-backend-policy"
  description = "Policy for backend EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}/*"
      },
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-*",
          "arn:aws:s3:::${var.project_name}-${var.environment}-*/*"
        ]
      },
      {
        Sid    = "SSMParameterStore"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:${var.aws_account_id}:parameter/${var.project_name}/${var.environment}/*"
      },
      {
        Sid    = "SESEmail"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ec2_backend" {
  role       = aws_iam_role.ec2_backend.name
  policy_arn = aws_iam_policy.ec2_backend.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_backend" {
  name = "${var.project_name}-${var.environment}-ec2-backend-profile"
  role = aws_iam_role.ec2_backend.name

  tags = var.tags
}

# ----------------------------------------------------------------------------
# 3. RDSMonitoringRole - RDS 增强监控
# ----------------------------------------------------------------------------
resource "aws_iam_role" "rds_monitoring" {
  name        = "${var.project_name}-${var.environment}-rds-monitoring-role"
  description = "Role for RDS Enhanced Monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = ["sts:AssumeRole", "sts:TagSession"]
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-rds-monitoring-role"
    Purpose = "RDS enhanced monitoring"
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
