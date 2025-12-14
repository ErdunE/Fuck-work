# Phase 5.3.0: Observability Console - Production-Grade Event Streaming & Debugging

## Overview

The Observability Console is a production-grade system for tracking, debugging, and understanding end-to-end application automation runs across the FuckWork platform. It provides structured event streaming, timeline reconstruction, and full traceability from Web App → Backend → Extension → ATS page interactions.

**Key Goal:** Answer the question "What happened during this application attempt and why?" with complete transparency and structured evidence.

---

## Architecture

```
Extension (Chrome)
    ↓
    startRun() → POST /api/observability/runs/start → run_id
    ↓
    enqueue(events) → batch flush → POST /api/observability/events/batch
    ↓
Backend (FastAPI + PostgreSQL)
    ↓
    apply_runs table (run metadata)
    apply_events table (event stream, append-only)
    ↓
Web App (React)
    ↓
    GET /api/observability/runs (list view)
    GET /api/observability/runs/{run_id} (detail)
    GET /api/observability/runs/{run_id}/events (timeline)
```

**Correlation:** All events are correlated by `run_id` (and optionally `task_id`, `detection_id`, `page_id`).

---

## Data Model

### Table: `apply_runs`

Stores high-level metadata for each application attempt/run.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (run_id) |
| `user_id` | int | Foreign key to users |
| `job_id` | varchar | Job identifier |
| `task_id` | int | Apply task ID (optional) |
| `initial_url` | text | URL where run started |
| `current_url` | text | Last known URL |
| `ats_kind` | varchar | ATS type (greenhouse, workday, lever, etc.) |
| `intent` | varchar | Page intent (application_form, login_required, etc.) |
| `stage` | varchar | Current stage (analyzing, filling, etc.) |
| `status` | varchar | Run status (in_progress, success, failed, abandoned) |
| `fill_rate` | float | Autofill success rate (0-100%) |
| `fields_attempted` | int | Total fields attempted |
| `fields_filled` | int | Fields successfully filled |
| `fields_skipped` | int | Fields skipped |
| `failure_reason` | text | Error message if failed |
| `created_at` | timestamp | Run start time |
| `updated_at` | timestamp | Last update time |
| `ended_at` | timestamp | Run end time (nullable) |

**Indexes:**
- `(user_id, created_at DESC)`
- `(status, created_at DESC)`
- `(ats_kind)`
- `(task_id)`

### Table: `observability_events`

Stores append-only structured event stream.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `run_id` | bigint | Foreign key to apply_runs |
| `user_id` | int | Foreign key to users |
| `source` | varchar(20) | Event source (extension, backend, web) |
| `severity` | varchar(10) | Severity level (debug, info, warn, error) |
| `event_name` | varchar(100) | Event name (standardized) |
| `event_version` | int | Event schema version |
| `ts` | timestamp | Event timestamp |
| `url` | text | Page URL context |
| `payload` | jsonb | Extensible event payload |
| `dedup_key` | varchar | Deduplication key (optional) |
| `request_id` | varchar | HTTP request ID (backend events) |
| `detection_id` | varchar | Detection session ID |
| `page_id` | varchar | Page ID |

**Indexes:**
- `(run_id, ts)`
- `(event_name, ts)`
- GIN index on `payload` (JSONB search)

---

## API Endpoints

### POST /api/observability/runs/start

Start a new observability run.

**Request:**
```json
{
  "task_id": 20,
  "job_id": "linkedin_728569",
  "initial_url": "https://linkedin.com/jobs/view/123",
  "current_url": "https://jobs.company.com/apply",
  "ats_kind": "greenhouse",
  "intent": "application_form",
  "stage": "analyzing"
}
```

**Response:**
```json
{
  "run_id": 123
}
```

**Idempotency:** If an `in_progress` run exists for the same `task_id + current_url` within 10 minutes, returns existing `run_id`.

---

### POST /api/observability/events/batch

Batch insert events for a run.

**Request:**
```json
{
  "run_id": 123,
  "events": [
    {
      "source": "extension",
      "severity": "info",
      "event_name": "detection_completed",
      "payload": {"ats_kind": "greenhouse", "confidence": 0.95}
    },
    {
      "source": "extension",
      "severity": "info",
      "event_name": "autofill_triggered",
      "payload": {"profile_source": "derived_profile"}
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "inserted": 2
}
```

