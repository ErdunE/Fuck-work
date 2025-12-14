/**
 * Content script for page inspection and autofill.
 * Runs on job application pages with ATS detection and state machine.
 */

console.log('FuckWork content script loaded');

/**
 * Ensure FW debug state exists globally
 * MUST be called before any access to _FW_DEBUG_STATE__
 * @returns {object} Debug state object
 */
function ensureFWDebugState() {
  if (!window._FW_DEBUG_STATE__) {
    window._FW_DEBUG_STATE__ = {
      recheckCount: 0,
      lastRecheckReason: null,
      initializedAt: Date.now()
    };
    console.log('[FW Debug State] Initialized:', window._FW_DEBUG_STATE__);
  }
  return window._FW_DEBUG_STATE__;
}

// State variables
let currentTask = null;
let activeSession = null;
let lastDetectionTime = 0;
const DETECTION_THROTTLE_MS = 2000; // Max once per 2 seconds

// Recheck state
let recheckTimeout = null;
let recheckCount = 0;
let lastRecheckUrl = '';
const RECHECK_DEBOUNCE_MS = 800;

// Deduplication guard
let lastRecheckSignature = null;

// Overlay lifecycle management (session-scoped singleton)
let fwOverlayInstance = null;

/**
 * Ensure overlay exists for active session
 * Creates overlay if it doesn't exist
 * @param {object} session - Active apply session
 */
function ensureOverlay(session) {
  if (!fwOverlayInstance) {
    console.log('[Overlay] Creating session-scoped overlay for task:', session.task_id);
    fwOverlayInstance = createOverlayElement(session);
    document.body.appendChild(fwOverlayInstance);
  }
}

/**
 * Update overlay content based on detection results
 * Does NOT control visibility - only updates content
 * @param {object} guidance - Guidance object from detection
 */
function updateOverlayContent(guidance) {
  if (!fwOverlayInstance) {
    console.warn('[Overlay] Cannot update - overlay does not exist');
    return;
  }
  
  console.log('[Overlay] Updating content:', guidance.intent);
  
  // Update overlay DOM with new guidance
  const titleEl = fwOverlayInstance.querySelector('.fw-overlay-title');
  const whatEl = fwOverlayInstance.querySelector('.fw-overlay-what');
  const actionEl = fwOverlayInstance.querySelector('.fw-overlay-action');
  const nextEl = fwOverlayInstance.querySelector('.fw-overlay-next');
  const taskIdEl = fwOverlayInstance.querySelector('.fw-overlay-task-id');
  const jobIdEl = fwOverlayInstance.querySelector('.fw-overlay-job-id');
  
  if (titleEl) titleEl.textContent = guidance.title;
  if (whatEl) whatEl.textContent = guidance.what_happening;
  if (actionEl) actionEl.textContent = guidance.user_action;
  if (nextEl) nextEl.textContent = guidance.what_next;
  if (taskIdEl) taskIdEl.textContent = guidance.task_id;
  if (jobIdEl) jobIdEl.textContent = guidance.job_id;
}

/**
 * Remove overlay ONLY if session is closed
 * @param {object} session - Session object (may be inactive)
 */
function removeOverlayIfSessionClosed(session) {
  if (!session || !session.active) {
    if (fwOverlayInstance) {
      console.log('[Overlay] Removing overlay - session closed');
      fwOverlayInstance.remove();
      fwOverlayInstance = null;
    }
  }
}

/**
 * Create overlay DOM element
 * @param {object} session - Active apply session
 * @returns {HTMLElement} Overlay element
 */
