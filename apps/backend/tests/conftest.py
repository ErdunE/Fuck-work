"""Pytest configuration and fixtures."""
import pytest
import os

@pytest.fixture(scope="session")
def test_env():
    """Set up test environment variables."""
    os.environ["ENVIRONMENT"] = "test"
    os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test_db"
    yield
    
@pytest.fixture
def client():
    """Create test client."""
    from fastapi.testclient import TestClient
    from src.fuckwork.api.main import app
    return TestClient(app)
