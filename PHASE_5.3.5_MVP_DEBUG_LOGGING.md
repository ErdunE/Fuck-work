# Phase 5.3.5 — MVP Debug Logging

## Status: ✅ COMPLETE

**Strict Constraint:** NO LOGIC CHANGES — Logs Only

---

## What Was Added

### A. Background Script (background.js) — 3 Log Points

#### 1️⃣ Lifecycle Log (Detects Service Worker Restarts)

**Location:** Top of file, after `activeTabSessions` declaration

```javascript
console.log('[FW BG][LIFECYCLE] background started or restarted', {
  ts: Date.now(),
  activeTabSessions_size: activeTabSessions.size,
  warning: activeTabSessions.size > 0 ? 'BUG: Map should be empty on fresh start' : 'OK: Map is empty as expected'
});
```

**Purpose:** Immediately detect when background service worker restarts (which clears in-memory Map).

---

#### 2️⃣ registerTabSession() — Before/After Map.set

**Location:** Inside `registerTabSession()` function

**Before Map.set:**
```javascript
console.log('[FW BG][Register] BEFORE Map.set', {
  tabId,
  map_has_key_before: activeTabSessions.has(tabId),
  existing_session: activeTabSessions.get(tabId),
  new_run_id: sessionData.run_id,
  new_task_id: sessionData.task_id
});
```

**After Map.set:**
```javascript
console.log('[FW BG][Register] AFTER Map.set', {
  tabId,
  map_has_key_after: activeTabSessions.has(tabId),
  stored_session: activeTabSessions.get(tabId),
  map_size: activeTabSessions.size,
  all_keys: Array.from(activeTabSessions.keys())
});
```

**Purpose:** Confirm that `Map.set()` actually stores the tab session (not silently failing).

---

#### 3️⃣ FW_GET_TAB_SESSION — Return Visibility

**Location:** Inside `FW_GET_TAB_SESSION` message handler

```javascript
console.log('[FW BG][Tab Query] Returning to content script', {
  tabId,
  has_session: activeTabSessions.has(tabId),
  session_exists: !!tabSession,
  session_data: tabSession,
  map_size: activeTabSessions.size
});
```

**Purpose:** See exactly what data content script receives when querying tab ownership.

---

### B. Content Script (content.js) — 8 Log Points

#### 4️⃣ getActiveSession() — EVERY Return Path

**5 decision paths, each logged before return:**

**a) Backend Not Active:**
```javascript
console.log('[FW Session][Decision] return active=false', {
  reason: 'backend_session_not_active',
  sess_active: sess.active,
  sess: sess
});
```

**b) Tab-Owned Success:**
```javascript
console.log('[FW Session][Decision] return active=true (tab_owned)', {
  reason: 'tab_owned_run_match',
  tabSession_run_id: tabSession.run_id,
  backend_run_id: sess.run_id,
  url_check_skipped: true,
  current_url: window.location.href
});
```

**c) URL Mismatch Failure:**
```javascript
console.log('[FW Session][Decision] return active=false', {
  reason: 'url_mismatch_and_no_tab_ownership',
  current_url: window.location.href,
  expected_url: sess.job_url,
  tabSession_has_session: tabSession.has_session,
  tabSession_run_id: tabSession.run_id
});
```

**d) URL Match Success:**
```javascript
console.log('[FW Session][Decision] return active=true (url_match)', {
  reason: 'url_match_success',
  current_url: currentUrl,
  matched_url: sess.job_url,
  tab_owned: false
});
```

**e) Exception Caught:**
```javascript
console.log('[FW Session][Decision] return active=false', {
  reason: 'exception_caught',
  error_message: error.message,
  error_stack: error.stack
});
```

**Purpose:** Precisely identify which decision path was taken every time `getActiveSession()` runs.

---

#### 5️⃣ registerCurrentTab() — Success/Failure Clarity

