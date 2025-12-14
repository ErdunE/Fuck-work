"""
Main FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import jobs, users, ai_answer, apply, auth, profile, preferences, events, tasks

app = FastAPI(
    title="FuckWork API",
    description="Job authenticity scoring, apply automation, and web control plane",
    version="0.5.0",  # Phase 5.0
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-FW-Detection-Id"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])  # Phase 5.0
app.include_router(profile.router, tags=["profile"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(preferences.router, tags=["automation-preferences"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(events.router, tags=["automation-events"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(tasks.router, tags=["apply-tasks"])  # Phase 5.0 - already has /api/users/me prefix
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(ai_answer.router, prefix="/ai", tags=["ai"])
app.include_router(apply.router, prefix="/apply", tags=["apply"])

@app.get("/")
def read_root():
    return {
        "name": "FuckWork API",
        "version": "0.5.0",
        "phase": "5.0 - Web Control Plane"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

