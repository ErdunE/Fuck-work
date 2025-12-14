/**
 * Background script for apply task worker.
 * Polls backend for tasks and orchestrates execution.
 */

// Import API client and state machine
importScripts('api.js', 'ats_types.js', 'apply_state_machine.js', 'apply_session.js');

// Worker state
let currentTask = null;
let currentJobTab = null;
let isProcessing = false;
let pollInterval = null;

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
async function handleDetectionResult({ ats, stage, action }) {
  if (!currentTask) {
    console.log('[Background] No current task for detection result');
    return;
  }
  
  console.log('[Background] Detection result:', { ats, stage, action });
  
  try {
    if (action.action === 'pause_needs_user') {
      // Transition to needs_user
      console.log('[Background] Transitioning to needs_user:', action.reason);
      await APIClient.transitionTask(
        currentTask.id,
        'needs_user',
        action.reason,
        { 
          ats: ats.ats_kind,
          stage: stage.stage,
          evidence: action.evidence,
          detection_timestamp: new Date().toISOString()
        }
      );
      
      // Keep task reference but mark as not processing
      // User can continue later via popup
      isProcessing = false;
      
    } else if (action.action === 'fail') {
      // Transition to failed
      console.log('[Background] Transitioning to failed:', action.reason);
      await APIClient.transitionTask(
        currentTask.id,
        'failed',
        action.reason,
        { 
          ats: ats.ats_kind,
          stage: stage.stage
        }
      );
      
      // Reset state
      currentTask = null;
      currentJobTab = null;
      isProcessing = false;
      await chrome.storage.local.remove(['activeTask', 'activeJob', 'taskStartTime']);
    }
    
    // For 'continue' and 'noop', do nothing - task stays in_progress
    // Content script will handle autofill for 'continue'
    // User will manually mark status for 'noop'
    
  } catch (error) {
    console.error('[Background] Failed to handle detection result:', error);
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
    
    if (currentTask && currentTask.status === 'needs_user') {
      // Transition needs_user -> in_progress
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
      sendResponse({ success: false, error: 'No current task in needs_user state' });
    }
    return true; // Async response
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
 * Initialize on extension load
 */
console.log('FuckWork Apply Worker initialized');
startPolling();