function createOverlayElement(session) {
  const overlay = document.createElement('div');
  overlay.id = 'fw-needs-user-overlay';
  overlay.className = 'fw-overlay-persistent';
  
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 360px;
    background: white;
    border: 2px solid #ff9800;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
  `;
  
  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div style="flex: 1;">
        <div style="font-size: 16px; font-weight: 600; color: #ff9800; margin-bottom: 4px;">
          FuckWork Apply Assistant
        </div>
        <div style="font-size: 12px; color: #999;">
          Task #<span class="fw-overlay-task-id">${session.task_id}</span> | 
          Job <span class="fw-overlay-job-id">${session.job_id}</span>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 16px; padding: 12px; background: #fff3e0; border-radius: 6px; border-left: 3px solid #ff9800;">
      <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
        <span class="fw-overlay-title">Loading...</span>
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
        <strong>What's happening:</strong> <span class="fw-overlay-what">Analyzing page...</span>
      </div>
      <div style="font-size: 14px; color: #1a1a1a; font-weight: 500; margin-bottom: 8px;">
        <strong>→ <span class="fw-overlay-action">Please wait...</span></strong>
      </div>
      <div style="font-size: 12px; color: #666;">
        <em>After you do this:</em> <span class="fw-overlay-next">Detection in progress...</span>
      </div>
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button class="fw-overlay-copy-debug" style="
        flex: 1;
        padding: 10px;
        background: #e0e0e0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        color: #333;
        font-weight: 500;
      ">
        📋 Copy Debug
      </button>
    </div>
  `;
  
  // Add copy debug handler
  overlay.querySelector('.fw-overlay-copy-debug').addEventListener('click', async () => {
    const { detectionState } = await chrome.storage.local.get(['detectionState']);
    if (detectionState) {
      const debugInfo = JSON.stringify(detectionState, null, 2);
      navigator.clipboard.writeText(debugInfo);
      console.log('[Overlay] Debug info copied to clipboard');
    }
  });
  
  return overlay;
}

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('[FW Init] Starting initialization...');
  
  // STEP 1: Ensure debug state exists
  const debugState = ensureFWDebugState();
  
  // STEP 2: Load or initialize session (MUST be first)
  activeSession = await getActiveSession();
  
  if (!activeSession || !activeSession.active) {
    console.log('[FW Init] No active session found, skipping initialization');
    return;
  }
  
  console.log('[FW Init] Active session found:', activeSession.task_id);
  
  // STEP 3: Get task from storage
  const { activeTask } = await chrome.storage.local.get(['activeTask']);
  if (!activeTask) {
    console.log('[FW Init] No active task in storage');
    return;
  }
  
  currentTask = activeTask;
  
  // STEP 4: CREATE OVERLAY (before detection)
  ensureOverlay(activeSession);
  
  // STEP 5: Update session with current URL
  await updateActiveSession({ current_url: window.location.href });
  
  // STEP 6: Wait for page to settle
  await sleep(2000);
  
  // STEP 7: Run detection (will update overlay content)
  await runDetection();
  
  // STEP 8: Initialize page lifecycle observers (AFTER detection)
  initializePageLifecycle();
  
  // STEP 9: Start monitoring for resume conditions
  startResumeMonitoring();
  
  console.log('[FW Init] Initialization complete');
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
    
    // Step 4: Detect user action intent and generate guidance
    const intentResult = detectUserActionIntent(atsResult, stageResult);
    const guidance = generateSessionAwareGuidance(
      intentResult.intent,
      atsResult,
      stageResult,
      activeSession
    );
    console.log('[Detection] Intent result:', intentResult);
    console.log('[Detection] Guidance:', guidance);
    
    // Step 5: UPDATE OVERLAY CONTENT (not visibility)
    updateOverlayContent(guidance);
    
    // Step 6: Store detection state for popup access
    await chrome.storage.local.set({
      detectionState: {
        ats: atsResult,
        stage: stageResult,
        action: actionResult,
        intent: intentResult,
        guidance: guidance,
        timestamp: new Date().toISOString(),
        session: {
          task_id: activeSession.task_id,
          job_id: activeSession.job_id,
          recheck_count: activeSession.recheck_count
        }
      }
    });
    
    // Step 7: Take action based on result (NO overlay manipulation)
    if (actionResult.action === 'continue') {
      // Get user profile and run autofill
      const userProfile = await APIClient.getUserProfile(1);
      
      if (userProfile && userProfile.profile) {
        await attemptAutofill(userProfile.profile, userProfile.user);
      } else {
        console.log('No user profile found for autofill');
      }
    }
    
    // Step 8: Report back to background worker
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
    console.error('[Detection] Pipeline failed:', error);
    
    // Even on error, show fallback guidance
    updateOverlayContent({
      title: 'Detection Error',
      what_happening: 'Unable to analyze page',
      user_action: 'Please continue manually or cancel this task',
      what_next: 'I will retry on next page transition',
      task_id: activeSession.task_id,
      job_id: activeSession.job_id,
      intent: 'unknown_manual'
    });
    
    return null;
  }
}

