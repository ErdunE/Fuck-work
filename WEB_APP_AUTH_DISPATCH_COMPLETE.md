# Web App Auth State Change Dispatch - COMPLETE

## Summary

Successfully implemented the missing FW_AUTH_CHANGED message dispatch from the Web Control Plane to the Extension background script. This completes the Phase A authentication architecture by enabling the Web App to notify the extension when users log in or out, allowing the extension to start/stop task polling accordingly.

## Problem Solved

**Before:**
- User logs in via Web App → Backend sets cookie → Web App shows logged in
- Extension background script → Remains in "Not authenticated (401)" state
- Extension → Never starts polling because it's never notified of auth change
- Result: HTTP 422/401 spam continues despite user being logged in

**After:**
- User logs in via Web App → Backend sets cookie → Web App shows logged in
- **Web App sends `FW_AUTH_CHANGED` message to extension**
- Extension → Verifies auth via backend → Updates `authState.isAuthenticated = true`
- Extension → Starts polling `/apply/tasks`
- Result: Polling begins immediately after login, no spam

## Changes Made

### File: `apps/web_control_plane/src/contexts/AuthContext.tsx`

#### 1. Added Auth Change Notification Helper

```typescript
// Phase A: Notify extension background script of auth state changes
const notifyExtensionAuthChanged = (isAuthenticated: boolean) => {
  // Check if Chrome extension APIs are available
  if (typeof window !== 'undefined' && window.chrome?.runtime?.sendMessage) {
    console.log('[FW Web] Auth state changed →', isAuthenticated ? 'authenticated' : 'logged out')
    
    try {
      window.chrome.runtime.sendMessage({
        type: 'FW_AUTH_CHANGED',
        isAuthenticated
      })
    } catch (err) {
      // Extension might not be installed or listening - this is non-blocking
      console.warn('[FW Web] Failed to notify extension:', err)
    }
  }
}
```

**Key Features:**
- Checks for `window.chrome?.runtime?.sendMessage` availability
- Sends `FW_AUTH_CHANGED` message with boolean `isAuthenticated` flag
- Gracefully handles extension not being installed (non-blocking)
- Explicit console logging for debugging

#### 2. Login Flow Enhancement

```typescript
const login = async (email: string, password: string) => {
  const authData = await api.login({ email, password })
  const currentUser = await api.getCurrentUser()
  setUser(currentUser)
  
  // Phase 5.3.2: Broadcast to extension (legacy token-based)
  broadcastAuthBootstrap(...)
  
  // Phase A: Notify extension background of auth change
  notifyExtensionAuthChanged(true)  // ← NEW
}
```

**Effect:** After successful login, extension is immediately notified and starts polling.

#### 3. Logout Flow Enhancement

```typescript
const logout = () => {
  // Phase 5.3.2: Broadcast clear BEFORE calling backend
  broadcastAuthClear('logout')
  
  // Phase A: Notify extension background of auth change
  notifyExtensionAuthChanged(false)  // ← NEW
  
  // Call backend logout...
  // Clear frontend state...
}
```

**Effect:** After logout, extension is immediately notified and stops polling.

## Expected Behavior

### Login Flow (End-to-End)

1. **User Action:** Submits login form in Web App
2. **Web App Console:**
   ```
   [FW Web] Auth state changed → authenticated
   ```
3. **Extension Background Console:**
   ```
   [FW Auth] Auth change event received
   [FW Auth] Verifying authentication state
   [FW Auth] Authenticated as user 1 user@example.com
   [FW Auth] State updated { isAuthenticated: true, user_id: 1, email: 'user@example.com' }
   [FW Auth] Authenticated - starting polling
   [FW Poll] Starting task polling
   Polling for next task...
   ```
4. **Network Tab:** `/apply/tasks` requests begin every 15 seconds
5. **Result:** No 401/422 errors, clean polling cycle

### Logout Flow (End-to-End)

1. **User Action:** Clicks logout in Web App
2. **Web App Console:**
   ```
   [FW Web] Auth state changed → logged out
   ```
