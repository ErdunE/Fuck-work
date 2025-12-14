# Phase 5.3.0 Manual Test Guide

## Prerequisites

Before running these tests, ensure:

1. **Backend is running:**
   ```bash
   cd apps/backend && python3 run_api.py
   ```

2. **Frontend is running:**
   ```bash
   cd apps/web_control_plane && npm run dev
   ```

3. **Extension is loaded:**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Load unpacked extension from `apps/extension/`

4. **Database migration completed:**
   ```bash
   cd apps/backend && python3 migrate_phase5_3.py
   ```

---

## Test 1: Database Schema Verification

**Objective:** Verify tables and indexes exist.

```bash
# Connect to PostgreSQL
psql -U postgres -d fuckwork_dev

# Check tables exist
\dt

# Should see:
# - apply_runs
# - observability_events (formerly apply_events in old schema)

# Check indexes
\di

# Should see indexes on:
# - apply_runs: user_id, task_id, status, ats_kind, created_at
# - observability_events: run_id, user_id, event_name, ts, payload (GIN)

# Exit
\q
```

**Expected Result:** ✅ Both tables exist with all indexes.

---

## Test 2: Backend API - Start Run

**Objective:** Verify run creation endpoint works.

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' \
  | jq -r '.access_token')

# If user doesn't exist, register first:
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Start a run
curl -X POST http://localhost:8000/api/observability/runs/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 1,
    "job_id": "test_job_001",
    "initial_url": "https://linkedin.com/jobs/view/123",
    "current_url": "https://jobs.company.com/apply",
    "ats_kind": "greenhouse",
    "intent": "application_form",
    "stage": "analyzing"
  }' | jq .
```

**Expected Output:**
```json
{
  "run_id": 1
}
```

**Expected Result:** ✅ Returns a `run_id`.

---

## Test 3: Backend API - Batch Events

**Objective:** Verify event ingestion endpoint works.

```bash
# Use run_id from Test 2 (e.g., 1)
RUN_ID=1

curl -X POST http://localhost:8000/api/observability/events/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"run_id\": $RUN_ID,
    \"events\": [
      {
        \"source\": \"extension\",
        \"severity\": \"info\",
        \"event_name\": \"detection_completed\",
        \"payload\": {\"ats_kind\": \"greenhouse\", \"confidence\": 0.95}
      },
      {
        \"source\": \"extension\",
        \"severity\": \"info\",
        \"event_name\": \"derived_profile_loaded\",
        \"payload\": {\"profile_source\": \"derived_profile\", \"has_legal_name\": true}
      },
      {
        \"source\": \"extension\",
        \"severity\": \"info\",
        \"event_name\": \"autofill_triggered\",
        \"payload\": {\"trigger_reason\": \"application_form detected\"}
      }
    ]
  }" | jq .
```

**Expected Output:**
```json
{
  "ok": true,
  "inserted": 3
}
```

**Expected Result:** ✅ Events inserted successfully.

---

## Test 4: Backend API - List Runs

**Objective:** Verify runs list endpoint works.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/observability/runs?limit=10" | jq .
```

**Expected Output:**
```json
{
  "runs": [
    {
      "id": 1,
      "task_id": 1,
      "job_id": "test_job_001",
      "ats_kind": "greenhouse",
      "intent": "application_form",
      "stage": "analyzing",
      "status": "in_progress",
      "fill_rate": null,
      "fields_attempted": 0,
      "fields_filled": 0,
      "fields_skipped": 0,
      "current_url": "https://jobs.company.com/apply",
      "created_at": "2025-01-14T...",
      "ended_at": null
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Expected Result:** ✅ Returns run created in Test 2.

---

## Test 5: Backend API - Run Detail

**Objective:** Verify run detail endpoint works.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/observability/runs/1" | jq .
```

**Expected Output:**
```json
{
  "id": 1,
  "user_id": 1,
  "task_id": 1,
  "job_id": "test_job_001",
  "initial_url": "https://linkedin.com/jobs/view/123",
  "current_url": "https://jobs.company.com/apply",
  "ats_kind": "greenhouse",
  "intent": "application_form",
  "stage": "analyzing",
  "status": "in_progress",
  "event_count": 3,
  "first_event_ts": "2025-01-14T...",
  "last_event_ts": "2025-01-14T..."
}
```

**Expected Result:** ✅ Returns detailed run info with event summary.

---

## Test 6: Backend API - Run Events

**Objective:** Verify events timeline endpoint works.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/observability/runs/1/events" | jq .
```

**Expected Output:**
```json
{
  "events": [
    {
      "id": 1,
      "source": "extension",
      "severity": "info",
      "event_name": "detection_completed",
      "event_version": 1,
      "ts": "2025-01-14T...",
      "url": null,
      "payload": {"ats_kind": "greenhouse", "confidence": 0.95}
    },
    {
      "id": 2,
      "source": "extension",
      "severity": "info",
      "event_name": "derived_profile_loaded",
      "event_version": 1,
      "ts": "2025-01-14T...",
      "payload": {"profile_source": "derived_profile"}
    },
    {
      "id": 3,
      "source": "extension",
      "severity": "info",
      "event_name": "autofill_triggered",
      "event_version": 1,
      "ts": "2025-01-14T...",
      "payload": {"trigger_reason": "application_form detected"}
    }
  ],
  "total": 3
}
```

**Expected Result:** ✅ Returns events in chronological order.

---

## Test 7: Web UI - Runs List

**Objective:** Verify runs list page displays correctly.

1. Open browser: http://localhost:3000
2. Login with test credentials
3. Navigate to: **Observability** (in nav bar)
4. Expected UI:
   - ✅ Filters visible (Status, ATS Type, Search)
   - ✅ Table with columns: Run ID, Time, Status, ATS, Intent/Stage, Job ID, Fill Rate, Fields
   - ✅ At least 1 run visible (from Test 2)
   - ✅ Click on run navigates to detail page

**Screenshot Location:** (Optional) Save screenshot to `docs/screenshots/observability-runs-list.png`

---

## Test 8: Web UI - Run Detail

**Objective:** Verify run detail page displays correctly.

1. From Runs List, click on run #1
2. Expected URL: `http://localhost:3000/observability/runs/1`
3. Expected UI:
   - ✅ Header card with run metadata (task_id, job_id, ATS, status, URLs)
   - ✅ Summary cards showing fields attempted/filled/skipped
   - ✅ Timeline with 3 events (from Test 3)
   - ✅ Each event shows: timestamp, source badge, severity, event name
   - ✅ Click "Show Payload" expands JSON
   - ✅ If status=in_progress, "LIVE" badge appears

