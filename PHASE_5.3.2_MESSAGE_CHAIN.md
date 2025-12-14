# Phase 5.3.2 — Complete Auth Bridge Message Chain

**Date:** 2025-01-14  
**Status:** ✅ IMPLEMENTED

---

## Message Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW (Happy Path)                   │
└──────────────────────────────────────────────────────────────┘

1️⃣  Web App (http://localhost:3000)
    └─ AuthContext.tsx → login()
       └─ api.login(email, password)
          └─ Backend returns: { access_token, user_id, expires_at }
             └─ broadcastAuthBootstrap(token, expires_at, user_id)
                └─ window.postMessage({
                      type: 'FW_AUTH_BOOTSTRAP',
                      token: "eyJ...",
                      user_id: 1,
                      expires_at: "2025-01-21T12:00:00Z",
                      mode: "replace"
                   }, '*')

                   ⬇️  (crosses page boundary)

2️⃣  Extension Content Script (any tab with extension injected)
    └─ content.js → window.addEventListener('message')
       └─ Validates: event.origin === window.location.origin
          └─ Receives: message.type === 'FW_AUTH_BOOTSTRAP'
             └─ console.log('[FW Auth Content] Received auth bootstrap')
                └─ window.authStorage.clearAuthToken('bootstrap_replace')
                   └─ window.authStorage.storeAuthToken({
                         token, user_id, expires_at
                      })
                      └─ chrome.storage.local.set({
                            fw_auth_token: "eyJ...",
                            fw_auth_user_id: 1,
                            fw_auth_expires_at: "2025-01-21T12:00:00Z",
                            fw_auth_fingerprint: "a1b2c3d4",
                            fw_auth_issued_at: "2025-01-14T12:00:00Z"
                         })
                         └─ console.log('[FW Auth Content] Auth bootstrap complete')
                            └─ chrome.runtime.sendMessage({
                                  type: 'FW_AUTH_BOOTSTRAP_COMPLETE',
                                  user_id: 1,
                                  expires_at: "2025-01-21T12:00:00Z"
                               })

                               ⬇️  (crosses extension context boundary)

3️⃣  Extension Background (Service Worker)
    └─ background.js → chrome.runtime.onMessage.addListener()
       └─ Receives: message.type === 'FW_AUTH_BOOTSTRAP_COMPLETE'
          └─ console.log('[FW Auth Background] Received auth bootstrap complete', {
                user_id: 1,
                expires_at: "2025-01-21T12:00:00Z",
                from_tab: 123
             })
             └─ console.log('[FW Auth Background] Token stored successfully')
                └─ console.log('[FW Auth Background] Authenticated as user_id', 1)
                   └─ sendResponse({ ok: true })

┌──────────────────────────────────────────────────────────────┐
│                  NEXT PAGE NAVIGATION                        │
└──────────────────────────────────────────────────────────────┘

4️⃣  User navigates to job page (e.g., https://www.linkedin.com/jobs/view/123)
    └─ Extension content script auto-injects (manifest content_scripts)
       └─ content.js → init()
          └─ verifyAuthToken()
             └─ loadAuthToken() from chrome.storage.local
                └─ Found: { token, user_id: 1, fingerprint: "a1b2c3d4" }
                   └─ Check expiration: ✅ Not expired
                      └─ Call backend: GET /api/auth/me
                         └─ Backend validates JWT + token_version
                            └─ Returns: { id: 1, email: "test@example.com" }
                               └─ Verify: user_id matches (1 === 1) ✅
                                  └─ console.log('[FW Auth] Token verified successfully')
                                     └─ getActiveSession()
                                        └─ Call backend: GET /api/users/me/active-session
                                           └─ Returns: { active: true, task_id: X, run_id: Y, job_url, ats_type }
                                              └─ Validate URL match ✅
                                                 └─ console.log('[FW Session] active_session_attached')
                                                    └─ Proceed with automation...
```

---

## Console Log Timeline (Chronological)

### T+0ms: Web App Login

```
[Web Console @ http://localhost:3000]
[FW Web Auth] Broadcasting auth bootstrap to extension { userId: 1 }
```

---

### T+10ms: Content Script Receives

```
[Extension Content Console @ http://localhost:3000]
[FW Auth Content] Received auth bootstrap from Web Control Plane { user_id: 1, mode: "replace" }
[FW Auth] Token cleared { reason: "bootstrap_replace", user_id: null, fingerprint: null }
[FW Auth] Token stored { user_id: 1, expires_at: "2025-01-21T12:00:00Z", fingerprint: "a1b2c3d4", issued_at: "2025-01-14T12:00:00Z" }
[FW Auth Content] Auth bootstrap complete, notifying background
```

---

### T+15ms: Background Receives

```
[Extension Background Console @ chrome://extensions Service Worker]
[FW Auth Background] Received auth bootstrap complete { user_id: 1, expires_at: "2025-01-21T12:00:00Z", from_tab: 123 }
[FW Auth Background] Token stored successfully
[FW Auth Background] Authenticated as user_id 1
```

---

### T+30s: User Navigates to Job Page

```
[Extension Content Console @ https://www.linkedin.com/jobs/view/123]
[FW Injected] content.js loaded
[FW Init] Starting initialization...
[FW Auth] Verifying token with backend... { user_id: 1, fingerprint: "a1b2c3d4" }
[FW Auth] Token verified successfully { user_id: 1, email: "test@example.com" }
[FW Init] Auth verified for user 1
[FW Session] Fetching active session from backend...
[FW Session] Active session fetch result: { active: true, has_run_id: true, has_task_id: true }
[FW Session] active_session_url_match: true { current: "https://...", expected: "https://..." }
[FW Session] active_session_attached: { task_id: 42, run_id: 99, ats_type: "linkedin" }
[FW Init] Proceeding with initialization
[Observability] Using existing run_id from session: 99
```

---

## Key Validation Points

### ✅ 1. Web → Content: window.postMessage

**Mechanism:** `window.postMessage` with origin validation  
**Security:** Only accepts messages from same origin  
**Payload:** `{ type, token, user_id, expires_at, mode }`

### ✅ 2. Content → Storage: chrome.storage.local

**Mechanism:** `auth_storage.js` with SHA-256 fingerprinting  
**Security:** Never logs raw token, only fingerprint  
**Payload:** `{ fw_auth_token, fw_auth_user_id, fw_auth_expires_at, fw_auth_fingerprint, fw_auth_issued_at }`

### ✅ 3. Content → Background: chrome.runtime.sendMessage

**Mechanism:** Extension internal messaging  
**Security:** Only extension contexts can send/receive  
**Payload:** `{ type: 'FW_AUTH_BOOTSTRAP_COMPLETE', user_id, expires_at }`

### ✅ 4. Content → Backend: /api/auth/me

**Mechanism:** HTTP GET with JWT Bearer token  
**Security:** Backend validates JWT signature + token_version  
**Response:** `{ id, email, is_active }`

### ✅ 5. Content → Backend: /api/users/me/active-session

**Mechanism:** HTTP GET with JWT Bearer token  
**Security:** Session ownership validated against current_user  
**Response:** `{ active, task_id, run_id, job_url, ats_type }`

---

## Error Handling

### Scenario 1: Token Expired

```
[FW Auth] Token expired, clearing
[FW Auth] Token cleared { reason: "expired", ... }
[FW Init] Not authenticated or token invalid, skipping initialization
```

### Scenario 2: Backend 401 (Token Revoked)

```
[FW Auth] Backend auth failed (401) -> clearing token
[FW Auth] Token cleared { reason: "backend_401", ... }
[FW Init] Not authenticated or token invalid, skipping initialization
```

### Scenario 3: User Mismatch (Account Switch)

```
[FW Auth] User mismatch (token user != backend user) -> clearing token
[FW Auth] Token cleared { reason: "user_mismatch", token_user: 1, backend_user: 2 }
[FW Init] Not authenticated or token invalid, skipping initialization
```

### Scenario 4: No Active Session

```
[FW Session] No active apply session (backend)
[FW Init] No active session found, skipping initialization
```

### Scenario 5: URL Mismatch

```
[FW Session] active_session_url_match: false { current: "https://...", expected: "https://..." }
[FW Session] URL mismatch - session exists but not for this page
[FW Init] No active session found, skipping initialization
```

---

## Testing Checklist

- [ ] Login in Web App → Background logs "Authenticated as user_id X"
- [ ] Logout in Web App → Background logs "Token cleared successfully"
- [ ] Navigate to job page → Content logs "Token verified successfully"
- [ ] Start Apply → Content logs "active_session_attached"
- [ ] Close tab → No errors in console
- [ ] Reload extension → Token persists across reload
- [ ] Switch accounts → Old token cleared, new token stored

---

## Files Involved

1. **Web App:**
   - `apps/web_control_plane/src/contexts/AuthContext.tsx` (broadcasts)

2. **Extension:**
   - `apps/extension/content.js` (receives + forwards)
   - `apps/extension/auth_storage.js` (stores token)
   - `apps/extension/background.js` (logs confirmation)
   - `apps/extension/api.js` (backend calls)

3. **Backend:**
   - `apps/backend/api/routers/auth.py` (login, logout, /me)
   - `apps/backend/api/auth/jwt_utils.py` (JWT validation)
   - `apps/backend/api/routers/active_session.py` (session management)

---

## Summary

**Before Fix:**
- Web broadcasts → Content receives → **Background never notified** ❌

**After Fix:**
- Web broadcasts → Content receives → Content forwards → **Background logs confirmation** ✅

**Impact:**
- Full visibility into auth sync across all extension contexts
- Easier debugging of auth-related issues
- Confirmation that token storage succeeded
- No architectural changes, pure message relay

---

## Next Steps

1. **Manual Test:** Login → Check background console for "Authenticated as user_id X"
2. **E2E Test:** Login → Start Apply → Verify session attachment
3. **Account Switch Test:** Login User A → Logout → Login User B → Verify token replaced
4. **Proceed to Phase 5.3.2 Acceptance Testing**