3. **Extension Background Console:**
   ```
   [FW Auth] Auth change event received
   [FW Auth] Verifying authentication state
   [FW Auth] Not authenticated (status: 401)
   [FW Auth] State updated { isAuthenticated: false, user_id: null, email: null }
   [FW Auth] Not authenticated - stopping polling
   [FW Poll] Stopping task polling
   ```
4. **Network Tab:** `/apply/tasks` requests stop immediately
5. **Result:** Clean shutdown, no orphaned polling

### Without Extension Installed

1. User logs in to Web App
2. Web App Console:
   ```
   [FW Web] Auth state changed → authenticated
   ```
3. **No errors** - `chrome.runtime.sendMessage` is checked before calling
4. Web App functions normally

## Architecture Compliance

✅ **Phase A Cookie-Based Auth:** Web App doesn't manage tokens, only notifies state changes  
✅ **Non-Intrusive:** Extension polls only when authenticated  
✅ **Single Responsibility:** Web App handles auth UI, Extension handles automation  
✅ **Graceful Degradation:** Works without extension installed  
✅ **Explicit Communication:** Clear console logs at every step

## Files Modified

- `apps/web_control_plane/src/contexts/AuthContext.tsx` (25 insertions, 1 deletion)

## Commit

```
commit 4790454
fix(web-app): add FW_AUTH_CHANGED message dispatch to extension
```

## Manual Testing Required

The plan includes manual testing todos that require user interaction:

### Test 1: Fresh Login → Extension Polling Starts
1. Clear all cookies or use incognito mode
2. Open Extension Service Worker console (chrome://inspect/#service-workers)
3. Verify: `[FW BG] Not authenticated - polling disabled`
4. Open Web App at localhost:3000
5. Log in with valid credentials
6. **Expected in Web App console:** `[FW Web] Auth state changed → authenticated`
7. **Expected in Extension console:** Auth verification logs + `[FW Auth] Authenticated - starting polling`
8. **Expected in Network tab:** `/apply/tasks` requests every 15 seconds

### Test 2: Logout → Extension Polling Stops
1. While logged in and polling active
2. Click "Logout" in Web App
3. **Expected in Web App console:** `[FW Web] Auth state changed → logged out`
4. **Expected in Extension console:** `[FW Auth] Not authenticated - stopping polling`
5. **Expected in Network tab:** No more `/apply/tasks` requests

### Test 3: No Extension → No Errors
1. Disable or uninstall the Chrome extension
2. Open Web App and log in
3. **Expected:** No errors in console, Web App works normally
4. **Expected:** Only `[FW Web] Auth state changed → authenticated` (no extension warning)

## Integration Points

This fix completes the Phase A authentication architecture:

```
┌─────────────────┐                 ┌──────────────────┐
│   Web Control   │  FW_AUTH_CHANGED│    Extension     │
│     Plane       │ ───────────────>│   Background     │
│                 │                 │                  │
│ • Login UI      │                 │ • Auth State     │
│ • Logout UI     │                 │ • Task Polling   │
│ • User State    │                 │ • Job Execution  │
└─────────────────┘                 └──────────────────┘
         │                                    │
         │                                    │
         └────────────┬───────────────────────┘
                      ▼
              ┌───────────────┐
              │    Backend    │
              │               │
              │ • Cookie Auth │
              │ • /auth/me    │
              │ • /apply/tasks│
              └───────────────┘
```

## Next Steps

1. **Manual Testing:** Execute all 3 test scenarios above
2. **Monitor Logs:** Verify clean console output with no errors
3. **Verify Behavior:** Confirm polling starts/stops as expected
4. **Backend Monitoring:** Ensure no more 422/401 spam in backend logs

## Notes

- Manual testing todos remain in plan file as `pending` (requires user execution)
- All code implementation todos marked as `completed`
- Backward compatible with existing `broadcastAuthBootstrap` (Phase 5.3.2 legacy)
- Extension auth logic unchanged (already correct from previous Phase A work)
- No backend changes required
- No new API endpoints needed

This is the final missing piece for Phase A authentication architecture! 🎉

