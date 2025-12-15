# Phase 5.3.5 — Tab-Based Session Tracking

## Status: ✅ COMPLETE

---

## Problem

**Auth is working!** ✅
- Token received from caller: true
- Status: 200
- Auth verified for user 3

**Real Issue:** Session gating based on URL matching breaks navigation flow.

### Reproduction (from logs)

1. Web App creates run/task, opens LinkedIn job tab
2. content.js fetches active session successfully
3. User clicks Apply → redirects to third-party site (e.g., `p1groupinc.applytojob.com`)
4. New page content.js verifies token (200 OK) ✅
5. BUT then: `active_session_url_match: false` → `URL mismatch - session exists but not for this page` → `Not initializing` ❌

### Root Cause

Current logic in `getActiveSession()`:
```javascript
const urlMatch = validateUrlMatch(currentUrl, sessionUrl);
if (!urlMatch) {
  console.warn('[FW Session] URL mismatch - session exists but not for this page');
  return { active: false }; // ❌ STOPS HERE
}
```

This breaks multi-step applications that navigate across domains.

---

## Solution: Tab-Scoped Session Ownership

**Principle:** Active sessions follow **tab + run_id**, NOT exact URL.

**Architecture:**
```
background.js: tabId → { run_id, task_id, job_url, created_at, user_id }
content.js: On init, ask background "Does this tab have an active run?"
  YES → Proceed with initialization (ignore URL mismatch)
  NO → Fall back to URL matching (backward compat)
```

---

## Implementation Details

### 1. Background: Tab-Session Registry

**File:** `apps/extension/background.js`

**Added:**
```javascript
// Phase 5.3.5: Tab-based session tracking
// Maps tabId → { run_id, task_id, job_url, created_at, user_id }
const activeTabSessions = new Map();

function registerTabSession(tabId, sessionData) {
  activeTabSessions.set(tabId, {
    run_id: sessionData.run_id,
    task_id: sessionData.task_id,
    job_url: sessionData.job_url,
    user_id: sessionData.user_id || null,
    created_at: Date.now()
  });
  console.log('[FW BG] Tab session registered', { 
    tabId, 
    run_id: sessionData.run_id, 
    task_id: sessionData.task_id 
  });
}

function getTabSession(tabId) {
  return activeTabSessions.get(tabId) || null;
}

function clearTabSession(tabId) {
  const session = activeTabSessions.get(tabId);
  if (session) {
    console.log('[FW BG] Tab session cleared', { tabId, run_id: session.run_id });
    activeTabSessions.delete(tabId);
  }
}
```

### 2. Background: Message Handlers

**Added:**
```javascript
// Phase 5.3.5: Query tab session
if (message.type === 'FW_GET_TAB_SESSION') {
  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ has_session: false });
    return true;
  }
  
  const tabSession = getTabSession(tabId);
  if (tabSession) {
    console.log('[FW BG] Tab session query', { 
      tabId, 
      has_session: true, 
      run_id: tabSession.run_id,
      task_id: tabSession.task_id
    });
    sendResponse({
      has_session: true,
      run_id: tabSession.run_id,
      task_id: tabSession.task_id,
      job_url: tabSession.job_url
    });
  } else {
    console.log('[FW BG] Tab session query', { tabId, has_session: false });
    sendResponse({ has_session: false });
  }
  return true;
}

// Phase 5.3.5: Register tab session (called by content script)
if (message.type === 'FW_REGISTER_TAB_SESSION') {
  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ ok: false, error: 'No tab ID' });
    return true;
  }
  
  registerTabSession(tabId, {
    run_id: message.run_id,
    task_id: message.task_id,
    job_url: message.job_url,
    user_id: message.user_id
  });
  
  sendResponse({ ok: true });
  return true;
}
```

### 3. Background: Tab Cleanup

**Updated:**
```javascript
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentJobTab) {
    console.log('Job tab closed');
    // Don't auto-complete, user might have multiple tabs open
  }
  
  // Phase 5.3.5: Clear tab session on tab close
  clearTabSession(tabId);
});
```

### 4. Content: Tab Session Helpers

**File:** `apps/extension/content.js`

