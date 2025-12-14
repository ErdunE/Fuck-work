# Phase 4.1.3: Apply Session Binding - Manual Verification

## Test Objective
Verify that apply sessions maintain task context across all page navigations, ensuring no "lost context" during multi-step applications.

## Prerequisites
- Backend API running (`python3 run_api.py`)
- Extension loaded in Chrome
- Test job URLs ready (LinkedIn, Workday, or Greenhouse)

## Test Scenario 1: LinkedIn Easy Apply with Session Continuity

### Setup
1. Queue a LinkedIn Easy Apply job:
   ```bash
   curl -X POST http://127.0.0.1:8000/apply/queue \
     -H "Content-Type: application/json" \
     -d '{"user_id": 1, "job_ids": ["linkedin_test_job"], "allow_duplicates": true}'
   ```

### Steps
1. **Extension opens job detail page**
   - ✓ Console shows: `[ApplySession] Created new session: {task_id: X, job_id: Y}`
   - ✓ Overlay shows: "Click Apply Button"
   - ✓ Guidance includes: "You are applying for job Y (Task #X)"

2. **User clicks "Apply" button**
   - ✓ Page navigates to application form
   - ✓ Console shows: `[Page Lifecycle] pushState detected`
   - ✓ Console shows: `[Recheck] Executing detection pipeline (reason: url_changed, task: X)`
   - ✓ Overlay updates automatically (no manual refresh)

3. **On application form page**
   - ✓ Autofill runs automatically
   - ✓ Open popup → verify session info shows task_id
   - ✓ Copy debug report → verify `session.task_id` matches original

4. **User clicks "Continue" or "Next"**
   - ✓ SPA navigation detected
   - ✓ Overlay updates for next step
   - ✓ task_id remains the same

5. **Complete application**
   - ✓ Mark success in popup
   - ✓ Console shows: `[ApplySession] Closed session: X`

### Expected Outcomes
- [ ] Session created when task claimed
- [ ] Session persists across URL changes
- [ ] task_id visible in all overlays and popup
- [ ] recheck_count increments with each transition
- [ ] No "orphaned" pages (all pages know their task)
- [ ] Session closed when task completes

## Test Scenario 2: Workday with Login Flow

### Setup
1. Queue a Workday job requiring login

### Steps
1. **Job detail page opens**
   - ✓ Session created with task_id
   - ✓ Overlay: "Click Apply"

2. **Click Apply → redirects to Workday login**
   - ✓ URL changes (hard navigation)
   - ✓ Session persists (same task_id)
   - ✓ Overlay: "Sign In Required"
   - ✓ Guidance: "You are applying for job Y (Task #X)"

3. **User logs in**
   - ✓ Page redirects to application form
   - ✓ Session still active
   - ✓ Overlay updates automatically
   - ✓ Autofill runs

4. **Verify session continuity**
   - ✓ Check console for task_id in all log messages
   - ✓ Copy debug report → session object present
   - ✓ recheck_count shows multiple transitions

### Expected Outcomes
- [ ] Login page knows it's part of an application
- [ ] No context lost during authentication
- [ ] All pages show same task_id
- [ ] Guidance references the correct job

## Test Scenario 3: Multi-Domain Navigation

### Steps
1. Start application on job board (e.g., LinkedIn)
2. Click Apply → redirects to external ATS (e.g., Greenhouse)
3. Navigate through multi-step form
4. Verify session maintained across domains

### Expected Outcomes
- [ ] Session crosses domain boundaries
- [ ] task_id preserved throughout
- [ ] Each page classified correctly (page_type)

## Validation Checklist

### Session Creation
- [ ] Session created when task transitions to in_progress
- [ ] Session includes: task_id, job_id, initial_url, started_at
- [ ] Old session closed before creating new one

### Session Persistence
- [ ] Session survives URL changes
- [ ] Session survives SPA navigation
- [ ] Session survives tab switches
- [ ] Session stored in chrome.storage.local

### Task Binding
- [ ] All detection logs show task_id
- [ ] All overlays reference task_id
- [ ] All guidance mentions job_id
- [ ] Debug report includes full session object

### Session Lifecycle
- [ ] Session active throughout application
- [ ] Session closed on success
- [ ] Session closed on failure
- [ ] Session closed on cancel

### Page Classification
- [ ] job_detail_page detected correctly
- [ ] ats_landing_page detected correctly
- [ ] authentication_page detected correctly
- [ ] application_form_page detected correctly
- [ ] submission_confirmation_page detected correctly

## Debug Verification

### Console Logs to Check
```
[ApplySession] Created new session: {task_id: 123, ...}
[Content] Active apply session found: {task_id: 123, ...}
[Recheck] Executing detection pipeline (reason: url_changed, task: 123)
[ApplySession] Updated session: {current_url: "...", recheck_count: 2}
[ApplySession] Closed session: 123
```

### Debug Report Structure
```json
{
  "session": {
    "task_id": 123,
    "job_id": "linkedin_456",
    "ats_kind": "workday",
    "started_at": "2024-01-15T10:00:00Z"
  },
  "ats": {...},
  "stage": {...},
  "page_type": "authentication_page",
  "recheck_count": 3
}
```

## Common Issues

**Issue: Session not found on new page**
- Check if session is in chrome.storage.local
- Verify session.active === true
- Check console for session creation logs

**Issue: task_id mismatch**
- Check if multiple tasks claimed simultaneously
- Verify old session closed before new one created

**Issue: Session closed prematurely**
- Check task completion logs
- Verify no accidental closeActiveSession() calls

## Success Criteria
✅ No "lost context" after navigation  
✅ task_id visible and consistent everywhere  
✅ Guidance references correct job  
✅ Session survives all transitions  
✅ Session lifecycle managed correctly  

