"""
Main FastAPI application.
"""

import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .routers import (
    jobs, users, ai_answer, apply, auth, profile, preferences, events, tasks,
    profile_education, profile_experience, profile_projects, profile_skills,  # Phase 5.2
    derived_profile,  # Phase 5.2.1
    observability,  # Phase 5.3.0
    active_session  # Phase 5.3.1
)

app = FastAPI(
    title="FuckWork API",
    description="Job authenticity scoring, apply automation, and web control plane",
    version="0.5.3.0",  # Phase 5.3.0
)

# Phase 5.3.0: Request ID Middleware
class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Generates a unique request_id for each request and adds it to response headers.
    Enables correlation of backend events with API requests.
    """
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-FW-Detection-Id", "X-Request-ID"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])  # Phase 5.0
app.include_router(profile.router, tags=["profile"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(preferences.router, tags=["automation-preferences"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(events.router, tags=["automation-events"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(tasks.router, tags=["apply-tasks"])  # Phase 5.0 - already has /api/users/me prefix
# Phase 5.2: Profile collections CRUD
app.include_router(profile_education.router, tags=["profile", "education"])  # /api/users/me/education
app.include_router(profile_experience.router, tags=["profile", "experience"])  # /api/users/me/experience
app.include_router(profile_projects.router, tags=["profile", "projects"])  # /api/users/me/projects
app.include_router(profile_skills.router, tags=["profile", "skills"])  # /api/users/me/skills
# Phase 5.2.1: Derived Profile (ATS-ready answers)
app.include_router(derived_profile.router, tags=["derived-profile"])  # /api/users/me/derived-profile
# Phase 5.3.0: Observability Console
app.include_router(observability.router, tags=["observability"])  # /api/observability/*
# Phase 5.3.1: Session Bridge
app.include_router(active_session.router, tags=["active-session"])  # /api/users/me/active-session
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(ai_answer.router, prefix="/ai", tags=["ai"])
app.include_router(apply.router, prefix="/apply", tags=["apply"])

@app.get("/")
def read_root():
    return {
        "name": "FuckWork API",
        "version": "0.5.3.1",
        "phase": "5.3.1 - Session Bridge (E2E Unblock)"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

