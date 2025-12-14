/**
 * Automation Preferences Manager
 * Versioned preference schema with abstracted storage for future backend sync.
 * Phase 4.3 - User-Controlled Autofill & Auto-Submit
 */

const AUTOMATION_PREFS_VERSION = 1;

const DEFAULT_AUTOMATION_PREFERENCES = {
  version: AUTOMATION_PREFS_VERSION,
  
  // Global defaults (set in popup)
  global: {
    auto_fill_after_login: true,    // Safe default
    auto_submit_when_ready: false,  // Requires explicit opt-in
    
    // Future expansion hooks
    per_ats_overrides: {},          // { "greenhouse": { auto_fill: true, auto_submit: false } }
    field_autofill_rules: {},       // Custom field mappings
    submit_review_timeout_ms: 0     // 0 = require explicit confirm, >0 = countdown
  },
  
  // Session-specific state (ephemeral, reset on session close)
  session: {
    current_session_id: null,
    auto_fill_enabled_this_session: null,   // null = use global, true/false = override
    auto_submit_enabled_this_session: null,
    ats_approved_this_session: false,       // Requires per-session approval
    submit_review_shown: false
  },
  
  // Sync metadata (for future backend integration)
  sync: {
    last_synced_at: null,
    sync_enabled: false,
    backend_version: null
  }
};

/**
 * Automation Preference Manager
 * Handles preference storage, retrieval, and future sync hooks
 */
class AutomationPreferenceManager {
  constructor() {
    this.storageKey = 'automation_preferences';
  }

  /**
   * Load preferences with fallback to defaults
   * @returns {Promise<object>} Preferences object
   */
  async getPreferences() {
    try {
      const stored = await chrome.storage.local.get([this.storageKey]);
      if (!stored[this.storageKey]) {
        console.log('[AutomationPrefs] No stored preferences, using defaults');
        return this._migrateOrDefault();
      }
      return this._validateAndMigrate(stored[this.storageKey]);
    } catch (error) {
      console.error('[AutomationPrefs] Failed to load preferences:', error);
      return this._migrateOrDefault();
    }
  }
  
  /**
   * Update global preferences (persistent across sessions)
   * @param {object} updates - Partial updates to global preferences
   * @returns {Promise<void>}
   */
  async updateGlobalPreferences(updates) {
    const prefs = await this.getPreferences();
    prefs.global = { ...prefs.global, ...updates };
    await chrome.storage.local.set({ [this.storageKey]: prefs });
    console.log('[AutomationPrefs] Global preferences updated:', updates);
    
    // TODO: Hook for backend sync
    // await this._syncToBackend(prefs);
  }
  
  /**
   * Set session-scoped override
   * @param {string|number} sessionId - Session/task ID
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {Promise<void>}
   */
  async setSessionOverride(sessionId, key, value) {
    const prefs = await this.getPreferences();
    prefs.session.current_session_id = sessionId;
    prefs.session[key] = value;
    await chrome.storage.local.set({ [this.storageKey]: prefs });
    console.log('[AutomationPrefs] Session override set:', { sessionId, key, value });
  }
  
  /**
   * Get effective preference value (session override > global default)
   * @param {string} key - Preference key (without _this_session suffix)
   * @returns {Promise<any>} Resolved preference value
   */
  async getEffectivePreference(key) {
    const prefs = await this.getPreferences();
    const sessionKey = `${key}_this_session`;
    
    // Session override takes precedence (if not null)
    if (prefs.session[sessionKey] !== null && prefs.session[sessionKey] !== undefined) {
      console.log(`[AutomationPrefs] Using session override for ${key}:`, prefs.session[sessionKey]);
      return prefs.session[sessionKey];
    }
    
    // Fall back to global default
    console.log(`[AutomationPrefs] Using global default for ${key}:`, prefs.global[key]);
    return prefs.global[key];
  }
  
  /**
   * Clear all session state (called when session closes)
   * @returns {Promise<void>}
   */
  async clearSessionState() {
    const prefs = await this.getPreferences();
    prefs.session = { ...DEFAULT_AUTOMATION_PREFERENCES.session };
    await chrome.storage.local.set({ [this.storageKey]: prefs });
    console.log('[AutomationPrefs] Session state cleared');
  }
  
