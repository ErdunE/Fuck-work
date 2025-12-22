# ============================================================================
# VPC Outputs
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# ============================================================================
# Subnet Outputs
# ============================================================================

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "public_subnet_cidr" {
  description = "CIDR block of the public subnet"
  value       = aws_subnet.public.cidr_block
}

# ============================================================================
# Gateway Outputs
# ============================================================================

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# ============================================================================
# Security Group Outputs
# ============================================================================

output "backend_security_group_id" {
  description = "ID of the backend security group"
  value       = aws_security_group.backend.id
}

output "jobspy_security_group_id" {
  description = "ID of the jobspy security group"
  value       = aws_security_group.jobspy.id
}

# ============================================================================
# Other Outputs
# ============================================================================

output "availability_zone" {
  description = "Availability zone used"
  value       = var.availability_zone
}
