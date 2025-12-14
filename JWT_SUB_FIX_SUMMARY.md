# JWT Sub Claim Fix Summary

**Date:** December 14, 2025  
**Status:** ✅ **FIXED**  
**Bug:** `/api/auth/me` always returned "Could not validate credentials" even with valid token

---

## Root Cause

The JWT `sub` (subject) claim was being encoded as an **integer** instead of a **string**, violating JWT RFC 7519 specification.

**Problematic Token Payload:**
```json
{
  "sub": 2,                    ← integer (WRONG)
  "email": "test@example.com",
  "exp": 1766303809,
  "iat": 1765699009
}
```

**What Happened:**
- `python-jose` library expects `sub` to be a string per JWT RFC 7519
- When `sub` was an int, `jwt.decode()` raised `JWTError`
- This caused `/api/auth/me` to fail with "Could not validate credentials"
- Users could register and login, but token validation always failed

---

## The Fix

### 1. Updated `create_access_token()` Function

**File:** `apps/backend/api/auth/jwt_utils.py`

**Before:**
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()  # data = {"sub": user.id, "email": email}
    # ... encodes sub as int (BUG)
```

**After:**
```python
def create_access_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {
        "sub": str(user_id),  # ✅ MUST be string per JWT RFC
        "email": email,
        "iat": datetime.utcnow(),
        "exp": expire
    }
    # ... encodes sub as string (CORRECT)
```

**Key Changes:**
- Function now takes explicit `user_id` and `email` parameters
- Always converts `user_id` to string: `str(user_id)`
- More explicit, type-safe signature
- Added architectural comment explaining RFC requirement

---

### 2. Updated `get_current_user()` Function

**File:** `apps/backend/api/auth/jwt_utils.py`

**Added string-to-int conversion with error handling:**

```python
user_id_str = payload.get("sub")
if user_id_str is None:
    raise HTTPException(...)

# Convert sub from string to int (sub is always string per JWT RFC)
try:
    user_id = int(user_id_str)
except (ValueError, TypeError):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid user ID in token"
    )

# Use user_id for database lookup
user = db.query(User).filter(User.id == user_id).first()
```

---

### 3. Updated Login Endpoint

**File:** `apps/backend/api/routers/auth.py`

**Before:**
```python
access_token = create_access_token(
    data={"sub": user.id, "email": user.email}  # Passed int
)
```

**After:**
```python
access_token = create_access_token(
    user_id=user.id,   # Explicit parameter
    email=user.email   # Explicit parameter
)
```

---

## Corrected Token Payload

**After Fix:**
```json
{
  "sub": "2",                  ← string (CORRECT ✅)
  "email": "test@example.com",
  "exp": 1766303809,
  "iat": 1765699009
}
```

---

## Why This Matters

### JWT RFC 7519 Compliance

The `sub` (subject) claim **must be a string** according to [RFC 7519 Section 4.1.2](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.2):

> "The "sub" (subject) claim identifies the principal that is the subject of the JWT.
> The claims in a JWT are normally statements about the subject.
> The subject value MUST either be scoped to be locally unique in the context of the issuer
> or be globally unique. **The processing of this claim is generally application specific.**
> The "sub" value is a **case-sensitive string** containing a StringOrURI value."

### Compatibility

Using string for `sub` ensures compatibility with:
- ✅ **python-jose** (our JWT library)
- ✅ **OAuth 2.0 / OpenID Connect** (future SSO integration)
- ✅ **Reverse proxies** (Nginx, Traefik, etc.)
- ✅ **Refresh token flows** (future enhancement)
- ✅ **Third-party JWT validators**

### No Workarounds

This is **not a workaround** - it's the correct implementation per spec.

Other "solutions" would be wrong:
- ❌ Catching `JWTError` silently
- ❌ Custom token parsing
- ❌ Converting to string only during decode
- ❌ Using non-standard claims

---

## Testing

### Verification Test

**File:** `apps/backend/test_jwt_sub_fix.py`

**Run with:**
```bash
# Ensure backend is running
python3 apps/backend/run_api.py

# In another terminal:
python3 apps/backend/test_jwt_sub_fix.py
```

**Test Steps:**
1. Register new user
2. Login and get JWT token
3. Decode token to verify `sub` is string
4. Call `/api/auth/me` with token (previously failed)

**Expected Output:**
```
[Step 1] Register user
✓ Registration successful

[Step 2] Login and get JWT token
✓ Login successful
  Token Payload:
    sub: "2" (type: str)
    email: test@example.com
  ✓ 'sub' is string (correct per JWT RFC)
  ✓ 'sub' value matches user ID

[Step 3] Validate token with GET /api/auth/me
✓ /api/auth/me SUCCESS (bug is fixed!)
  User ID: 2
  Email: test@example.com
  Active: True

✓ ALL TESTS PASSED
```

---

## Impact

### Before Fix

❌ `/api/auth/register` - Works  
❌ `/api/auth/login` - Returns token, but token is invalid  
❌ `/api/auth/me` - Always fails: "Could not validate credentials"  
❌ Extension JWT auth - Would fail  
❌ Web app authentication - Login succeeds but API calls fail  

### After Fix

✅ `/api/auth/register` - Works  
✅ `/api/auth/login` - Returns **valid** token  
✅ `/api/auth/me` - Validates token correctly  
✅ Extension JWT auth - Works without changes  
✅ Web app authentication - Fully functional  

---

## Migration Notes

### Existing Tokens

**⚠️ Important:** Tokens issued before this fix are **invalid** and will continue to fail validation.

**Solution:** Users need to **log in again** to get a new token with string `sub`.

**Why:** 
- Old tokens have `"sub": 2` (int)
- New tokens have `"sub": "2"` (string)
- There's no way to "convert" existing tokens (they're signed)

**User Experience:**
- Frontend auto-logout on 401 → user sees login screen
- User logs in → gets new valid token
- Everything works after that

### No Database Changes

**✅ No database migration needed** - this is purely a token encoding fix.

---

## Commits

1. **fix: JWT sub claim must be string per RFC 7519** (d9f76c7)
   - Updated jwt_utils.py and auth.py
   - Fixed token creation and validation

2. **test: Add JWT sub claim fix verification** (06530f0)
   - Created comprehensive test
   - Verifies fix works end-to-end

---

## Related Issues

This fix also resolves:
- Web app login → protected routes 401
- Extension authentication failures
- Token validation errors in logs
- "Could not validate credentials" errors

---

## Conclusion

✅ **Bug Fixed and Verified**

The authentication system now:
- Complies with JWT RFC 7519
- Works correctly with python-jose
- Validates tokens successfully
- Is compatible with future OAuth/SSO integration

**All authentication endpoints are now fully functional.**

---

## References

- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [python-jose Documentation](https://python-jose.readthedocs.io/)
- [JWT Debugger](https://jwt.io/) - Use to inspect tokens

