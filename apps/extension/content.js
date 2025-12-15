/**
 * Content script for page inspection and autofill.
 * Runs on job application pages with ATS detection and state machine.
 */

// ============================================================
// INJECTION MARKER - First executable code (must not throw)
// ============================================================
const FW_EXT_VERSION = (() => {
  try {
    return chrome?.runtime?.getManifest?.().version || 'unknown';
  } catch (_) {
    return 'unknown';
  }
})();

(() => {
  const ts = Date.now();
  const tsISO = new Date(ts).toISOString();
  const href = window.location.href;
  const host = window.location.hostname;
  const readyState = document.readyState;

  // 1. Console log with domain info
  console.log('[FW Injected] domain=', host, 'href=', href, 'ts=', ts);

  // 2. Global marker for verification
  window.__FW_CONTENT_LOADED__ = {
    href: href,
    host: host,
    ts: ts,
    tsISO: tsISO,
    version: FW_EXT_VERSION,
    readyState: readyState
  };

  // 3. Notify background script that content script loaded
  try {
    chrome.runtime.sendMessage({
      type: 'FW_CONTENT_HELLO',
      host: host,
      href: href,
      ts: ts,
      version: FW_EXT_VERSION
    }).catch(() => {
      // Background may not be ready yet, ignore
    });
  } catch (_) {
    // Ignore errors during injection phase
  }
})();

// ============================================================
// ERROR FILTERING - Only log errors from our extension
// ============================================================
(() => {
  let ourExtensionId = '';
  try {
    ourExtensionId = chrome.runtime.id || '';
  } catch (_) {}

  // Check if error is from our extension
  function isOurExtensionError(stack) {
    if (!stack || !ourExtensionId) return false;
    return stack.includes(`chrome-extension://${ourExtensionId}/`);
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    if (event.error && event.error.stack && isOurExtensionError(event.error.stack)) {
      console.error('[FW ERROR] Uncaught error:', event.error.message, event.error.stack);
    }
    // Don't log errors from other extensions (e.g., Simplify)
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const stack = reason?.stack || '';
    if (isOurExtensionError(stack)) {
      console.error('[FW ERROR] Unhandled rejection:', reason?.message || reason, stack);
    }
    // Don't log rejections from other extensions
  });
})();

// ============================================================
// Phase A: Auth event listener removed - using cookie auth only
/*
// Phase 5.3.2: Auth Event Listener - Web Control Plane Bridge
// ============================================================
/**
 * Listen for auth events from Web Control Plane.
 * Enables secure, cross-user-safe authentication sync.
 */
/*
window.addEventListener('message', async (event) => {
  // Security: Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }
  
  const message = event.data;
  
  // Phase 5.3.2: Auth bootstrap (login/account switch)
  if (message.type === 'FW_AUTH_BOOTSTRAP') {
    console.log('[FW Auth Content] Received auth bootstrap from Web Control Plane', {
      user_id: message.user_id,
      mode: message.mode
    });
    
    // Always clear existing auth first (mode: replace ensures no cross-user contamination)
    await window.authStorage.clearAuthToken('bootstrap_replace');
    
    // Store new auth
    await window.authStorage.storeAuthToken({
      token: message.token,
      user_id: message.user_id,
      expires_at: message.expires_at
    });
    
    console.log('[FW Auth Content] Auth bootstrap complete, notifying background');
    
    // Phase 5.3.2: Forward to background for logging and confirmation
    try {
      chrome.runtime.sendMessage({
        type: 'FW_AUTH_BOOTSTRAP_COMPLETE',
        user_id: message.user_id,
        expires_at: message.expires_at
      });
    } catch (err) {
      console.warn('[FW Auth Content] Failed to notify background:', err);
    }
  }
  
  // Phase 5.3.2: Auth clear (logout)
  if (message.type === 'FW_AUTH_CLEAR') {
    console.log('[FW Auth Content] Received auth clear from Web Control Plane', {
      reason: message.reason
    });
    
    await window.authStorage.clearAuthToken(`web_${message.reason}`);
    console.log('[FW Auth Content] Auth cleared, notifying background');
    
    // Phase 5.3.2: Forward to background
    try {
      chrome.runtime.sendMessage({
        type: 'FW_AUTH_CLEAR_COMPLETE',
        reason: message.reason
      });
    } catch (err) {
      console.warn('[FW Auth Content] Failed to notify background:', err);
    }
  }
});
*/

/**
 * Ensure FW debug state exists globally
 * MUST be called before any access to _FW_DEBUG_STATE__
 * @returns {object} Debug state object
 */
function ensureFWDebugState() {
  if (!window._FW_DEBUG_STATE__) {
    let version = 'unknown';
    try {
      version = chrome?.runtime?.getManifest?.().version || 'unknown';
    } catch (_) {
      // ignore
    }
    window._FW_DEBUG_STATE__ = {
      recheckCount: 0,
      lastRecheckReason: null,
      initializedAt: Date.now(),
      version,
      lastUrlSeen: window.location.href,
      lastPageType: null,
      lastDedupSignature: null,
      detectionCounter: 0,
      lastDetectionId: null,
      lastDetectionStage: null,
      lastDetectionAtsKind: null,
      overlay: {
        ensureOverlayLogged: false,
        state: 'none',
        createdAt: null,
        updatedAt: null,
        removedAt: null,
        lastUpdate: null
      }
    };
    console.log('[FW Debug State] Initialized:', window._FW_DEBUG_STATE__);
  }
  return window._FW_DEBUG_STATE__;
}

// State variables
let currentTask = null;
let activeSession = null;
let currentAuthContext = null; // Phase 5.3.4.1: Store authContext for observability calls
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
let fwOverlayEnsureLoggedThisPage = false;

/**
 * Safe URL parser (NEVER throws).
 * Handles: null, undefined, "", "www.example.com", "/path", and garbage strings.
 * Strategy: auto-add https:// if no protocol; fallback to window.location.href on failure.
 * @param {string|null|undefined} input
 * @param {string} [fallback]
 * @returns {URL|{href:string,searchParams:URLSearchParams,toString:Function,hostname:string,pathname:string,origin:string}}
 */
function safeParseURL(input, fallback) {
  // Get a safe fallback (never throw here)
  let safeFallback;
  try {
    safeFallback = (typeof fallback === 'string' && fallback) ? fallback : window.location.href;
  } catch (_) {
    safeFallback = 'about:blank';
  }

  // Handle null, undefined, empty string
  if (input === null || input === undefined || input === '') {
    console.warn('[FW URL] Invalid URL encountered', { input, fallback_used: safeFallback });
    return safeParseURLInternal(safeFallback, safeFallback);
  }

  // Coerce to string
  let str;
  try {
    str = String(input).trim();
  } catch (_) {
    console.warn('[FW URL] Invalid URL encountered', { input, fallback_used: safeFallback });
    return safeParseURLInternal(safeFallback, safeFallback);
  }

  if (!str) {
    console.warn('[FW URL] Invalid URL encountered', { input, fallback_used: safeFallback });
    return safeParseURLInternal(safeFallback, safeFallback);
  }

  // Try parsing as-is first
  try {
    return new URL(str);
  } catch (_) {
    // continue to normalization
  }

  // Relative path starting with /
  if (str.startsWith('/')) {
    try {
      const origin = new URL(safeFallback).origin;
      return new URL(str, origin);
    } catch (_) {
      // continue
    }
  }

  // Missing protocol (e.g. "www.linkedin.com" or "linkedin.com/jobs")
  if (!str.includes('://')) {
    try {
      return new URL('https://' + str);
    } catch (_) {
      // continue
    }
  }

  // All attempts failed
  console.warn('[FW URL] Invalid URL encountered', { input, fallback_used: safeFallback });
  return safeParseURLInternal(safeFallback, safeFallback);
}

/**
 * Internal helper: parse URL or return mock object (NEVER throws).
 */
function safeParseURLInternal(urlString, fallbackHref) {
  try {
    return new URL(urlString);
  } catch (_) {
    // Return a minimal URL-like object that won't crash callers
    const href = typeof fallbackHref === 'string' ? fallbackHref : 'about:blank';
    return {
      href: href,
      searchParams: new URLSearchParams(),
      toString: () => href,
      hostname: '',
      pathname: '/',
      origin: '',
      protocol: '',
      search: '',
      hash: ''
    };
  }
}

function isFWDebugUIEnabled() {
  // Must never throw during init/recheck; avoid URL parsing here entirely.
  try {
    if (typeof location !== 'undefined' && typeof location.search === 'string') {
      if (location.search.includes('fw_debug=1')) return true;
    }
  } catch (_) {}
  try {
    return window.__FW_DEBUG_UI_ENABLED__ === true;
  } catch (_) {
    return false;
  }
}