**Limits:** Max 200 events per batch.

---

### GET /api/observability/runs

List runs with filters and pagination.

**Query Parameters:**
- `limit` (default: 50, max: 200)
- `offset` (default: 0)
- `status` (in_progress, success, failed, abandoned)
- `ats_kind` (greenhouse, workday, lever, etc.)
- `q` (text search on job_id, URLs)

**Response:**
```json
{
  "runs": [
    {
      "id": 123,
      "task_id": 20,
      "job_id": "linkedin_728569",
      "ats_kind": "greenhouse",
      "intent": "application_form",
      "stage": "filled",
      "status": "in_progress",
      "fill_rate": 85.0,
      "fields_attempted": 20,
      "fields_filled": 17,
      "fields_skipped": 3,
      "current_url": "https://jobs.company.com/apply",
      "created_at": "2025-01-14T10:30:00Z",
      "ended_at": null
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### GET /api/observability/runs/{run_id}

Get detailed run information.

**Response:**
```json
{
  "id": 123,
  "user_id": 1,
  "task_id": 20,
  "job_id": "linkedin_728569",
  "initial_url": "https://linkedin.com/jobs/view/123",
  "current_url": "https://jobs.company.com/apply",
  "ats_kind": "greenhouse",
  "intent": "application_form",
  "stage": "filled",
  "status": "in_progress",
  "fill_rate": 85.0,
  "fields_attempted": 20,
  "fields_filled": 17,
  "fields_skipped": 3,
  "failure_reason": null,
  "created_at": "2025-01-14T10:30:00Z",
  "updated_at": "2025-01-14T10:32:15Z",
  "ended_at": null,
  "event_count": 45,
  "first_event_ts": "2025-01-14T10:30:05Z",
  "last_event_ts": "2025-01-14T10:32:10Z"
}
```

---

### GET /api/observability/runs/{run_id}/events

Get event timeline for a run.

**Query Parameters:**
- `limit` (default: 500, max: 1000)

**Response:**
```json
{
  "events": [
    {
      "id": 1001,
      "source": "extension",
      "severity": "info",
      "event_name": "run_started",
      "event_version": 1,
      "ts": "2025-01-14T10:30:05Z",
      "url": "https://linkedin.com/jobs/view/123",
      "payload": {"task_id": 20, "job_id": "linkedin_728569"},
      "detection_id": "abc123"
    },
    {
      "id": 1002,
      "source": "extension",
      "severity": "info",
      "event_name": "detection_completed",
      "event_version": 1,
      "ts": "2025-01-14T10:30:08Z",
      "url": "https://jobs.company.com/apply",
      "payload": {"ats_kind": "greenhouse", "confidence": 0.95}
    }
  ],
  "total": 45
}
```

---

## Event Naming Conventions

Use these standardized event names:

### Run Lifecycle
- `run_started` - Run begins
- `run_completed` - Run succeeds
- `run_failed` - Run fails with error
- `run_abandoned` - User abandoned run

### Session
- `session_loaded` - Apply session loaded
- `session_closed` - Apply session closed

### Detection
- `detection_started` - Detection pipeline starts
- `detection_completed` - Detection pipeline completes
- `stage_transition` - Stage changes (analyzing → ready_to_fill → filled, etc.)

### Profile
- `derived_profile_loaded` - Derived profile fetched successfully
- `derived_profile_missing_fields` - Profile has missing required fields

### Autofill
- `autofill_triggered` - Autofill decision made
- `autofill_started` - Autofill execution begins
- `autofill_field_attempt` - Field fill attempted
- `autofill_field_filled` - Field successfully filled
- `autofill_field_skipped` - Field skipped (with reason)
- `autofill_completed` - Autofill execution completes

### Errors
- `api_call_failed` - Backend API call failed
- `auth_failed` - Authentication failed
- `selector_not_found` - DOM selector not found
- `manual_review_required` - User action required

---

## Redaction Rules (Non-Negotiable)

**Never log the following in event payloads:**

- JWT access tokens
- Passwords
- Full email addresses (mask: `us***@example.com`)
- Full phone numbers (mask: `+1-555-***-1234`)
- Resume text content
- Cover letter text content

**Implementation:** The `observability.js` client automatically redacts sensitive data via the `redact()` method before queueing events.

---

## Extension Integration

### ObservabilityClient API

```javascript
// Start a run
const runId = await observabilityClient.startRun(session, pageContext)