**Added:**
```javascript
/**
 * Phase 5.3.5: Check if current tab has an active session registered by background
 * @returns {Promise<Object>} { has_session, run_id?, task_id?, job_url? }
 */
async function getTabSession() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'FW_GET_TAB_SESSION' });
    return response || { has_session: false };
  } catch (error) {
    console.warn('[FW Session] Failed to query tab session:', error);
    return { has_session: false };
  }
}

/**
 * Phase 5.3.5: Register current tab with background for session tracking
 * @param {Object} sessionData - { run_id, task_id, job_url, user_id }
 */
async function registerCurrentTab(sessionData) {
  try {
    await chrome.runtime.sendMessage({
      type: 'FW_REGISTER_TAB_SESSION',
      run_id: sessionData.run_id,
      task_id: sessionData.task_id,
      job_url: sessionData.job_url,
      user_id: sessionData.user_id
    });
    console.log('[FW Session] Tab registered with background', {
      run_id: sessionData.run_id,
      task_id: sessionData.task_id
    });
  } catch (error) {
    console.warn('[FW Session] Failed to register tab:', error);
  }
}
```

### 5. Content: Updated getActiveSession()

**Key Changes:**

1. **Query tab ownership first:**
```javascript
const tabSession = await getTabSession();

console.group('[FW Session][Tab Check]');
console.log('Tab has registered session:', tabSession.has_session);
if (tabSession.has_session) {
  console.log('Tab-owned run_id:', tabSession.run_id);
  console.log('Tab-owned task_id:', tabSession.task_id);
}
console.groupEnd();
```

2. **If tab-owned and run_id matches, proceed (ignore URL mismatch):**
```javascript
if (tabSession.has_session && tabSession.run_id === sess.run_id) {
  console.log('[FW Session] Proceeding due to tab-owned run (URL match not required)');
  
  return {
    active: true,
    // ... session data
    tab_owned: true
  };
}
```

3. **Fall back to URL matching:**
```javascript
const urlMatch = validateUrlMatch(window.location.href, sess.job_url);

console.log('[FW Session] active_session_url_match:', urlMatch, {
  current: window.location.href,
  expected: sess.job_url,
  tab_owned: false
});

if (!urlMatch) {
  console.warn('[FW Session] URL mismatch and no tab ownership - not initializing');
  return { active: false };
}

// Register tab on URL match
await registerCurrentTab({
  run_id: sess.run_id,
  task_id: sess.task_id,
  job_url: sess.job_url,
  user_id: authContext.user_id
});
```

---

## Expected Behavior

### Scenario 1: LinkedIn → Third-Party Site (applytojob.com)

**Before:**
```
[FW Session] active_session_url_match: false
[FW Session] URL mismatch - not initializing ❌
```

**After:**
```
[FW Session][Tab Check]
  Tab has registered session: true
  Tab-owned run_id: 99
  Tab-owned task_id: 42

[FW Session] Proceeding due to tab-owned run (URL match not required) ✅
[FW Session] active_session_attached: { task_id: 42, run_id: 99, tab_owned: true }
[FW Init] Proceeding with initialization ✅
```

### Scenario 2: User Manually Opens LinkedIn Job (No Tab Registration)

**Behavior:**
```
[FW Session][Tab Check]
  Tab has registered session: false

[FW Session] active_session_url_match: true { tab_owned: false }
[FW Session] Tab registered with background { run_id: 99, task_id: 42 }
[FW Init] Proceeding with initialization ✅
```

Falls back to URL matching (backward compatible).

---

## Logging

### Background Logs

**Tab Registration:**
```
[FW BG] Tab session registered { tabId: 123, run_id: 99, task_id: 42 }
```

**Tab Query:**
```
[FW BG] Tab session query { tabId: 123, has_session: true, run_id: 99, task_id: 42 }
[FW BG] Tab session query { tabId: 456, has_session: false }
```

**Tab Cleared:**
```
[FW BG] Tab session cleared { tabId: 123, run_id: 99 }
```

### Content Logs

**Tab Check:**
```
[FW Session][Tab Check]
  Tab has registered session: true
  Tab-owned run_id: 99
  Tab-owned task_id: 42
```

**Proceeding with Tab Ownership:**
```
[FW Session] Proceeding due to tab-owned run (URL match not required)
[FW Session] active_session_attached: { task_id: 42, run_id: 99, ats_type: "workday", tab_owned: true }
```

**URL Match Fallback:**
```
[FW Session] active_session_url_match: true { current: "...", expected: "...", tab_owned: false }
[FW Session] Tab registered with background { run_id: 99, task_id: 42 }
```

---

## Testing Steps

1. **Start Apply from Web Control Plane**
   - Go to Tasks page
   - Click "Start Apply" on a queued task

2. **LinkedIn tab opens**
   - Check console: `[FW BG] Tab session registered`
   - Check console: `[FW Session][Tab Check] Tab has registered session: true`

