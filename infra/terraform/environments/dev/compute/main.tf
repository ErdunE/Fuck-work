# ============================================================================
# Networking Module
# ============================================================================

module "networking" {
  source = "../../../modules/networking"

  project     = var.project
  environment = var.environment

  vpc_cidr               = var.vpc_cidr
  public_subnet_cidr     = var.public_subnet_cidr
  availability_zone      = var.availability_zone
  allowed_ssh_cidr_blocks = var.allowed_ssh_cidr_blocks

  common_tags = var.common_tags
}

# ============================================================================
# Data Sources
# ============================================================================

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================================================
# S3 Buckets
# ============================================================================

# Backups bucket
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project}-${var.environment}-backups-${var.aws_account_id}"

  tags = merge(
    var.common_tags,
    {
      Name    = "${var.project}-${var.environment}-backups"
      Purpose = "database-backups"
    }
  )
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

# User uploads bucket
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project}-${var.environment}-uploads-${var.aws_account_id}"

  tags = merge(
    var.common_tags,
    {
      Name    = "${var.project}-${var.environment}-uploads"
      Purpose = "user-uploads"
    }
  )
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # Update this to your domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ============================================================================
# ECR Repositories
# ============================================================================

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-backend-ecr"
    }
  )
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_repository" "jobspy" {
  name                 = "${var.project}-jobspy"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-jobspy-ecr"
    }
  )
}

resource "aws_ecr_lifecycle_policy" "jobspy" {
  repository = aws_ecr_repository.jobspy.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# ============================================================================
# EC2 Key Pair
# ============================================================================

resource "aws_key_pair" "main" {
  key_name   = "${var.project}-${var.environment}-key"
  public_key = var.ssh_public_key

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-key"
    }
  )
}

# ============================================================================
# IAM Role for Backend EC2
# ============================================================================

resource "aws_iam_role" "backend" {
  name = "${var.project}-${var.environment}-backend-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-backend-ec2-role"
    }
  )
}

resource "aws_iam_role_policy" "backend" {
  name = "${var.project}-${var.environment}-backend-policy"
  role = aws_iam_role.backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*",
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "backend" {
  name = "${var.project}-${var.environment}-backend-profile"
  role = aws_iam_role.backend.name

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-backend-profile"
    }
  )
}

# ============================================================================
# IAM Role for jobspy EC2
# ============================================================================

resource "aws_iam_role" "jobspy" {
  name = "${var.project}-${var.environment}-jobspy-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-jobspy-ec2-role"
    }
  )
}

resource "aws_iam_role_policy" "jobspy" {
  name = "${var.project}-${var.environment}-jobspy-policy"
  role = aws_iam_role.jobspy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:StopInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Name" = "${var.project}-${var.environment}-jobspy"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "jobspy" {
  name = "${var.project}-${var.environment}-jobspy-profile"
  role = aws_iam_role.jobspy.name

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-jobspy-profile"
    }
  )
}

# ============================================================================
# Backend EC2 Instance
# ============================================================================

resource "aws_instance" "backend" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.backend_instance_type
  key_name      = aws_key_pair.main.key_name

  subnet_id                   = module.networking.public_subnet_id
  vpc_security_group_ids      = [module.networking.backend_security_group_id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.backend.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data/backend-init.sh", {
    region            = var.aws_region
    ecr_backend_url   = aws_ecr_repository.backend.repository_url
    postgres_password = var.postgres_password
    s3_backups_bucket = aws_s3_bucket.backups.id
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-backend"
      Role = "backend-api"
    }
  )

  lifecycle {
    ignore_changes = [ami]
  }
}

# ============================================================================
# jobspy EC2 Instance
# ============================================================================

resource "aws_instance" "jobspy" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.jobspy_instance_type
  key_name      = aws_key_pair.main.key_name

  subnet_id                   = module.networking.public_subnet_id
  vpc_security_group_ids      = [module.networking.jobspy_security_group_id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.jobspy.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data/jobspy-init.sh", {
    region              = var.aws_region
    ecr_jobspy_url      = aws_ecr_repository.jobspy.repository_url
    backend_instance_ip = aws_instance.backend.private_ip
    postgres_password   = var.postgres_password
  })

  tags = merge(
    var.common_tags,
    {
      Name         = "${var.project}-${var.environment}-jobspy"
      Role         = "jobspy-scraper"
      AutoStart    = "true"
      AutoShutdown = "true"
    }
  )

  lifecycle {
    ignore_changes = [ami]
  }
}

# ============================================================================
# Lambda Function for Starting jobspy
# ============================================================================

resource "aws_iam_role" "lambda_start_jobspy" {
  name = "${var.project}-${var.environment}-lambda-start-jobspy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-lambda-start-jobspy"
    }
  )
}

resource "aws_iam_role_policy" "lambda_start_jobspy" {
  name = "${var.project}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_start_jobspy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_start_jobspy" {
  type        = "zip"
  output_path = "${path.module}/.terraform/lambda-start-jobspy.zip"

  source {
    content  = <<-PYTHON
import boto3
import os
import json

ec2 = boto3.client('ec2')

def handler(event, context):
    instance_id = os.environ['JOBSPY_INSTANCE_ID']
    
    print(f"Starting jobspy instance: {instance_id}")
    
    try:
        response = ec2.describe_instances(InstanceIds=[instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']
        
        print(f"Current state: {state}")
        
        if state == 'stopped':
            ec2.start_instances(InstanceIds=[instance_id])
            print(f"Successfully started instance {instance_id}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Started instance {instance_id}')
            }
        elif state == 'running':
            print(f"Instance {instance_id} is already running")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is already running')
            }
        else:
            print(f"Instance {instance_id} is in state: {state}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is in state: {state}')
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
PYTHON
    filename = "index.py"
  }
}

resource "aws_lambda_function" "start_jobspy" {
  filename      = data.archive_file.lambda_start_jobspy.output_path
  function_name = "${var.project}-${var.environment}-start-jobspy"
  role          = aws_iam_role.lambda_start_jobspy.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30

  source_code_hash = data.archive_file.lambda_start_jobspy.output_base64sha256

  environment {
    variables = {
      JOBSPY_INSTANCE_ID = aws_instance.jobspy.id
    }
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-start-jobspy"
    }
  )
}

resource "aws_cloudwatch_log_group" "lambda_start_jobspy" {
  name              = "/aws/lambda/${aws_lambda_function.start_jobspy.function_name}"
  retention_in_days = 7

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-lambda-logs"
    }
  )
}

# ============================================================================
# EventBridge Rule - Trigger every hour
# ============================================================================

resource "aws_cloudwatch_event_rule" "start_jobspy_hourly" {
  name                = "${var.project}-${var.environment}-start-jobspy-hourly"
  description         = "Trigger jobspy scraper every hour"
  schedule_expression = "cron(0 */4 * * ? *)" # Every 4 hours at :00

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-${var.environment}-start-jobspy-hourly"
    }
  )
}

resource "aws_cloudwatch_event_target" "start_jobspy" {
  rule      = aws_cloudwatch_event_rule.start_jobspy_hourly.name
  target_id = "StartJobspyLambda"
  arn       = aws_lambda_function.start_jobspy.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_jobspy.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.start_jobspy_hourly.arn
}
