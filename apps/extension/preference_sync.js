/**
 * Preference Sync Service for Phase 5.0 Web Control Plane.
 * Polls backend for automation preferences and caches locally.
 * Backend is source of truth, local cache is fallback only.
 */

const PREFERENCE_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PREFERENCE_CACHE_KEY = 'fw_preference_cache';
const LAST_SYNC_KEY = 'fw_last_preference_sync';

class PreferenceSyncService {
  constructor() {
    this.pollInterval = null;
    this.isRunning = false;
  }
  
  /**
   * Start preference polling service
   * Call this on extension startup after authentication
   */
  async start() {
    if (this.isRunning) {
      console.log('[FW Sync] Already running');
      return;
    }
    
    console.log('[FW Sync] Starting preference sync service');
    this.isRunning = true;
    
    // Immediate sync on start
    await this.syncPreferences();
    
    // Poll every 5 minutes
    this.pollInterval = setInterval(() => {
      this.syncPreferences();
    }, PREFERENCE_POLL_INTERVAL_MS);
  }
  
  /**
   * Stop preference polling service
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('[FW Sync] Stopped preference sync service');
  }
  
  /**
   * Sync preferences from backend
   * Returns preferences (from backend or cache)
   */
  async syncPreferences() {
    try {
      // Check authentication
      const isAuth = await AuthManager.isAuthenticated();
      if (!isAuth) {
        console.log('[FW Sync] Not authenticated, skipping sync');
        return await this.getCachedPreferences();
      }
      
      console.log('[FW Sync] Fetching preferences from backend');
      
      // Fetch from backend
      const preferences = await APIClient.getAutomationPreferences();
      
      if (preferences) {
        // Cache locally
        await this.cachePreferences(preferences);
        console.log('[FW Sync] Preferences synced', {
          auto_fill: preferences.auto_fill_after_login,
          auto_submit: preferences.auto_submit_when_ready,
          last_synced: preferences.last_synced_at
        });
        
        // Notify content scripts of preference update
        await this.notifyPreferenceUpdate(preferences);
        
        return preferences;
      } else {
        console.warn('[FW Sync] Failed to fetch preferences, using cache');
        return await this.getCachedPreferences();
      }
      
    } catch (error) {
      console.error('[FW Sync] Error syncing preferences', error);
      return await this.getCachedPreferences();
    }
  }
  
  /**
   * Cache preferences locally
   */
  async cachePreferences(preferences) {
    await chrome.storage.local.set({
      [PREFERENCE_CACHE_KEY]: preferences,
      [LAST_SYNC_KEY]: Date.now()
    });
  }
  
  /**
   * Get cached preferences (fallback when offline)
   */
  async getCachedPreferences() {
    const result = await chrome.storage.local.get(PREFERENCE_CACHE_KEY);
    const cached = result[PREFERENCE_CACHE_KEY];
    
    if (cached) {
      console.log('[FW Sync] Using cached preferences');
      return cached;
    }
    
    // Return safe defaults if no cache
    console.log('[FW Sync] No cached preferences, using defaults');
    return {
      auto_fill_after_login: true,
      auto_submit_when_ready: false,
      require_review_before_submit: true,
      per_ats_overrides: {},
      field_autofill_rules: {},
      submit_review_timeout_ms: 0
    };
  }
  
  /**
   * Get last sync timestamp
   */
  async getLastSyncTime() {
    const result = await chrome.storage.local.get(LAST_SYNC_KEY);
    return result[LAST_SYNC_KEY] || null;
  }
  
  /**
   * Notify all tabs about preference update
   * Content scripts can listen for this message
   */
  async notifyPreferenceUpdate(preferences) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'FW_PREFERENCES_UPDATED',
            preferences: preferences
          });
        } catch (err) {
          // Tab may not have content script, ignore
        }
      }
    } catch (error) {
      console.error('[FW Sync] Error notifying tabs', error);
    }
  }
  
  /**
   * Force immediate sync (e.g., after user changes preference in popup)
   */
  async forceSyncNow() {
    console.log('[FW Sync] Force sync requested');
    return await this.syncPreferences();
  }
}

// Create singleton instance
const preferenceSyncService = new PreferenceSyncService();

// Make available globally
if (typeof window !== 'undefined') {
  window.PreferenceSyncService = preferenceSyncService;
}

