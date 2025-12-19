"""
Quick test script to verify bcrypt authentication after removing passlib.
Tests hash_password() and verify_password() functions.
"""

import sys
from api.auth.password import hash_password, verify_password


def test_bcrypt_authentication():
    """Test password hashing and verification."""
    print("=" * 60)
    print("Testing bcrypt authentication (passlib removed)")
    print("=" * 60)
    
    # Test 1: Hash a password
    print("\n[Test 1] Hashing password...")
    test_password = "testpass123"
    hashed = hash_password(test_password)
    print(f"✓ Password hashed successfully")
    print(f"  Original: {test_password}")
    print(f"  Hashed: {hashed[:50]}...")
    
    # Test 2: Verify correct password
    print("\n[Test 2] Verifying correct password...")
    is_valid = verify_password(test_password, hashed)
    if is_valid:
        print("✓ Correct password verified successfully")
    else:
        print("✗ FAILED: Correct password not verified")
        return False
    
    # Test 3: Verify incorrect password
    print("\n[Test 3] Verifying incorrect password...")
    is_valid = verify_password("wrongpassword", hashed)
    if not is_valid:
        print("✓ Incorrect password correctly rejected")
    else:
        print("✗ FAILED: Incorrect password was accepted")
        return False
    
    # Test 4: Multiple hashes of same password are different (salt works)
    print("\n[Test 4] Testing salt uniqueness...")
    hash1 = hash_password(test_password)
    hash2 = hash_password(test_password)
    if hash1 != hash2:
        print("✓ Different salts generated (hashes are unique)")
    else:
        print("✗ FAILED: Same hash generated (salt not working)")
        return False
    
    # Test 5: Both hashes verify correctly
    print("\n[Test 5] Both hashes verify correctly...")
    if verify_password(test_password, hash1) and verify_password(test_password, hash2):
        print("✓ Both unique hashes verify the same password")
    else:
        print("✗ FAILED: Hash verification inconsistent")
        return False
    
    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED - bcrypt authentication working correctly")
    print("=" * 60)
    return True


if __name__ == "__main__":
    try:
        success = test_bcrypt_authentication()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

