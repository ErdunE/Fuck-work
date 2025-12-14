/**
 * API client for FuckWork backend.
 * Phase 5.0: JWT authentication enabled.
 * Handles all HTTP communication with the backend.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';
const USER_ID = 1; // Backward compatibility fallback

class APIClient {
  /**
   * Get authorization headers (Phase 5.0)
   * Returns headers object with JWT token if available
   */
  static async getAuthHeaders() {
    // Phase 5.3.3: Auth headers construction logging
    console.group('[FW API][Auth Headers]');
    console.log('Loading auth for API request');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Try to get JWT token (Phase 5.0)
    if (typeof AuthManager !== 'undefined') {
      const token = await AuthManager.getToken();
      console.log('Has token:', !!token);
      if (token) {
        // Get user info for logging (don't log token itself)
        const userInfo = await AuthManager.getUserInfo();
        console.log('user_id:', userInfo?.user_id);
        console.log('email:', userInfo?.email);
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      console.log('AuthManager not available');
    }
    
    console.groupEnd();
    
    return headers;
  }
  /**
   * Get next queued apply task
   */
  static async getNextTask() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/apply/tasks?user_id=${USER_ID}&status=queued&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tasks.length > 0 ? data.tasks[0] : null;
    } catch (error) {
      console.error('Failed to get next task:', error);
      return null;
    }
  }
  
  /**
   * Get task by ID
   */
  static async getTask(taskId) {
    try {
      const response = await fetch(`${API_BASE_URL}/apply/tasks/${taskId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }
  
  /**
   * Transition task status
   */
  static async transitionTask(taskId, toStatus, reason = null, details = {}) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/apply/tasks/${taskId}/transition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to_status: toStatus,
            reason: reason,
            details: details
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || response.statusText);
      }

      const echoedDetectionId = response.headers.get('X-FW-Detection-Id');
      if (echoedDetectionId) {
        console.log('[FW Detection] Backend echoed detection_id', { detection_id: echoedDetectionId });
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to transition task:', error);
      throw error;
    }
  }
  
  /**
   * Get job details by job_id
   */
  static async getJob(jobId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/jobs/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filters: { job_id: jobId },
            limit: 1
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.jobs.length > 0 ? data.jobs[0] : null;
    } catch (error) {
      console.error('Failed to get job:', error);
      return null;
    }
  }
  
  /**
   * Get user profile for autofill (Phase 3.6 - backward compat)
   */
  static async getUserProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }
  
  // ============================================
  // Phase 5.0 API Methods
  // ============================================
  
  /**
   * Get current user's profile (Phase 5.0 - authenticated)
   * Authoritative source for autofill operations
   */
  /**
   * Get raw profile (Phase 5.0 - DEPRECATED in Phase 5.2.1)
   * @deprecated Use getMyDerivedProfile() instead for autofill operations
   */
  static async getMyProfile() {
    console.warn('[DEPRECATED] getMyProfile() - Autofill should use getMyDerivedProfile() instead');
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to get profile:', error);
      return null;
    }
  }
  
  /**
   * Get derived ATS-ready profile (Phase 5.2.1 - REQUIRED FOR AUTOFILL)
   * This endpoint returns computed, ATS-ready answers from raw profile data.
   * Extension autofill MUST use this endpoint exclusively.
   */
  static async getMyDerivedProfile() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/derived-profile`, { headers });
      
      if (!response.ok) {
        console.error('[FW API] Failed to fetch derived profile:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const derived = await response.json();
      console.log('[FW API] Derived profile fetched successfully');
      return derived;
    } catch (error) {
      console.error('[FW API] Failed to get derived profile:', error);
      return null;
    }
  }
  
  /**
   * Get automation preferences (Phase 5.0 - CRITICAL)
   * Extension polls this endpoint for preference updates
   */
  static async getAutomationPreferences() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/automation-preferences`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to get automation preferences:', error);
      return null;
    }
  }
  
  /**
   * Update automation preferences (Phase 5.0)
   */
  static async updateAutomationPreferences(updates) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/users/me/automation-preferences`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(updates)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to update automation preferences:', error);
      throw error;
    }
  }
  
  /**
   * Log automation event (Phase 5.0 - audit log)
   */
  static async logAutomationEvent(eventData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/users/me/automation-events`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(eventData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to log automation event:', error);
      // Don't throw - logging failure should not break automation
      return null;
    }
  }
  
  /**
   * Get apply tasks (Phase 5.0 - read-only visibility)
   */
  static async getMyApplyTasks(status = null, limit = 50, offset = 0) {
    try {
      const headers = await this.getAuthHeaders();
      let url = `${API_BASE_URL}/api/users/me/apply-tasks?limit=${limit}&offset=${offset}`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to get apply tasks:', error);
      return null;
    }
  }
  
  /**
   * Get specific apply task detail (Phase 5.0)
   */
  static async getMyApplyTask(taskId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/apply-tasks/${taskId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to get apply task:', error);
      return null;
    }
  }
  
  /**
   * Get active apply session from backend (Phase 5.3.1 - Session Bridge)
   * Extension uses this to deterministically attach to the correct apply run.
   */
  static async getMyActiveSession() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/active-session`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active session: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[FW API] Failed to get active session:', error);
      throw error;
    }
  }
  
  /**
   * Clear active apply session (Phase 5.3.1 - Session Bridge)
   * Called when run completes, fails, or user cancels.
   */
  static async clearMyActiveSession() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/active-session`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        console.warn('[FW API] Failed to clear active session:', response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('[FW API] Failed to clear active session:', error);
      // Don't throw - clearing session failure should not break flow
      return null;
    }
  }
}