// Legacy overlay function removed - now using session-scoped lifecycle manager

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
 * Trigger a re-check of detection pipeline
 * @param {string} reason - Why recheck was triggered
 */
async function triggerRecheck(reason) {
  // DEFENSIVE: Ensure debug state exists
  const debugState = ensureFWDebugState();
  
  // Clear existing timeout
  if (recheckTimeout) {
    clearTimeout(recheckTimeout);
  }
  
  // Update debug state
  debugState.lastRecheckReason = reason;
  
  // Debounce to avoid rapid fire
  recheckTimeout = setTimeout(async () => {
    await executeRecheck(reason);
  }, RECHECK_DEBOUNCE_MS);
}

/**
 * Execute the recheck detection pipeline
 * @param {string} reason - Trigger reason
 */
async function executeRecheck(reason) {
  // DEFENSIVE: Ensure debug state exists
  const debugState = ensureFWDebugState();
  
  // Load active session
  activeSession = await getActiveSession();
  
  if (!activeSession || !activeSession.active) {
    console.log('[Recheck] No active session, skipping');
    return;
  }
  
  // Guard: Don't recheck if no active task
  if (!currentTask) {
    console.log('[Recheck] No active task, skipping');
    return;
  }
  
  // Verify task matches session
  if (currentTask.id !== activeSession.task_id) {
    console.warn('[Recheck] Task/session mismatch!', {
      task: currentTask.id,
      session: activeSession.task_id
    });
    return;
  }
  
  const currentUrl = window.location.href;
  
  // Classify page type early for signature
  const pageType = classifyPageType();
  
  // DEDUPLICATION: Create signature
  const signature = `${currentUrl}|${pageType}|${activeSession.task_id}`;
  
  if (signature === lastRecheckSignature) {
    console.log('[Recheck] Skipping duplicate recheck for same page/stage');
    return;
  }
  
  lastRecheckSignature = signature;
  console.log(`[Recheck] New recheck signature: ${signature}`);
  
  // Update session state
  await updateActiveSession({
    current_url: currentUrl,
    recheck_count: activeSession.recheck_count + 1
  });
  
  // Reload updated session
  activeSession = await getActiveSession();
  
  // Update debug state
  debugState.recheckCount = activeSession.recheck_count;
  
  console.log(`[Recheck] Executing detection pipeline (reason: ${reason}, task: ${activeSession.task_id}, count: ${debugState.recheckCount})`);
  
  // Show "rechecking" state in existing overlay
  updateOverlayContent({
    title: 'Analyzing New Page',
    what_happening: `Detected ${reason}, checking what to do next...`,
    user_action: 'Please wait while I analyze this page',
    what_next: 'Guidance will appear in a moment',
    task_id: activeSession.task_id,
    job_id: activeSession.job_id,
    intent: 'analyzing'
  });
  
  try {
    
    // Run full detection pipeline
    const atsResult = detectATS();
    const stageResult = detectApplyStage(atsResult.ats_kind);
    const actionResult = computeWorkerAction({
      task: currentTask,
      ats: atsResult,
      stage: stageResult
    });
    
    // Update session with detected ATS
    if (atsResult.ats_kind !== 'unknown' && !activeSession.ats_kind) {
      await updateActiveSession({ ats_kind: atsResult.ats_kind });
    }
    
    // Detect intent if pausing
    let intentResult = null;
    let guidance = null;
    
    if (actionResult.action === 'pause_needs_user') {
      intentResult = detectUserActionIntent(atsResult, stageResult);
      guidance = generateSessionAwareGuidance(
        intentResult.intent,
        atsResult,
        stageResult,
        activeSession
      );
    }
    
    // Add recheck evidence with session context
    const recheckEvidence = makeEvidence(
      'recheck_trigger',
      `Re-detection triggered by ${reason}`,
      { 
        reason,
        task_id: activeSession.task_id,
        job_id: activeSession.job_id,
        recheck_count: activeSession.recheck_count,
        url: currentUrl,
        page_type: pageType,
        timestamp: new Date().toISOString()
      }
    );
    
    // Update storage with recheck metadata and session info
    await chrome.storage.local.set({
      detectionState: {
        ats: atsResult,
        stage: stageResult,
        action: actionResult,
        intent: intentResult,
        guidance: guidance,
        last_recheck_reason: reason,
        recheck_count: activeSession.recheck_count,
        page_url: currentUrl,
        page_type: pageType,
        session: {
          task_id: activeSession.task_id,
          job_id: activeSession.job_id,
          ats_kind: activeSession.ats_kind,
          started_at: activeSession.started_at
        },
        recheck_evidence: recheckEvidence
      }
    });
    
    // Update overlay content with new guidance (NO visibility control)
    if (guidance) {
      updateOverlayContent(guidance);
    }
    
    // Handle autofill if action is continue
    if (actionResult.action === 'continue') {
      const userProfile = await APIClient.getUserProfile(1);
      if (userProfile && userProfile.profile) {
        await attemptAutofill(userProfile.profile, userProfile.user);
      }
    }
    
    console.log('[Recheck] Detection pipeline complete:', {
      task_id: activeSession.task_id,
      ats: atsResult.ats_kind,
      stage: stageResult.stage,
      action: actionResult.action,
      page_type: pageType,
      intent: intentResult?.intent
    });
    
  } catch (error) {
    console.error('[Recheck] Detection failed:', error);
    
    // Show error in overlay (don't remove it)
    updateOverlayContent({
      title: 'Recheck Failed',
      what_happening: 'Could not analyze this page',
      user_action: 'You can continue manually or cancel the task',
      what_next: 'I will retry on next page change',
      task_id: activeSession.task_id,
      job_id: activeSession.job_id,
      intent: 'error'
    });
  }
}

