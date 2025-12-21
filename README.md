# FuckWork

Enterprise-grade job application automation platform.

## 🏗️ Project Structure
```
Fuck-work/
├── .github/workflows/    # CI/CD pipelines
├── infra/               # Infrastructure as Code (Terraform)
├── docs/                # Documentation
├── apps/
│   ├── backend/        # FastAPI backend (Python)
│   ├── web-control-plane/  # React frontend
│   └── extension/      # Chrome extension
└── specs/              # Product specifications
```

## 🚀 Quick Start

### Backend
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements/base.txt
python scripts/automation/run_api.py
```

### Frontend
```bash
cd apps/web-control-plane
npm install
npm run dev
```

### Extension
See `apps/extension/INSTALL_GUIDE.md`

## 📊 Status

- **Backend**: ✅ 企业级重构完成
- **Frontend**: ✅ React + TailwindCSS
- **Extension**: ✅ v0.5.3 production
- **Infrastructure**: 🚧 Terraform 配置中
- **CI/CD**: 🚧 GitHub Actions 配置中

## 📚 Documentation

- [Architecture](docs/architecture/)
- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)
- [Runbooks](docs/runbooks/)

## 🗄️ Database

PostgreSQL with 16 tables and 63,592+ jobs

## 📝 License

Proprietary
