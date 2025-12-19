# Phase 5.0 Integration Testing Verification

End-to-end testing checklist for Web Control Plane + Extension + Backend integration.

## Prerequisites

1. Backend running: `cd apps/backend && python run_api.py`
2. Web app running: `cd apps/web_control_plane && npm run dev`
3. Extension loaded in Chrome
4. PostgreSQL running: `cd apps/backend && docker-compose up -d`
5. Run migration: `cd apps/backend && python migrate_phase5_schema.py`

## Test 1: Authentication & Registration

### Steps:
1. Open web app: `http://localhost:3000`
2. Click "Register"
3. Enter email: `test@example.com`, password: `testpass123`
4. Submit registration

### Expected Results:
- ✓ User created in database
- ✓ Auto-login after registration
- ✓ Redirected to Dashboard
- ✓ JWT token stored in localStorage
- ✓ User email shown in header

### Verification:
```bash
# Check user in database
psql -h localhost -U fuckwork -d fuckwork -c "SELECT * FROM users WHERE email='test@example.com';"

# Check default preferences created
psql -h localhost -U fuckwork -d fuckwork -c "SELECT * FROM automation_preferences WHERE user_id=1;"
```

## Test 2: Profile Management

### Steps:
1. Navigate to Profile page
2. Fill in profile fields:
   - First Name: John
   - Last Name: Doe
   - Primary Email: john@example.com
   - City: San Francisco
   - State: CA
   - LinkedIn URL: https://linkedin.com/in/johndoe
3. Click "Save Profile"

### Expected Results:
- ✓ Success message appears
- ✓ Profile updated in database
- ✓ Full name auto-generated: "John Doe"
- ✓ Updated_at timestamp changes

### Verification:
```bash
# Check profile in database
psql -h localhost -U fuckwork -d fuckwork -c "SELECT * FROM user_profiles WHERE user_id=1;"
```

## Test 3: Automation Preferences (Web → Extension Sync)

### Steps:
1. Navigate to Automation Settings page
2. Current settings should show:
   - Auto-fill after login: TRUE (default)
   - Auto-submit when ready: FALSE (default)
3. Toggle "Auto-submit when ready" to TRUE
4. Click "Save Preferences"
5. Open browser extension popup
6. Wait 5 minutes OR restart extension

### Expected Results:
- ✓ Success message: "Preferences updated successfully. Extension will sync within 5 minutes."
- ✓ Preferences saved in database
- ✓ `last_synced_at` timestamp updates
- ✓ Extension logs: `[FW Sync] Preferences synced`
- ✓ Extension overlay reflects new settings

### Verification:
```bash
# Check preferences in database
psql -h localhost -U fuckwork -d fuckwork -c "SELECT auto_fill_after_login, auto_submit_when_ready, last_synced_at FROM automation_preferences WHERE user_id=1;"

# Check extension console
# Should see: [FW Sync] Preferences synced { auto_fill: true, auto_submit: true }
```

## Test 4: Cross-Device Preference Sync

### Steps:
1. On Device A (or Browser A):
   - Log in to web app
   - Change auto-fill to FALSE
   - Save preferences
2. On Device B (or Incognito Browser B):
   - Log in with same credentials
   - Navigate to Automation Settings

### Expected Results:
- ✓ Device B shows auto-fill = FALSE
- ✓ Same preferences across devices
- ✓ Extension on both devices syncs within 5 minutes

### Verification:
```bash
# Both devices should show same data from database
psql -h localhost -U fuckwork -d fuckwork -c "SELECT * FROM automation_preferences WHERE user_id=1;"
```

## Test 5: Extension Authentication

### Steps:
1. Open extension popup
2. Click "Login" (if not already logged in)
3. Enter credentials
4. Submit

### Expected Results:
- ✓ JWT token stored in `chrome.storage.local`
- ✓ Extension console: `[FW Auth] Token stored { user_id: 1, email: 'test@example.com' }`
- ✓ Preference sync starts automatically
- ✓ Extension console: `[FW Phase 5.0] Authenticated`

## Test 6: Extension Event Logging

### Steps:
1. Ensure extension is authenticated
2. Navigate to a job application page (e.g., LinkedIn job)
3. Extension detects page and runs autofill
4. Go to web app Audit Log page

