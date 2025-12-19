# Apply Worker Protocol

## Overview

This document defines the protocol for apply workers (browser extensions, automation scripts) to interact with the FuckWork backend to process job application tasks.

## Worker Lifecycle

1. **Poll for task**: Worker requests next queued task
2. **Claim task**: Worker transitions task to `in_progress`
3. **Execute task**: Worker opens job page and performs actions
4. **Report outcome**: Worker transitions task to final status

## API Endpoints

### 1. Poll Next Task

```http
GET /apply/tasks?user_id={user_id}&status=queued&limit=1
```

**Response:**
```json
{
  "tasks": [{
    "id": 1,
    "user_id": 1,
    "job_id": "linkedin_123",
    "status": "queued",
    "priority": 1050,
    ...
  }],
  "total": 1
}
```

### 2. Claim Task

```http
POST /apply/tasks/{task_id}/transition
Content-Type: application/json

{
  "to_status": "in_progress",
  "reason": "Worker claimed task",
  "details": {
    "worker_id": "extension_v1",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Fetch Job Details

Worker must fetch the job to get the URL:

```http
POST /jobs/search
Content-Type: application/json

{
  "filters": {"job_id": "linkedin_123"},
  "limit": 1
}
```

Or the backend should include job URL in task metadata (future enhancement).

### 4. Report Outcome

**Success:**
```http
POST /apply/tasks/{task_id}/transition

{
  "to_status": "success",
  "reason": "User submitted application",
  "details": {
    "submitted_at": "2024-01-01T00:00:00Z",
    "page_url": "https://..."
  }
}
```

**Needs User:**
```http
POST /apply/tasks/{task_id}/transition

{
  "to_status": "needs_user",
  "reason": "captcha_detected | custom_form | unknown_layout",
  "details": {
    "issue": "CAPTCHA challenge present",
    "page_url": "https://..."
  }
}
```

**Failed:**
```http
POST /apply/tasks/{task_id}/transition

{
  "to_status": "failed",
  "reason": "Network error | Page not found | Timeout",
  "details": {
    "error": "Page load timeout after 30s",
    "page_url": "https://..."
  }
}
```

**Canceled:**
```http
POST /apply/tasks/{task_id}/transition

{
  "to_status": "canceled",
  "reason": "User manually canceled"
}
```

## Worker Rules

1. **One task at a time**: Worker should only process one task at a time
2. **No auto-submit**: Worker must NEVER automatically submit applications
3. **Timeout**: If worker doesn't report outcome within 10 minutes, task should be considered stalled
4. **Polling interval**: Workers should poll every 15-30 seconds when idle
5. **User confirmation**: All submissions require explicit user action

## Error Handling

- **Network errors**: Transition to `failed` with error details
- **Page load failures**: Transition to `failed`
- **Unrecognized forms**: Transition to `needs_user`
- **Worker crash**: Task remains `in_progress` (manual intervention needed)

## Security

- Workers run in user's browser context (local-only for Phase 3.6)
- No authentication required in Phase 3.6 (local dev only)
- Future: API tokens required for production workers

