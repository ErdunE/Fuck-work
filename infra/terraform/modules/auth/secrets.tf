# ============================================================================
# AWS Secrets Manager - Store OAuth Credentials Securely
# ============================================================================

resource "aws_secretsmanager_secret" "google_oauth" {
  name        = "${var.project_name}-${var.environment}-google-oauth"
  description = "Google OAuth credentials for Cognito"
  
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "google_oauth" {
  secret_id = aws_secretsmanager_secret.google_oauth.id
  secret_string = jsonencode({
    client_id     = var.google_client_id
    client_secret = var.google_client_secret
  })
}

resource "aws_secretsmanager_secret" "facebook_oauth" {
  name        = "${var.project_name}-${var.environment}-facebook-oauth"
  description = "Facebook OAuth credentials for Cognito"
  
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "facebook_oauth" {
  secret_id = aws_secretsmanager_secret.facebook_oauth.id
  secret_string = jsonencode({
    app_id     = var.facebook_app_id
    app_secret = var.facebook_app_secret
  })
}

resource "aws_secretsmanager_secret" "github_oauth" {
  name        = "${var.project_name}-${var.environment}-github-oauth"
  description = "GitHub OAuth credentials for Cognito OIDC"
  
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "github_oauth" {
  secret_id = aws_secretsmanager_secret.github_oauth.id
  secret_string = jsonencode({
    client_id     = var.github_client_id
    client_secret = var.github_client_secret
  })
}

resource "aws_secretsmanager_secret" "linkedin_oauth" {
  name        = "${var.project_name}-${var.environment}-linkedin-oauth"
  description = "LinkedIn OAuth credentials for Cognito OIDC"
  
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "linkedin_oauth" {
  secret_id = aws_secretsmanager_secret.linkedin_oauth.id
  secret_string = jsonencode({
    client_id     = var.linkedin_client_id
    client_secret = var.linkedin_client_secret
  })
}
