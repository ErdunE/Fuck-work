/**
 * Background script for apply task worker.
 * Phase 5.0: JWT authentication and preference sync enabled.
 * Polls backend for tasks and orchestrates execution.
 */

// Import API client, auth, and state machine
importScripts('auth.js', 'api.js', 'ats_types.js', 'apply_state_machine.js', 'apply_session.js', 'preference_sync.js');

// Worker state
let currentTask = null;
let currentJobTab = null;
let isProcessing = false;
let pollInterval = null;

// Content script injection tracking
let lastContentHello = null;

// ============================================================
// Authentication State (Single Source of Truth)
// ============================================================
const authState = {
  isAuthenticated: false,
  user: null,
  lastCheckTime: null
};

// ============================================================
// Phase A: Tab session system removed - Extension uses cookie auth only
// ============================================================
/*
// Phase 5.3.5: Tab-based session tracking
// Maps tabId → { run_id, task_id, job_url, created_at, user_id }
const activeTabSessions = new Map();

// Phase 5.3.5: Background lifecycle logging (detect service worker restarts)
console.log('[FW BG][LIFECYCLE] background started or restarted', {
  ts: Date.now(),
  activeTabSessions_size: activeTabSessions.size,
  warning: activeTabSessions.size > 0 ? 'BUG: Map should be empty on fresh start' : 'OK: Map is empty as expected'
});
*/

// Configuration
const POLL_INTERVAL_MS = 15000; // 15 seconds
const TASK_TIMEOUT_MS = 600000; // 10 minutes
// background.js
const BG_API_BASE_URL = 'http://127.0.0.1:8000'; // Backend API URL

// ============================================================
// Phase A: Token-Based Auth (Explicit Authorization)
// ============================================================
let authToken = null;

async function loadToken() {
  try {
    const result = await chrome.storage.local.get(['fw_extension_token']);
    authToken = result.fw_extension_token || null;
    console.log('[FW Auth] Token loaded from storage', { hasToken: !!authToken });
  } catch (err) {
    console.error('[FW Auth] Failed to load token:', err);
    authToken = null;
  }
}

async function saveToken(token) {
  try {
    await chrome.storage.local.set({ fw_extension_token: token });
    authToken = token;
    console.log('[FW Auth] Token saved to storage');
  } catch (err) {
    console.error('[FW Auth] Failed to save token:', err);
  }
}

async function clearToken() {
  try {
    await chrome.storage.local.remove(['fw_extension_token']);
    authToken = null;
    console.log('[FW Auth] Token cleared from storage');
  } catch (err) {
    console.error('[FW Auth] Failed to clear token:', err);
  }
}

// ============================================================
// Phase A: Cookie-Based Auth (LEGACY - Will be removed)
// ============================================================

/**
 * Check authentication status via backend cookies.
 * Extension stores nothing - backend session cookies are the only source of truth.
 * 
 * @returns {Promise<Object>} { authenticated: boolean, user?: { user_id, email } }
 */
