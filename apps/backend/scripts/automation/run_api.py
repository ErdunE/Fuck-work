"""
Run the FastAPI server.

Usage:
    python3 run_api.py
"""

import uvicorn
from src.fuckwork.api import app

if __name__ == "__main__":
    uvicorn.run(
        "api.app:app",
        host="localhost",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

