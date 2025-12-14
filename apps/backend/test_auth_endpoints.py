"""
Test authentication endpoints with new bcrypt implementation.
Tests register and login endpoints to ensure they work after removing passlib.
"""

import httpx
import sys
import time

API_BASE = "http://localhost:8000"


def test_auth_endpoints():
    """Test authentication endpoints."""
    print("=" * 60)
    print("Testing Authentication Endpoints (POST bcrypt migration)")
    print("=" * 60)
    
    # Generate unique email to avoid conflicts
    test_email = f"test_bcrypt_{int(time.time())}@example.com"
    test_password = "SecurePassword123!"
    
    print(f"\nTest User: {test_email}")
    print(f"Password: {test_password}")
    
    # Test 1: Register new user
    print("\n[Test 1] POST /api/auth/register...")
    try:
        response = httpx.post(
            f"{API_BASE}/api/auth/register",
            json={"email": test_email, "password": test_password},
            timeout=10.0
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✓ Registration successful")
            print(f"  User ID: {data['user_id']}")
            print(f"  Email: {data['email']}")
            user_id = data['user_id']
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Registration error: {e}")
        print("\nNote: Ensure backend is running: python3 apps/backend/run_api.py")
        return False
    
    # Test 2: Login with correct password
    print("\n[Test 2] POST /api/auth/login (correct password)...")
    try:
        response = httpx.post(
            f"{API_BASE}/api/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=10.0
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Login successful")
            print(f"  Token type: {data['token_type']}")
            print(f"  User ID: {data['user_id']}")
            print(f"  Access token: {data['access_token'][:40]}...")
            access_token = data['access_token']
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Login error: {e}")
        return False
    
    # Test 3: Login with incorrect password
    print("\n[Test 3] POST /api/auth/login (incorrect password)...")
    try:
        response = httpx.post(
            f"{API_BASE}/api/auth/login",
            json={"email": test_email, "password": "WrongPassword123!"},
            timeout=10.0
        )
        
        if response.status_code == 401:
            print(f"✓ Incorrect password correctly rejected (401)")
        else:
            print(f"✗ Expected 401, got: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Login error: {e}")
        return False
    
    # Test 4: Validate token with GET /api/auth/me
    print("\n[Test 4] GET /api/auth/me (validate JWT token)...")
    try:
        response = httpx.get(
            f"{API_BASE}/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Token validated successfully")
            print(f"  User ID: {data['user_id']}")
            print(f"  Email: {data['email']}")
            print(f"  Active: {data['is_active']}")
            
            if data['user_id'] == user_id and data['email'] == test_email:
                print(f"✓ User data matches registered user")
            else:
                print(f"✗ User data mismatch")
                return False
        else:
            print(f"✗ Token validation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Token validation error: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✓ ALL AUTHENTICATION TESTS PASSED")
    print("=" * 60)
    print("\nConclusion:")
    print("  • bcrypt password hashing works correctly")
    print("  • Registration endpoint creates hashed passwords")
    print("  • Login endpoint verifies passwords with bcrypt")
    print("  • JWT token generation and validation works")
    print("  • passlib removal did NOT break authentication")
    return True


if __name__ == "__main__":
    try:
        success = test_auth_endpoints()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
        sys.exit(1)