async function checkAuthViaBackend() {
  console.log('[FW Auth] Checking auth via backend cookies');
  
  try {
    const res = await fetch(`${BG_API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 200) {
      const user = await res.json();
      console.log('[FW Auth] Authenticated as user', user.user_id, user.email);
      return { authenticated: true, user };
    }

    console.log('[FW Auth] Not authenticated (status:', res.status, ')');
    return { authenticated: false };
  } catch (err) {
    console.error('[FW Auth] Backend auth check failed', err);
    return { authenticated: false };
  }
}

console.log('[FW BG][LIFECYCLE] Cookie-based auth architecture', {
  ts: Date.now(),
  note: 'Extension uses backend session cookies only - no token storage'
});

/**
 * Verify authentication and update authState.
 * Called on extension load, login, and auth change events.
 * 
 * @returns {Promise<boolean>} true if authenticated, false otherwise
 */
async function verifyAndUpdateAuthState() {
  console.log('[FW Auth] Verifying authentication state');
  
  const result = await checkAuthViaBackend();
  
  authState.isAuthenticated = result.authenticated;
  authState.user = result.user || null;
  authState.lastCheckTime = Date.now();
  
  console.log('[FW Auth] State updated', {
    isAuthenticated: authState.isAuthenticated,
    user_id: authState.user?.user_id || null,
    email: authState.user?.email || null
  });
  
  return authState.isAuthenticated;
}


/**
 * Start polling for tasks
 */
function startPolling() {
  // Idempotency check
  if (pollInterval !== null) {
    console.log('[FW Poll] Already polling, skipping start');
    return;
  }

  console.log('[FW Poll] Starting task polling');
  
  // Poll immediately (will be gated by auth check)
  pollForTask();
  
  // Set up interval
  pollInterval = setInterval(pollForTask, POLL_INTERVAL_MS);
}

/**
 * Stop polling
 */
function stopPolling() {
  if (pollInterval === null) {
    console.log('[FW Poll] Already stopped, skipping');
    return;
  }

  console.log('[FW Poll] Stopping task polling');
  clearInterval(pollInterval);
  pollInterval = null;
}

/**
 * Poll for next task
 * Phase A: Token-based auth - must have valid token to poll
 */
async function pollForTask() {
  // Authentication gate - MUST have token to poll
  if (!authToken) {
    console.log('[FW Poll] Skipped: no token');
    return;
  }

  // Don't poll if already processing
  if (isProcessing || currentTask) {
    console.log('Already processing task, skipping poll');
    return;
  }
  
  console.log('Polling for next task...');
  
  try {
    const task = await APIClient.getNextTask();
    
    if (!task) {
      console.log('No queued tasks found');
      return;
    }
    
    console.log('Found task:', task);
    await processTask(task);
    
  } catch (error) {
    console.error('Poll failed:', error);
    
    // Phase A: If 401, token is invalid/expired - clear and stop polling
    if (error.message && error.message.includes('401')) {
      console.warn('[FW Auth] Token invalid/expired - stopping polling');
      await clearToken();
      authState.isAuthenticated = false;
      authState.user = null;
      stopPolling();
    }
  }
}

/**
 * Process a task
 */
async function processTask(task) {
  isProcessing = true;
  currentTask = task;
  
  try {
    // 1. Claim task (transition to in_progress)
    console.log(`Claiming task ${task.id}...`);
    await APIClient.transitionTask(
      task.id,
      'in_progress',
      'Worker claimed task',
      { worker_id: 'extension_v1', claimed_at: new Date().toISOString() }
    );
    
    // 2. Get job details
    console.log(`Fetching job ${task.job_id}...`);
    const job = await APIClient.getJob(task.job_id);
    
    if (!job) {
      throw new Error(`Job ${task.job_id} not found`);
    }
    
    // 3. Create apply session BEFORE opening tab
    await createApplySession(task.id, task.job_id, job.url);
    console.log(`[Background] Apply session created for task ${task.id}`);
    
    // 4. Open job URL in new tab
    console.log(`Opening job URL: ${job.url}`);
    const tab = await chrome.tabs.create({
      url: job.url,
      active: true
    });
    
    currentJobTab = tab.id;
    
    // 5. Store task data for content script (legacy, session is primary now)
    await chrome.storage.local.set({
      activeTask: task,
      activeJob: job,
      taskStartTime: Date.now()
    });
    
    console.log(`Task ${task.id} in progress`);
    
    // Wait for tab to complete loading, then request detection
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === currentJobTab && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        console.log('[Background] Tab loaded, requesting detection from content script');
        
        // Request detection from content script
        chrome.tabs.sendMessage(tabId, { type: 'FW_DETECT_AND_REPORT' })
          .then(response => {
            if (response && response.ats && response.stage && response.action) {
              handleDetectionResult(response);
            } else {
              console.error('[Background] Invalid detection response:', response);
            }
          })
          .catch(err => {
            console.error('[Background] Detection request failed:', err);
          });
      }
    });
    
  } catch (error) {
    console.error('Failed to process task:', error);
    
    // Transition to failed
    if (task) {
      await APIClient.transitionTask(
        task.id,
        'failed',
        `Worker error: ${error.message}`,
        { error: error.toString() }
      );
    }
    
    // Reset state
    currentTask = null;
    currentJobTab = null;
    isProcessing = false;
  }
}

/**
 * Handle detection result from content script
 */
async function handleDetectionResult({ ats, stage, action, detection_id }) {
  if (!currentTask) {
    console.log('[Background] No current task for detection result');
    return;
  }
  
  // VALIDATION: Check session matches
  const session = await getActiveSession();
  if (!session || !session.active) {
    console.warn('[Background] No active session, skipping transition');
    return;
  }
  
  if (session.task_id !== currentTask.id) {
    console.warn('[Background] Session/task mismatch, skipping transition', {
      session_task: session.task_id,
      current_task: currentTask.id
    });
    return;
  }
  
  console.log('[Background] Detection result:', { ats, stage, action });
  if (detection_id) {
    console.log('[FW Detection] Start', { detection_id, task_id: currentTask.id });
  }
  
  try {
    if (action.action === 'pause_needs_user') {
      // Transition to needs_user
      console.log('[Background] Transitioning to needs_user:', action.reason);
      
      try {
        await APIClient.transitionTask(
          currentTask.id,
          'needs_user',
          action.reason,
          { 
            ats: ats.ats_kind,
            stage: stage.stage,
            evidence: action.evidence,
            detection_timestamp: new Date().toISOString(),
            detection_id: detection_id || null
          }
        );
      } catch (error) {
        // If 400 error (already in this state), don't retry
        if (error.message && error.message.includes('400')) {
          console.log('[Background] Task already in needs_user state, skipping');
        } else {
          throw error;
        }
      }
      
      // Keep task reference but mark as not processing
      isProcessing = false;
      if (detection_id) {
        console.log('[FW Detection] Complete', { detection_id, task_id: currentTask.id });
      }
      
    } else if (action.action === 'fail') {
      // Transition to failed
      console.log('[Background] Transitioning to failed:', action.reason);
      
      try {
        await APIClient.transitionTask(
          currentTask.id,
          'failed',
          action.reason,
          { 
            ats: ats.ats_kind,
            stage: stage.stage,
            detection_id: detection_id || null
          }
        );
      } catch (error) {
        if (error.message && error.message.includes('400')) {
          console.log('[Background] Task already in failed state, skipping');
        } else {
          throw error;
        }
      }
      
      // Reset state
      currentTask = null;
      currentJobTab = null;
      isProcessing = false;
      await chrome.storage.local.remove(['activeTask', 'activeJob', 'taskStartTime']);
      if (detection_id) {
        console.log('[FW Detection] Complete', { detection_id, task_id: currentTask.id });
      }
    }
    
    // For 'continue' and 'noop', do nothing - task stays in_progress
    if (detection_id && (action.action === 'continue' || action.action === 'noop')) {
      console.log('[FW Detection] Complete', { detection_id, task_id: currentTask.id });
    }
    
  } catch (error) {
    console.error('[Background] Failed to handle detection result:', error);
    if (detection_id) {
      console.log('[FW Detection] Complete', { detection_id, task_id: currentTask.id, error: true });
    }
  }
}

/**
 * Handle task completion
 */
async function completeTask(status, reason, details = {}) {
  if (!currentTask) {
    console.error('No current task to complete');
    return;
  }
  
  console.log(`Completing task ${currentTask.id} with status: ${status}`);
  
  try {
    await APIClient.transitionTask(
      currentTask.id,
      status,
      reason,
      details
    );
    
    // Close apply session
    await closeActiveSession();
    
    console.log(`Task ${currentTask.id} completed: ${status}`);
    
  } catch (error) {
    console.error('Failed to complete task:', error);
  } finally {
    // Reset state
    currentTask = null;
    currentJobTab = null;
    isProcessing = false;
    
    await chrome.storage.local.remove(['activeTask', 'activeJob', 'taskStartTime']);
  }
}

/**
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'completeTask') {
    completeTask(message.status, message.reason, message.details)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
  
  if (message.action === 'getCurrentTask') {
    sendResponse({ task: currentTask, isProcessing: isProcessing });
    return false;
  }
  
  if (message.action === 'startPolling') {
    startPolling();
    sendResponse({ success: true });
    return false;
  }
  
  if (message.action === 'stopPolling') {
    stopPolling();
    sendResponse({ success: true });
    return false;
  }
  
  if (message.action === 'continueFromNeedsUser') {
    // User clicked "I finished login, continue" in popup
    // Transition needs_user -> in_progress
    if (currentTask) {
      console.log('[Background] User requested continue from needs_user');
      APIClient.transitionTask(
        currentTask.id,
        'in_progress',
        'User confirmed ready to continue',
        { 
          user_action: 'manual_continue',
          timestamp: new Date().toISOString()
        }
      )
        .then(() => {
          // Re-enable processing so detection can run again
          isProcessing = false;
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('[Background] Failed to transition from needs_user:', error);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      sendResponse({ success: false, error: 'No current task' });
    }
    return true; // Async response
  }
  
  // ============================================================
  // Phase A: Cookie Auth Check
  // ============================================================
  if (message.type === 'FW_CHECK_AUTH') {
    checkAuthViaBackend().then(sendResponse);
    return true; // Async response
  }
  
  // ============================================================
  // Phase A: Extension Token Message Handlers
  // ============================================================
  if (message.type === 'FW_EXTENSION_TOKEN') {
    console.log('[FW BG] Received FW_EXTENSION_TOKEN');
    
    (async () => {
      try {
        await saveToken(message.token);
        authState.isAuthenticated = true;
        authState.user = null;  // We don't parse token here, just mark as authenticated
        
        console.log('[FW Auth] Token received - starting polling');
        startPolling();
        
        sendResponse({ success: true });
      } catch (err) {
        console.error('[FW Auth] Failed to save token:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    
    return true; // Async response
  }
  
  if (message.type === 'FW_EXTENSION_LOGOUT') {
    console.log('[FW BG] Received FW_EXTENSION_LOGOUT');
    
    (async () => {
      try {
        await clearToken();
        authState.isAuthenticated = false;
        authState.user = null;
        
        console.log('[FW Auth] Logout - stopping polling');
        stopPolling();
        
        // Clear any active task state
        currentTask = null;
        currentJobTab = null;
        isProcessing = false;
        
        sendResponse({ success: true });
      } catch (err) {
        console.error('[FW Auth] Failed to clear token:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    
    return true; // Async response
  }
  
  // ============================================================
  // Phase A: Auth Change Handler (LEGACY - Keep for compatibility)
  // ============================================================
  if (message.type === 'FW_AUTH_CHANGED') {
    console.log('[FW Auth] Auth change event received (legacy)');
    
    verifyAndUpdateAuthState().then(isAuth => {
      if (isAuth) {
        console.log('[FW Auth] Authenticated - starting polling');
        startPolling();
      } else {
        console.log('[FW Auth] Not authenticated - stopping polling');
        stopPolling();
        
        // Clear any active task state
        currentTask = null;
        currentJobTab = null;
        isProcessing = false;
      }
      
      sendResponse({ success: true, isAuthenticated: isAuth });
    }).catch(err => {
      console.error('[FW Auth] Auth verification failed', err);
      sendResponse({ success: false, error: err.message });
    });
    
    return true; // Async response
  }
  
  if (message.type === 'FW_DETECTION_RESULT') {
    // Content script is reporting detection result directly
    handleDetectionResult(message)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
  
  if (message.type === 'FW_TASK_RESUMED') {
    // Task automatically resumed after user action
    console.log('[Background] Task resumed:', message);
    
    // VALIDATION: Check current task and session
    if (!currentTask) {
      console.warn('[Background] No current task for resume');
      sendResponse({ success: false, error: 'No current task' });
      return true;
    }
    
    getActiveSession().then(session => {
      if (!session || !session.active || session.task_id !== currentTask.id) {
        console.warn('[Background] Session validation failed for resume');
        sendResponse({ success: false, error: 'Invalid session' });
        return;
      }
      
      // Only transition if currently in needs_user
      if (currentTask.status === 'needs_user') {
        APIClient.transitionTask(
          currentTask.id,
          'in_progress',
          `Resumed after user completed: ${message.previous_intent}`,
          {
            auto_resume: true,
            previous_intent: message.previous_intent,
            new_stage: message.new_stage,
            evidence: message.evidence,
            timestamp: new Date().toISOString()
          }
        )
          .then(() => {
            console.log('[Background] Task transitioned to in_progress');
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('[Background] Resume transition failed:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        console.log('[Background] Task not in needs_user state, skipping resume');
        sendResponse({ success: false, error: 'Task not in needs_user state' });
      }
    }).catch(error => {
      console.error('[Background] Failed to get session:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Async response
  }
  
  // ============================================================
  
  // ============================================================
  // FW_CONTENT_HELLO: Content script injection confirmation
  // ============================================================
  if (message.type === 'FW_CONTENT_HELLO') {
    lastContentHello = {
      host: message.host,
      href: message.href,
      ts: message.ts,
      version: message.version,
      receivedAt: Date.now()
    };
    console.log('[FW BG] Content script hello received:', lastContentHello);
    sendResponse({ success: true, received: true });
    return true;
  }
});

/**
 * Handle tab close
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentJobTab) {
    console.log('Job tab closed');
    // Don't auto-complete, user might have multiple tabs open
  }
  
  // Phase A: Tab session system removed
  // clearTabSession(tabId);
});

/**
 * Navigation logging for injection debugging.
 * Logs when navigating while apply session is active.
 */
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only log main frame navigations
  if (details.frameId !== 0) return;
  
  try {
    const session = await getActiveSession();
    const sessionActive = session && session.active;
    
    let host = '';
    try {
      host = new URL(details.url).hostname;
    } catch (_) {
      host = 'invalid_url';
    }
    
    // Only log if session is active (during apply flow)
    if (sessionActive) {
      console.log('[FW BG] nav', {
        tabId: details.tabId,
        url: details.url,
        host: host,
        transitionType: details.transitionType,
        sessionActive: sessionActive,
        taskId: session.task_id,
        willInject: true,
        reason: 'content_scripts.matches=https://*/*'
      });
    }
  } catch (error) {
    // Don't let navigation logging crash the extension
    console.warn('[FW BG] nav logging error:', error.message);
  }
});

/**
 * Initialize background script with token-based auth.
 * Phase A: Extension uses explicit token authorization, no cookies.
 * Only start polling after token is loaded.
 */
async function initialize() {
  console.log('[FW BG] Initializing background script');
  console.log('[FW BG] Token-based auth architecture active');
  
  await loadToken();
  
  if (authToken) {
    console.log('[FW BG] Token found - starting task polling');
    authState.isAuthenticated = true;
    startPolling();
  } else {
    console.log('[FW BG] No token - polling disabled');
    console.log('[FW BG] Waiting for FW_EXTENSION_TOKEN from Web App');
  }
}

/**
 * Initialize on extension load
 */
console.log('FuckWork Apply Worker initialized');
initialize();

