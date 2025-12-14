"""
Main FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import jobs, users, ai_answer, apply

app = FastAPI(
    title="FuckWork API",
    description="Job authenticity scoring and search API",
    version="0.3.1",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(ai_answer.router, prefix="/ai", tags=["ai"])
app.include_router(apply.router, prefix="/apply", tags=["apply"])

@app.get("/")
def read_root():
    return {
        "name": "FuckWork API",
        "version": "0.3.1",
        "phase": "3.1 - Query Layer"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

