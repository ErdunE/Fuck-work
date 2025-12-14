# Phase 5.3.2 — Happy Path Log Example

**Date:** 2025-01-14  
**Purpose:** Reference log output for successful auth bridge flow

---

## Complete Happy Path Logs

### 1️⃣ Web Console (http://localhost:3000)

**Location:** Browser DevTools → Console (on Web Control Plane tab)

```javascript
// User clicks "Login" button
[FW Web Auth] Broadcasting auth bootstrap to extension { userId: 1 }
```

---

### 2️⃣ Extension Content Script Console (http://localhost:3000)

**Location:** Browser DevTools → Console (same tab as Web App)

```javascript
// Content script receives postMessage from Web App
[FW Auth Content] Received auth bootstrap from Web Control Plane { user_id: 1, mode: "replace" }

// Clears any existing token first
[FW Auth] Token cleared { reason: "bootstrap_replace", user_id: null, fingerprint: null }

// Stores new token with fingerprint
[FW Auth] Token stored { 
  user_id: 1, 
  expires_at: "2025-01-21T12:00:00Z", 
  fingerprint: "a1b2c3d4", 
  issued_at: "2025-01-14T12:00:00Z" 
}

// Forwards to background
[FW Auth Content] Auth bootstrap complete, notifying background
```

---

### 3️⃣ Extension Background Console (Service Worker)

**Location:** chrome://extensions → FuckWork Apply Worker → Service Worker → "Inspect"

```javascript
// Background receives message from content script
[FW Auth Background] Received auth bootstrap complete { 
  user_id: 1, 
  expires_at: "2025-01-21T12:00:00Z", 
  from_tab: 123 
}

// Confirmation logs
[FW Auth Background] Token stored successfully
[FW Auth Background] Authenticated as user_id 1
```

**✅ CRITICAL:** If you see these 3 lines in background console, auth bridge is working!

---

### 4️⃣ Extension Content Script Console (Job Page)

**Location:** Browser DevTools → Console (on job page tab, e.g., linkedin.com/jobs/view/123)

```javascript
// Content script auto-injects on page load
[FW Injected] content.js loaded

// Initialization starts
[FW Init] Starting initialization...

// Verifies token with backend
[FW Auth] Verifying token with backend... { user_id: 1, fingerprint: "a1b2c3d4" }

// Backend confirms token is valid
[FW Auth] Token verified successfully { user_id: 1, email: "test@example.com" }

// Proceeds with initialization
[FW Init] Auth verified for user 1

// Fetches active session
[FW Session] Fetching active session from backend...
[FW Session] Active session fetch result: { active: true, has_run_id: true, has_task_id: true }

// Validates URL match
[FW Session] active_session_url_match: true { 
  current: "https://www.linkedin.com/jobs/view/123", 
  expected: "https://www.linkedin.com/jobs/view/123" 
}

// Session attached successfully
[FW Session] active_session_attached: { 
  task_id: 42, 
  run_id: 99, 
  ats_type: "linkedin" 
}

// Initialization complete
[FW Init] Proceeding with initialization

// Observability starts
[Observability] Using existing run_id from session: 99
[Observability] Run started: 99

// Session attached event logged
[Observability] Event enqueued: session_attached
```

---

## Logout Flow Logs

### 1️⃣ Web Console (http://localhost:3000)

```javascript
// User clicks "Logout" button
[FW Web Auth] Broadcasting auth clear to extension { reason: "logout" }
```

---

### 2️⃣ Extension Content Script Console (http://localhost:3000)

```javascript
// Content script receives logout message
[FW Auth Content] Received auth clear from Web Control Plane { reason: "logout" }

// Clears token
[FW Auth] Token cleared { reason: "web_logout", user_id: 1, fingerprint: "a1b2c3d4" }

// Forwards to background
[FW Auth Content] Auth cleared, notifying background
```

---

### 3️⃣ Extension Background Console (Service Worker)

```javascript
// Background receives clear confirmation
[FW Auth Background] Received auth clear complete { reason: "logout", from_tab: 123 }
[FW Auth Background] Token cleared successfully
```

---

### 4️⃣ Extension Content Script Console (Next Job Page)

```javascript
// Content script tries to initialize
[FW Injected] content.js loaded
[FW Init] Starting initialization...

// No token found
[FW Auth] No token found in storage

// Skips initialization
[FW Init] Not authenticated or token invalid, skipping initialization
```

---

## Account Switch Flow Logs

### Step 1: Login as User A

**Background Console:**
```javascript
[FW Auth Background] Received auth bootstrap complete { user_id: 1, expires_at: "...", from_tab: 123 }
[FW Auth Background] Token stored successfully
[FW Auth Background] Authenticated as user_id 1
```

---

### Step 2: Logout User A

**Background Console:**
```javascript
[FW Auth Background] Received auth clear complete { reason: "logout", from_tab: 123 }
[FW Auth Background] Token cleared successfully
```

---

### Step 3: Login as User B