// Enqueue an event
observabilityClient.enqueue({
  source: 'extension',
  severity: 'info',
  event_name: 'autofill_triggered',
  url: window.location.href,
  payload: { profile_source: 'derived_profile' }
})

// Manually flush events
await observabilityClient.flush()

// End run
await observabilityClient.endRun('success')
```

### Auto-Flush

Events are automatically flushed every 5 seconds while a run is active. On page unload, a best-effort flush is attempted via `navigator.sendBeacon`.

### Queue Management

- Max queue size: 200 events
- Oldest events are dropped if queue is full
- Failed flushes requeue events (up to max)

---

## Web UI Features

### Runs List Page (`/observability`)

- **Filters:** Status, ATS type, text search
- **Columns:** Run ID, Time, Status, ATS, Intent/Stage, Job ID, Fill Rate, Fields
- **Click:** Navigate to run detail
- **Pagination:** 50 runs per page

### Run Detail Page (`/observability/runs/:runId`)

**Header Card:**
- Run metadata (status, task_id, job_id, ATS, intent, stage, URLs, timestamps)

**Summary Cards:**
- Fields Attempted, Fields Filled, Fields Skipped, Fill Rate

**Timeline:**
- Chronological event list
- Each event shows: timestamp, source badge, severity, event name, expandable JSON payload
- **Live Mode:** Auto-refreshes every 2s if `status === 'in_progress'`

---

## Backend Instrumentation

### Request ID Middleware

Every HTTP request is assigned a unique `request_id` (UUID), added to:
- Response header: `X-Request-ID`
- Backend-emitted events: `request_id` field

### Event Logging Helper

```python
from api.observability_logger import log_event

log_event(
    db=db,
    user_id=current_user.id,
    run_id=123,
    event_name="derived_profile_served",
    payload={"missing_fields": ["legal_name"], "derived_profile_version": 1}
)
```

---

## Manual Testing Guide

See `PHASE_5.3.0_MANUAL_TEST.md` for step-by-step manual testing instructions.

---

## Acceptance Criteria (MVP)

Phase 5.3.0 is complete when:

- ✅ Database tables `apply_runs` and `observability_events` exist with indexes
- ✅ Migration script runs successfully
- ✅ Backend API endpoints work correctly
- ✅ Extension starts runs and logs events
- ✅ Extension redacts sensitive data
- ✅ Web UI shows runs list with filters
- ✅ Web UI shows run detail with timeline
- ✅ Live mode auto-refreshes in_progress runs
- ✅ No JWT or passwords appear in logs
- ✅ Manual test passes end-to-end

---

## Future Phases (Not in MVP)

### Phase 5.3.1: Hardening
- Backend emits key events (auth, profile, preferences changes)
- `dedup_key` support for noisy mutation events
- Live mode WebSocket (replace polling)
- Better filters (time range, event name)

### Phase 5.3.2: Field Evidence
- `apply_field_events` table for field-level telemetry
- Fill rate computation and storage
- Field compare view (expected vs actual)

---

## Troubleshooting

**No events showing up:**
- Check extension console for `[Observability] Run started:` log
- Verify JWT token is valid
- Check backend `/api/observability/runs` returns data
- Verify run_id is set in extension

**Events not flushing:**
- Check network tab for batch POST requests
- Verify backend is reachable from extension
- Check extension console for flush errors

**Run detail page empty:**
- Verify `run_id` in URL is correct
- Check backend logs for 403/404 errors
- Ensure user owns the run

---

## Summary

Phase 5.3.0 establishes a **production-grade observability foundation** that makes the entire FuckWork automation system transparent, debuggable, and traceable. Every action across Extension → Backend → Web App is captured, correlated, and queryable with full timeline reconstruction.

**Key Achievement:** We can now answer "What happened during this application and why?" with complete evidence.

