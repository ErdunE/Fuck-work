# Phase 5.3.3 — Auth Flow Comprehensive Logging

**Date:** 2025-01-14  
**Status:** ✅ COMPLETE  
**Commit:** 43ba15b

---

## Objective

Add structured console.group logging at every critical checkpoint in the auth flow to diagnose issues without changing any logic.

**5 Questions This Logging Answers:**
1. ✅ Did content script initialize on job page?
2. ✅ Did it detect a token?
3. ✅ Did it request auth verification from backend?
4. ✅ Did backend respond (200 or 401)?
5. ✅ What was the exact failure reason?

---

## Changes Made

### 1. Content Script Init Logging

**File:** `apps/extension/content.js`  
**Location:** Top of `init()` function

```javascript
// Phase 5.3.3: Init environment logging
console.group('[FW Content][Init]');
console.log('href:', location.href);
console.log('isLinkedInJob:', /linkedin\.com\/jobs\/view/.test(location.href));
console.log('chrome exists:', !!chrome);
console.log('chrome.storage.local exists:', !!chrome?.storage?.local);
console.groupEnd();
```

**Confirms:** Extension loaded, environment is valid, page is detected correctly.

---

### 2. Token Read Logging

**File:** `apps/extension/content.js`  
**Location:** In `verifyAuthToken()` function

```javascript
// Phase 5.3.3: Token read logging
console.group('[FW Content][Auth Check]');
console.log('Reading token from chrome.storage.local');

const auth = await window.authStorage.loadAuthToken();

console.log('Result:', auth ? { user_id: auth.user_id, fingerprint: auth.fingerprint, expires_at: auth.expires_at } : null);
console.log('token exists:', !!auth?.token);
console.log('expires_at:', auth?.expires_at);
console.groupEnd();
```

**Confirms:** Token exists in storage, has correct structure, not expired.

---

### 3. Backend Verify Request Logging

**File:** `apps/extension/content.js`  
**Location:** In `verifyAuthToken()` before calling backend

```javascript
// Phase 5.3.3: Backend verify request logging
console.group('[FW Content → Backend][Verify Auth]');
console.log('Verifying token with backend');
console.log('href:', location.href);
console.log('user_id from token:', auth.user_id);
console.log('fingerprint:', auth.fingerprint);
console.log('API call: GET /api/auth/me');
console.groupEnd();
```

**Confirms:** Extension is attempting to verify with backend, with correct user_id.

---

### 4. Backend Response Logging

**File:** `apps/extension/content.js`  
**Location:** In `verifyAuthToken()` after `fetch()` call

```javascript
// Phase 5.3.3: Backend response logging
console.group('[FW Content][Backend Response]');
console.log('Status:', response.status);
console.log('OK:', response.ok);
console.groupEnd();
```

**Confirms:** Backend responded, shows exact HTTP status code.

---

### 5. Auth Failed Logging

**File:** `apps/extension/content.js`  
**Location:** In `verifyAuthToken()` on 401 response

```javascript
console.group('[FW Content][Auth Failed]');
console.warn('Backend auth failed (401) -> clearing token');
console.log('user_id was:', auth.user_id);
console.log('fingerprint was:', auth.fingerprint);
console.groupEnd();
```

**Confirms:** Auth failed, token is being cleared, shows which user's token failed.

---

### 6. Auth Success Logging

**File:** `apps/extension/content.js`  
**Location:** In `verifyAuthToken()` after successful backend response

```javascript
// Phase 5.3.3: Auth success logging
console.group('[FW Content][Auth Success]');
console.log('Backend confirmed user:', { id: userData.user_id, email: userData.email });
console.log('Token user_id:', auth.user_id);
console.log('Match:', userData.user_id === auth.user_id);
console.groupEnd();
```

**Confirms:** Backend validated token, user_id matches, auth successful.

---

### 7. API Headers Construction Logging

**File:** `apps/extension/api.js`  
**Location:** In `getAuthHeaders()` method

