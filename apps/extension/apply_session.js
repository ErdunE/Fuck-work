/**
 * Apply Session Manager
 * Manages the active application session to maintain context across navigations.
 */

const APPLY_SESSION_KEY = 'activeApplySession';

/**
 * ApplySession structure
 * @typedef {Object} ApplySession
 * @property {number} task_id - Backend task ID
 * @property {string} job_id - Job identifier
 * @property {string|null} ats_kind - Detected ATS platform
 * @property {string} initial_url - Starting URL of application
 * @property {string} current_url - Current page URL
 * @property {string} started_at - ISO timestamp of session start
 * @property {string} last_seen_at - ISO timestamp of last activity
 * @property {number} recheck_count - Number of rechecks in this session
 * @property {boolean} active - Whether session is active
 */

/**
 * Create a new apply session
 * @param {number} task_id - Task ID
 * @param {string} job_id - Job ID
 * @param {string} initial_url - Starting URL
 * @returns {Promise<ApplySession>}
 */
async function createApplySession(task_id, job_id, initial_url) {
  // Close any existing active session first
  await closeActiveSession();
  
  const session = {
    task_id,
    job_id,
    ats_kind: null,
    initial_url,
    current_url: initial_url,
    started_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    recheck_count: 0,
    active: true
  };
  
  await chrome.storage.local.set({ [APPLY_SESSION_KEY]: session });
  console.log('[ApplySession] Created new session:', session);
  
  return session;
}

/**
 * Get the active apply session
 * @returns {Promise<ApplySession|null>}
 */
async function getActiveSession() {
  const result = await chrome.storage.local.get(APPLY_SESSION_KEY);
  return result[APPLY_SESSION_KEY] || null;
}

/**
 * Update the active session
 * @param {Partial<ApplySession>} updates - Properties to update
 * @returns {Promise<ApplySession|null>}
 */
async function updateActiveSession(updates) {
  const session = await getActiveSession();
  if (!session || !session.active) {
    console.warn('[ApplySession] No active session to update');
    return null;
  }
  
  const updated = {
    ...session,
    ...updates,
    last_seen_at: new Date().toISOString()
  };
  
  await chrome.storage.local.set({ [APPLY_SESSION_KEY]: updated });
  console.log('[ApplySession] Updated session:', updated);
  
  return updated;
}

/**
 * Close the active apply session
 * @returns {Promise<void>}
 */
async function closeActiveSession() {
  const session = await getActiveSession();
  if (session && session.active) {
    session.active = false;
    await chrome.storage.local.set({ [APPLY_SESSION_KEY]: session });
    console.log('[ApplySession] Closed session:', session.task_id);
    
    // Notify content script to remove overlay
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'FW_SESSION_CLOSED',
          session_id: session.task_id
        });
      }
    } catch (error) {
      // Content script may not be loaded
      console.log('[ApplySession] Could not notify content script:', error.message);
    }
  }
}

/**
 * Increment recheck count for active session
 * @returns {Promise<number>}
 */
async function incrementRecheckCount() {
  const session = await getActiveSession();
  if (!session || !session.active) {
    return 0;
  }
  
  const newCount = session.recheck_count + 1;
  await updateActiveSession({ recheck_count: newCount });
  return newCount;
}

