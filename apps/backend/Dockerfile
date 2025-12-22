# ============================================================================
# FuckWork Backend - FastAPI Application
# ============================================================================

FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements directory (prod.txt references base.txt)
COPY requirements/ /app/requirements/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements/prod.txt

# Copy application code
COPY src/ /app/src/
COPY scripts/ /app/scripts/

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run FastAPI application
CMD ["uvicorn", "src.fuckwork.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