function getFWDebugSnapshot() {
  const debugState = ensureFWDebugState();
  const marker = window.__FW_CONTENT_LOADED__ || null;
  return {
    injected: Boolean(marker),
    injected_marker: marker,
    injected_host: marker?.host ?? null,
    injected_ts: marker?.ts ?? null,
    session_active: Boolean(activeSession && activeSession.active),
    task_id: activeSession?.task_id ?? null,
    job_id: activeSession?.job_id ?? null,
    last_recheck_reason: debugState.lastRecheckReason,
    recheck_count: debugState.recheckCount,
    last_detection_id: debugState.lastDetectionId,
    url: window.location.href,
    overlay_state: debugState.overlay.state
  };
}

async function updateOverlayDebugPanel() {
  if (!fwOverlayInstance) return;
  const debugState = ensureFWDebugState();
  const panel = fwOverlayInstance.querySelector('.fw-debug-panel');
  if (!panel) return;

  const snap = getFWDebugSnapshot();
  const { detectionState } = await chrome.storage.local.get(['detectionState']);
  
  panel.textContent =
    `Page Intent: ${detectionState?.pageIntent?.intent || 'unknown'}\n` +
    `ATS: ${detectionState?.ats?.ats_kind || 'unknown'}\n` +
    `Stage: ${detectionState?.stage?.stage || 'unknown'}\n` +
    `Session: ${snap.session_active ? 'active' : 'inactive'}\n` +
    `Task ID: ${snap.task_id}\n` +
    `Step: ${detectionState?.guidance?.step?.current || '?'} of ${detectionState?.guidance?.step?.total || '?'}\n` +
    `Injected: ${snap.injected ? 'yes' : 'no'} (${snap.injected_host})\n` +
    `Recheck Count: ${snap.recheck_count}\n` +
    `Detection ID: ${snap.last_detection_id}\n` +
    `URL: ${snap.url}\n`;
}

/**
 * Ensure overlay exists for active session
 * Creates overlay if it doesn't exist
 * @param {object} session - Active apply session
 */
function ensureOverlay(session) {
  const debugState = ensureFWDebugState();
  if (!fwOverlayEnsureLoggedThisPage) {
    console.log('[FW Overlay] ensureOverlay called');
    fwOverlayEnsureLoggedThisPage = true;
  }

  // Hard invariant: if session is active, overlay must exist.
  if (session && session.active === true) {
    console.log('[FW Invariant] Session active → overlay must exist');
  }

  if (!fwOverlayInstance) {
    console.log('[FW Overlay] Created', { url: window.location.href, task_id: session?.task_id ?? null });
    fwOverlayInstance = createOverlayElement(session);
    if (document.body) {
      document.body.appendChild(fwOverlayInstance);
    } else {
      // Extremely early execution; retry once DOM is ready.
      document.addEventListener('DOMContentLoaded', () => {
        try {
          if (fwOverlayInstance && document.body && !document.getElementById('fw-needs-user-overlay')) {
            document.body.appendChild(fwOverlayInstance);
          }
        } catch (_) {}
      }, { once: true });
    }
    debugState.overlay.state = 'created';
    debugState.overlay.createdAt = new Date().toISOString();
    updateOverlayDebugPanel();
  } else {
    console.log('[FW Overlay] Reused existing overlay');
    debugState.overlay.state = 'reused';
    updateOverlayDebugPanel();
  }
}

function enforceOverlayInvariant(session) {
  if (!session || session.active !== true) return;
  console.log('[FW Invariant] Session active → overlay must exist');
  const existing = document.getElementById('fw-needs-user-overlay');
  if (!existing || !fwOverlayInstance) {
    console.warn('[FW Invariant] Overlay missing - recreating immediately');
    fwOverlayInstance = null;
    ensureOverlay(session);
  }
}

function fatalManualFallback(where, error) {
  console.error('[FW Fatal] Detection error, falling back to manual guidance', { where, error: error?.message || String(error) });
  try {
    if (activeSession && activeSession.active) {
      enforceOverlayInvariant(activeSession);
    }
  } catch (_) {}

  // Do NOT change existing guidance templates/copy; this is explicit crash fallback text only.
  try {
    updateOverlayContent({
      title: 'Manual Action Required',
      what_happening: 'Continue the application on this page. I’m still tracking this task.',
      user_action: 'Continue the application on this page. I’m still tracking this task.',
      what_next: 'Continue the application on this page. I’m still tracking this task.',
      intent: 'unknown_manual',
      task_id: activeSession?.task_id ?? 'unknown',
      job_id: activeSession?.job_id ?? 'unknown'
    });
  } catch (_) {}
}

/**
 * Update overlay content based on detection results
 * Does NOT control visibility - only updates content
 * @param {object} guidance - Guidance object from detection
 * @param {object} meta - Optional metadata { stage, ats_kind }
 */
function updateOverlayContent(guidance, meta = {}) {
  if (!fwOverlayInstance) {
    console.warn('[Overlay] Cannot update - overlay does not exist');
    return;
  }

  const debugState = ensureFWDebugState();
  const stage = meta.stage ?? debugState.lastDetectionStage;
  const atsKind = meta.ats_kind ?? debugState.lastDetectionAtsKind ?? guidance.ats_kind;
  console.log('[FW Overlay] Updated content', {
    intent: guidance.intent,
    step: guidance.step,
    stage,
    ats_kind: atsKind
  });
  debugState.overlay.state = 'updated';
  debugState.overlay.updatedAt = new Date().toISOString();
  debugState.overlay.lastUpdate = { intent: guidance.intent, stage, ats_kind: atsKind };
  
  // Update overlay DOM with new guidance
  const titleEl = fwOverlayInstance.querySelector('.fw-overlay-title');
  const progressEl = fwOverlayInstance.querySelector('.fw-overlay-progress');
  const instructionEl = fwOverlayInstance.querySelector('.fw-overlay-instruction');
  const reassuranceEl = fwOverlayInstance.querySelector('.fw-overlay-reassurance');
  const whatNextEl = fwOverlayInstance.querySelector('.fw-overlay-what-next');
  const taskIdEl = fwOverlayInstance.querySelector('.fw-overlay-task-id');
  const jobIdEl = fwOverlayInstance.querySelector('.fw-overlay-job-id');
  
  // Handle both new intent-based guidance and legacy guidance
  if (titleEl) titleEl.textContent = guidance.title;
  if (progressEl && guidance.progress_text) progressEl.textContent = guidance.progress_text;
  if (instructionEl) instructionEl.textContent = guidance.instruction || guidance.user_action;
  if (reassuranceEl) reassuranceEl.textContent = guidance.reassurance || guidance.what_happening;
  if (whatNextEl) whatNextEl.textContent = guidance.what_next;
  if (taskIdEl) taskIdEl.textContent = guidance.task_id;
  if (jobIdEl) jobIdEl.textContent = guidance.job_id;

  updateOverlayDebugPanel();
}

/**
 * Remove overlay ONLY if session is closed
 * @param {object} session - Session object (may be inactive)
 */
