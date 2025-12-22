cd ~/Desktop/Fuck-work

cat > .github/workflows/README.md << 'EOF'
# CI/CD Workflows

## CI (Continuous Integration)
- ✅ `ci-backend.yml` - Backend 代码质量检查和测试
- ✅ `ci-jobspy.yml` - JobSpy 服务代码检查
- ✅ `infra-plan.yml` - Terraform 计划和验证
- ✅ `infra-apply.yml` - Terraform 自动应用

## CD (Continuous Deployment)
- ✅ `deploy-backend.yml` - Backend 自动部署
- ✅ `deploy-jobspy.yml` - JobSpy 自动部署

## 待添加
- `ci-frontend.yml` - Frontend 测试和构建
- `deploy-frontend.yml` - Frontend 部署
EOF