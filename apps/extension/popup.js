/**
 * Popup UI logic for apply worker controls.
 */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load current state
  await refreshState();
  
  // Load automation settings
  await loadAutomationSettings();
  
  // Set up event listeners
  document.getElementById('btn-continue').addEventListener('click', handleContinue);
  document.getElementById('btn-success').addEventListener('click', () => completeTask('success'));
  document.getElementById('btn-needs-user').addEventListener('click', () => completeTask('needs_user'));
  document.getElementById('btn-cancel').addEventListener('click', () => completeTask('canceled'));
  document.getElementById('btn-refresh').addEventListener('click', refreshState);
  document.getElementById('btn-copy-debug').addEventListener('click', handleCopyDebug);
  document.getElementById('save-automation-prefs').addEventListener('click', handleSaveAutomationPrefs);
  
  // Listen for checkbox changes to enable save button
  document.getElementById('auto-fill-toggle').addEventListener('change', () => {
    document.getElementById('save-automation-prefs').style.background = '#ff9800';
  });
  document.getElementById('auto-submit-toggle').addEventListener('change', () => {
    document.getElementById('save-automation-prefs').style.background = '#ff9800';
  });
}

// Listen for storage changes to auto-update popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.detectionState) {
    console.log('[Popup] Detection state changed, refreshing display');
    const newState = changes.detectionState.newValue;
    if (newState) {
      showDetectionInfo(newState);
    }
  }
});

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
      
      // Load detection state from storage
      const { detectionState } = await chrome.storage.local.get(['detectionState']);
      
      if (detectionState) {
        showDetectionInfo(detectionState);
      } else {
        // Hide detection info if not available
        document.getElementById('detection-info').style.display = 'none';
      }
      
      // Show continue button if needs_user
      if (response.task.status === 'needs_user') {
        document.getElementById('btn-continue').style.display = 'block';
        document.getElementById('btn-continue').disabled = false;
      } else {
        document.getElementById('btn-continue').style.display = 'none';
      }
      
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

/**
 * Show detection info panel
 */
function showDetectionInfo(detectionState) {
  const { 
    ats, stage, action, intent, guidance, 
    last_recheck_reason, recheck_count, page_url, page_type, session 
  } = detectionState;
  
  document.getElementById('detection-info').style.display = 'block';
  document.getElementById('ats-kind').textContent = ats.ats_kind || 'unknown';
  document.getElementById('apply-stage').textContent = stage.stage || 'unknown';
  document.getElementById('stage-reason').textContent = action.reason || 'N/A';
  
  // Show intent guidance if available
  if (intent && guidance) {
    document.getElementById('intent-info').style.display = 'block';
    document.getElementById('intent-title').textContent = guidance.title || 'Manual Action Needed';
    document.getElementById('intent-action').textContent = guidance.user_action || 'Complete the required action';
    document.getElementById('intent-next').textContent = guidance.what_next || 'The application will continue';
  } else {
    document.getElementById('intent-info').style.display = 'none';
  }
  
  // Format evidence as JSON with recheck metadata and session info
  const fullReport = {
    session: session || null,
    ats: ats,
    stage: stage,
    action: action,
    intent: intent,
    guidance: guidance,
    page_url: page_url,
    page_type: page_type,
    last_recheck_reason: last_recheck_reason,
    recheck_count: recheck_count,
    timestamp: new Date().toISOString()
  };
  
  document.getElementById('evidence-json').textContent = JSON.stringify(fullReport, null, 2);
}

/**
 * Handle copy debug report
 */
async function handleCopyDebug() {
  try {
    const text = document.getElementById('evidence-json').textContent;
    await navigator.clipboard.writeText(text);
    showMessage('Debug report copied to clipboard', 'success');
    setTimeout(hideMessage, 3000);
  } catch (error) {
    showMessage('Failed to copy: ' + error.message, 'error');
  }
}

/**
 * Handle continue from needs_user
 */
async function handleContinue() {
  try {
    // Disable button
    document.getElementById('btn-continue').disabled = true;
    
    const response = await chrome.runtime.sendMessage({
      action: 'continueFromNeedsUser'
    });
    
    if (response.success) {
      showMessage('Continuing task...', 'success');
      setTimeout(() => {
        hideMessage();
        refreshState();
      }, 1000);
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (error) {
    showMessage('Failed to continue: ' + error.message, 'error');
    document.getElementById('btn-continue').disabled = false;
  }
}

/**
 * Load automation settings from preferences
 */
async function loadAutomationSettings() {
  try {
    const prefs = await prefManager.getPreferences();
    document.getElementById('auto-fill-toggle').checked = prefs.global.auto_fill_after_login;
    document.getElementById('auto-submit-toggle').checked = prefs.global.auto_submit_when_ready;
    console.log('[Popup] Loaded automation settings:', prefs.global);
  } catch (error) {
    console.error('[Popup] Failed to load automation settings:', error);
  }
}

/**
 * Handle save automation preferences
 */
async function handleSaveAutomationPrefs() {
  try {
    const saveBtn = document.getElementById('save-automation-prefs');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const autoFill = document.getElementById('auto-fill-toggle').checked;
    const autoSubmit = document.getElementById('auto-submit-toggle').checked;
    
    await prefManager.updateGlobalPreferences({
      auto_fill_after_login: autoFill,
      auto_submit_when_ready: autoSubmit
    });
    
    showMessage('Automation settings saved successfully', 'success');
    saveBtn.style.background = '';
    saveBtn.textContent = 'Save Settings';
    saveBtn.disabled = false;
    
    setTimeout(hideMessage, 3000);
  } catch (error) {
    showMessage('Failed to save settings: ' + error.message, 'error');
    document.getElementById('save-automation-prefs').disabled = false;
    document.getElementById('save-automation-prefs').textContent = 'Save Settings';
  }
}