function removeOverlayIfSessionClosed(session) {
  const debugState = ensureFWDebugState();
  if (!session || !session.active) {
    if (fwOverlayInstance) {
      console.log('[FW Overlay] Removed (reason: session_closed)');
      debugState.overlay.state = 'removed';
      debugState.overlay.removedAt = new Date().toISOString();
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
    width: 380px;
    background: white;
    border: 2px solid #ff9800;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
  `;
  
  overlay.innerHTML = `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        FuckWork Apply Assistant
      </div>
      <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
        <span class="fw-overlay-title">Loading...</span>
      </div>
      <div style="font-size: 12px; color: #999;">
        <span class="fw-overlay-progress">Preparing...</span>
      </div>
    </div>
    
    <div style="margin-bottom: 16px; padding: 12px; background: #fff3e0; border-radius: 6px; border-left: 3px solid #ff9800;">
      <div style="font-size: 14px; color: #1a1a1a; margin-bottom: 12px; line-height: 1.4;">
        <span class="fw-overlay-instruction">Analyzing page...</span>
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 8px; line-height: 1.4;">
        <span class="fw-overlay-reassurance">Please wait...</span>
      </div>
      <div style="font-size: 12px; color: #555; font-style: italic; line-height: 1.4;">
        <strong>What's next:</strong> <span class="fw-overlay-what-next">Detection in progress...</span>
      </div>
    </div>
    
    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
      <button class="fw-overlay-copy-debug" style="
        flex: 1;
        padding: 8px;
        background: #e0e0e0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: #333;
        font-weight: 500;
      ">
        📋 Copy Debug
      </button>
    </div>
    
    <div style="font-size: 11px; color: #999; text-align: center;">
      Task #<span class="fw-overlay-task-id">${session.task_id}</span> | 
      Job <span class="fw-overlay-job-id">${session.job_id}</span>
    </div>
    
    <div class="fw-automation-controls" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">
      <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
        This Session:
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="fw-session-toggle" data-pref="auto_fill_enabled_this_session" style="
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 11px;
          cursor: pointer;
        ">
          <span class="toggle-icon">◻</span> Auto-fill
        </button>
        <button class="fw-session-toggle" data-pref="auto_submit_enabled_this_session" style="
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 11px;
          cursor: pointer;
        ">
          <span class="toggle-icon">◻</span> Auto-submit
        </button>
      </div>
      <div style="font-size: 10px; color: #999; margin-top: 4px; text-align: center;">
        Session overrides active until application completes
      </div>
    </div>
    
    ${isFWDebugUIEnabled() ? `
      <div style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px;">
        <button class="fw-debug-toggle" style="
          width: 100%;
          padding: 6px;
          background: #f5f5f5;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          color: #555;
          text-align: left;
        ">FW Debug ▸</button>
        <pre class="fw-debug-panel" style="
          display: none;
          margin: 8px 0 0 0;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 4px;
          font-size: 10px;
          color: #333;
          overflow-x: auto;
          white-space: pre-wrap;
          max-height: 200px;
        "></pre>
      </div>
    ` : ''}
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

  if (isFWDebugUIEnabled()) {
    const toggle = overlay.querySelector('.fw-debug-toggle');
    const panel = overlay.querySelector('.fw-debug-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        const isOpen = panel.style.display === 'block';
        panel.style.display = isOpen ? 'none' : 'block';
        toggle.textContent = isOpen ? 'FW Debug ▸' : 'FW Debug ▾';
        updateOverlayDebugPanel();
      });
    }
  }
  
  // Add automation control handlers
  attachAutomationControlHandlers(overlay, session);
  
  // Initial display update
  updateAutomationControlDisplay();
  
  return overlay;
}

/**
 * Attach event handlers to automation toggle buttons
 * @param {HTMLElement} overlay - Overlay element
 * @param {object} session - Active session
 */
function attachAutomationControlHandlers(overlay, session) {
  const toggleButtons = overlay.querySelectorAll('.fw-session-toggle');
  
  for (const btn of toggleButtons) {
    btn.addEventListener('click', async () => {
      const prefKey = btn.getAttribute('data-pref');
      const baseKey = prefKey.replace('_this_session', '');
      const currentValue = await prefManager.getEffectivePreference(baseKey);
      
      console.log('[Automation] Toggling', prefKey, 'from', currentValue, 'to', !currentValue);
      
      // Toggle session override
      await prefManager.setSessionOverride(
        session.task_id,
        prefKey,
        !currentValue
      );
      
      updateAutomationControlDisplay();
    });
  }
}

/**
 * Update automation control button display
 */
async function updateAutomationControlDisplay() {
  if (!fwOverlayInstance) return;
  
  try {
    const autoFillEnabled = await prefManager.getEffectivePreference('auto_fill_after_login');
    const autoSubmitEnabled = await prefManager.getEffectivePreference('auto_submit_when_ready');
    
    // Update button states
    const buttons = fwOverlayInstance.querySelectorAll('.fw-session-toggle');
    for (const btn of buttons) {
      const pref = btn.getAttribute('data-pref');
      const enabled = pref.includes('auto_fill') ? autoFillEnabled : autoSubmitEnabled;
      
      const icon = btn.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = enabled ? '☑' : '◻';
      }
      btn.style.background = enabled ? '#e8f5e9' : 'white';
      btn.style.borderColor = enabled ? '#4caf50' : '#ddd';
    }
  } catch (error) {
    console.error('[Automation] Failed to update control display:', error);
  }
}

/**
 * Validate URL match (loose matching for session bridge)
 * Phase 5.3.1: Same origin + path, ignore query params, allow trailing slashes
 * @param {string} currentUrl - Current page URL
 * @param {string} sessionUrl - Session job URL from backend
 * @returns {boolean} True if URLs match
 */
function validateUrlMatch(currentUrl, sessionUrl) {
  try {
    const current = safeParseURL(currentUrl);
    const session = safeParseURL(sessionUrl);
    
    if (!current || !session) {
      return false;
    }
    
    // Same origin
    if (current.origin !== session.origin) {
      return false;
    }
    
    // Same pathname (normalize trailing slashes)
    const currentPath = current.pathname.replace(/\/$/, '');
    const sessionPath = session.pathname.replace(/\/$/, '');
    
    return currentPath === sessionPath;
  } catch (e) {
    console.error('[FW Session] URL validation error:', e);
    return false;
  }
}

// Phase A: Tab session functions removed - using cookie auth only
/*
/**
 * Phase 5.3.5: Check if current tab has an active session registered by background
 * @returns {Promise<Object>} { has_session, run_id?, task_id?, job_url? }
 */
/*
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
/*
async function registerCurrentTab(sessionData) {
  try {
    console.log('[FW Session] Sending FW_REGISTER_TAB_SESSION', {
      run_id: sessionData.run_id,
      task_id: sessionData.task_id,
      job_url: sessionData.job_url,
      user_id: sessionData.user_id
    });
    
    await chrome.runtime.sendMessage({
      type: 'FW_REGISTER_TAB_SESSION',
      run_id: sessionData.run_id,
      task_id: sessionData.task_id,
      job_url: sessionData.job_url,
      user_id: sessionData.user_id
    });
    
    // Phase 5.3.5: Debug - registration success
    console.log('[FW Session] Tab registration ACK received', {
      run_id: sessionData.run_id,
      task_id: sessionData.task_id,
      note: 'Background should have stored this tab session'
    });
    
    console.log('[FW Session] Tab registered with background', {
      run_id: sessionData.run_id,
      task_id: sessionData.task_id
    });
  } catch (error) {
    // Phase 5.3.5: Debug - registration failure
    console.error('[FW Session] Tab registration FAILED', {
      error_message: error.message,
      error_name: error.name,
      run_id: sessionData.run_id,
      task_id: sessionData.task_id,
      critical: true,
      impact: 'Tab ownership NOT established in background'
    });
    console.warn('[FW Session] Failed to register tab:', error);
  }
}
*/

/**
 * Get active session from backend (Phase 5.3.1 - Session Bridge)
 * This overrides the function from apply_session.js to fetch from backend API.
 * @returns {Promise<Object>} Session object with { active, task_id, run_id, job_url, ats_type }
 */