### Expected Results:
- ✓ Events appear in audit log
- ✓ Event types: `autofill_executed`, `detection_result`, etc.
- ✓ Events show: task_id, session_id, detection_id
- ✓ Decision reasons are readable
- ✓ Timestamps are correct

### Verification:
```bash
# Check events in database
psql -h localhost -U fuckwork -d fuckwork -c "SELECT event_type, automation_decision, created_at FROM automation_events WHERE user_id=1 ORDER BY created_at DESC LIMIT 10;"
```

## Test 7: Apply Tasks Visibility

### Steps:
1. Create a test apply task via API:
```bash
curl -X POST http://localhost:8000/apply/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "job_id": "linkedin-test-job",
    "status": "queued",
    "priority": 5
  }'
```
2. Navigate to Tasks page in web app
3. Filter by status: "Queued"

### Expected Results:
- ✓ Task appears in list
- ✓ Shows job_id
- ✓ Status badge shows "queued"
- ✓ Timestamp is correct
- ✓ Filter works

## Test 8: Extension Offline Mode

### Steps:
1. Ensure extension has cached preferences
2. Stop backend API
3. Extension should continue working with cached data

### Expected Results:
- ✓ Extension console: `[FW Sync] Failed to fetch preferences, using cache`
- ✓ Extension still reads local preference cache
- ✓ Autofill still works (if enabled in cache)
- ✓ No crashes or errors

### Verification:
```bash
# Check chrome.storage.local
# In extension console:
# chrome.storage.local.get('fw_preference_cache', console.log)
```

## Test 9: Token Expiration & Re-auth

### Steps:
1. Log in to web app
2. Manually expire token (or wait 7 days)
3. Try to access any protected page

### Expected Results:
- ✓ 401 Unauthorized from API
- ✓ Auto-logout
- ✓ Redirected to /login
- ✓ Token cleared from localStorage

## Test 10: Complete Apply Flow with Logging

### Steps:
1. Queue an apply task (via API or backend)
2. Extension picks up task
3. Extension navigates to job page
4. Extension detects ATS, runs autofill
5. User reviews and submits
6. Check web app for audit trail

### Expected Results:
- ✓ Task visible in Tasks page
- ✓ Status changes: queued → in_progress → success
- ✓ All automation events logged
- ✓ Audit log shows full decision tree
- ✓ Profile data was used for autofill

## Success Criteria Summary

Phase 5.0 is complete when ALL of the following are verified:

- [x] User can register and login on web app
- [x] JWT authentication works end-to-end
- [x] Profile CRUD works, data persists
- [x] Automation preferences sync to extension (5 min poll)
- [x] Cross-device: same preferences on multiple devices
- [x] Extension authenticates with JWT
- [x] Extension logs automation events to backend
- [x] Web app displays automation audit log
- [x] Web app displays apply tasks (read-only)
- [x] Extension works offline with cached preferences
- [x] All data in backend database (PostgreSQL)

## Critical Failures (Must Not Occur)

- User creates profile → extension cannot fetch it
- User updates preferences → extension never sees changes
- Extension logs events → web app shows empty audit log
- JWT token expires → user cannot re-authenticate
- Database migration breaks existing data
- Extension runs in online mode but ignores backend preferences

## Testing Notes

- All API calls should include JWT token in Authorization header
- Extension should gracefully handle offline scenarios
- Web app should auto-logout on 401 responses
- All timestamps should be in UTC
- All UUIDs and IDs should be consistent across systems

## Troubleshooting

**Extension not syncing:**
- Check network tab for API calls
- Check console for `[FW Sync]` logs
- Verify JWT token in chrome.storage.local
- Verify backend is running

**Web app not loading:**
- Check Vite dev server is running on port 3000
- Check API proxy is forwarding to port 8000
- Check CORS settings in backend

**Database errors:**
- Ensure PostgreSQL is running
- Run migrations: `python migrate_phase5_schema.py`
- Check connection string in DATABASE_URL

---

**Test Completion Date:** _____________

**Tester:** _____________

**All Tests Passed:** ☐ Yes ☐ No

**Notes:**

