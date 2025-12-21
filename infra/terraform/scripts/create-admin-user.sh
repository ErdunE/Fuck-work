#!/bin/bash
# ============================================================================
# Create IAM Admin User
# ============================================================================
# This script creates an IAM admin user to replace root account usage
# Run this ONCE with root credentials before running Terraform

set -e

# Configuration
ADMIN_USERNAME="erdun-admin"
ADMIN_GROUP="fuckwork-administrators"
ACCOUNT_ID="302222527269"

echo "============================================================================"
echo "Creating IAM Admin User: $ADMIN_USERNAME"
echo "============================================================================"

# Check if user already exists
if aws iam get-user --user-name "$ADMIN_USERNAME" 2>/dev/null; then
    echo "✅ User $ADMIN_USERNAME already exists"
else
    echo "📝 Creating user: $ADMIN_USERNAME"
    aws iam create-user --user-name "$ADMIN_USERNAME"
    echo "✅ User created"
fi

# Enable console access
echo "📝 Setting up console password..."
echo "Please enter a password for $ADMIN_USERNAME (min 14 characters):"
read -s PASSWORD

aws iam create-login-profile \
    --user-name "$ADMIN_USERNAME" \
    --password "$PASSWORD" \
    --password-reset-required 2>/dev/null || \
    echo "⚠️  Login profile already exists"

# Create access keys
echo "📝 Creating access keys..."
KEYS=$(aws iam create-access-key --user-name "$ADMIN_USERNAME" 2>/dev/null || echo "")

if [ -n "$KEYS" ]; then
    ACCESS_KEY_ID=$(echo "$KEYS" | jq -r '.AccessKey.AccessKeyId')
    SECRET_ACCESS_KEY=$(echo "$KEYS" | jq -r '.AccessKey.SecretAccessKey')
    
    echo ""
    echo "============================================================================"
    echo "✅ IAM User Created Successfully!"
    echo "============================================================================"
    echo ""
    echo "Username: $ADMIN_USERNAME"
    echo "Console URL: https://$ACCOUNT_ID.signin.aws.amazon.com/console"
    echo ""
    echo "⚠️  SAVE THESE CREDENTIALS SECURELY - THEY WON'T BE SHOWN AGAIN:"
    echo ""
    echo "Access Key ID: $ACCESS_KEY_ID"
    echo "Secret Access Key: $SECRET_ACCESS_KEY"
    echo ""
    echo "============================================================================"
    echo "Next Steps:"
    echo "============================================================================"
    echo ""
    echo "1. Configure AWS CLI with new credentials:"
    echo "   aws configure --profile erdun-admin"
    echo "   AWS Access Key ID: $ACCESS_KEY_ID"
    echo "   AWS Secret Access Key: $SECRET_ACCESS_KEY"
    echo "   Default region: us-east-1"
    echo ""
    echo "2. Test the profile:"
    echo "   export AWS_PROFILE=erdun-admin"
    echo "   aws sts get-caller-identity"
    echo ""
    echo "3. Run Terraform to create IAM groups and roles:"
    echo "   cd ~/Desktop/Fuck-work/infra/terraform/environments/dev"
    echo "   terraform init"
    echo "   terraform plan"
    echo "   terraform apply"
    echo ""
    echo "4. Add $ADMIN_USERNAME to Administrators group via AWS Console"
    echo ""
    echo "5. Enable MFA for $ADMIN_USERNAME via AWS Console"
    echo ""
    echo "============================================================================"
else
    echo "✅ Access keys already exist for this user"
    echo ""
    echo "Next step: Add $ADMIN_USERNAME to the Administrators group"
fi