async function getActiveSession(authContext) {
  try {
    // Phase 5.3.5: Check if this tab has a registered session
    const tabSession = await getTabSession();
    
    console.group('[FW Session][Tab Check]');
    console.log('Tab has registered session:', tabSession.has_session);
    if (tabSession.has_session) {
      console.log('Tab-owned run_id:', tabSession.run_id);
      console.log('Tab-owned task_id:', tabSession.task_id);
    }
    console.groupEnd();
    
    // Phase 5.3.4: Log token passing to API
    console.group('[FW Content][API Call Prep]');
    console.log('Passing token explicitly to API');
    console.log('token exists:', !!authContext.token);
    console.log('fingerprint:', authContext.fingerprint);
    console.groupEnd();
    
    // Fetch active session from backend
    console.log('[FW Session] Fetching active session from backend...');
    const sess = await APIClient.getMyActiveSession(authContext.token);
    
    console.log('[FW Session] Active session fetch result:', {
      active: sess.active,
      has_run_id: !!sess.run_id,
      has_task_id: !!sess.task_id
    });
    
    if (!sess.active) {
      // Phase 5.3.5: Debug - decision path
      console.log('[FW Session][Decision] return active=false', {
        reason: 'backend_session_not_active',
        sess_active: sess.active,
        sess: sess
      });
      console.log('[FW Session] No active apply session (backend)');
      return { active: false };
    }
    
    // Phase 5.3.5: Register tab ownership as soon as backend confirms active session
    // This must happen BEFORE URL match check, so third-party pages stay registered
    if (!tabSession.has_session) {
      console.log('[FW Session] Tab not yet registered, registering now', {
        current_url: window.location.href,
        run_id: sess.run_id,
        task_id: sess.task_id,
        reason: 'backend_session_active'
      });
      
      await registerCurrentTab({
        run_id: sess.run_id,
        task_id: sess.task_id,
        job_url: sess.job_url,
        user_id: authContext.user_id
      });
      
      // Update local tabSession reference so subsequent checks see it as registered
      tabSession = {
        has_session: true,
        run_id: sess.run_id,
        task_id: sess.task_id,
        job_url: sess.job_url
      };
    } else {
      console.log('[FW Session] Tab already registered, skipping re-registration', {
        existing_run_id: tabSession.run_id,
        backend_run_id: sess.run_id
      });
    }
    
    // Phase 5.3.5: If tab has registered session matching backend session, proceed
    console.log('[FW Session] Tab ownership check', {
      tabSession_has_session: tabSession.has_session,
      tabSession_run_id: tabSession.run_id,
      backend_run_id: sess.run_id,
      match: tabSession.run_id === sess.run_id
    });
    
    if (tabSession.has_session && tabSession.run_id === sess.run_id) {
      console.log('[FW Session] Proceeding due to tab-owned run (URL match not required)');
      
      // Store in chrome.storage.local for compatibility
      await chrome.storage.local.set({
        fw_active_session: {
          ...sess,
          detected_at: Date.now(),
          tab_owned: true
        }
      });
      
      console.log('[FW Session] active_session_attached:', {
        task_id: sess.task_id,
        run_id: sess.run_id,
        ats_type: sess.ats_type,
        tab_owned: true
      });
      
      // Phase 5.3.5: Debug - decision path
      console.log('[FW Session][Decision] return active=true (tab_owned)', {
        reason: 'tab_owned_run_match',
        tabSession_run_id: tabSession.run_id,
        backend_run_id: sess.run_id,
        url_check_skipped: true,
        current_url: window.location.href
      });
      
      return {
        active: true,
        task_id: sess.task_id,
        run_id: sess.run_id,
        job_id: sess.job_id || `run_${sess.run_id}`,
        job_url: sess.job_url,
        ats_type: sess.ats_type,
        initial_url: sess.job_url,
        current_url: window.location.href,
        recheck_count: 0,
        tab_owned: true
      };
    }
    
    // Phase 5.3.5: Fall back to URL matching (backward compatibility)
    const currentUrl = window.location.href;
    const sessionUrl = sess.job_url;
    const urlMatch = validateUrlMatch(currentUrl, sessionUrl);
    
    console.log('[FW Session] active_session_url_match:', urlMatch, {
      current: currentUrl,
      expected: sessionUrl,
      tab_owned: false
    });
    
    if (!urlMatch) {
      // Phase 5.3.5: Debug - decision path
      console.log('[FW Session][Decision] return active=false', {
        reason: 'url_mismatch_and_no_tab_ownership',
        current_url: window.location.href,
        expected_url: sess.job_url,
        tabSession_has_session: tabSession.has_session,
        tabSession_run_id: tabSession.run_id
      });
      console.warn('[FW Session] URL mismatch and no tab ownership - not initializing');
      return { active: false };
    }
    
    // Phase 5.3.5: Tab already registered earlier (after backend session confirmed)
    // No need to register again here
    
    // Store in chrome.storage.local for compatibility
    await chrome.storage.local.set({
      fw_active_session: {
        ...sess,
        detected_at: Date.now(),
        tab_owned: false
      }
    });
    
    console.log('[FW Session] active_session_attached:', {
      task_id: sess.task_id,
      run_id: sess.run_id,
      ats_type: sess.ats_type,
      tab_owned: false
    });
    
    // Phase 5.3.5: Debug - decision path
    console.log('[FW Session][Decision] return active=true (url_match)', {
      reason: 'url_match_success',
      current_url: currentUrl,
      matched_url: sess.job_url,
      tab_owned: false
    });
    
    // Return session in expected format
    return {
      active: true,
      task_id: sess.task_id,
      run_id: sess.run_id,
      job_id: sess.job_id || `run_${sess.run_id}`,
      job_url: sess.job_url,
      ats_type: sess.ats_type,
      initial_url: sess.job_url,
      current_url: currentUrl,
      recheck_count: 0,
      tab_owned: false
    };
    
  } catch (error) {
    // Phase 5.3.5: Debug - decision path
    console.log('[FW Session][Decision] return active=false', {
      reason: 'exception_caught',
      error_message: error.message,
      error_stack: error.stack
    });
    console.error('[FW Session] Failed to fetch active session:', error);
    return { active: false };
  }
}

/**
 * Phase 5.3.2: Verify auth token with backend before proceeding (self-healing)
 * @returns {Promise<Object|null>} {user_id, email} or null if invalid
 */
// ============================================================
// Phase A: Cookie-Based Auth (Simple Backend Check)
// ============================================================

/**
 * Check if user is authenticated via backend session cookies.
 * Extension stores nothing - backend is the single source of truth.
 * 
 * @returns {Promise<boolean>} true if authenticated, false otherwise
 */
async function requireAuth() {
  console.log('[FW Auth] Checking authentication status');
  
  try {
    const result = await chrome.runtime.sendMessage({
      type: 'FW_CHECK_AUTH'
    });

    console.log('[FW Auth] Auth check result:', {
      authenticated: result?.authenticated,
      user_id: result?.user?.user_id,
      email: result?.user?.email
    });
    
    return result?.authenticated === true;
  } catch (error) {
    console.error('[FW Auth] Auth check failed:', error);
    return false;
  }
}

