# Phase 5.3.3 — Quick Reference: Auth Logging

**Use this to diagnose auth issues in 30 seconds.**

---

## 1️⃣ Open Console

```
LinkedIn Job Page → F12 → Console Tab
```

---

## 2️⃣ Look for These Logs (In Order)

### ✅ Extension Loaded?

```javascript
[FW Content][Init]
  href: https://www.linkedin.com/jobs/view/123
  chrome exists: true
```

**If missing:** Content script not injecting → Check manifest.json

---

### ✅ Token Found?

```javascript
[FW Content][Auth Check]
  token exists: true ← LOOK HERE
  user_id: 1
  fingerprint: a1b2c3d4
```

**If `false`:** User not logged in → Login in Web Control Plane

---

### ✅ Backend Called?

```javascript
[FW Content → Backend][Verify Auth]
  API call: GET /api/auth/me ← LOOK HERE
  user_id from token: 1
```

**If missing:** Token expired or missing → Check previous log

---

### ✅ Backend Response?

```javascript
[FW Content][Backend Response]
  Status: 200 ← LOOK HERE (200 = success, 401 = rejected)
  OK: true
```

**If 401:** Token was revoked → User needs to re-login  
**If 500:** Backend error → Check backend logs  
**If missing:** Network error or CORS → Check backend running

---

### ✅ Auth Successful?

```javascript
[FW Content][Auth Success]
  Backend confirmed user: { id: 1, email: "test@example.com" }
  Match: true ← LOOK HERE
```

**If missing:** Check previous step for error

---

## 3️⃣ Common Failure Patterns

### Pattern 1: No Token

```
[Auth Check]
  token exists: false
```

**Fix:** Login at http://localhost:3000/login

---

### Pattern 2: Token Expired

```
[Auth Check]
  token exists: true
  expires_at: 2025-01-10T12:00:00Z

[FW Auth] Token expired, clearing
```

**Fix:** Re-login (token TTL expired)

---

### Pattern 3: Backend Rejected Token (401)

```
[Backend Response]
  Status: 401
  OK: false

[Auth Failed]
  Backend auth failed (401) -> clearing token
```

**Fix:** Re-login (token was revoked by logout or token_version increment)

---

### Pattern 4: User Mismatch

```
[Auth Success]
  Token user_id: 1
  Backend confirmed user: { id: 2 }
  Match: false

[FW Auth] User mismatch -> clearing token
```

**Fix:** Re-login (account switch detected, security working correctly)

---

### Pattern 5: Backend Not Running

```
[Content → Backend][Verify Auth]
  API call: GET /api/auth/me

// No [Backend Response] log appears
// Network error in console
```

**Fix:** Start backend: `cd apps/backend && python3 run.py`

---

## 4️⃣ Quick Diagnostic Commands

### Check Token in Storage

```javascript
chrome.storage.local.get(['fw_auth_token', 'fw_auth_user_id', 'fw_auth_fingerprint'], console.log)
```

**Expected:**
```javascript
{
  fw_auth_token: "eyJ...",
  fw_auth_user_id: 1,
  fw_auth_fingerprint: "a1b2c3d4"
}
```

---

### Clear Token (Force Re-login)

```javascript
chrome.storage.local.remove(['fw_auth_token', 'fw_auth_user_id', 'fw_auth_fingerprint', 'fw_auth_expires_at', 'fw_auth_issued_at'])
```

---

### Check Active Session

```javascript
chrome.storage.local.get('fw_active_session', console.log)
```

---

## 5️⃣ One-Line Diagnosis

Copy this into console and read the result:

```javascript
(async () => {
  const auth = await chrome.storage.local.get(['fw_auth_token', 'fw_auth_user_id', 'fw_auth_expires_at']);
  const hasToken = !!auth.fw_auth_token;
  const expired = auth.fw_auth_expires_at ? new Date(auth.fw_auth_expires_at) < new Date() : 'unknown';
  console.log({
    hasToken,
    user_id: auth.fw_auth_user_id || 'none',
    expires_at: auth.fw_auth_expires_at || 'none',
    expired
  });
})()
```

**Instant diagnosis:**
- `hasToken: false` → Not logged in
- `hasToken: true, expired: true` → Token expired
- `hasToken: true, expired: false` → Token valid, check backend logs

---

## 6️⃣ Expected Full Log (Happy Path)

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
[FW Session] active_session_attached: { task_id: 42, run_id: 99, ats_type: "linkedin" }
```

**If you see this:** Everything working perfectly! ✅

---

## 7️⃣ Troubleshooting Checklist

- [ ] Backend running? `http://localhost:8000/docs`
- [ ] Web Control Plane running? `http://localhost:3000`
- [ ] Logged in? Check Web Control Plane
- [ ] Extension installed? `chrome://extensions`
- [ ] Extension enabled? Check toggle at `chrome://extensions`
- [ ] Service Worker active? Click "Inspect" at `chrome://extensions`
- [ ] Console showing logs? Check no filters applied
- [ ] Correct tab? Must be on job page (LinkedIn, Workday, etc.)

---

**If still stuck:** Copy full console output and share with team.

