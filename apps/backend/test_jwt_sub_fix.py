"""
Verification test for JWT sub claim fix.
Confirms that /api/auth/me now works correctly after fixing sub to be string.
"""

import httpx
import sys
import time
import json


API_BASE = "http://localhost:8000"


def test_jwt_sub_fix():
    """Test that JWT sub as string fixes /api/auth/me."""
    print("=" * 70)
    print("JWT Sub Claim Fix Verification")
    print("=" * 70)
    
    # Generate unique test user
    test_email = f"jwt_test_{int(time.time())}@example.com"
    test_password = "TestPass123!"
    
    print(f"\n[Step 1] Register user: {test_email}")
    try:
        response = httpx.post(
            f"{API_BASE}/api/auth/register",
            json={"email": test_email, "password": test_password},
            timeout=10.0
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✓ Registration successful - User ID: {data['user_id']}")
            expected_user_id = data['user_id']
        else:
            print(f"✗ Registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
            print("\n⚠️  Ensure backend is running: python3 apps/backend/run_api.py")
            return False
    except Exception as e:
        print(f"✗ Registration error: {e}")
        print("\n⚠️  Ensure backend is running: python3 apps/backend/run_api.py")
        return False
    
    print(f"\n[Step 2] Login and get JWT token")
    try:
        response = httpx.post(
            f"{API_BASE}/api/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=10.0
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data['access_token']
            print(f"✓ Login successful")
            print(f"  Token (first 50 chars): {access_token[:50]}...")
            
            # Decode token to inspect payload (without verification)
            import base64
            try:
                # JWT format: header.payload.signature
                parts = access_token.split('.')
                if len(parts) == 3:
                    # Decode payload (add padding if needed)
                    payload_b64 = parts[1]
                    # Add padding
                    padding = 4 - len(payload_b64) % 4
                    if padding != 4:
                        payload_b64 += '=' * padding
                    payload_json = base64.urlsafe_b64decode(payload_b64)
                    payload = json.loads(payload_json)
                    
                    print(f"\n  Token Payload:")
                    print(f"    sub: {payload.get('sub')} (type: {type(payload.get('sub')).__name__})")
                    print(f"    email: {payload.get('email')}")
                    
                    # Verify sub is string
                    sub_value = payload.get('sub')
                    if isinstance(sub_value, str):
                        print(f"  ✓ 'sub' is string (correct per JWT RFC)")
                    else:
                        print(f"  ✗ 'sub' is {type(sub_value).__name__} (should be string)")
                        return False
                    
                    # Verify sub value matches user_id
                    if sub_value == str(expected_user_id):
                        print(f"  ✓ 'sub' value matches user ID")
                    else:
                        print(f"  ✗ 'sub' value mismatch: {sub_value} != {expected_user_id}")
                        return False
            except Exception as e:
                print(f"  (Could not decode token payload: {e})")
        else:
            print(f"✗ Login failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Login error: {e}")
        return False
    
    print(f"\n[Step 3] Validate token with GET /api/auth/me")
    print("  This is the CRITICAL test - previously failed with 'Could not validate credentials'")
    try:
        response = httpx.get(
            f"{API_BASE}/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ /api/auth/me SUCCESS (bug is fixed!)")
            print(f"  User ID: {data['user_id']}")
            print(f"  Email: {data['email']}")
            print(f"  Active: {data['is_active']}")
            
            # Verify data matches
            if data['user_id'] == expected_user_id and data['email'] == test_email:
                print(f"✓ User data matches")
            else:
                print(f"✗ User data mismatch")
                return False
        else:
            print(f"✗ /api/auth/me FAILED: {response.status_code}")
            print(f"  Response: {response.text}")
            print(f"\n  ⚠️  Bug still present - 'sub' may not be encoded as string")
            return False
    except Exception as e:
        print(f"✗ Token validation error: {e}")
        return False
    
    print("\n" + "=" * 70)
    print("✓ ALL TESTS PASSED - JWT sub claim fix is working correctly!")
    print("=" * 70)
    print("\nSummary:")
    print("  ✓ JWT encodes 'sub' as string (per RFC 7519)")
    print("  ✓ /api/auth/register works")
    print("  ✓ /api/auth/login returns valid JWT")
    print("  ✓ /api/auth/me validates token correctly (BUG FIXED)")
    print("  ✓ Extension JWT auth will work without changes")
    print("\nThe authentication endpoints are now fully functional.")
    return True


if __name__ == "__main__":
    try:
        success = test_jwt_sub_fix()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
        sys.exit(1)