/**
 * Show temporary "rechecking" overlay
 */
// Legacy showRecheckingOverlay function removed - now using updateOverlayContent

/**
 * Classify the current page type
 * @returns {string} Page type classification
 */
function classifyPageType() {
  const url = window.location.href.toLowerCase();
  const bodyText = document.body?.textContent.toLowerCase() || '';
  
  // Check for submission confirmation
  if (bodyText.includes('application submitted') ||
      bodyText.includes('thank you for applying') ||
      bodyText.includes('we received your application')) {
    return 'submission_confirmation_page';
  }
  
  // Check for authentication page
  const hasPasswordInput = document.querySelector('input[type="password"]') !== null;
  const hasLoginButton = findButtonsForClassification(['sign in', 'log in', 'login']).length > 0;
  
  if (hasPasswordInput && hasLoginButton) {
    return 'authentication_page';
  }
  
  // Check for application form
  const hasFormInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea').length >= 3;
  const hasSubmitButton = findButtonsForClassification(['submit', 'submit application', 'apply']).length > 0;
  
  if (hasFormInputs && hasSubmitButton) {
    return 'application_form_page';
  }
  
  // Check for ATS landing page
  const isAtsUrl = url.includes('greenhouse.io') || 
                   url.includes('lever.co') || 
                   url.includes('myworkdayjobs.com') ||
                   url.includes('icims.com');
  
  const hasApplyButton = findButtonsForClassification([
    'apply', 'apply now', 'easy apply', 'apply for this job'
  ]).length > 0;
  
  if (isAtsUrl && hasApplyButton) {
    return 'ats_landing_page';
  }
  
  // Check for job detail page
  const hasJobTitle = document.querySelector('h1, h2, .job-title, [class*="job-title"]') !== null;
  const hasJobDescription = bodyText.length > 500;
  
  if (hasJobTitle && hasJobDescription && hasApplyButton) {
    return 'job_detail_page';
  }
  
  return 'unknown_page';
}

/**
 * Helper function to find buttons for page classification
 * @param {string[]} textPatterns - Text patterns to search for
 * @returns {Element[]} Array of matching button elements
 */