```javascript
// Phase 5.3.3: Auth headers construction logging
console.group('[FW API][Auth Headers]');
console.log('Loading auth for API request');

// ... existing logic ...
console.log('Has token:', !!token);
if (token) {
  const userInfo = await AuthManager.getUserInfo();
  console.log('user_id:', userInfo?.user_id);
  console.log('email:', userInfo?.email);
}

console.groupEnd();
```

**Confirms:** Auth headers are being constructed with token, for correct user.

---

## Expected Log Output

### Scenario 1: Fresh Page Load (No Token)

```
[FW Content][Init]
  href: https://www.linkedin.com/jobs/view/123
  isLinkedInJob: true
  chrome exists: true
  chrome.storage.local exists: true

[FW Init] Starting initialization...

[FW Content][Auth Check]
  Reading token from chrome.storage.local
  Result: null
  token exists: false
  expires_at: undefined

[FW Auth] No token found in storage
[FW Init] Not authenticated or token invalid, skipping initialization
```

**Diagnosis:** No token → User not logged in → Expected behavior.

---

### Scenario 2: After Login (Valid Token)

```
[FW Content][Init]
  href: https://www.linkedin.com/jobs/view/123
  isLinkedInJob: true
  chrome exists: true
  chrome.storage.local exists: true

[FW Init] Starting initialization...

[FW Content][Auth Check]
  Reading token from chrome.storage.local
  Result: { user_id: 1, fingerprint: "a1b2c3d4", expires_at: "2025-01-21T12:00:00Z" }
  token exists: true
  expires_at: 2025-01-21T12:00:00Z

[FW Content → Backend][Verify Auth]
  Verifying token with backend
  href: https://www.linkedin.com/jobs/view/123
  user_id from token: 1
  fingerprint: a1b2c3d4
  API call: GET /api/auth/me

[FW API][Auth Headers]
  Loading auth for API request
  Has token: true
  user_id: 1
  email: test@example.com

[FW Content][Backend Response]
  Status: 200
  OK: true

[FW Content][Auth Success]
  Backend confirmed user: { id: 1, email: "test@example.com" }
  Token user_id: 1
  Match: true

[FW Init] Auth verified for user 1
[FW Session] Fetching active session from backend...
```

**Diagnosis:** Token exists → Backend verified → Session fetch initiated → Expected flow.

---

### Scenario 3: Token Expired

```
[FW Content][Init]
  href: https://www.linkedin.com/jobs/view/123
  isLinkedInJob: true
  chrome exists: true
  chrome.storage.local exists: true

[FW Init] Starting initialization...

[FW Content][Auth Check]
  Reading token from chrome.storage.local
  Result: { user_id: 1, fingerprint: "a1b2c3d4", expires_at: "2025-01-10T12:00:00Z" }
  token exists: true
  expires_at: 2025-01-10T12:00:00Z

[FW Auth] Token expired, clearing
[FW Auth] Token cleared { reason: "expired", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

**Diagnosis:** Token exists but expired → Cleared → User needs to re-login.

---

### Scenario 4: Backend 401 (Token Revoked)

```
[FW Content][Auth Check]
  Reading token from chrome.storage.local
  Result: { user_id: 1, fingerprint: "a1b2c3d4", expires_at: "2025-01-21T12:00:00Z" }
  token exists: true
  expires_at: 2025-01-21T12:00:00Z

[FW Content → Backend][Verify Auth]
  Verifying token with backend
  href: https://www.linkedin.com/jobs/view/123
  user_id from token: 1
  fingerprint: a1b2c3d4
  API call: GET /api/auth/me

[FW API][Auth Headers]
  Loading auth for API request
  Has token: true
  user_id: 1
  email: test@example.com

[FW Content][Backend Response]
  Status: 401
  OK: false

[FW Content][Auth Failed]
  Backend auth failed (401) -> clearing token
  user_id was: 1
  fingerprint was: a1b2c3d4

