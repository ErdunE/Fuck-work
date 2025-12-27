# ============================================================================
# API Gateway HTTP API - For Backend API
# ============================================================================

# ----------------------------------------------------------------------------
# HTTP API
# ----------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name} backend"

  cors_configuration {
    allow_origins     = var.cors_allow_origins
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    allow_headers     = ["Content-Type", "Authorization", "X-Requested-With"]
    expose_headers    = ["*"]
    max_age           = 3600
    allow_credentials = true
  }

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Stage (Auto-deploy)
# ----------------------------------------------------------------------------

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId         = "$context.requestId"
      ip                = "$context.identity.sourceIp"
      requestTime       = "$context.requestTime"
      httpMethod        = "$context.httpMethod"
      routeKey          = "$context.routeKey"
      status            = "$context.status"
      protocol          = "$context.protocol"
      responseLength    = "$context.responseLength"
      integrationError  = "$context.integrationErrorMessage"
    })
  }

  tags = var.tags
}

# ----------------------------------------------------------------------------
# CloudWatch Log Group for API Gateway
# ----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Integration - Connect to Backend EC2 (for /api/*)
# ----------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "backend_api" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/api/{proxy}"

  timeout_milliseconds = 30000
}

# Integration for /api root
resource "aws_apigatewayv2_integration" "backend_api_root" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/api"

  timeout_milliseconds = 30000
}

# Integration for /jobs/*
resource "aws_apigatewayv2_integration" "backend_jobs" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/jobs/{proxy}"

  timeout_milliseconds = 30000
}

# Integration for /jobs root
resource "aws_apigatewayv2_integration" "backend_jobs_root" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/jobs"

  timeout_milliseconds = 30000
}

# Integration for /docs
resource "aws_apigatewayv2_integration" "backend_docs" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/docs"

  timeout_milliseconds = 30000
}

# Integration for /openapi.json
resource "aws_apigatewayv2_integration" "backend_openapi" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/openapi.json"

  timeout_milliseconds = 30000
}

# Integration for health check (root)
resource "aws_apigatewayv2_integration" "backend_health" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "GET"
  integration_uri    = "http://${var.backend_ip}:${var.backend_port}/"

  timeout_milliseconds = 30000
}

# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------

# Route for /api/* 
resource "aws_apigatewayv2_route" "api_proxy" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_api.id}"
}

# Route for /api (without trailing path)
resource "aws_apigatewayv2_route" "api_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api"
  target    = "integrations/${aws_apigatewayv2_integration.backend_api_root.id}"
}

# Route for /jobs/*
resource "aws_apigatewayv2_route" "jobs_proxy" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /jobs/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_jobs.id}"
}

# Route for /jobs
resource "aws_apigatewayv2_route" "jobs_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /jobs"
  target    = "integrations/${aws_apigatewayv2_integration.backend_jobs_root.id}"
}

# Route for /docs (FastAPI documentation)
resource "aws_apigatewayv2_route" "docs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /docs"
  target    = "integrations/${aws_apigatewayv2_integration.backend_docs.id}"
}

# Route for /openapi.json
resource "aws_apigatewayv2_route" "openapi" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /openapi.json"
  target    = "integrations/${aws_apigatewayv2_integration.backend_openapi.id}"
}

# Health check route (root) - GET only
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.backend_health.id}"
}
