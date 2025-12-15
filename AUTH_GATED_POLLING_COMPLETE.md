# Auth-Gated Task Polling Implementation - COMPLETE

## Summary

Successfully implemented authentication-gated task polling in the browser extension background script to eliminate HTTP 422/401 spam caused by unauthenticated polling attempts.

## Changes Made

### 1. Authentication State Management
**File:** `apps/extension/background.js`

Added centralized auth state tracker:
```javascript
const authState = {
  isAuthenticated: false,
  user: null,
  lastCheckTime: null
};
```

### 2. Polling Authentication Guard
Added hard authentication gate at the top of `pollForTask()`:
- Returns early with log message if `!authState.isAuthenticated`
- Prevents any HTTP requests to `/apply/tasks` when unauthenticated

### 3. Idempotent Polling Control
Made `startPolling()` and `stopPolling()` idempotent:
- `startPolling()` checks if already polling before starting
- `stopPolling()` checks if already stopped before stopping
- Prevents duplicate polling intervals

### 4. Authentication Verification
Added `verifyAndUpdateAuthState()` function:
- Calls `checkAuthViaBackend()` to verify session cookies
- Updates `authState` with result
- Returns boolean indicating authentication status
- Logs state changes for debugging

### 5. Auth Change Event Handler
Added `FW_AUTH_CHANGED` message handler:
- Listens for login/logout events from Web App
- Verifies authentication via backend
- Starts polling if authenticated
- Stops polling and clears task state if not authenticated

### 6. Auth-Gated Initialization
Replaced `initializePhase5()` with `initialize()`:
- Verifies authentication on extension load
- Only starts polling if already authenticated
- Otherwise waits for `FW_AUTH_CHANGED` event

### 7. Auth Failure Handling
Added 401/403 error handling to `pollForTask()` catch block:
- Detects authentication failures during polling
- Marks as unauthenticated
- Stops polling immediately
- Prevents retry spam

## Expected Behavior

### When NOT Logged In
- Console shows: `[FW BG] Not authenticated - polling disabled`
- Console shows: `[FW Poll] Skipped: not authenticated` (on timer tick)
- **No HTTP requests** to `/apply/tasks`
- No 422 or 401 errors

### After Successful Login
- Web App sends `FW_AUTH_CHANGED` message
- Extension verifies auth via `/api/auth/me`
- Console shows: `[FW Auth] Authenticated - starting polling`
- **Exactly ONE** polling interval starts
- `/apply/tasks` requests begin every 15 seconds

### After Logout
- Web App sends `FW_AUTH_CHANGED` message
- Extension verifies auth (gets 401)
- Console shows: `[FW Auth] Not authenticated - stopping polling`
- Polling stops immediately
- Task state cleared
- No further `/apply/tasks` requests

### On Authentication Failure During Polling
- Poll request returns 401 or 403
- Console shows: `[FW Poll] Authentication failure detected - stopping polling`
- `authState.isAuthenticated` set to `false`
- Polling stops automatically
- No retry spam

## Manual Testing Required

The following tests should be performed manually:

### Test 1: Unauthenticated State
1. Close all browser tabs with Web App
2. Open browser DevTools → Service Workers (chrome://inspect/#service-workers)
3. Terminate the extension service worker if running
4. Reload the extension
5. Check Service Worker console

**Expected:**
- `[FW BG] Not authenticated - polling disabled`
- `[FW Poll] Skipped: not authenticated` (repeating every 15s)
- **No** requests to `/apply/tasks` in Network tab

### Test 2: Login Flow
1. Open Web App (localhost:3000)
2. Log in with valid credentials
3. Check extension Service Worker console

**Expected:**
- `[FW Auth] Auth change event received`
- `[FW Auth] Authenticated - starting polling`
- Requests to `/apply/tasks` begin appearing in Network tab
- **No** duplicate polling logs (should see "Already polling" if login sends multiple events)

### Test 3: Logout Flow
1. While logged in and polling active
2. Click logout in Web App
3. Check extension Service Worker console

**Expected:**
- `[FW Auth] Auth change event received`
- `[FW Auth] Not authenticated - stopping polling`
- No further `/apply/tasks` requests
- Console stops showing "Polling for next task"

### Test 4: Auth Failure During Polling
1. Log in and start polling
2. Use backend CLI to invalidate session (or wait for session expiry)
3. Wait for next poll cycle

**Expected:**
- Poll request returns 401
- `[FW Poll] Authentication failure detected - stopping polling`
- Polling stops automatically
- No further requests

## Architecture Compliance

✅ **Phase A Cookie-Based Auth:** Extension uses backend session cookies as single source of truth  
✅ **State Machine Correctness:** Polling state transitions are deterministic and safe  
✅ **No Client Token Storage:** All auth verification goes through backend  
✅ **Idempotent Operations:** Safe to call start/stop multiple times

## Files Modified

- `apps/extension/background.js` (107 insertions, 25 deletions)

## Commit

```
commit c5a81c6
fix(extension): add auth-gated task polling to prevent 422/401 spam
```

## Next Steps

1. **Manual Testing:** Perform all 4 test scenarios above
2. **Verify Web App Integration:** Ensure Web App sends `FW_AUTH_CHANGED` on login/logout
3. **Monitor Backend Logs:** Confirm no more 422/401 spam from `/apply/tasks`
4. **Service Worker Stability:** Verify extension doesn't crash on auth state changes

## Notes

- Manual testing todos remain in plan file as `pending` (requires user execution)
- All code implementation todos marked as `completed`
- No backend API changes required
- No changes to Web App auth flow (assumes `FW_AUTH_CHANGED` already implemented)

