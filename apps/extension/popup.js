/**
 * Popup UI logic for apply worker controls.
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load current state
  await refreshState();
  
  // Set up event listeners
  document.getElementById('btn-success').addEventListener('click', () => completeTask('success'));
  document.getElementById('btn-needs-user').addEventListener('click', () => completeTask('needs_user'));
  document.getElementById('btn-cancel').addEventListener('click', () => completeTask('canceled'));
  document.getElementById('btn-refresh').addEventListener('click', refreshState);
}

/**
 * Refresh current state
 */
async function refreshState() {
  try {
    // Get current task from background script
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentTask' });
    
    const statusEl = document.getElementById('status');
    const taskInfoEl = document.getElementById('task-info');
    
    if (response.task) {
      // Show task info
      statusEl.className = 'status active';
      statusEl.textContent = `Task in progress: ${response.task.job_id}`;
      
      taskInfoEl.style.display = 'block';
      document.getElementById('job-id').textContent = response.task.job_id;
      document.getElementById('task-status').textContent = response.task.status;
      document.getElementById('task-priority').textContent = response.task.priority;
      
      // Enable buttons
      document.getElementById('btn-success').disabled = false;
      document.getElementById('btn-needs-user').disabled = false;
      document.getElementById('btn-cancel').disabled = false;
      
    } else if (response.isProcessing) {
      statusEl.className = 'status active';
      statusEl.textContent = 'Processing task...';
      taskInfoEl.style.display = 'none';
      
    } else {
      statusEl.className = 'status';
      statusEl.textContent = 'No active task - waiting for queued tasks...';
      taskInfoEl.style.display = 'none';
      
      // Disable buttons
      document.getElementById('btn-success').disabled = true;
      document.getElementById('btn-needs-user').disabled = true;
      document.getElementById('btn-cancel').disabled = true;
    }
    
    hideMessage();
    
  } catch (error) {
    showMessage('Failed to load state: ' + error.message, 'error');
  }
}

/**
 * Complete current task
 */
async function completeTask(status) {
  try {
    // Disable buttons
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    
    let reason;
    if (status === 'success') {
      reason = 'User confirmed successful submission';
    } else if (status === 'needs_user') {
      reason = 'User indicated manual intervention needed';
    } else if (status === 'canceled') {
      reason = 'User canceled task';
    }
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'completeTask',
      status: status,
      reason: reason,
      details: {
        completed_via: 'popup',
        completed_at: new Date().toISOString()
      }
    });
    
    if (response.success) {
      showMessage('Task completed successfully', 'success');
      setTimeout(refreshState, 1000);
    } else {
      throw new Error(response.error || 'Unknown error');
    }
    
  } catch (error) {
    showMessage('Failed to complete task: ' + error.message, 'error');
    document.querySelectorAll('button').forEach(btn => btn.disabled = false);
  }
}

/**
 * Show message
 */
function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
}

/**
 * Hide message
 */
function hideMessage() {
  document.getElementById('message').style.display = 'none';
}