// Phase A: Token auth removed - using cookie auth only
/*
async function verifyAuthToken() {
  try {
    // Phase 5.3.3: Token read logging
    console.group('[FW Content][Auth Check]');
    console.log('Reading token from chrome.storage.local');
    
    // Load token from storage
    const auth = await window.authStorage.loadAuthToken();
    
    console.log('Result:', auth ? { user_id: auth.user_id, fingerprint: auth.fingerprint, expires_at: auth.expires_at } : null);
    console.log('token exists:', !!auth?.token);
    console.log('expires_at:', auth?.expires_at);
    console.groupEnd();
    
    if (!auth || !auth.token) {
      console.log('[FW Auth] No token found in storage');
      return null;
    }
    
    // Check expiration
    if (await window.authStorage.isTokenExpired()) {
      console.log('[FW Auth] Token expired, clearing');
      await window.authStorage.clearAuthToken('expired');
      return null;
    }
    
    // Phase 5.3.3: Backend verify request logging
    console.group('[FW Content → Backend][Verify Auth]');
    console.log('Verifying token with backend');
    console.log('href:', location.href);
    console.log('user_id from token:', auth.user_id);
    console.log('fingerprint:', auth.fingerprint);
    console.log('API call: GET /api/auth/me');
    console.groupEnd();
    
    // Phase 5.3.4.1: Defensive check before API call
    console.log('[FW Content] Passing token to API', {
      hasToken: !!auth?.token,
      tokenType: typeof auth?.token,
      tokenLength: auth?.token?.length
    });
    
    const headers = APIClient.getAuthHeaders(auth.token);
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
    
    // Phase 5.3.3: Backend response logging
    console.group('[FW Content][Backend Response]');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.groupEnd();
    
    if (!response.ok) {
      if (response.status === 401) {
        console.group('[FW Content][Auth Failed]');
        console.warn('Backend auth failed (401) -> clearing token');
        console.log('user_id was:', auth.user_id);
        console.log('fingerprint was:', auth.fingerprint);
        console.groupEnd();
        
        await window.authStorage.clearAuthToken('backend_401');
        return null;
      }
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const userData = await response.json();
    
    // Verify user_id matches (critical for cross-user safety)
    if (userData.user_id !== auth.user_id) {
      console.error('[FW Auth] User mismatch (token user != backend user) -> clearing token', {
        token_user: auth.user_id,
        backend_user: userData.user_id
      });
      await window.authStorage.clearAuthToken('user_mismatch');
      return null;
    }
    
    // Phase 5.3.3: Auth success logging
    console.group('[FW Content][Auth Success]');
    console.log('Backend confirmed user:', { id: userData.user_id, email: userData.email });
    console.log('Token user_id:', auth.user_id);
    console.log('Match:', userData.user_id === auth.user_id);
    console.groupEnd();
    
    // Phase 5.3.4: Return full authContext including token for API calls
    return {
      token: auth.token,
      user_id: userData.user_id,
      email: userData.email,
      fingerprint: auth.fingerprint,
      expires_at: auth.expires_at
    };
    
  } catch (error) {
    console.error('[FW Auth] Token verification failed:', error);
    return null;
  }
}
*/

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Phase 5.3.2: Init must verify auth before proceeding
  try {
    // Phase 5.3.3: Init environment logging
    console.group('[FW Content][Init]');
    console.log('href:', location.href);
    console.log('isLinkedInJob:', /linkedin\.com\/jobs\/view/.test(location.href));
    console.log('chrome exists:', !!chrome);
    console.log('chrome.storage.local exists:', !!chrome?.storage?.local);
    console.groupEnd();
    
    console.log('[FW Init] Starting initialization...');
    ensureFWDebugState();

    // Phase 5.3.2: Verify auth before fetching session
    verifyAuthToken()
      .then((authContext) => {
        if (!authContext) {
          console.log('[FW Init] Not authenticated or token invalid, skipping initialization');
          return;
        }
        
        console.log('[FW Init] Auth verified for user', authContext.user_id);
        
        // Phase 5.3.4.1: Store authContext for observability calls
        currentAuthContext = authContext;
        
        // Phase 5.3.4: Pass authContext to getActiveSession
        return getActiveSession(authContext);
      })
      .then((session) => {
        if (!session) {
          // Auth failed in previous step, already logged
          return;
        }
        
        activeSession = session;

        if (!activeSession || !activeSession.active) {
          // Phase 5.3.5: Debug - init decision
          console.log('[FW Init][Decision] Skipping init', {
            reason: 'no_active_session',
            activeSession_exists: !!activeSession,
            activeSession_active: activeSession?.active,
            will_not_show_overlay: true
          });
          console.log('[FW Session] No active apply session on this page');
          console.log('[FW Init] No active session found, skipping initialization');
          return;
        }

        console.log('[FW Session] Loaded', {
          active: activeSession.active,
          task_id: activeSession.task_id,
          run_id: activeSession.run_id,  // Phase 5.3.1
          job_url: activeSession.job_url,
          ats_type: activeSession.ats_type  // Phase 5.3.1
        });
        
        // Phase 5.3.5: Debug - init decision
        console.log('[FW Init][Decision] Proceeding with init', {
          reason: 'active_session_confirmed',
          run_id: activeSession.run_id,
          task_id: activeSession.task_id,
          tab_owned: activeSession.tab_owned,
          ats_type: activeSession.ats_type,
          will_show_overlay: true,
          will_run_detection: true
        });
        
        console.log('[FW Init] Proceeding with initialization');

        // Overlay-first invariant: create overlay before any awaits/detection/url parsing.
        ensureOverlay(activeSession);
        enforceOverlayInvariant(activeSession);

        // Continue async pipeline after overlay exists.
        (async () => {
          try {
            console.log('[FW Init] Active session found:', activeSession.task_id);
            
            // Phase 5.3.1: Use run_id from backend session
            if (activeSession.active && activeSession.run_id && !observabilityClient.getRunId()) {
              const debugState = ensureFWDebugState();
              const atsKind = activeSession.ats_type || debugState.lastDetectionAtsKind || 'unknown';
              const intent = debugState.lastDetectionIntent || 'unknown';
              const stage = debugState.lastDetectionStage || 'analyzing';
              
              // Set run_id from backend session (don't create new run)
              observabilityClient.currentRunId = activeSession.run_id;
              console.log('[Observability] Using existing run_id from session:', activeSession.run_id);
              
              // Log session_attached event
              observabilityClient.enqueue({
                source: 'extension',
                severity: 'info',
                event_name: 'session_attached',
                url: window.location.href,
                payload: {
                  task_id: activeSession.task_id,
                  run_id: activeSession.run_id,
                  job_url: activeSession.job_url,
                  ats_type: activeSession.ats_type
                }
              });
              
              observabilityClient.startAutoFlush();
            }

            const { activeTask } = await chrome.storage.local.get(['activeTask']);
            if (!activeTask) {
              console.log('[FW Init] No active task in storage');
              return;
            }

            currentTask = activeTask;

            await updateActiveSession({ current_url: window.location.href });
            await sleep(2000);
            await runDetection();

            initializePageLifecycle();
            startResumeMonitoring();

            console.log('[FW Init] Initialization complete');
          } catch (error) {
            fatalManualFallback('init_async', error);
          }
        })().catch((error) => fatalManualFallback('init_async_outer', error));
      })
      .catch((error) => {
        fatalManualFallback('session_load', error);
      });
  } catch (error) {
    fatalManualFallback('init_sync', error);
  }
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
  
  const debugState = ensureFWDebugState();
  debugState.detectionCounter += 1;
  const detectionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `det_${debugState.detectionCounter}_${Date.now()}`;
  debugState.lastDetectionId = detectionId;

  console.log('[FW Detection] Start', { detection_id: detectionId, url: window.location.href });
  console.log('[Detection] Running ATS and stage detection...');
  
  try {
    // Step 1: Detect ATS platform
    const atsResult = detectATS();
    console.log('[Detection] ATS result:', atsResult);
    
    // Step 2: Detect application stage
    const stageResult = detectApplyStage(atsResult.ats_kind);
    console.log('[Detection] Stage result:', stageResult);

    debugState.lastDetectionStage = stageResult.stage;
    debugState.lastDetectionAtsKind = atsResult.ats_kind;
    
    // Step 3: NEW - Page intent detection (Phase 4.2 UX upgrade)
    const pageIntent = classifyPageIntent();
    console.log('[FW Detection] Page intent:', pageIntent);
    
    // Step 4: Compute worker action
    const actionResult = computeWorkerAction({
      task: currentTask,
      ats: atsResult,
      stage: stageResult
    });
    console.log('[Detection] Action result:', actionResult);
    
    // Step 5: Generate intent-based guidance (Phase 4.2 UX upgrade)
    const guidance = generateIntentBasedGuidance(pageIntent, activeSession);
    console.log('[FW Detection] Complete', {
      detection_id: detectionId,
      ats: atsResult.ats_kind,
      stage: stageResult.stage,
      intent: pageIntent.intent,
      step: guidance.step
    });
    
    // Step 6: UPDATE OVERLAY CONTENT (not visibility)
    updateOverlayContent(guidance, {
      ats_kind: atsResult.ats_kind,
      stage: stageResult.stage
    });
    
    // Step 7: Store detection state for popup access
    await chrome.storage.local.set({
      detectionState: {
        ats: atsResult,
        stage: stageResult,
        action: actionResult,
        pageIntent: pageIntent,
        guidance: guidance,
        detection_id: detectionId,
        timestamp: new Date().toISOString(),
        session: {
          task_id: activeSession.task_id,
          job_id: activeSession.job_id,
          recheck_count: activeSession.recheck_count
        }
      }
    });
    
    // Step 8: Phase 5.1 - E2E Mode: Trigger autofill automatically on application_form
    if (pageIntent.intent === 'application_form') {
      console.log('[Phase 5.1 E2E] Detected application_form page - triggering autofill...');
      
      // Phase 5.1: Automatically trigger autofill when:
      // - page_intent === "application_form"
      // - auto_fill_after_login === true (checked inside executeAutofillIfAuthorized)
      await executeAutofillIfAuthorized();
      
      // Update last page type for login detection
      const debugState = ensureFWDebugState();
      debugState.lastPageType = pageIntent.intent;
    } else if (pageIntent.intent === 'login_required' || pageIntent.intent === 'account_creation') {
      // Store that we're on a login page for transition detection
      const debugState = ensureFWDebugState();
      debugState.lastPageType = pageIntent.intent;
    }
    
    // Step 9: Legacy action handling removed in Phase 5.1
    // Autofill now triggers automatically on application_form detection
    
    // Step 9: Report back to background worker
    chrome.runtime.sendMessage({
      type: 'FW_DETECTION_RESULT',
      detection_id: detectionId,
      ats: atsResult,
      stage: stageResult,
      pageIntent: pageIntent,
      action: actionResult
    }).catch(err => {
      console.error('[Detection] Failed to send result to background:', err);
    });
    
    console.log('[FW Detection] Complete', { detection_id: detectionId, task_id: activeSession?.task_id });
    return {
      detection_id: detectionId,
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
    }, { stage: debugState.lastDetectionStage, ats_kind: debugState.lastDetectionAtsKind });
    
    console.log('[FW Detection] Complete', { detection_id: detectionId, error: true });
    return null;
  }
}

// Legacy overlay function removed - now using session-scoped lifecycle manager

/**
 * Execute autofill if authorized (Phase 4.3)
 * Checks permission before running autofill
 */