3. **Click Apply button**
   - LinkedIn redirects to third-party site (e.g., applytojob.com)

4. **New page loads**
   - Console should show:
     - `[FW Session][Tab Check] Tab has registered session: true`
     - `[FW Session] Proceeding due to tab-owned run (URL match not required)`
     - `[FW Init] Proceeding with initialization` (NOT "Not initializing")

5. **Overlay/detection continues**
   - Automation pipeline continues (even though URL changed)

---

## Success Criteria

- [x] Background tracks tabId → session mapping
- [x] Content can query "Does this tab have an active run?"
- [x] If tab-owned, proceed even with URL mismatch
- [x] If not tab-owned, fall back to URL matching
- [x] Third-party application sites no longer show "Not initializing"
- [x] Logs show "Proceeding due to tab-owned run"
- [x] Automation continues across navigation

---

## Files Modified

1. **`apps/extension/background.js`**
   - Added `activeTabSessions` Map
   - Added `registerTabSession()`, `getTabSession()`, `clearTabSession()`
   - Added `FW_GET_TAB_SESSION` message handler
   - Added `FW_REGISTER_TAB_SESSION` message handler
   - Updated `chrome.tabs.onRemoved` to clear tab sessions

2. **`apps/extension/content.js`**
   - Added `getTabSession()` function
   - Added `registerCurrentTab()` function
   - Updated `getActiveSession()` to check tab ownership first
   - Added tab-owned logging
   - Proceed with initialization if tab-owned, even if URL mismatch

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Control Plane                        │
│  User clicks "Start Apply" → POST /execute → window.open()  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ New tab opens
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    LinkedIn Job Page                        │
│                     (Tab ID: 123)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ content.js init()
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Content Script: getTabSession()                │
│            chrome.runtime.sendMessage(GET_TAB)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│        Background: activeTabSessions.get(123)               │
│          Returns: { has_session: false }                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ No tab session yet
                           ↓
┌─────────────────────────────────────────────────────────────┐
│     Content: GET /api/users/me/active-session              │
│     Backend: { active: true, run_id: 99, task_id: 42 }     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ URL match succeeds
                           ↓
┌─────────────────────────────────────────────────────────────┐
│         Content: registerCurrentTab({ run_id: 99 })         │
│       chrome.runtime.sendMessage(REGISTER_TAB_SESSION)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Background: activeTabSessions.set(123, { run_id: 99 })    │
│         Tab 123 is now registered for run 99                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ User clicks Apply
                           │ Navigate to applytojob.com
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Third-Party Application Site                    │
│                  (Still Tab ID: 123)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ content.js init()
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Content Script: getTabSession()                │
│            chrome.runtime.sendMessage(GET_TAB)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│        Background: activeTabSessions.get(123)               │
│   Returns: { has_session: true, run_id: 99, task_id: 42 }  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Tab-owned!
                           ↓
┌─────────────────────────────────────────────────────────────┐
│     Content: GET /api/users/me/active-session              │
│     Backend: { active: true, run_id: 99, task_id: 42 }     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ run_id matches: 99 === 99
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Content: Proceeding due to tab-owned run                   │
│           (URL match not required) ✅                        │
│           Continue with initialization                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Impact

**Problem Solved:** Multi-step job applications now work correctly across domain changes and redirects.

**Backward Compatibility:** Manual job opens and URL-matched sessions still work as before.

**Future-Proof:** Tab-based tracking supports complex application flows (multi-step forms, redirects, iframes).

---

## Next Steps

This phase completes the session tracking infrastructure. Future phases can build on this:

1. **Phase 5.3.6 (if needed):** Session state persistence across extension reloads
2. **Phase 5.4 (if needed):** Enhanced ATS detection using session history
3. **Phase 6 (planned):** Full E2E autofill validation

---

## Commit

```
feat(session): implement tab-based session tracking (Phase 5.3.5)

Problem: URL-based session gating breaks when navigating to third-party
application sites (e.g., LinkedIn → applytojob.com)

Solution: Track active sessions by tabId instead of exact URL match

Changes:
- Add activeTabSessions Map in background.js
- Add registerTabSession(), getTabSession(), clearTabSession() helpers
- Add FW_GET_TAB_SESSION and FW_REGISTER_TAB_SESSION message handlers
- Content queries tab ownership before URL validation
- If tab-owned, proceed with initialization (ignore URL mismatch)
- Fall back to URL matching for backward compatibility
- Register tab on URL match for future navigation

Now automation continues across redirects and domain changes
```

