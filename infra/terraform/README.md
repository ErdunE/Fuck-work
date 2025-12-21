# Terraform Configuration

## Modules

- `networking/` - VPC, Subnets, Security Groups
- `compute/` - EC2, ALB
- `database/` - RDS PostgreSQL
- `storage/` - S3
- `auth/` - Cognito
- `monitoring/` - CloudWatch

## Environments

每个环境有独立的配置：
- `dev/` - 开发环境
- `staging/` - 预生产环境
- `prod/` - 生产环境
