#!/bin/bash
set -e

# ============================================================================
# FuckWork Backend EC2 Initialization Script
# ============================================================================

echo "=========================================="
echo "Starting FuckWork Backend initialization"
echo "=========================================="

# Update system
echo "Updating system packages..."
dnf update -y

# Install Docker

# Install cronie for cron jobs
echo "Installing cronie..."
dnf install -y cronie
systemctl start crond
systemctl enable crond
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

# Create application directory
echo "Creating application directory..."
mkdir -p /home/ec2-user/fuckwork
cd /home/ec2-user/fuckwork

# Create environment file
echo "Creating environment file..."
cat > .env << 'ENVEOF'
# Database Configuration
POSTGRES_USER=fuckwork
POSTGRES_PASSWORD=${postgres_password}
POSTGRES_DB=fuckwork

# Application Configuration
DATABASE_URL=postgresql://fuckwork:${postgres_password}@postgres:5432/fuckwork
ENVIRONMENT=dev

# AWS Configuration
AWS_REGION=${region}
S3_BACKUPS_BUCKET=${s3_backups_bucket}
ENVEOF

# Create docker-compose.yml
echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSEEOF'
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: fuckwork_postgres
    environment:
      POSTGRES_USER: $${POSTGRES_USER}
      POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
      POSTGRES_DB: $${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: ${ecr_backend_url}:latest
    container_name: fuckwork_backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: $${DATABASE_URL}
      ENVIRONMENT: $${ENVIRONMENT}
      AWS_REGION: $${AWS_REGION}
      S3_BACKUPS_BUCKET: $${S3_BACKUPS_BUCKET}
    ports:
      - "80:8000"
    restart: unless-stopped

volumes:
  postgres_data:
COMPOSEEOF

# Create backup script
echo "Creating backup script..."
cat > /home/ec2-user/backup-postgres.sh << 'BACKUPEOF'
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fuckwork_backup_$${TIMESTAMP}.sql.gz"
BACKUP_DIR="/home/ec2-user/fuckwork/backups"
S3_BUCKET="${s3_backups_bucket}"

mkdir -p $${BACKUP_DIR}

echo "Creating database backup..."
docker exec fuckwork_postgres pg_dump -U fuckwork fuckwork | gzip > $${BACKUP_DIR}/$${BACKUP_FILE}

echo "Uploading to S3..."
aws s3 cp $${BACKUP_DIR}/$${BACKUP_FILE} s3://$${S3_BUCKET}/postgres/

echo "Cleaning up old local backups..."
cd $${BACKUP_DIR}
ls -t fuckwork_backup_*.sql.gz | tail -n +8 | xargs -r rm --

echo "Backup completed: $${BACKUP_FILE}"
BACKUPEOF

chmod +x /home/ec2-user/backup-postgres.sh

# Setup daily backups via cron
echo "Setting up daily backups..."
(crontab -u ec2-user -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1") | crontab -u ec2-user -

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_backend_url}

# Note: Backend image needs to be pushed to ECR first
echo "NOTE: Backend Docker image not pulled yet."
echo "Please push your image to ECR first:"
echo "  ${ecr_backend_url}:latest"

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/fuckwork

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

# Create cleanup script
cat > /usr/local/bin/docker-cleanup.sh << 'CLEANUP'
#!/bin/bash
# Docker cleanup script - runs daily at 3 AM

echo "[$(date)] Starting Docker cleanup..."

# Remove stopped containers (older than 24 hours)
docker container prune -f --filter "until=24h"

# Remove dangling images (untagged)
docker image prune -f

# Remove unused images (keep last 2 versions)
# This will remove old ECR images but keep the latest 2
docker images --format "{{.Repository}}:{{.Tag}}" | grep "fuckwork" | tail -n +3 | xargs -r docker rmi 2>/dev/null || true

# Remove unused networks
docker network prune -f

# Show remaining usage
echo "[$(date)] Cleanup complete. Current usage:"
docker system df

echo "[$(date)] Docker cleanup finished"
CLEANUP

chmod +x /usr/local/bin/docker-cleanup.sh

# Add to cron (runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1") | crontab -

echo "✅ Docker auto-cleanup configured (daily at 3 AM)"

echo "=========================================="
echo "Backend initialization completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Push backend Docker image to: ${ecr_backend_url}"
echo "2. SSH into instance: ssh -i ~/.ssh/fuckwork-dev ec2-user@<PUBLIC_IP>"
echo "3. Start services: cd /home/ec2-user/fuckwork && docker-compose up -d"
echo ""