async function executeAutofillIfAuthorized() {
  console.log('[Autofill] Checking if authorized...');
  
  // Check if autofill is enabled
  const autoFillEnabled = await prefManager.getEffectivePreference('auto_fill_after_login');
  
  if (!autoFillEnabled) {
    console.log('[Autofill] Skipped - auto-fill disabled');
    
    // Log decision (Phase 5.0)
    await logAutomationEvent(createEventPayload(
      'autofill_evaluated',
      'autofill_blocked',
      'auto_fill_after_login=false'
    ));
    
    const currentGuidance = await getCurrentGuidance();
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        instruction: 'Auto-fill is disabled. Fill the form manually or enable auto-fill in settings.'
      });
    }
    return;
  }
  
  console.log('[Autofill] Starting authorized autofill...');
  console.log('[Phase 5.1] E2E Mode: Autofill trigger reason = application_form detected');
  
  const currentGuidance = await getCurrentGuidance();
  if (currentGuidance) {
    updateOverlayContent({
      ...currentGuidance,
      title: 'Auto-filling Application',
      instruction: 'Filling form fields with your profile information...',
      reassurance: 'You can review and edit any field before submitting.'
    });
  }
  
  try {
    // Phase 5.2.1: Fetch DERIVED profile from backend (ATS-ready answers ONLY)
    console.log('[Phase 5.2.1] Fetching DERIVED profile from backend API (authenticated)...');
    const derivedProfile = await APIClient.getMyDerivedProfile();
    
    if (!derivedProfile) {
      console.error('[Autofill] Derived profile fetch failed or returned null');
      
      // Log failure (Phase 5.0)
      await logAutomationEvent(createEventPayload(
        'autofill_failed',
        'autofill_blocked',
        'Derived profile API returned null (auth may have failed)'
      ));
      
      if (currentGuidance) {
        updateOverlayContent({
          ...currentGuidance,
          instruction: 'Could not load your profile. Please ensure you are logged in.'
        });
      }
      return;
    }
    
    // Phase 5.2.1 Review Fix: Explicit telemetry proving derived profile usage
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Phase 5.2.1 Review Fix] PROOF OF DERIVED PROFILE USAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Telemetry] profile_source: "derived-profile" (NOT raw profile)');
    console.log('[Telemetry] endpoint: GET /api/users/me/derived-profile');
    console.log('[Telemetry] Derived profile data received:', {
      legal_name: derivedProfile.legal_name || 'MISSING',
      primary_email: derivedProfile.primary_email || 'MISSING',
      phone: derivedProfile.phone || 'MISSING',
      highest_degree: derivedProfile.highest_degree || 'MISSING',
      graduation_year: derivedProfile.graduation_year || 'MISSING',
      years_of_experience: derivedProfile.years_of_experience || 'MISSING',
      work_authorized_us: derivedProfile.work_authorized_us,
      requires_sponsorship: derivedProfile.requires_sponsorship,
      work_auth_category: derivedProfile.work_auth_category || 'MISSING',
      normalized_skills: derivedProfile.normalized_skills?.length || 0,
      missing_fields: derivedProfile.missing_fields || [],
      source_fields_count: Object.keys(derivedProfile.source_fields || {}).length
    });
    
    if (derivedProfile.missing_fields && derivedProfile.missing_fields.length > 0) {
      console.warn('[Telemetry] ⚠️ Missing required fields:', derivedProfile.missing_fields);
    }
    
    console.log('[Telemetry] Source field mapping (traceability):', derivedProfile.source_fields || {});
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Phase 5.3.0: Log derived profile loaded event
    observabilityClient.enqueue({
      source: 'extension',
      severity: 'info',
      event_name: 'derived_profile_loaded',
      url: window.location.href,
      payload: {
        profile_source: 'derived_profile',
        has_legal_name: !!derivedProfile.legal_name,
        has_email: !!derivedProfile.primary_email,
        has_phone: !!derivedProfile.phone,
        highest_degree: derivedProfile.highest_degree,
        years_of_experience: derivedProfile.years_of_experience,
        work_auth_category: derivedProfile.work_auth_category,
        skills_count: derivedProfile.normalized_skills?.length || 0,
        missing_fields: derivedProfile.missing_fields || []
      }
    });
    
    // Phase 5.2.1: Execute autofill with DERIVED profile
    observabilityClient.enqueue({
      source: 'extension',
      severity: 'info',
      event_name: 'autofill_triggered',
      url: window.location.href,
      payload: {
        profile_source: 'derived_profile',
        trigger_reason: 'application_form detected + auto_fill_enabled'
      }
    });
    
    const autofillResult = await attemptAutofill(derivedProfile);
    
    // Phase 5.2.1 Review Fix: Enhanced telemetry
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Phase 5.2.1 Review Fix] AUTOFILL TELEMETRY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Telemetry] profile_source: "derived-profile"');
    console.log('[Telemetry] autofill_trigger_reason: application_form detected + auto_fill_enabled');
    console.log('[Telemetry] fields_attempted:', autofillResult.attempted);
    console.log('[Telemetry] fields_filled:', autofillResult.filled);
    console.log('[Telemetry] fields_skipped:', autofillResult.skipped);
    console.log('[Telemetry] Detailed skip reasons:', autofillResult.skippedReasons);
    
    if (autofillResult.selectorsNotFound && autofillResult.selectorsNotFound.length > 0) {
      console.warn('[Telemetry] ⚠️ ATS-specific selectors NOT FOUND on page:', autofillResult.selectorsNotFound);
    }
    
    const fillRate = autofillResult.attempted > 0 
      ? Math.round((autofillResult.filled / autofillResult.attempted) * 100) 
      : 0;
    console.log('[Telemetry] fill_rate:', `${fillRate}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Phase 5.3.0: Log autofill completed event to observability
    observabilityClient.enqueue({
      source: 'extension',
      severity: 'info',
      event_name: 'autofill_completed',
      url: window.location.href,
      payload: {
        profile_source: 'derived_profile',
        fields_attempted: autofillResult.attempted,
        fields_filled: autofillResult.filled,
        fields_skipped: autofillResult.skipped,
        fill_rate: fillRate,
        selectors_not_found: autofillResult.selectorsNotFound || [],
        skipped_reasons: autofillResult.skippedReasons
      }
    });
    
    // Flush immediately after critical milestones (Phase 5.3.4.1: pass token)
    if (currentAuthContext?.token) {
      await observabilityClient.flush(currentAuthContext.token);
    }
    
    // Log successful autofill (Phase 5.2.1)
    await logAutomationEvent(createEventPayload(
      'autofill_executed',
      'autofill_executed',
      'auto_fill_after_login=true, DERIVED profile loaded from backend API',
      {
        profile_source: 'derived_backend',
        profile_type: 'ats_ready_answers',
        fields_filled: autofillResult.filled,
        fields_attempted: autofillResult.attempted,
        fields_skipped: autofillResult.skipped
      }
    ));
    
    // Update overlay with result
    if (currentGuidance) {
      const fillRate = autofillResult.attempted > 0 
        ? Math.round((autofillResult.filled / autofillResult.attempted) * 100) 
        : 0;
      
      updateOverlayContent({
        ...currentGuidance,
        title: 'Autofill Complete',
        instruction: `Filled ${autofillResult.filled} of ${autofillResult.attempted} fields (${fillRate}%). Review and submit when ready.`,
        reassurance: 'All data comes from your profile. You can edit any field.'
      });
    }
    
    // After autofill, check if ready to submit
    await checkReadyToSubmit();
    
  } catch (error) {
    console.error('[Autofill] Failed:', error);
    
    // Phase 5.3.0: Log error to observability
    observabilityClient.enqueue({
      source: 'extension',
      severity: 'error',
      event_name: 'api_call_failed',
      url: window.location.href,
      payload: {
        endpoint: '/api/users/me/derived-profile',
        error_message: error.message,
        error_type: error.name
      }
    });
    
    // Log error (Phase 5.0)
    await logAutomationEvent(createEventPayload(
      'autofill_error',
      'autofill_failed',
      `Autofill error: ${error.message}`
    ));
    
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        instruction: 'Auto-fill encountered an error. Please fill the form manually.'
      });
    }
  }
}

/**
 * Helper to get current guidance from storage
 * @returns {Promise<object|null>}
 */
async function getCurrentGuidance() {
  try {
    const { detectionState } = await chrome.storage.local.get(['detectionState']);
    return detectionState?.guidance || null;
  } catch (error) {
    console.error('[Guidance] Failed to load:', error);
    return null;
  }
}

/**
 * Check if application is ready to submit (Phase 4.3)
 */
async function checkReadyToSubmit() {
  console.log('[Submit] Checking if ready to submit...');
  
  const readiness = detectSubmitReadiness();
  
  if (readiness.ready) {
    console.log('[Submit] Application is ready - checking authorization...');
    await attemptAutoSubmitIfAuthorized();
  } else {
    console.log('[Submit] Not ready:', readiness.blocker);
    const currentGuidance = await getCurrentGuidance();
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        instruction: `Complete the form. ${readiness.blocker}`
      });
    }
  }
}

/**
 * Attempt auto-submit if authorized (Phase 4.3)
 * All 4 safety gates must pass
 */
async function attemptAutoSubmitIfAuthorized() {
  console.log('[Submit] Checking auto-submit authorization...');
  
  // Gate 1: Check if auto-submit is enabled
  const autoSubmitEnabled = await prefManager.getEffectivePreference('auto_submit_when_ready');
  
  if (!autoSubmitEnabled) {
    console.log('[Submit] Auto-submit disabled');
    
    // Log decision (Phase 5.0)
    await logAutomationEvent(createEventPayload(
      'submit_evaluated',
      'submit_blocked',
      'auto_submit_when_ready=false'
    ));
    
    const currentGuidance = await getCurrentGuidance();
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        title: 'Ready to Submit',
        instruction: 'Your application is ready. Review the form and click Submit when ready.',
        reassurance: 'Auto-submit is disabled. You have full control.'
      });
    }
    return;
  }
  
  // Gate 2: Check ATS approval
  const prefs = await prefManager.getPreferences();
  if (!prefs.session.ats_approved_this_session) {
    console.log('[Submit] ATS not approved - prompting user...');
    const approved = await promptATSApproval();
    if (!approved) {
      console.log('[Submit] User declined ATS approval');
      
      // Log user decision (Phase 5.0)
      await logAutomationEvent(createEventPayload(
        'submit_evaluated',
        'submit_blocked',
        'User declined ATS approval'
      ));
      
      return;
    }
  }
  
  // Gate 3: Check readiness (redundant but safe)
  const readiness = detectSubmitReadiness();
  if (!readiness.ready) {
    console.log('[Submit] Not ready:', readiness.blocker);
    
    // Log blocker (Phase 5.0)
    await logAutomationEvent(createEventPayload(
      'submit_evaluated',
      'submit_blocked',
      `Form not ready: ${readiness.blocker}`
    ));
    
    const currentGuidance = await getCurrentGuidance();
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        instruction: `Cannot auto-submit: ${readiness.blocker}`
      });
    }
    return;
  }
  
  // Gate 4: ALWAYS show review modal (NON-NEGOTIABLE)
  console.log('[Submit] Showing review modal...');
  const currentGuidance = await getCurrentGuidance();
  if (currentGuidance) {
    updateOverlayContent({
      ...currentGuidance,
      title: 'Review Required',
      instruction: 'Please review your application in the modal.',
      reassurance: 'You can cancel at any time.'
    });
  }
  
  const { detectionState } = await chrome.storage.local.get(['detectionState']);
  const context = {
    activeSession: activeSession,
    ats_kind: detectionState?.ats?.ats_kind,
    job_id: activeSession?.job_id
  };
  
  const confirmed = await showSubmitReviewModal(context);
  
  if (confirmed) {
    console.log('[Submit] User confirmed - executing submit');
    executeSubmit(readiness.submitButton);
  } else {
    console.log('[Submit] User canceled');
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        title: 'Submission Canceled',
        instruction: 'Submission canceled. Review the form and submit manually when ready.',
        reassurance: 'You can always submit manually by clicking the submit button.'
      });
    }
  }
}

/**
 * Prompt user for ATS approval
 * @returns {Promise<boolean>}
 */
async function promptATSApproval() {
  const { detectionState } = await chrome.storage.local.get(['detectionState']);
  const atsKind = detectionState?.ats?.ats_kind || 'this ATS';
  
  // Simple confirmation for now
  // Future: Could be more sophisticated with ATS capability detection
  const approved = confirm(
    `Allow auto-submit for ${atsKind} applications in this session?\n\n` +
    `You will still review every submission before it's sent.`
  );
  
  if (approved && activeSession) {
    await prefManager.setSessionOverride(activeSession.task_id, 'ats_approved_this_session', true);
    console.log('[Submit] ATS approved for session');
  }
  
  return approved;
}