**Success (after sendMessage completes):**
```javascript
console.log('[FW Session] Tab registration ACK received', {
  run_id: sessionData.run_id,
  task_id: sessionData.task_id,
  note: 'Background should have stored this tab session'
});
```

**Failure (in catch block):**
```javascript
console.error('[FW Session] Tab registration FAILED', {
  error_message: error.message,
  error_name: error.name,
  run_id: sessionData.run_id,
  task_id: sessionData.task_id,
  critical: true,
  impact: 'Tab ownership NOT established in background'
});
```

**Purpose:** Know immediately if tab registration succeeded or failed.

---

#### 6️⃣ init() — Final Decision Visibility

**Skip init (no active session):**
```javascript
console.log('[FW Init][Decision] Skipping init', {
  reason: 'no_active_session',
  activeSession_exists: !!activeSession,
  activeSession_active: activeSession?.active,
  will_not_show_overlay: true
});
```

**Proceed with init:**
```javascript
console.log('[FW Init][Decision] Proceeding with init', {
  reason: 'active_session_confirmed',
  run_id: activeSession.run_id,
  task_id: activeSession.task_id,
  tab_owned: activeSession.tab_owned,
  ats_type: activeSession.ats_type,
  will_show_overlay: true,
  will_run_detection: true
});
```

**Purpose:** Understand why init proceeds or stops.

---

## Git Diff Summary

```
Files changed: 2
Lines added: 108
Lines removed: 0

apps/extension/background.js: +40 lines
apps/extension/content.js: +68 lines
```

**✅ NO LOGIC CHANGES** - Only `console.log()` additions.

---

## What We Can Now Diagnose

### 1. Service Worker Restarts
```
[FW BG][LIFECYCLE] background started or restarted { ts: ..., activeTabSessions_size: 0 }
```
→ If we see this log with `activeTabSessions_size: 0` during navigation, the Map was lost.

---

### 2. Map Storage Failures
```
[FW BG][Register] BEFORE Map.set { map_has_key_before: false, ... }
[FW BG][Register] AFTER Map.set { map_has_key_after: false, ... }
```
→ If `map_has_key_after` is `false`, `Map.set()` silently failed.

---

### 3. Tab Query Mismatches
```
[FW BG][Tab Query] Returning to content script { has_session: false, ... }
[FW Session][Tab Check] Tab has registered session: false
```
→ Content script queries tab ownership, background says "no session".

---

### 4. Decision Path Confusion
```
[FW Session][Decision] return active=false { reason: 'url_mismatch_and_no_tab_ownership', ... }
```
→ Know exactly why session failed (not guessing between URL mismatch vs tab ownership).

---

### 5. Registration Failures
```
[FW Session] Tab registration FAILED { critical: true, ... }
```
→ Know when `registerCurrentTab()` throws an error.

---

### 6. Init Skipping vs Proceeding
```
[FW Init][Decision] Skipping init { reason: 'no_active_session', ... }
```
→ Understand why overlay doesn't appear.

---

## Expected Happy-Path Logs

### On LinkedIn (First Page)

```
[FW Content][Init] href: https://www.linkedin.com/jobs/view/123

[FW Session][Tab Check] Tab has registered session: false

[FW Session] Fetching active session from backend...
[FW Session] Active session fetch result: { active: true, ... }

[FW Session] Tab not yet registered, registering now { reason: 'backend_session_active', ... }

[FW Session] Sending FW_REGISTER_TAB_SESSION { run_id: 99, task_id: 42, ... }

[FW BG] Received FW_REGISTER_TAB_SESSION { from_tab: 456, ... }

[FW BG][Register] BEFORE Map.set { tabId: 456, map_has_key_before: false, new_run_id: 99 }
[FW BG][Register] AFTER Map.set { tabId: 456, map_has_key_after: true, stored_session: { run_id: 99, ... }, map_size: 1 }

[FW Session] Tab registration ACK received { run_id: 99, ... }

[FW Session] Tab ownership check { tabSession_run_id: 99, backend_run_id: 99, match: true }

[FW Session][Decision] return active=true (tab_owned) { reason: 'tab_owned_run_match', url_check_skipped: true }

[FW Init][Decision] Proceeding with init { reason: 'active_session_confirmed', run_id: 99, tab_owned: true }
```