**Screenshot Location:** (Optional) Save screenshot to `docs/screenshots/observability-run-detail.png`

---

## Test 9: End-to-End - Extension Integration

**Objective:** Verify extension creates runs and logs events.

### Setup:
1. Web App: Register/login, complete profile, enable `auto_fill_after_login`
2. Extension: Login via popup with same credentials

### Steps:
1. Navigate to a job on LinkedIn (or any supported ATS)
2. Click "Apply" button
3. **Extension should:**
   - Start observability run (check console: `[Observability] Run started: <run_id>`)
   - Log detection events
   - Load derived profile
   - Trigger autofill
   - Log autofill events
   - Flush events periodically

4. **Web App:**
   - Go to http://localhost:3000/observability
   - ✅ New run should appear in list
   - Click on the run
   - ✅ Timeline should show events:
     - `run_started`
     - `detection_completed`
     - `derived_profile_loaded`
     - `autofill_triggered`
     - `autofill_completed`

5. **Check Extension Console:**
   ```
   [Observability] Run started: 2
   [Observability] Flushed 5 events
   ```

6. **Check Run Detail Page:**
   - ✅ Events appear in chronological order
   - ✅ No JWT tokens in payloads
   - ✅ Email/phone are masked (if present)
   - ✅ Payload JSON is expandable

**Expected Result:** ✅ Full end-to-end flow captured in observability console.

---

## Test 10: Redaction Verification

**Objective:** Verify sensitive data is NOT logged.

1. From Test 9, inspect event payloads in Web UI
2. **Must NOT contain:**
   - ❌ JWT tokens
   - ❌ Passwords
   - ❌ Full email addresses (should be masked: `us***@example.com`)
   - ❌ Full phone numbers (should be masked: `+1-555-***-1234`)

3. **Extension Console Check:**
   ```javascript
   // Should see redaction logs:
   [Observability] Redacting sensitive fields...
   ```

**Expected Result:** ✅ No sensitive data appears in any payload.

---

## Test 11: Live Mode

**Objective:** Verify live mode auto-refresh works.

1. Start an application run via extension (keep it in_progress, don't complete)
2. Open Run Detail page for that run
3. **Expected UI:**
   - ✅ "LIVE" badge appears next to run ID
   - ✅ Timeline auto-refreshes every 2 seconds
   - ✅ New events appear without manual refresh
   - ✅ Page shows "Auto-refreshing every 2s" text

4. Complete the run (or mark as success/failed)
5. **Expected UI:**
   - ✅ "LIVE" badge disappears
   - ✅ Auto-refresh stops

**Expected Result:** ✅ Live mode works correctly for in_progress runs.

---

## Test 12: Filters & Pagination

**Objective:** Verify filters and pagination work.

1. Create multiple runs (use curl from Test 2, vary parameters)
2. Go to Observability Runs List
3. **Test Filters:**
   - Set Status = "in_progress" → ✅ Only shows in_progress runs
   - Set ATS Type = "greenhouse" → ✅ Only shows greenhouse runs
   - Enter Job ID in search → ✅ Filters by job_id
4. **Test Pagination:**
   - If total > 50, pagination buttons appear
   - Click "Next" → ✅ Shows next page
   - Click "Previous" → ✅ Shows previous page

**Expected Result:** ✅ Filters and pagination work correctly.

---

## Acceptance Checklist

Mark all as ✅ before considering Phase 5.3.0 complete:

- [ ] Database tables created (apply_runs, observability_events)
- [ ] All indexes created successfully
- [ ] POST /api/observability/runs/start works
- [ ] POST /api/observability/events/batch works
- [ ] GET /api/observability/runs works
- [ ] GET /api/observability/runs/{run_id} works
- [ ] GET /api/observability/runs/{run_id}/events works
- [ ] Web UI Runs List page renders
- [ ] Web UI Run Detail page renders
- [ ] Extension starts runs correctly
- [ ] Extension logs events correctly
- [ ] Extension redacts sensitive data
- [ ] Live mode auto-refreshes
- [ ] No JWT/passwords in logs
- [ ] End-to-end flow captured correctly

---

## Troubleshooting

### Issue: No runs showing up in Web UI

**Check:**
- Backend API returns data: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/observability/runs`
- Browser console for errors
- JWT token is valid (check localStorage)

### Issue: Extension not logging events

**Check:**
- Extension console for `[Observability] Run started:` log
- Auth token is set (extension popup shows logged in)
- Backend is reachable from extension
- Network tab for POST requests to `/api/observability/events/batch`

### Issue: Live mode not working

**Check:**
- Run status is `in_progress`
- Browser console for auto-refresh logs
- Network tab shows periodic GET requests every 2s

---

## Summary

This manual test guide ensures Phase 5.3.0 MVP is fully functional end-to-end. Complete all tests and mark the acceptance checklist before proceeding to Phase 5.3.1.

