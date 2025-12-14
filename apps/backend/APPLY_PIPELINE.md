# Apply Pipeline - Phase 3.5

## Overview

The Apply Pipeline provides a task queue system for managing job applications with human-in-the-loop workflow. It tracks application attempts through their lifecycle and ensures the user makes the final submission.

## Architecture

### Database Tables

**apply_tasks**
- Stores job application tasks
- Tracks status: queued → in_progress → needs_user → success/failed
- Assigns priority based on configurable strategy

**apply_events**
- Audit log of all status transitions
- Stores reason and debug details for each change

### Status Lifecycle

```
queued → in_progress → needs_user → success
                ↓            ↓
              failed ← ← ← ← ← 
                ↓
              queued (retry)
```

**Status Meanings:**
- `queued`: Task waiting to be processed
- `in_progress`: Extension is working on it (opening page, filling form)
- `needs_user`: Extension has prepared application, waiting for user to review and submit
- `success`: User successfully submitted application
- `failed`: Error occurred (network, form validation, etc.)
- `canceled`: User manually canceled

### Priority Strategies

**decision_then_newest** (default):
- Prioritize by job decision: recommend (1000) > caution (500) > avoid (100)
- Add recency bonus: newer jobs get +0 to +99
- Best for balanced approach

**newest**:
- Prioritize by posted_date only
- Newer jobs processed first
- Good for time-sensitive applications

**highest_score**:
- Prioritize by authenticity_score
- Higher quality jobs first
- Good for quality-focused approach

## API Usage

### For Browser Extension

**1. User Selects Jobs**

User selects jobs from UI, extension queues them:

```javascript
// Queue selected jobs
const response = await fetch('http://localhost:8000/apply/queue', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    user_id: 1,
    job_ids: ['indeed_123', 'linkedin_456'],
    priority_strategy: 'decision_then_newest',
    allow_duplicates: false
  })
});
```

**2. Extension Requests Next Task**

Extension polls for next queued task:

```javascript
// Get next task
const response = await fetch(
  'http://localhost:8000/apply/tasks?user_id=1&status=queued&limit=1'
);
const {tasks} = await response.json();
const nextTask = tasks[0];
```

**3. Extension Processes Task**

Extension opens job page and transitions status:

```javascript
// Mark as in_progress
await fetch(`http://localhost:8000/apply/tasks/${taskId}/transition`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    to_status: 'in_progress',
    reason: 'Opening job page'
  })
});

// Fill form using AI answers...
// When ready for user review:

await fetch(`http://localhost:8000/apply/tasks/${taskId}/transition`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    to_status: 'needs_user',
    reason: 'Form filled, awaiting user review'
  })
});
```

**4. User Reviews and Submits**

User reviews pre-filled form and clicks submit. Extension marks as success:

```javascript
// After user clicks submit
await fetch(`http://localhost:8000/apply/tasks/${taskId}/transition`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    to_status: 'success',
    reason: 'User submitted application'
  })
});
```

## Setup

### 1. Run Migration

```bash
cd apps/backend
python3 migrate_apply_schema.py
```

Creates `apply_tasks` and `apply_events` tables.

### 2. Start API

```bash
python3 run_api.py
```

Server runs on http://127.0.0.1:8000

### 3. Run Tests

```bash
python3 test_apply_api.py
```

Tests full workflow: queue → process → success

## API Endpoints

### POST /apply/queue
Queue jobs for application.

**Request:**
```json
{
  "user_id": 1,
  "job_ids": ["indeed_123", "linkedin_456"],
  "priority_strategy": "decision_then_newest",
  "allow_duplicates": false
}
```

**Response:**
```json
{
  "tasks": [...],
  "total": 2,
  "limit": 2,
  "offset": 0
}
```

### GET /apply/tasks
List tasks for user.

**Query Params:**
- `user_id` (required): User ID
- `status` (optional): Filter by status
- `limit` (default 50): Max results
- `offset` (default 0): Pagination offset

### GET /apply/tasks/{task_id}
Get single task.

### POST /apply/tasks/{task_id}/transition
Transition task status.

**Request:**
```json
{
  "to_status": "in_progress",
  "reason": "Extension started processing",
  "details": {"url": "https://..."}
}
```

## Error Handling

- Invalid transitions return 400 with error message
- Missing reason for `failed` status returns 400
- Task not found returns 404
- Database errors return 500

## Future Phases

Phase 3.5 provides the foundation. Future phases will add:
- Phase 4.x: ATS field mapping and autofill logic
- Phase 5.x: Full auto-apply execution engine
- Phase 6.x: Desktop UI for monitoring tasks

