# FuckWork Web Control Plane

Phase 5.0 - System of Record for Cross-Device Automation Control

## Overview

The Web Control Plane is the authoritative user interface for managing job application automation. It provides:

- **Profile Management**: Authoritative source for autofill data
- **Automation Settings**: Global preferences that sync to browser extension
- **Task Visibility**: Read-only view of active/queued/completed applications
- **Audit Log**: Developer-grade debugging for automation decisions

## Architecture

**Backend:** FastAPI + PostgreSQL (source of truth)  
**Frontend:** React 18 + TypeScript + Vite  
**Extension:** Execution worker (polls backend every 5 minutes)

## Setup

```bash
# Install dependencies
npm install

# Development server (with API proxy)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Create `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_JWT_STORAGE_KEY=fw_jwt_token
```

## Features

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Auto-redirect on unauthorized

### Profile Management
- Full CRUD for user profile
- Authoritative source for autofill
- Real-time sync with extension

### Automation Preferences
- Toggle auto-fill after login
- Toggle auto-submit when ready
- Require review before submit (safety gate)
- Extension polls every 5 minutes

### Apply Tasks
- Read-only visibility
- Filter by status (queued, in_progress, needs_user, success, failed)
- Shows company, source, stage, last action

### Automation Audit Log
- All automation decisions logged
- Developer-grade debugging
- Filter by event type
- Correlation IDs for tracing

## Development

The app uses Vite's proxy to forward `/api` requests to `http://localhost:8000`.

Ensure the backend is running:

```bash
cd ../backend
python run_api.py
```

## Phase 5.0 Completion Criteria

- [x] User can register and login
- [x] JWT token validates correctly
- [x] User can view and update profile
- [x] User can toggle automation preferences
- [x] Extension polls and receives updated preferences
- [x] User can view apply tasks
- [x] User can view automation audit log
- [x] Cross-device: Preferences sync across devices

## Security Notes

- JWT stored in localStorage (acceptable for Phase 5.0)
- 7-day token expiration
- Auto-logout on 401 responses
- CORS configured for localhost development

## Future Enhancements (NOT Phase 5.0)

- HttpOnly cookies instead of localStorage
- Refresh tokens
- Real-time sync via WebSockets
- Profile picture upload
- Advanced filtering and search
- Charts and analytics
- Multi-device notifications