**Background Console:**
```javascript
[FW Auth Background] Received auth bootstrap complete { user_id: 2, expires_at: "...", from_tab: 123 }
[FW Auth Background] Token stored successfully
[FW Auth Background] Authenticated as user_id 2
```

---

### Step 4: Start Apply for User B

**Content Console (Job Page):**
```javascript
[FW Auth] Token verified successfully { user_id: 2, email: "userb@example.com" }
[FW Init] Auth verified for user 2
[FW Session] active_session_attached: { task_id: 99, run_id: 200, ats_type: "..." }
```

**✅ CRITICAL:** user_id must be 2, not 1. Session must belong to User B.

---

## Error Scenarios

### Error 1: Token Expired

**Content Console:**
```javascript
[FW Auth] Token expired, clearing
[FW Auth] Token cleared { reason: "expired", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

---

### Error 2: Backend 401 (Token Revoked)

**Content Console:**
```javascript
[FW Auth] Verifying token with backend... { user_id: 1, fingerprint: "a1b2c3d4" }
[FW Auth] Backend auth failed (401) -> clearing token
[FW Auth] Token cleared { reason: "backend_401", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

---

### Error 3: User Mismatch

**Content Console:**
```javascript
[FW Auth] Verifying token with backend... { user_id: 1, fingerprint: "a1b2c3d4" }
[FW Auth] User mismatch (token user != backend user) -> clearing token { 
  token_user: 1, 
  backend_user: 2 
}
[FW Auth] Token cleared { reason: "user_mismatch", user_id: 1, fingerprint: "a1b2c3d4" }
[FW Init] Not authenticated or token invalid, skipping initialization
```

---

### Error 4: No Active Session

**Content Console:**
```javascript
[FW Auth] Token verified successfully { user_id: 1, email: "test@example.com" }
[FW Init] Auth verified for user 1
[FW Session] Fetching active session from backend...
[FW Session] No active apply session (backend)
[FW Init] No active session found, skipping initialization
```

---

### Error 5: URL Mismatch

**Content Console:**
```javascript
[FW Auth] Token verified successfully { user_id: 1, email: "test@example.com" }
[FW Init] Auth verified for user 1
[FW Session] Fetching active session from backend...
[FW Session] Active session fetch result: { active: true, has_run_id: true, has_task_id: true }
[FW Session] active_session_url_match: false { 
  current: "https://www.linkedin.com/jobs/view/456", 
  expected: "https://www.linkedin.com/jobs/view/123" 
}
[FW Session] URL mismatch - session exists but not for this page
[FW Session] This may be the wrong tab. Not initializing.
[FW Init] No active session found, skipping initialization
```

---

## How to Read Logs

### ✅ Success Indicators

1. **Web Console:** "Broadcasting auth bootstrap" appears
2. **Content Console:** "Token stored" with fingerprint appears
3. **Background Console:** "Authenticated as user_id X" appears ← **MOST IMPORTANT**
4. **Content Console (Job Page):** "Token verified successfully" appears
5. **Content Console (Job Page):** "active_session_attached" appears

### ❌ Failure Indicators

1. **Background Console:** No "Authenticated as user_id" log → Auth bridge broken
2. **Content Console:** "No token found in storage" → Token not stored
3. **Content Console:** "Backend auth failed (401)" → Token invalid/revoked
4. **Content Console:** "User mismatch" → Account switch issue
5. **Content Console:** "URL mismatch" → Wrong tab or session expired

---

## Quick Verification Commands

### Check Token in Storage

**Console (any extension page):**
```javascript
chrome.storage.local.get(['fw_auth_token', 'fw_auth_user_id', 'fw_auth_fingerprint'], (result) => {
  console.log('Stored auth:', result);
});
```

**Expected Output:**
```javascript
Stored auth: {
  fw_auth_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  fw_auth_user_id: 1,
  fw_auth_fingerprint: "a1b2c3d4"
}
```

---

### Check Active Session

**Console (any extension page):**
```javascript
chrome.storage.local.get('fw_active_session', (result) => {
  console.log('Active session:', result);
});
```

**Expected Output:**
```javascript
Active session: {
  fw_active_session: {
    active: true,
    task_id: 42,
    run_id: 99,
    job_url: "https://www.linkedin.com/jobs/view/123",
    ats_type: "linkedin",
    detected_at: 1705238400000
  }
}
```

---

## Summary

**Key Success Metric:**
```
Background Console MUST show:
[FW Auth Background] Authenticated as user_id X
```

If you see this log, the auth bridge is working correctly. All other logs are secondary confirmation.

**If you DON'T see this log:**
1. Check Web Console: Is "Broadcasting auth bootstrap" appearing?
2. Check Content Console: Is "Auth bootstrap complete, notifying background" appearing?
3. Check Background Console: Is Service Worker running? (may need to reload extension)
4. Check for errors in any console

**Common Issues:**
- Service Worker not running → Reload extension at chrome://extensions
- Content script not injected → Check manifest.json content_scripts matches
- Origin mismatch → Web App and extension must be on same origin for postMessage