/**
 * Execute submit action
 * @param {HTMLElement} submitButton - Submit button to click
 */
function executeSubmit(submitButton) {
  // Final safety check
  if (!submitButton || submitButton.disabled) {
    console.error('[Submit] Submit button no longer available');
    return;
  }
  
  console.log('[Submit] Clicking submit button');
  const currentGuidancePromise = getCurrentGuidance();
  currentGuidancePromise.then(currentGuidance => {
    if (currentGuidance) {
      updateOverlayContent({
        ...currentGuidance,
        title: 'Submitting Application',
        instruction: 'Sending your application...',
        reassurance: 'Please wait...'
      });
    }
  });
  
  // Click the button
  submitButton.click();
  
  console.log('[Submit] Submit button clicked - waiting for page transition');
}

/**
 * Check if we just logged in (based on page transition history)
 * @returns {boolean}
 */
function checkIfJustLoggedIn() {
  // Simple heuristic: check if we transitioned from login_required to application_form
  const debugState = ensureFWDebugState();
  
  // Check if last page type was login_required
  if (debugState.lastPageType === 'login_required') {
    console.log('[Login] Detected transition from login page');
    return true;
  }
  
  return false;
}

/**
 * Attempt to autofill using DERIVED profile (Phase 5.2.1)
 * Uses ATS-ready answers, not raw profile data
 */