  /**
   * Get current session state
   * @returns {Promise<object>} Session state object
   */
  async getSessionState() {
    const prefs = await this.getPreferences();
    return prefs.session;
  }
  
  /**
   * Migrate or return default preferences
   * @returns {object} Default preferences
   * @private
   */
  _migrateOrDefault() {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_AUTOMATION_PREFERENCES));
    chrome.storage.local.set({ [this.storageKey]: defaults });
    return defaults;
  }
  
  /**
   * Validate and migrate preferences to current version
   * @param {object} prefs - Stored preferences
   * @returns {object} Validated/migrated preferences
   * @private
   */
  _validateAndMigrate(prefs) {
    // Version check
    if (!prefs.version || prefs.version < AUTOMATION_PREFS_VERSION) {
      console.log('[AutomationPrefs] Migrating preferences from version', prefs.version, 'to', AUTOMATION_PREFS_VERSION);
      // Future: Add migration logic here
      prefs = this._migrateOrDefault();
    }
    
    // Ensure all required keys exist
    if (!prefs.global) prefs.global = DEFAULT_AUTOMATION_PREFERENCES.global;
    if (!prefs.session) prefs.session = DEFAULT_AUTOMATION_PREFERENCES.session;
    if (!prefs.sync) prefs.sync = DEFAULT_AUTOMATION_PREFERENCES.sync;
    
    return prefs;
  }
  
  // ============================================================
  // FUTURE BACKEND SYNC HOOKS
  // ============================================================
  
  /**
   * Sync preferences to backend (future implementation)
   * @param {object} prefs - Preferences to sync
   * @returns {Promise<void>}
   * @private
   */
  async _syncToBackend(prefs) {
    // TODO: Implement backend sync
    // Future endpoint: POST /api/users/me/automation-preferences
    // Payload: { global: prefs.global, version: prefs.version }
    // Response: { synced_at: ISO timestamp, version: number }
    
    if (!prefs.sync.sync_enabled) {
      return;
    }
    
    console.log('[AutomationPrefs] Backend sync not yet implemented');
    
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/automation-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          global: prefs.global,
          version: prefs.version
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        prefs.sync.last_synced_at = data.synced_at;
        prefs.sync.backend_version = data.version;
        await chrome.storage.local.set({ [this.storageKey]: prefs });
      }
    } catch (error) {
      console.error('[AutomationPrefs] Backend sync failed:', error);
    }
    */
  }
  
  /**
   * Sync preferences from backend (future implementation)
   * @returns {Promise<void>}
   * @private
   */
  async _syncFromBackend() {
    // TODO: Implement backend sync
    // Future endpoint: GET /api/users/me/automation-preferences
    // Response: { global: {...}, version: number, updated_at: ISO timestamp }
    
    console.log('[AutomationPrefs] Backend sync not yet implemented');
    
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/automation-preferences`);
      
      if (response.ok) {
        const data = await response.json();
        const prefs = await this.getPreferences();
        
        // Merge backend preferences with local
        prefs.global = { ...prefs.global, ...data.global };
        prefs.version = Math.max(prefs.version, data.version);
        prefs.sync.last_synced_at = data.updated_at;
        prefs.sync.backend_version = data.version;
        
        await chrome.storage.local.set({ [this.storageKey]: prefs });
        console.log('[AutomationPrefs] Synced from backend');
      }
    } catch (error) {
      console.error('[AutomationPrefs] Backend sync failed:', error);
    }
    */
  }
  
  /**
   * Enable backend sync (future implementation)
   * @returns {Promise<void>}
   */
  async enableBackendSync() {
    const prefs = await this.getPreferences();
    prefs.sync.sync_enabled = true;
    await chrome.storage.local.set({ [this.storageKey]: prefs });
    console.log('[AutomationPrefs] Backend sync enabled (will activate when backend is ready)');
    
    // TODO: Trigger initial sync
    // await this._syncFromBackend();
    // await this._syncToBackend(prefs);
  }
  
  /**
   * Disable backend sync
   * @returns {Promise<void>}
   */
  async disableBackendSync() {
    const prefs = await this.getPreferences();
    prefs.sync.sync_enabled = false;
    await chrome.storage.local.set({ [this.storageKey]: prefs });
    console.log('[AutomationPrefs] Backend sync disabled');
  }
}

// Export singleton instance
const prefManager = new AutomationPreferenceManager();

