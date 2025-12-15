/**
 * Phase 5.3.2: Extension Auth Storage
 * 
 * Manages secure storage of JWT token with versioning, fingerprinting, and safe clear.
 * Never logs actual token values - only fingerprints and metadata.
 * 
 * Security Features:
 * - Token fingerprinting (SHA-256) for safe logging
 * - Expiration tracking
 * - User ID tracking for cross-user safety
 * - Issued timestamp for audit
 */

const AUTH_KEYS = {
  TOKEN: 'fw_auth_token',
  USER_ID: 'fw_auth_user_id',
  EXPIRES_AT: 'fw_auth_expires_at',
  FINGERPRINT: 'fw_auth_fingerprint',
  ISSUED_AT: 'fw_auth_issued_at'
};

/**
 * Generate token fingerprint (SHA-256 first 8 chars)
 * @param {string} token - JWT token
 * @returns {Promise<string>} Token fingerprint
 */
async function generateFingerprint(token) {
  // Use Web Crypto API (available in extension environment)
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 8);
}

/**
 * Store auth token and metadata
 * Phase 5.3.2: Called by postMessage listener when Web Control Plane sends auth bootstrap
 * @param {Object} authData - {token, user_id, expires_at}
 */
async function storeAuthToken(authData) {
  const { token, user_id, expires_at } = authData;
  
  const fingerprint = await generateFingerprint(token);
  const issued_at = new Date().toISOString();
  
  await chrome.storage.local.set({
    [AUTH_KEYS.TOKEN]: token,
    [AUTH_KEYS.USER_ID]: user_id,
    [AUTH_KEYS.EXPIRES_AT]: expires_at,
    [AUTH_KEYS.FINGERPRINT]: fingerprint,
    [AUTH_KEYS.ISSUED_AT]: issued_at
  });
  
  console.log('[FW Auth] Token stored', {
    user_id,
    expires_at,
    fingerprint,
    issued_at
  });
  // NEVER log actual token
}

/**
 * Load auth token and metadata
 * @returns {Promise<Object|null>} {token, user_id, expires_at, fingerprint, issued_at} or null
 */
async function loadAuthToken() {
  const result = await chrome.storage.local.get(Object.values(AUTH_KEYS));
  
  if (!result[AUTH_KEYS.TOKEN]) {
    return null;
  }
  
  return {
    token: result[AUTH_KEYS.TOKEN],
    user_id: result[AUTH_KEYS.USER_ID],
    expires_at: result[AUTH_KEYS.EXPIRES_AT],
    fingerprint: result[AUTH_KEYS.FINGERPRINT],
    issued_at: result[AUTH_KEYS.ISSUED_AT]
  };
}

/**
 * Clear all auth data
 * Phase 5.3.2: Called when logout, token revoked, or user mismatch detected
 * @param {string} reason - Reason for clearing (for logging)
 */
async function clearAuthToken(reason) {
  const current = await loadAuthToken();
  
  if (current) {
    console.log('[FW Auth] Token cleared', {
      reason,
      user_id: current.user_id,
      fingerprint: current.fingerprint
    });
  }
  
  await chrome.storage.local.remove(Object.values(AUTH_KEYS));
}

/**
 * Check if token is expired
 * @returns {Promise<boolean>} True if expired or no token
 */
async function isTokenExpired() {
  const auth = await loadAuthToken();
  if (!auth || !auth.expires_at) {
    return true;
  }
  
  const expiresAt = new Date(auth.expires_at);
  const now = new Date();
  
  return now >= expiresAt;
}

// Export functions
// Note: In extension context, these are used directly without module.exports
// Make them available globally for content.js to use
if (typeof window !== 'undefined') {
  window.authStorage = {
    storeAuthToken,
    loadAuthToken,
    clearAuthToken,
    isTokenExpired
  };
}

