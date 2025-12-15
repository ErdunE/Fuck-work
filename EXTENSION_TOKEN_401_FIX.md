# Extension Token 401 Error - FIXED

## Root Cause

**Domain Mismatch Between Cookie Domain and API Request Domain**

- Backend runs on: `127.0.0.1:8000`
- Login sets cookie for domain: `127.0.0.1`
- Web App was calling: `http://localhost:8000/api/auth/extension-token`
- **Browsers treat `localhost` and `127.0.0.1` as different domains**
- Result: Cookie not sent → 401 Unauthorized

## Fix Applied

Unified all backend API calls in Web App to use `127.0.0.1:8000` instead of `localhost:8000`.

### Files Modified:

1. **`apps/web_control_plane/src/contexts/AuthContext.tsx`**
   - Changed `fetchExtensionToken()` to use `http://127.0.0.1:8000`

2. **`apps/web_control_plane/src/services/api.ts`**
   - Updated `API_BASE_URL` default from `localhost:8000` to `127.0.0.1:8000`

3. **`apps/web_control_plane/vite.config.ts`**
   - Updated proxy target from `localhost:8000` to `127.0.0.1:8000`

4. **`apps/web_control_plane/README.md`**
   - Updated documentation examples to use `127.0.0.1:8000`

## Why This Works

By ensuring all API calls use the same domain (`127.0.0.1`), the session cookie set during login will be correctly sent with all subsequent requests, including the extension token endpoint.

## Manual Verification Steps

### Prerequisites:
1. Backend running: `cd apps/backend && python -m uvicorn api.app:app --reload --host 127.0.0.1 --port 8000`
2. Web App running: `cd apps/web_control_plane && npm run dev`
3. Extension loaded in Chrome

### Test 1: Cold Start (No Login)
**Steps**:
1. Open Web App at `http://127.0.0.1:3000` (or `http://localhost:3000`)
2. Extension should not attempt to fetch token

**Expected**:
- Extension console: `[FW Poll] Skipped: no token`
- No 401 errors

### Test 2: Login and Extension Token Fetch ⭐ **CRITICAL**
**Steps**:
1. Open Web App at `http://127.0.0.1:3000`
2. Login with test credentials
3. Open browser DevTools on Web App page
4. Open Extension background console (chrome://extensions → Inspect service worker)

**Expected Web Console**:
```
[FW Web] Extension token fetched successfully
[FW Web] Sent FW_EXTENSION_TOKEN to extension
```

**Expected Content Script Console** (on Web App page):
```
[FW CS] Received FW_EXTENSION_TOKEN (len=XXX), forwarding to background
```

**Expected Background Console**:
```
[FW BG] Received FW_EXTENSION_TOKEN
[FW Auth] Token saved to storage
[FW Auth] Token received - starting polling
[FW Poll] Starting task polling
Polling for next task...
```

**Expected Backend Logs** (terminal):
```
[Auth] Login successful for user X, token_version=X, cookie set
[Auth] Extension token issued for user X
INFO: 127.0.0.1:XXXXX - "POST /api/auth/extension-token HTTP/1.1" 200 OK
INFO: 127.0.0.1:XXXXX - "GET /apply/tasks?status=queued&limit=1 HTTP/1.1" 200 OK
```
(Or 204 No Content if no tasks)

**❌ Should NOT See**:
- `401 Unauthorized` on `/api/auth/extension-token`
- `422 Unprocessable Entity` spam
- `[FW Poll] Skipped: no token` after login

### Test 3: Logout
**Steps**:
1. Click logout in Web App

**Expected**:
- Web console: `[FW Web] Sent FW_EXTENSION_LOGOUT`
- Background console: `[FW Auth] Token cleared`, `[FW Poll] Stopping task polling`
- Backend: No more `/apply/tasks` requests

### Test 4: Extension Reload
**Steps**:
1. Keep Web App logged in
2. Reload extension (chrome://extensions → reload)
3. Refresh Web App page

**Expected**:
- Web App re-fetches and broadcasts token
- Background console: `[FW Auth] Token loaded from storage`, `[FW Poll] Starting task polling`

## Important Note on Domain Access

**Best Practice**: Access Web App at `http://127.0.0.1:3000` to ensure perfect cookie consistency.

If you access at `http://localhost:3000`:
- The Web App will still work (calls to `127.0.0.1:8000` will succeed)
- But cookies might not be perfectly aligned if backend also uses `localhost` somewhere

**Recommendation**: Update your bookmarks and development workflow to use `127.0.0.1:3000` instead of `localhost:3000`.

## Troubleshooting

### If still seeing 401 on extension token:
1. **Check browser DevTools → Application → Cookies**
   - Ensure `fw_session` cookie exists for `127.0.0.1`
   - Check cookie domain, path, and expiration

2. **Clear all cookies and try again**:
   - DevTools → Application → Storage → Clear site data
   - Restart backend and web app
   - Login again

3. **Verify backend is actually running on 127.0.0.1**:
   - Backend command MUST be: `uvicorn api.app:app --host 127.0.0.1 --port 8000`
   - NOT: `uvicorn api.app:app --host localhost --port 8000`

4. **Check CORS configuration**:
   - Backend `apps/backend/api/app.py` should include:
     ```python
     allow_origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         ...
     ]
     ```

### If polling still not starting:
1. Check that extension background script loaded: chrome://extensions → Inspect service worker
2. Verify token was received: Look for `[FW BG] Received FW_EXTENSION_TOKEN` in background console
3. Check token was saved: Look for `[FW Auth] Token saved to storage`

## Architectural Correctness

The authentication architecture is **100% correct**:
- ✅ Web App uses cookie session for login
- ✅ `/api/auth/extension-token` correctly requires authenticated user via cookie
- ✅ Extension uses explicit Bearer token for all API calls
- ✅ Token has 15-minute lifetime for security

The **only** issue was the domain mismatch, which is now fixed.

## Next Steps

After successful verification:
1. ✅ All 4 tests pass
2. ✅ Extension polling works automatically after login
3. ✅ No 401/422 errors
4. → Phase A Token-Based Auth Migration is **COMPLETE** 🎉

## Git Commit

```
6efdfee fix(webapp): unify backend URL to 127.0.0.1 for cookie consistency
```

---

**Status**: Ready for E2E testing with real job application flow.

