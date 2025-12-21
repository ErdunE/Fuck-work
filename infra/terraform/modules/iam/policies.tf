# ============================================================================
# REUSABLE POLICIES
# ============================================================================

# ----------------------------------------------------------------------------
# Password Policy
# ----------------------------------------------------------------------------
resource "aws_iam_account_password_policy" "strict" {
  count = var.enforce_mfa ? 1 : 0

  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 24
}

# ----------------------------------------------------------------------------
# MFA Enforcement Policy
# ----------------------------------------------------------------------------
resource "aws_iam_policy" "require_mfa" {
  count = var.enforce_mfa ? 1 : 0

  name        = "${var.project_name}-require-mfa-policy"
  description = "Require MFA for all actions except managing own credentials"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::${var.aws_account_id}:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnAccessKeys"
        Effect = "Allow"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::${var.aws_account_id}:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::${var.aws_account_id}:mfa/$${aws:username}",
          "arn:aws:iam::${var.aws_account_id}:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# Attach MFA policy to all groups
resource "aws_iam_group_policy_attachment" "administrators_mfa" {
  count = var.enforce_mfa ? 1 : 0

  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.require_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "backend_developers_mfa" {
  count = var.enforce_mfa ? 1 : 0

  group      = aws_iam_group.backend_developers.name
  policy_arn = aws_iam_policy.require_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "frontend_developers_mfa" {
  count = var.enforce_mfa ? 1 : 0

  group      = aws_iam_group.frontend_developers.name
  policy_arn = aws_iam_policy.require_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "devops_mfa" {
  count = var.enforce_mfa ? 1 : 0

  group      = aws_iam_group.devops.name
  policy_arn = aws_iam_policy.require_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "readonly_mfa" {
  count = var.enforce_mfa ? 1 : 0

  group      = aws_iam_group.readonly.name
  policy_arn = aws_iam_policy.require_mfa[0].arn
}
