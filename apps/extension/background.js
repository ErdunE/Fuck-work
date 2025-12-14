/**
 * Background script for apply task worker.
 * Polls backend for tasks and orchestrates execution.
 */

// Import API client
importScripts('api.js');

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
    
    // 3. Open job URL in new tab
    console.log(`Opening job URL: ${job.url}`);
    const tab = await chrome.tabs.create({
      url: job.url,
      active: true
    });
    
    currentJobTab = tab.id;
    
    // Store task data for content script
    await chrome.storage.local.set({
      activeTask: task,
      activeJob: job,
      taskStartTime: Date.now()
    });
    
    console.log(`Task ${task.id} in progress`);
    
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