function findButtonsForClassification(textPatterns) {
  const buttons = [];
  const elements = document.querySelectorAll(
    'button, a[role="button"], input[type="submit"], input[type="button"], [role="link"]'
  );
  
  for (const el of elements) {
    const text = (el.textContent || el.value || '').toLowerCase().trim();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const combinedText = `${text} ${ariaLabel}`;
    
    for (const pattern of textPatterns) {
      if (combinedText.includes(pattern)) {
        buttons.push(el);
        break;
      }
    }
  }
  
  return buttons;
}

/**
 * Initialize page lifecycle observers
 */
function initializePageLifecycle() {
  console.log('[Page Lifecycle] Initializing observers...');
  
  // 1. Visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[Page Lifecycle] Tab became visible');
      triggerRecheck('visibility_change');
    }
  });
  
  // 2. History API hooks for SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    console.log('[Page Lifecycle] pushState detected');
    triggerRecheck('url_changed');
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    console.log('[Page Lifecycle] replaceState detected');
    triggerRecheck('url_changed');
  };
  
  window.addEventListener('popstate', () => {
    console.log('[Page Lifecycle] popstate detected');
    triggerRecheck('url_changed');
  });
  
  // 3. Page load (if we're loaded dynamically)
  if (document.readyState === 'complete') {
    console.log('[Page Lifecycle] Page already loaded');
  }
  
  console.log('[Page Lifecycle] All observers initialized');
}

/**
 * Resume monitoring
 */
let resumeMonitor = null;
let resumeCheckTimeout = null;

/**
 * Start monitoring for resume conditions
 */
function startResumeMonitoring() {
  console.log('[Resume Monitor] Starting...');
  
  // Monitor DOM mutations
  const observer = new MutationObserver(handlePageChange);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Monitor URL changes (for SPAs)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('[Resume Monitor] URL changed');
      handlePageChange();
    }
  }, 1000);
  
  resumeMonitor = observer;
}

/**
 * Handle page change and check if can resume
 */
function handlePageChange() {
  // Debounce: only check after 1 second of no changes
  if (resumeCheckTimeout) {
    clearTimeout(resumeCheckTimeout);
  }
  
  resumeCheckTimeout = setTimeout(async () => {
    console.log('[Page Lifecycle] DOM changed significantly');
    
    // Get current state
    const { detectionState } = await chrome.storage.local.get(['detectionState']);
    
    // If paused, check for resume (existing behavior)
    if (detectionState && detectionState.action && detectionState.action.action === 'pause_needs_user') {
      await checkResumeCondition(detectionState);
    } else {
      // Otherwise, just recheck to update guidance
      triggerRecheck('dom_changed');
    }
  }, 1000);
}

/**
 * Check if resume condition is met
 */
async function checkResumeCondition(previousState) {
  // Re-run detection using the new pipeline
  await executeRecheck('resume_check');
  
  // Get updated state
  const { detectionState } = await chrome.storage.local.get(['detectionState']);
  
  // Check if we can resume
  if (detectionState && 
      detectionState.action.action === 'continue' &&
      previousState.action.action === 'pause_needs_user') {
    
    console.log('[Resume Monitor] ✓ Resume condition met!');
    
    // Notify background of resume
    chrome.runtime.sendMessage({
      type: 'FW_TASK_RESUMED',
      previous_intent: previousState.intent?.intent,
      new_stage: detectionState.stage.stage,
      evidence: {
        what_changed: 'User completed required action',
        previous_stage: previousState.stage.stage,
        new_stage: detectionState.stage.stage,
        can_continue: true
      }
    }).catch(err => {
      console.error('[Resume Monitor] Failed to notify background:', err);
    });
  }
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
  
  if (message.type === 'FW_SESSION_CLOSED') {
    console.log('[Content] Received session closed notification');
    
    // Reload session and remove overlay if closed
    getActiveSession().then(session => {
      removeOverlayIfSessionClosed(session);
      sendResponse({ success: true });
    }).catch(error => {
      console.error('[Content] Failed to handle session close:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Async response
  }
  
  return false;
});
