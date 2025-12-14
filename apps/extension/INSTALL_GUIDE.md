# FuckWork Extension - Installation & Testing Guide

## Phase 3.6: Human-in-the-loop Apply Worker

### Prerequisites

1. Backend API running on `http://127.0.0.1:8000`
2. User profile created (user_id=1) with email, first_name, last_name
3. Jobs in database with valid LinkedIn/Indeed URLs

### Installation Steps

#### 1. Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions`
3. Toggle "Developer mode" ON (top-right corner)
4. Click "Load unpacked" button
5. Navigate to and select: `/Users/erdune/Desktop/Fuck-work/apps/extension`
6. Verify extension appears in list with blue "FW" icon

#### 2. Verify Extension Loaded

- Click the extension icon in Chrome toolbar (or extensions menu)
- Popup should open showing: "No active task - waiting for queued tasks..."
- Check Chrome DevTools > Service Workers to see background script logs

### Testing Workflow

#### Step 1: Prepare Backend

```bash
# Terminal 1: Start backend API
cd /Users/erdune/Desktop/Fuck-work/apps/backend
python3 run_api.py
```

#### Step 2: Queue Apply Tasks

```bash
# Terminal 2: Queue some jobs
curl -X POST http://127.0.0.1:8000/apply/queue \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "job_ids": ["linkedin_728569", "linkedin_815132"],
    "priority_strategy": "decision_then_newest",
    "allow_duplicates": false
  }'
```

Expected response:
```json
{
  "tasks": [...],
  "total": 2,
  ...
}
```

#### Step 3: Observe Automatic Behavior

1. Wait up to 15 seconds (polling interval)
2. Extension background script will:
   - Poll backend
   - Find queued task
   - Claim it (transition to `in_progress`)
   - Open job URL in new tab
3. Job page should open automatically

#### Step 4: Check Autofill

1. On the opened job page, open Chrome DevTools Console
2. Look for logs: "FuckWork content script loaded"
3. Check for autofill logs: "Filled email: ...", "Filled first name: ..."
4. Verify email/name fields are filled

#### Step 5: Manual Submission

1. Review the pre-filled form
2. Fill any remaining required fields manually
3. Submit the application manually (click submit button)
4. Confirm submission was successful

#### Step 6: Mark Task Status

1. Click the extension icon in Chrome toolbar
2. Popup should show: "Task in progress: linkedin_728569"
3. Click "✓ Mark Success" button
4. Popup should show: "Task completed successfully"

#### Step 7: Verify Backend State

```bash
# Check task status changed to success
curl http://127.0.0.1:8000/apply/tasks/1

# Check event log
curl http://127.0.0.1:8000/apply/tasks?user_id=1
```

Expected: Task status should be `success` with events logged.

### Testing Other Scenarios

#### Test "Needs Manual Help"

1. Queue a task with a complex form
2. Let extension open page
3. Click extension icon
4. Click "⚠ Needs Manual Help" button
5. Verify task transitions to `needs_user`

#### Test "Cancel Task"

1. Queue a task
2. Let extension open page
3. Click extension icon
4. Click "✕ Cancel Task" button
5. Verify task transitions to `canceled`

### Debugging

#### Extension Console

View background script logs:
1. Go to `chrome://extensions`
2. Find "FuckWork Apply Worker"
3. Click "service worker" link
4. DevTools opens showing background script console

#### Content Script Console

View content script logs:
1. Open job page where content script runs
2. Open DevTools (F12)
3. Go to Console tab
4. Look for "FuckWork content script loaded"

#### Network Issues

If extension can't reach backend:
- Verify backend is running: `curl http://127.0.0.1:8000/health`
- Check host_permissions in manifest.json
- Reload extension after backend starts

### Expected Results

All acceptance criteria should pass:
- ✓ Extension loads without errors
- ✓ Background script polls backend successfully
- ✓ Queued task is fetched and claimed
- ✓ Task transitions to `in_progress`
- ✓ Job page opens automatically
- ✓ At least 1 field is autofilled (email or name)
- ✓ User can manually submit application
- ✓ Popup shows current task information
- ✓ "Mark Success" button transitions task to `success`
- ✓ "Needs Manual Help" button transitions to `needs_user`
- ✓ "Cancel Task" button transitions to `canceled`
- ✓ Backend apply_events table logs all transitions
- ✓ Multiple tasks are processed sequentially

### Troubleshooting

**Problem:** Extension not polling
- **Solution:** Check service worker console for errors, reload extension

**Problem:** Job page doesn't open
- **Solution:** Verify job has valid URL in database, check background script logs

**Problem:** Autofill doesn't work
- **Solution:** Check user profile exists (`curl http://127.0.0.1:8000/users/1`), check content script console

**Problem:** Status buttons disabled
- **Solution:** Refresh popup, verify task is in `in_progress` state

**Problem:** "Task already in progress" when queuing
- **Solution:** Use `allow_duplicates: true` or complete/cancel existing task first

### Phase Outcome

Phase 3.6 proves the end-to-end apply loop:
- Backend task queue ✓
- Extension worker ✓
- Automatic page opening ✓
- Basic autofill ✓
- Human oversight ✓
- Status tracking ✓

**The apply loop is now REAL and functional.**

Future phases will enhance automation incrementally while maintaining safety.

