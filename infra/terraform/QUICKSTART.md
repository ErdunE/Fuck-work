# 🚀 FuckWork IAM Setup - Quick Start Guide

## ⏱️ Estimated Time: 15 minutes

## ✅ Prerequisites Checklist

- [x] AWS CLI installed and configured with root credentials
- [x] Terraform installed (>= 1.0)
- [x] S3 bucket created: `fuckwork-terraform-state-302222527269`
- [x] DynamoDB table created: `fuckwork-terraform-locks`
- [x] KMS key created: `9b911f43-e48f-483c-a403-b4bd3eb31fdd`

## 📝 Step-by-Step Instructions

### 1️⃣ Create IAM Admin User (2 min)
```bash
cd ~/Desktop/Fuck-work/infra/terraform/scripts
./create-admin-user.sh
```

**⚠️ SAVE THE OUTPUT!** You'll need:
- Access Key ID
- Secret Access Key
- Console password

### 2️⃣ Configure AWS CLI (1 min)
```bash
aws configure --profile erdun-admin
```

Enter:
- Access Key ID: [from step 1]
- Secret Access Key: [from step 1]
- Default region: `us-east-1`
- Default output format: `json`

### 3️⃣ Test the Profile (1 min)
```bash
export AWS_PROFILE=erdun-admin
aws sts get-caller-identity
```

Should show: `"Arn": "arn:aws:iam::302222527269:user/erdun-admin"`

### 4️⃣ Initialize Terraform (2 min)
```bash
cd ~/Desktop/Fuck-work/infra/terraform/environments/dev
terraform init
```

Expected output: `Terraform has been successfully initialized!`

### 5️⃣ Review Changes (3 min)
```bash
terraform plan
```

Review the resources to be created (~30-40 resources).

### 6️⃣ Apply Changes (5 min)
```bash
terraform apply
```

Type `yes` when prompted.

Wait for completion (~3-5 minutes).

### 7️⃣ Save Outputs (1 min)
```bash
terraform output > ../../../docs/iam-outputs.txt
```

This saves all role ARNs for later use.

### 8️⃣ Add Admin to Group (via Console)

1. Open AWS Console: https://302222527269.signin.aws.amazon.com/console
2. IAM → Users → erdun-admin
3. Groups tab → Add user to groups
4. Select `fuckwork-administrators` → Add to groups

### 9️⃣ Enable MFA (via Console)

1. IAM → Users → erdun-admin
2. Security credentials tab
3. Manage → Assign MFA device
4. Use Authenticator app (Google Authenticator, Authy, etc.)

## ✅ Verification

### Check IAM Roles
```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `fuckwork`)].RoleName'
```

Should show 5 roles.

### Check IAM Groups
```bash
aws iam list-groups --query 'Groups[?contains(GroupName, `fuckwork`)].GroupName'
```

Should show 5 groups.

### Check GitHub OIDC Provider
```bash
aws iam list-open-id-connect-providers
```

Should show GitHub provider.

## 🎉 Success!

You're all set! Next steps:

1. ✅ Set up networking infrastructure
2. ✅ Deploy RDS database
3. ✅ Deploy EC2 backend
4. ✅ Set up CI/CD pipelines

## 🆘 Need Help?

Check `README.md` for detailed documentation and troubleshooting.
