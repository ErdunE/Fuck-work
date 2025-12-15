/**
 * Authentication utilities for Phase 5.0 Web Control Plane.
 * Manages JWT token storage and validation.
 */

// Phase A: Shared API_BASE_URL for all content scripts
const API_BASE_URL = 'http://127.0.0.1:8000';

const AUTH_STORAGE_KEY = 'fw_jwt_token';
const USER_INFO_STORAGE_KEY = 'fw_user_info';

class AuthManager {
  /**
   * Store JWT token and user info in chrome.storage.local
   */
  static async storeToken(token, userInfo) {
    await chrome.storage.local.set({
      [AUTH_STORAGE_KEY]: token,
      [USER_INFO_STORAGE_KEY]: userInfo
    });
    console.log('[FW Auth] Token stored', { user_id: userInfo.user_id, email: userInfo.email });
  }
  
  /**
   * Get stored JWT token
   */
  static async getToken() {
    const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    return result[AUTH_STORAGE_KEY] || null;
  }
  
  /**
   * Get stored user info
   */
  static async getUserInfo() {
    const result = await chrome.storage.local.get(USER_INFO_STORAGE_KEY);
    return result[USER_INFO_STORAGE_KEY] || null;
  }
  
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    const token = await this.getToken();
    return token !== null;
  }
  
  /**
   * Clear stored auth data (logout)
   */
  static async clearAuth() {
    await chrome.storage.local.remove([AUTH_STORAGE_KEY, USER_INFO_STORAGE_KEY]);
    console.log('[FW Auth] Cleared authentication');
  }
  
  /**
   * Validate token with backend
   * Returns user info if valid, null if invalid
   */
  static async validateToken(apiBaseUrl = 'http://127.0.0.1:8000') {
    const token = await this.getToken();
    if (!token) {
      return null;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn('[FW Auth] Token validation failed', response.status);
        await this.clearAuth();
        return null;
      }
      
      const userInfo = await response.json();
      console.log('[FW Auth] Token validated', { user_id: userInfo.user_id });
      return userInfo;
    } catch (error) {
      console.error('[FW Auth] Token validation error', error);
      return null;
    }
  }
}

// Make available globally in extension
if (typeof window !== 'undefined') {
  window.AuthManager = AuthManager;
}