async function attemptAutofill(derivedProfile) {
  console.log('[Phase 5.2.1 Review Fix] Autofill using DERIVED profile (ATS-ready answers)');
  console.log('[Phase 5.2.1 Review Fix] profile_source: "derived-profile"');
  
  let attempted = 0;
  let filled = 0;
  const skipped = [];
  const skippedReasons = {};
  const selectorsNotFound = [];  // Phase 5.2.1 Review Fix: Track missing ATS-specific selectors
  
  // Helper to fill text/url field
  const fillField = (field, value, fieldName) => {
    attempted++;
    if (!value) {
      skipped.push(fieldName);
      skippedReasons[fieldName] = 'missing_profile_field';
      console.log(`[Autofill] Skipped ${fieldName}: missing_profile_field`);
      return false;
    }
    
    if (field.disabled || field.readOnly) {
      skipped.push(fieldName);
      skippedReasons[fieldName] = 'field_locked';
      console.log(`[Autofill] Skipped ${fieldName}: field_locked`);
      return false;
    }
    
    if (field.value && field.value.trim()) {
      skipped.push(fieldName);
      skippedReasons[fieldName] = 'field_already_filled';
      console.log(`[Autofill] Skipped ${fieldName}: field_already_filled`);
      return false;
    }
    
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    console.log(`[Autofill] Filled ${fieldName}: ${value}`);
    filled++;
    return true;
  };
  
  // Helper to check/uncheck checkbox
  const fillCheckbox = (field, value, fieldName) => {
    attempted++;
    if (field.disabled || field.readOnly) {
      skipped.push(fieldName);
      skippedReasons[fieldName] = 'field_locked';
      console.log(`[Autofill] Skipped ${fieldName}: field_locked`);
      return false;
    }
    
    field.checked = value;
    field.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`[Autofill] Checked ${fieldName}: ${value}`);
    filled++;
    return true;
  };
  
  // Phase 5.2.1: Legal Name (single field, derived)
  const fullNameFields = findFieldsByType(['text'], ['name', 'full', 'legal', 'fullname']);
  for (const field of fullNameFields) {
    fillField(field, derivedProfile.legal_name, 'legal_name');
  }
  
  // Phase 5.2.1: First/Last name (backward compat - some ATS still ask separately)
  // Extract from legal_name if not provided separately
  if (derivedProfile.legal_name) {
    const nameParts = derivedProfile.legal_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    const firstNameFields = findFieldsByType(['text'], ['first', 'fname', 'firstname', 'given']);
    for (const field of firstNameFields) {
      fillField(field, firstName, 'first_name');
    }
    
    const lastNameFields = findFieldsByType(['text'], ['last', 'lname', 'lastname', 'surname', 'family']);
    for (const field of lastNameFields) {
      fillField(field, lastName, 'last_name');
    }
  }
  
  // Email
  const emailFields = findFieldsByType(['email'], ['email', 'e-mail', 'e_mail']);
  for (const field of emailFields) {
    fillField(field, derivedProfile.primary_email, 'email');
  }
  
  // Phone
  const phoneFields = findFieldsByType(['tel', 'text'], ['phone', 'mobile', 'cell', 'telephone']);
  for (const field of phoneFields) {
    fillField(field, derivedProfile.phone, 'phone');
  }
  
  // Phase 5.2.1: NEW - Highest Degree (ATS-specific)
  const degreeFields = findFieldsByType(['text', 'select'], ['degree', 'education', 'highest']);
  if (degreeFields.length === 0 && derivedProfile.highest_degree) {
    selectorsNotFound.push('highest_degree');
    console.warn('[Telemetry] ⚠️ selector_not_found: highest_degree (profile has value but no field found)');
  }
  for (const field of degreeFields) {
    fillField(field, derivedProfile.highest_degree, 'highest_degree');
  }
  
  // Phase 5.2.1: NEW - Years of Experience (ATS-specific)
  const experienceFields = findFieldsByType(['number', 'text'], ['experience', 'years', 'years of experience']);
  if (experienceFields.length === 0 && derivedProfile.years_of_experience !== null && derivedProfile.years_of_experience !== undefined) {
    selectorsNotFound.push('years_of_experience');
    console.warn('[Telemetry] ⚠️ selector_not_found: years_of_experience (profile has value but no field found)');
  }
  for (const field of experienceFields) {
    if (derivedProfile.years_of_experience !== null && derivedProfile.years_of_experience !== undefined) {
      fillField(field, derivedProfile.years_of_experience.toString(), 'years_of_experience');
    }
  }
  
  // Phase 5.2.1 Review Fix: Work Authorization (use work_auth_category)
  const authFields = findFieldsByType(['text', 'select'], ['authorization', 'work auth', 'visa', 'sponsorship', 'work authorization']);
  if (authFields.length === 0 && derivedProfile.work_auth_category) {
    selectorsNotFound.push('work_authorization');
    console.warn('[Telemetry] ⚠️ selector_not_found: work_authorization (profile has value but no field found)');
  }
  for (const field of authFields) {
    fillField(field, derivedProfile.work_auth_category, 'work_authorization');
  }
  
  // Phase 5.2.1: NEW - Willing to Relocate (ATS-specific checkbox)
  const relocateFields = findFieldsByType(['checkbox', 'radio'], ['relocate', 'willing to move', 'willing to relocate', 'relocation']);
  if (relocateFields.length === 0 && derivedProfile.willing_to_relocate) {
    selectorsNotFound.push('willing_to_relocate');
    console.warn('[Telemetry] ⚠️ selector_not_found: willing_to_relocate (profile has value but no field found)');
  }
  for (const field of relocateFields) {
    if (derivedProfile.willing_to_relocate) {
      fillCheckbox(field, true, 'willing_to_relocate');
    }
  }
  
  // Phase 5.2.1: NEW - Government Employment (ATS-specific checkbox)
  const govFields = findFieldsByType(['checkbox', 'radio'], ['government', 'federal', 'public sector', 'government employment']);
  for (const field of govFields) {
    if (derivedProfile.government_employment_flag) {
      fillCheckbox(field, true, 'government_employment_flag');
    }
  }
  
  // City
  const cityFields = findFieldsByType(['text'], ['city']);
  for (const field of cityFields) {
    fillField(field, derivedProfile.city, 'city');
  }
  
  // State
  const stateFields = findFieldsByType(['text'], ['state', 'province', 'region']);
  for (const field of stateFields) {
    fillField(field, derivedProfile.state, 'state');
  }
  
  // Postal/Zip code
  const postalFields = findFieldsByType(['text'], ['zip', 'postal', 'postcode', 'zipcode']);
  for (const field of postalFields) {
    fillField(field, derivedProfile.postal_code, 'postal_code');
  }
  
  // LinkedIn URL
  const linkedinFields = findFieldsByType(['url', 'text'], ['linkedin', 'linked-in']);
  for (const field of linkedinFields) {
    fillField(field, derivedProfile.linkedin_url, 'linkedin_url');
  }
  
  // Portfolio URL
  const portfolioFields = findFieldsByType(['url', 'text'], ['portfolio', 'website', 'personal']);
  for (const field of portfolioFields) {
    fillField(field, derivedProfile.portfolio_url, 'portfolio_url');
  }
  
  // GitHub URL
  const githubFields = findFieldsByType(['url', 'text'], ['github', 'git-hub']);
  for (const field of githubFields) {
    fillField(field, derivedProfile.github_url, 'github_url');
  }
  
  // Phase 5.2.1 Review Fix: Log summary with enhanced telemetry
  console.log('[Phase 5.2.1] Autofill complete');
  console.log(`[Phase 5.2.1] Fields attempted: ${attempted}`);
  console.log(`[Phase 5.2.1] Fields filled: ${filled}`);
  console.log(`[Phase 5.2.1] Fields skipped: ${skipped.length}`);
  if (skipped.length > 0) {
    console.log(`[Phase 5.2.1] Skipped fields:`, skippedReasons);
  }
  
  const fillRate = attempted > 0 ? Math.round((filled / attempted) * 100) : 0;
  console.log(`[Phase 5.2.1] Fill rate: ${fillRate}%`);
  
  // Phase 5.2.1 Review Fix: Explicit proof of derived profile usage
  console.log('[Phase 5.2.1 Review Fix] PROOF: Autofill used DERIVED profile exclusively');
  console.log('[Phase 5.2.1 Review Fix] ATS-specific fields from derived profile:', {
    legal_name: !!derivedProfile.legal_name,
    highest_degree: !!derivedProfile.highest_degree,
    years_of_experience: derivedProfile.years_of_experience !== null && derivedProfile.years_of_experience !== undefined,
    work_auth_category: !!derivedProfile.work_auth_category,
    work_authorized_us: derivedProfile.work_authorized_us,
    requires_sponsorship: derivedProfile.requires_sponsorship,
    willing_to_relocate: derivedProfile.willing_to_relocate,
    government_employment_flag: derivedProfile.government_employment_flag
  });
  
  if (selectorsNotFound.length > 0) {
    console.warn(`[Phase 5.2.1 Review Fix] ⚠️ ${selectorsNotFound.length} ATS-specific selectors NOT FOUND:`, selectorsNotFound);
  }
  
  // Phase 5.2.1: E2E success criteria check
  if (fillRate < 80 && attempted > 0) {
    console.warn(`[Phase 5.2.1] E2E WARNING: Fill rate ${fillRate}% is below 80% threshold`);
  }
  
  if (filled === 0 && attempted === 0) {
    console.warn('[Phase 5.2.1] E2E WARNING: No form fields detected on page');
  }
  
  return {
    attempted,
    filled,
    skipped,
    skippedReasons,
    selectorsNotFound,  // Phase 5.2.1 Review Fix
    fillRate
  };
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
  const beforeUrl = debugState.lastUrlSeen || lastRecheckUrl || '';
  const afterUrl = window.location.href;
  let pageType = null;
  try {
    pageType = classifyPageType();
  } catch (_) {
    pageType = null;
  }
  const reasonCategory = (() => {
    if (reason === 'dom_changed') return 'mutation';
    if (reason === 'visibility_change') return 'visibility';
    if (reason === 'manual') return 'manual';
    return 'navigation';
  })();
  
  // Clear existing timeout
  if (recheckTimeout) {
    clearTimeout(recheckTimeout);
  }
  
  // Update debug state
  debugState.recheckCount += 1;
  debugState.lastRecheckReason = reason;
  debugState.lastUrlSeen = afterUrl;
  debugState.lastPageType = pageType;

  console.log('[FW Recheck] Triggered', {
    reason: reasonCategory,
    reason_raw: reason,
    url_before: beforeUrl,
    url_after: afterUrl,
    page_type: pageType,
    recheck_count: debugState.recheckCount
  });
  
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

  try {
    // Load active session
    activeSession = await getActiveSession();

    if (!activeSession || !activeSession.active) {
      console.log('[Recheck] No active session, skipping');
      return;
    }

    console.log('[FW Session] Loaded', {
      active: activeSession.active,
      task_id: activeSession.task_id,
      job_id: activeSession.job_id,
      initial_url: activeSession.initial_url,
      current_url: activeSession.current_url
    });
    
    // Phase 5.3.0: Start observability run if not already started
    if (activeSession.active && !observabilityClient.getRunId()) {
      const atsKind = debugState.lastDetectionAtsKind || 'unknown';
      const intent = debugState.lastDetectionIntent || 'unknown';
      const stage = debugState.lastDetectionStage || 'analyzing';
      
      // Phase 5.3.4.1: Pass token to startRun
      if (currentAuthContext?.token) {
        await observabilityClient.startRun(currentAuthContext.token, activeSession, {
          initial_url: activeSession.initial_url,
          ats_kind: atsKind,
          intent: intent,
          stage: stage
        });
      }
    }

    // Explicit invariant logging and enforcement on every recheck page
    enforceOverlayInvariant(activeSession);
  
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
      debugState.lastDedupSignature = signature;
      console.log('[FW Recheck] Skipped duplicate', { dedup_signature: signature });
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
    }, { stage: debugState.lastDetectionStage, ats_kind: debugState.lastDetectionAtsKind });
  
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
      updateOverlayContent(guidance, { stage: stageResult.stage, ats_kind: atsResult.ats_kind });
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
      }, { stage: debugState.lastDetectionStage, ats_kind: debugState.lastDetectionAtsKind });
    }
  } catch (error) {
    fatalManualFallback('executeRecheck_outer', error);
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
