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

// Configuration
const POLL_INTERVAL_MS = 15000; // 15 seconds
const TASK_TIMEOUT_MS = 600000; // 10 minutes

/**
 * Start polling for tasks
 */
function startPolling() {
  console.log('Starting task polling...');
  
  // Poll immediately
  pollForTask();
  
  // Set up interval
  pollInterval = setInterval(pollForTask, POLL_INTERVAL_MS);
}

/**
 * Stop polling
 */
function stopPolling() {
  console.log('Stopping task polling...');
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

/**
 * Poll for next task
 */
async function pollForTask() {
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
  // Phase 5.3.2: Auth Bridge - Content → Background Relay
  // ============================================================
  if (message.type === 'FW_AUTH_BOOTSTRAP_COMPLETE') {
    console.log('[FW Auth Background] Received auth bootstrap complete', {
      user_id: message.user_id,
      expires_at: message.expires_at,
      from_tab: sender.tab?.id
    });
    console.log('[FW Auth Background] Token stored successfully');
    console.log('[FW Auth Background] Authenticated as user_id', message.user_id);
    sendResponse({ ok: true });
    return true;
  }
  
  if (message.type === 'FW_AUTH_CLEAR_COMPLETE') {
    console.log('[FW Auth Background] Received auth clear complete', {
      reason: message.reason,
      from_tab: sender.tab?.id
    });
    console.log('[FW Auth Background] Token cleared successfully');
    sendResponse({ ok: true });
    return true;
  }
  
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
 * Phase 5.0: Initialize authentication and preference sync
 */
async function initializePhase5() {
  console.log('[FW Phase 5.0] Initializing Web Control Plane integration');
  
  // Validate authentication
  const userInfo = await AuthManager.validateToken();
  if (userInfo) {
    console.log('[FW Phase 5.0] Authenticated', { user_id: userInfo.user_id });
    
    // Start preference sync service
    await PreferenceSyncService.start();
  } else {
    console.log('[FW Phase 5.0] Not authenticated - running in offline mode');
    console.log('[FW Phase 5.0] Extension will use local preference cache');
    console.log('[FW Phase 5.0] Open popup to log in');
  }
}

/**
 * Initialize on extension load
 */
console.log('FuckWork Apply Worker initialized');
startPolling();

// Phase 5.0 initialization
initializePhase5();