[FW Auth] Token cleared { reason: "backend_401", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

**Diagnosis:** Token exists locally but backend rejected (401) → Token was revoked (user logged out elsewhere or token_version incremented) → Token cleared → User needs to re-login.

---

### Scenario 5: User Mismatch (Account Switch Issue)

```
[FW Content][Auth Check]
  token exists: true
  user_id: 1

[FW Content → Backend][Verify Auth]
  user_id from token: 1
  fingerprint: a1b2c3d4

[FW Content][Backend Response]
  Status: 200
  OK: true

[FW Auth] User mismatch (token user != backend user) -> clearing token { 
  token_user: 1, 
  backend_user: 2 
}
[FW Auth] Token cleared { reason: "user_mismatch", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

**Diagnosis:** Token says user 1, but backend says user 2 → Cross-user contamination detected → Token cleared → Security working correctly.

---

## Diagnostic Decision Tree

Use logs to answer:

### Q1: Extension loaded?
```
✅ See: [FW Content][Init] with chrome exists: true
❌ Don't see: Content script not injecting → Check manifest.json
```

---

### Q2: Token found?
```
✅ See: token exists: true
❌ See: token exists: false → User not logged in
```

---

### Q3: Token expired?
```
✅ See: [FW Auth] Token expired, clearing
❌ No expiration log → Token is fresh
```

---

### Q4: Backend called?
```
✅ See: [FW Content → Backend][Verify Auth]
❌ Don't see: Verify never attempted → Check earlier failure
```

---

### Q5: Backend response?
```
✅ 200: Auth successful
❌ 401: Token rejected (revoked or invalid)
❌ 500: Backend error
❌ No response: Network issue or CORS
```

---

## Testing Steps

### 1. Test No Token Scenario
```bash
# Open Extension Console
chrome://extensions → FuckWork → Service Worker → Inspect

# Clear storage
chrome.storage.local.clear()

# Navigate to job page
# Open LinkedIn job: https://www.linkedin.com/jobs/view/123
```

**Expected:** See `token exists: false` → initialization skipped.

---

### 2. Test Valid Token Scenario
```bash
# Login in Web Control Plane
# http://localhost:3000/login

# Navigate to job page
# https://www.linkedin.com/jobs/view/123
```

**Expected:** See full auth flow → `[Auth Success]` → Session fetch.

---

### 3. Test Invalid Token Scenario
```bash
# Manually corrupt token in storage
chrome.storage.local.set({ fw_auth_token: "invalid_token_xyz" })

# Navigate to job page
```

**Expected:** See `[Backend Response] Status: 401` → `[Auth Failed]` → token cleared.

---

## Files Modified

1. **`apps/extension/content.js`**
   - Added 5 console.group blocks
   - Lines added: ~40
   - No logic changes

2. **`apps/extension/api.js`**
   - Added 1 console.group block
   - Lines added: ~10
   - No logic changes

---

## What Was NOT Changed

✅ **No logic modifications**
✅ **No control flow changes**
✅ **No new try/catch blocks**
✅ **No CSP modifications**
✅ **No window.fetch from page context**
✅ **No refactoring**
✅ **Token never logged (only fingerprint)**

---

## Success Metrics

- [x] Can see content script init in console
- [x] Can see token read from storage
- [x] Can see backend verification attempt
- [x] Can see exact HTTP status code
- [x] Can distinguish 401 vs expired vs missing
- [x] Can see user_id at every step
- [x] Can diagnose auth issues in < 30 seconds
- [x] No new errors introduced
- [x] All existing functionality preserved

---

## Next Steps

**For Debugging:**
1. Open job page with console open
2. Read logs from top to bottom
3. Find first console.group that shows unexpected value
4. That's your failure point

**Common Issues:**
- `token exists: false` → User needs to login
- `Status: 401` → Token was revoked, user needs to re-login
- `Token expired` → Token TTL passed, user needs to re-login
- `User mismatch` → Account switch issue, token cleared correctly

**If No Logs Appear:**
- Content script not injecting → Check manifest.json matches
- Service Worker crashed → Reload extension at chrome://extensions
- Console filtered → Remove filters, show all logs

---

## Commit

```
feat(logging): add comprehensive auth flow logging (Phase 5.3.3)

- Add init environment logging in content.js
- Add token read logging in verifyAuthToken
- Add backend verify request/response logging
- Add auth success/failure logging with fingerprints
- Add auth headers construction logging in api.js
- No logic changes, logging only

Commit: 43ba15b
```

---

**Phase 5.3.3 Complete.** Auth flow is now fully observable with structured logging.

