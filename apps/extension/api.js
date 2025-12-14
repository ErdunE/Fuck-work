/**
 * API client for FuckWork backend.
 * Handles all HTTP communication with the backend.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';
const USER_ID = 1; // Hardcoded for Phase 3.6

class APIClient {
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
   * Get user profile for autofill
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
}

