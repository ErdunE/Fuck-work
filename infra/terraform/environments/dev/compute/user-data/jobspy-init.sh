#!/bin/bash
set -e

# ============================================================================
# FuckWork jobspy EC2 Initialization Script
# ============================================================================

echo "=========================================="
echo "Starting jobspy scraper initialization"
echo "=========================================="

# Update system
echo "Updating system packages..."
dnf update -y

# Install Docker
echo "Installing Docker..."
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Create jobspy directory
echo "Creating jobspy directory..."
mkdir -p /home/ec2-user/jobspy
cd /home/ec2-user/jobspy

# Create run script
echo "Creating run script..."
cat > /home/ec2-user/jobspy/run-jobspy.sh << 'RUNSCRIPT'
#!/bin/bash
set -e

echo "=========================================="
echo "Starting jobspy scraper"
echo "=========================================="

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_jobspy_url}

# Pull latest image
echo "Pulling jobspy image..."
docker pull ${ecr_jobspy_url}:latest

# Run jobspy
echo "Running jobspy..."
docker run --rm \
  --name fuckwork_jobspy \
  -e DATABASE_URL=postgresql://fuckwork:${postgres_password}@${backend_instance_ip}:5432/fuckwork \
  -e ENVIRONMENT=production \
  ${ecr_jobspy_url}:latest

echo "jobspy completed successfully!"

# Auto-shutdown after job completes
echo "Shutting down instance in 2 minutes..."
sudo shutdown -h +2 "jobspy completed, shutting down"
RUNSCRIPT

chmod +x /home/ec2-user/jobspy/run-jobspy.sh

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/jobspy

# Create systemd service that runs jobspy on boot
cat > /etc/systemd/system/jobspy.service << 'SERVICEEOF'
[Unit]
Description=Run jobspy scraper on boot
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=ec2-user
WorkingDirectory=/home/ec2-user/jobspy
ExecStart=/home/ec2-user/jobspy/run-jobspy.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable jobspy.service

echo "=========================================="
echo "jobspy initialization completed!"
echo "=========================================="
echo ""
echo "This instance will:"
echo "1. Run jobspy on boot"
echo "2. Auto-shutdown after completion"
echo ""
echo "NOTE: jobspy Docker image must be pushed to ECR first:"
echo "  ${ecr_jobspy_url}:latest"
echo ""
