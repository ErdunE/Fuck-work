/**
 * Content script for page inspection and autofill.
 * Runs on job application pages with ATS detection and state machine.
 */

console.log('FuckWork content script loaded');

// State variables
let currentTask = null;
let lastDetectionTime = 0;
const DETECTION_THROTTLE_MS = 2000; // Max once per 2 seconds

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('Initializing content script...');
  
  // Get active task
  const { activeTask, activeJob } = await chrome.storage.local.get(['activeTask', 'activeJob']);
  
  if (!activeTask) {
    console.log('No active task, skipping initialization');
    return;
  }
  
  currentTask = activeTask;
  console.log('Active task:', activeTask);
  
  // Wait for page to settle
  await sleep(2000);
  
  // Run detection
  await runDetection();
}

/**
 * Run ATS and stage detection
 */
async function runDetection() {
  // Throttle detection to avoid spam
  const now = Date.now();
  if (now - lastDetectionTime < DETECTION_THROTTLE_MS) {
    console.log('[Detection] Throttled - too soon since last detection');
    return;
  }
  lastDetectionTime = now;
  
  console.log('[Detection] Running ATS and stage detection...');
  
  try {
    // Step 1: Detect ATS platform
    const atsResult = detectATS();
    console.log('[Detection] ATS result:', atsResult);
    
    // Step 2: Detect application stage
    const stageResult = detectApplyStage(atsResult.ats_kind);
    console.log('[Detection] Stage result:', stageResult);
    
    // Step 3: Compute worker action
    const actionResult = computeWorkerAction({
      task: currentTask,
      ats: atsResult,
      stage: stageResult
    });
    console.log('[Detection] Action result:', actionResult);
    
    // Step 4: Store detection state for popup access
    await chrome.storage.local.set({
      detectionState: {
        ats: atsResult,
        stage: stageResult,
        action: actionResult
      }
    });
    
    // Step 5: Take action based on result
    if (actionResult.action === 'pause_needs_user') {
      showNeedsUserOverlay(atsResult, stageResult, actionResult);
    } else if (actionResult.action === 'continue') {
      // Get user profile and run autofill
      const userProfile = await APIClient.getUserProfile(1);
      
      if (userProfile && userProfile.profile) {
        await attemptAutofill(userProfile.profile, userProfile.user);
      } else {
        console.log('No user profile found for autofill');
      }
    } else if (actionResult.action === 'noop') {
      console.log('[Detection] No action needed - user must confirm via popup');
    }
    
    // Step 6: Report back to background worker
    chrome.runtime.sendMessage({
      type: 'FW_DETECTION_RESULT',
      ats: atsResult,
      stage: stageResult,
      action: actionResult
    }).catch(err => {
      console.error('[Detection] Failed to send result to background:', err);
    });
    
    return {
      ats: atsResult,
      stage: stageResult,
      action: actionResult
    };
    
  } catch (error) {
    console.error('[Detection] Error during detection:', error);
    return null;
  }
}

/**
 * Show needs_user overlay
 */
function showNeedsUserOverlay(ats, stage, action) {
  // Check if overlay already exists
  if (document.getElementById('fw-needs-user-overlay')) {
    console.log('[Overlay] Already showing');
    return;
  }
  
  console.log('[Overlay] Showing needs_user overlay');
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'fw-needs-user-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: white;
    border: 2px solid #ff9800;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 16px;
  `;
  
  // Create content
  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="font-size: 16px; font-weight: 600; color: #ff9800;">
        ⚠ Action Required
      </div>
      <button id="fw-overlay-close" style="
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 1;
      ">&times;</button>
    </div>
    
    <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
      <strong>ATS Platform:</strong> ${ats.ats_kind}
    </div>
    
    <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
      <strong>Stage:</strong> ${stage.stage}
    </div>
    
    <div style="font-size: 13px; color: #333; margin-bottom: 12px; padding: 8px; background: #fff3e0; border-radius: 4px;">
      ${action.reason}
    </div>
    
    <button id="fw-overlay-copy" style="
      width: 100%;
      padding: 8px;
      background: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      font-weight: 500;
    ">
      📋 Copy Debug Report
    </button>
  `;
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Add event listeners
  document.getElementById('fw-overlay-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  document.getElementById('fw-overlay-copy').addEventListener('click', async () => {
    const debugReport = {
      ats,
      stage,
      action,
      timestamp: new Date().toISOString()
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2));
      const btn = document.getElementById('fw-overlay-copy');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.style.background = '#4caf50';
      btn.style.color = 'white';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#e0e0e0';
        btn.style.color = '#333';
      }, 2000);
    } catch (err) {
      console.error('[Overlay] Failed to copy:', err);
    }
  });
}

/**
 * Attempt to autofill basic fields
 */
async function attemptAutofill(profile, user) {
  console.log('Attempting autofill with profile:', profile);
  
  let filledCount = 0;
  
  // Find and fill email field
  const emailFields = findFieldsByType(['email'], ['email', 'e-mail', 'e_mail']);
  for (const field of emailFields) {
    if (user.email && !field.value) {
      field.value = user.email;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled email:', user.email);
      filledCount++;
    }
  }
  
  // Find and fill first name
  const firstNameFields = findFieldsByType(['text'], ['first', 'fname', 'firstname', 'given']);
  for (const field of firstNameFields) {
    if (profile.first_name && !field.value) {
      field.value = profile.first_name;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled first name:', profile.first_name);
      filledCount++;
    }
  }
  
  // Find and fill last name
  const lastNameFields = findFieldsByType(['text'], ['last', 'lname', 'lastname', 'surname', 'family']);
  for (const field of lastNameFields) {
    if (profile.last_name && !field.value) {
      field.value = profile.last_name;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled last name:', profile.last_name);
      filledCount++;
    }
  }
  
  console.log(`Autofilled ${filledCount} fields`);
  
  if (filledCount === 0) {
    console.log('No fields were filled - form may be unrecognized');
  }
}

/**
 * Find input fields by type and name patterns
 */
function findFieldsByType(types, namePatterns) {
  const fields = [];
  
  const inputs = document.querySelectorAll('input');
  
  for (const input of inputs) {
    // Check type
    if (!types.includes(input.type)) {
      continue;
    }
    
    // Check name/id/placeholder for patterns
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const label = findLabel(input)?.toLowerCase() || '';
    
    const searchText = `${name} ${id} ${placeholder} ${label}`;
    
    for (const pattern of namePatterns) {
      if (searchText.includes(pattern)) {
        fields.push(input);
        break;
      }
    }
  }
  
  return fields;
}

/**
 * Find label for input field
 */
function findLabel(input) {
  // Check for <label for="id">
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent;
    }
  }
  
  // Check for wrapping <label>
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent;
  }
  
  return null;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Message listener for background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Received message:', message);
  
  if (message.type === 'FW_DETECT_AND_REPORT') {
    // Run detection and respond
    runDetection()
      .then(result => {
        sendResponse(result || { error: 'Detection failed' });
      })
      .catch(error => {
        console.error('[Content] Detection error:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Async response
  }
  
  return false;
});
