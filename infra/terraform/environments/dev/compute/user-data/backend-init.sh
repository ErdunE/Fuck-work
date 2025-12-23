#!/bin/bash
set -e

# ============================================================================
# FuckWork Backend EC2 Initialization Script (RDS Version)
# ============================================================================

echo "=========================================="
echo "Starting FuckWork Backend initialization"
echo "=========================================="

# Update system
echo "Updating system packages..."
dnf update -y

# Install cronie for cron jobs
echo "Installing cronie..."
dnf install -y cronie
systemctl start crond
systemctl enable crond

# Install Docker
echo "Installing Docker..."
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.24.0"
curl -L "https://github.com/docker/compose/releases/download/v$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install PostgreSQL client (for database initialization)
echo "Installing PostgreSQL client..."
dnf install -y postgresql15

# Create application directory
echo "Creating application directory..."
mkdir -p /home/ec2-user/fuckwork
cd /home/ec2-user/fuckwork

# Create environment file (using RDS)
echo "Creating environment file..."
cat > .env << 'ENVEOF'
# Database Configuration (RDS)
DATABASE_URL=postgresql://fuckwork:${postgres_password}@${rds_endpoint}/fuckwork
ENVIRONMENT=dev

# AWS Configuration
AWS_REGION=${region}
S3_BACKUPS_BUCKET=${s3_backups_bucket}
ENVEOF

# Create docker-compose.yml (NO PostgreSQL - using RDS)
echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSEEOF'
version: '3.8'

services:
  backend:
    image: ${ecr_backend_url}:latest
    container_name: fuckwork_backend
    environment:
      DATABASE_URL: $${DATABASE_URL}
      ENVIRONMENT: $${ENVIRONMENT}
      AWS_REGION: $${AWS_REGION}
      S3_BACKUPS_BUCKET: $${S3_BACKUPS_BUCKET}
    ports:
      - "80:8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  scorer:
    image: ${ecr_backend_url}:latest
    container_name: fuckwork_scorer
    environment:
      DATABASE_URL: $${DATABASE_URL}
      ENVIRONMENT: $${ENVIRONMENT}
    command: python -m scripts.automation.run_scoring
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
COMPOSEEOF

# Create database initialization script
echo "Creating database init script..."
cat > /home/ec2-user/init-database.sh << 'INITDBEOF'
#!/bin/bash
set -e

echo "Initializing database on RDS..."

# Wait for RDS to be ready
echo "Waiting for RDS to be ready..."
for i in {1..30}; do
  if PGPASSWORD="${postgres_password}" psql -h ${rds_hostname} -U fuckwork -d fuckwork -c "SELECT 1" > /dev/null 2>&1; then
    echo "RDS is ready!"
    break
  fi
  echo "Waiting for RDS... ($i/30)"
  sleep 10
done

# Run database initialization via Docker
cd /home/ec2-user/fuckwork
source .env
docker run --rm \
  -e DATABASE_URL="$${DATABASE_URL}" \
  ${ecr_backend_url}:latest \
  python -m scripts.deployment.init_database

echo "Database initialization complete!"
INITDBEOF

chmod +x /home/ec2-user/init-database.sh

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_backend_url}

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/fuckwork
chown ec2-user:ec2-user /home/ec2-user/init-database.sh

# Create systemd service for auto-start
cat > /etc/systemd/system/fuckwork.service << 'SERVICEEOF'
[Unit]
Description=FuckWork Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/fuckwork
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable fuckwork.service

# ============================================================================
# Docker Auto-Cleanup Cron Job
# ============================================================================
echo "Setting up Docker auto-cleanup cron job..."

cat > /usr/local/bin/docker-cleanup.sh << 'CLEANUP'
#!/bin/bash
echo "[$(date)] Starting Docker cleanup..."
docker container prune -f --filter "until=24h"
docker image prune -f
docker images --format "{{.Repository}}:{{.Tag}}" | grep "fuckwork" | tail -n +3 | xargs -r docker rmi 2>/dev/null || true
docker network prune -f
docker system df
echo "[$(date)] Docker cleanup finished"
CLEANUP

chmod +x /usr/local/bin/docker-cleanup.sh

cat > /etc/cron.d/fuckwork-docker-cleanup << 'CRONEOF'
# Docker cleanup daily at 3 AM
0 3 * * * root /usr/local/bin/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
CRONEOF
chmod 644 /etc/cron.d/fuckwork-docker-cleanup

echo "✅ Docker auto-cleanup configured (daily at 3 AM)"

echo "=========================================="
echo "Backend initialization completed!"
echo "=========================================="
echo ""
echo "Services configured:"
echo "  - Backend API (port 80)"
echo "  - Scorer (every 5 minutes)"
echo ""
echo "Database: RDS PostgreSQL"
echo "  Endpoint: ${rds_endpoint}"
echo ""
echo "Next steps:"
echo "1. Run database init: /home/ec2-user/init-database.sh"
echo "2. Start services: cd /home/ec2-user/fuckwork && docker-compose up -d"
echo ""