---

### On applytojob.com (After Navigation)

```
[FW Content][Init] href: https://p1groupinc.applytojob.com/...

[FW Session][Tab Check] Tab has registered session: true (Tab-owned run_id: 99)

[FW Session] Fetching active session from backend...
[FW Session] Active session fetch result: { active: true, ... }

[FW Session] Tab already registered, skipping re-registration { existing_run_id: 99, backend_run_id: 99 }

[FW Session] Tab ownership check { tabSession_run_id: 99, backend_run_id: 99, match: true }

[FW Session][Decision] return active=true (tab_owned) { reason: 'tab_owned_run_match', url_check_skipped: true }

[FW Init][Decision] Proceeding with init { reason: 'active_session_confirmed', run_id: 99, tab_owned: true }
```

**Key:** No "URL mismatch - not initializing" error!

---

## Failure Scenarios We Can Now Detect

### Scenario 1: Background Restarts Between Pages

**LinkedIn page:**
```
[FW BG][LIFECYCLE] background started { activeTabSessions_size: 0 }
[FW BG][Register] AFTER Map.set { map_size: 1 }
```

**applytojob.com page (5 minutes later):**
```
[FW BG][LIFECYCLE] background started or restarted { activeTabSessions_size: 0 }  ← ⚠️ RESTART
[FW BG][Tab Query] Returning { has_session: false, map_size: 0 }  ← ⚠️ MAP LOST
[FW Session][Decision] return active=false { reason: 'url_mismatch_and_no_tab_ownership' }
```

**Diagnosis:** Service worker restarted → Map cleared → Tab ownership lost.

---

### Scenario 2: Registration Failed Silently

**LinkedIn page:**
```
[FW Session] Sending FW_REGISTER_TAB_SESSION { run_id: 99, ... }
[FW Session] Tab registration FAILED { error: '...', critical: true }  ← ⚠️ FAILED
[FW Session] Tab ownership check { tabSession_run_id: undefined, backend_run_id: 99, match: false }
[FW Session][Decision] return active=true (url_match) { reason: 'url_match_success' }  ← Fallback to URL
```

**applytojob.com page:**
```
[FW Session][Tab Check] Tab has registered session: false  ← ⚠️ NO TAB SESSION
[FW Session][Decision] return active=false { reason: 'url_mismatch_and_no_tab_ownership' }
```

**Diagnosis:** Registration failed on first page → No tab ownership → Third-party page fails.

---

### Scenario 3: Backend Session Expired

**applytojob.com page:**
```
[FW Session][Tab Check] Tab has registered session: true (run_id: 99)
[FW Session] Active session fetch result: { active: false }  ← ⚠️ BACKEND SAYS NO
[FW Session][Decision] return active=false { reason: 'backend_session_not_active' }
```

**Diagnosis:** Backend session expired → Tab ownership irrelevant → Init skipped.

---

## Next Steps

**After this logging is deployed:**

1. **Test real E2E flow:** LinkedIn → applytojob.com
2. **Collect console logs** from both pages
3. **Identify exact failure point:**
   - Service worker restart?
   - Registration async window?
   - Backend session expiry?
   - URL mismatch logic?

4. **THEN design fix** based on evidence (not guesses)

---

## Files Modified

1. `apps/extension/background.js` (+40 lines)
   - Lifecycle log
   - registerTabSession before/after logs
   - FW_GET_TAB_SESSION visibility log

2. `apps/extension/content.js` (+68 lines)
   - 5 decision path logs in getActiveSession()
   - 2 logs in registerCurrentTab()
   - 2 logs in init()

---

**Status:** ✅ COMPLETE — NO LOGIC CHANGES

**Ready for:** E2E testing with full observability

