# FuckWork Apply Worker Extension

Browser extension that acts as a worker to process job application tasks from the FuckWork backend.

## Phase 3.6: Human-in-the-loop MVP

This extension implements the first real apply execution loop:
- Polls backend for queued apply tasks
- Opens job application pages automatically
- Autofills basic information (email, name only)
- Requires manual user submission
- Allows user to mark task status via popup

## Features

### What It Does
- ✓ Polls backend every 15 seconds for queued tasks
- ✓ Claims task and transitions to `in_progress`
- ✓ Opens job URL in new tab
- ✓ Autofills email and name fields
- ✓ User manually reviews and submits
- ✓ User marks status: success / needs_user / canceled

### What It Does NOT Do
- ✗ No automatic form submission
- ✗ No CAPTCHA solving
- ✗ No resume upload
- ✗ No ATS-specific logic
- ✗ No multi-step workflow automation

## Installation

1. Open Chrome/Edge
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `apps/extension` directory

## Configuration

Edit `api.js` to configure:
- `API_BASE_URL`: Backend URL (default: `http://127.0.0.1:8000`)
- `USER_ID`: User ID (default: `1`)

## Usage

1. Start the backend API:
   ```bash
   cd apps/backend
   python3 run_api.py
   ```

2. Queue some tasks:
   ```bash
   curl -X POST http://127.0.0.1:8000/apply/queue \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "job_ids": ["linkedin_123", "indeed_456"],
       "priority_strategy": "decision_then_newest"
     }'
   ```

3. Load the extension in Chrome

4. Extension will automatically:
   - Poll for queued tasks
   - Claim next task
   - Open job page
   - Autofill basic fields

5. You manually:
   - Review the form
   - Fill remaining fields
   - Submit the application
   - Click extension popup to mark status

## Architecture

- **background.js**: Service worker that polls for tasks and orchestrates execution
- **content.js**: Content script that runs on job pages and performs autofill
- **popup.html/js**: User interface for manual status control
- **api.js**: Backend API client

## Troubleshooting

**Extension not loading:**
- Check Chrome console for errors
- Verify manifest.json is valid
- Reload extension after code changes

**No tasks being claimed:**
- Check backend is running on `http://127.0.0.1:8000`
- Verify tasks are queued: `curl http://127.0.0.1:8000/apply/tasks?user_id=1&status=queued`
- Check browser console for API errors

**Autofill not working:**
- Check content script is loaded on page
- Verify user profile exists: `curl http://127.0.0.1:8000/users/1`
- Check browser console for field detection logs

## Future Phases

Phase 3.6 is the MVP. Future enhancements:
- Phase 4.x: ATS-specific field mapping
- Phase 5.x: Resume upload automation
- Phase 6.x: Multi-step workflow support
- Phase 7.x: CAPTCHA handling

