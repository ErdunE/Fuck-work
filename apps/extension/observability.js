/**
 * Observability Client - Phase 5.3.0
 * 
 * Production-grade observability logging for browser extension.
 * Features:
 * - Run-based correlation
 * - Batch event streaming
 * - Auto-flush with configurable interval
 * - Automatic redaction of sensitive data
 * - Queue management with cap
 * - Resilient to backend failures
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

class ObservabilityClient {
  constructor() {
    this.currentRunId = null;
    this.eventQueue = [];
    this.maxQueueSize = 200;
    this.flushInterval = 5000;  // 5 seconds
    this.flushTimer = null;
  }

  /**
   * Start a new observability run.
   * Call this at the beginning of an apply session.
   * 
   * @param {Object} session - Apply session context (task_id, job_id)
   * @param {Object} pageContext - Page detection context (ats_kind, intent, stage, urls)
   * @returns {Promise<number|null>} run_id or null if failed
   */
  async startRun(session, pageContext) {
    const payload = {
      task_id: session.task_id || null,
      job_id: session.job_id || null,
      initial_url: pageContext.initial_url || window.location.href,
      current_url: window.location.href,
      ats_kind: pageContext.ats_kind || 'unknown',
      intent: pageContext.intent || 'unknown',
      stage: pageContext.stage || 'analyzing'
    };
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/observability/runs/start`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentRunId = data.run_id;
        console.log('[Observability] Run started:', this.currentRunId);
        this.startAutoFlush();
        
        // Log run_started event
        this.enqueue({
          source: 'extension',
          severity: 'info',
          event_name: 'run_started',
          url: window.location.href,
          payload: {
            task_id: session.task_id,
            job_id: session.job_id,
            ats_kind: pageContext.ats_kind,
            initial_url: pageContext.initial_url
          }
        });
        
        return this.currentRunId;
      } else {
        console.error('[Observability] Failed to start run:', response.status);
      }
    } catch (error) {
      console.error('[Observability] Failed to start run:', error);
    }
    return null;
  }

  /**
   * Enqueue an event for batch sending.
   * Events are automatically redacted and timestamped.
   * 
   * @param {Object} event - Event payload
   */
  enqueue(event) {
    if (!this.currentRunId) {
      console.warn('[Observability] No run_id, skipping event:', event.event_name);
      return;
    }
    
    // Add timestamp
    event.ts = new Date().toISOString();
    
    // Redact sensitive data
    event = this.redact(event);
    
    this.eventQueue.push(event);
    
    // Cap queue size (drop oldest if full)
    if (this.eventQueue.length > this.maxQueueSize) {
      const dropped = this.eventQueue.shift();
      console.warn('[Observability] Queue full, dropped oldest event:', dropped.event_name);
    }
  }

  /**
   * Redact sensitive data from event payload.
   * Phase 5.3.0: Non-negotiable redaction rules.
   * 
   * @param {Object} event - Event to redact
   * @returns {Object} Redacted event
   */
  redact(event) {
    if (event.payload) {
      // Remove tokens
      delete event.payload.jwt;
      delete event.payload.access_token;
      delete event.payload.token;
      delete event.payload.password;
      
      // Mask email (keep first 2 chars + domain)
      if (event.payload.email) {
        event.payload.email = this.maskEmail(event.payload.email);
      }
      
      // Mask phone (keep last 4 digits)
      if (event.payload.phone) {
        event.payload.phone = this.maskPhone(event.payload.phone);
      }
      
      // Don't log full resume/cover letter text
      if (event.payload.resume_text) {
        event.payload.resume_text = `[REDACTED: ${event.payload.resume_text.length} chars]`;
      }
      if (event.payload.cover_letter) {
        event.payload.cover_letter = `[REDACTED: ${event.payload.cover_letter.length} chars]`;
      }
    }
    return event;
  }

  /**
   * Mask email address for logging.
   * Example: john.doe@example.com -> jo***@example.com
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  /**
   * Mask phone number for logging.
   * Example: +1-555-123-4567 -> +1-555-***-4567
   */
  maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    // Keep last 4 digits, mask others
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  /**
   * Get authentication headers for API calls.
   */
  async getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Try to get JWT token from AuthManager
    if (typeof AuthManager !== 'undefined') {
      const token = await AuthManager.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Flush queued events to backend (batch).
   * Called automatically on timer and manually.
   */
  async flush() {
    if (this.eventQueue.length === 0 || !this.currentRunId) {
      return;
    }
    
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/observability/events/batch`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          run_id: this.currentRunId,
          events: eventsToSend
        })
      });
      
      if (response.ok) {
        console.log(`[Observability] Flushed ${eventsToSend.length} events`);
      } else {
        console.warn('[Observability] Flush failed, requeueing events');
        // Requeue events (keep newest maxQueueSize events)
        this.eventQueue = [...eventsToSend, ...this.eventQueue].slice(0, this.maxQueueSize);
      }
    } catch (error) {
      console.error('[Observability] Flush error:', error);
      // Requeue events on network error
      this.eventQueue = [...eventsToSend, ...this.eventQueue].slice(0, this.maxQueueSize);
    }
  }

  /**
   * Start auto-flush timer.
   * Events are flushed every N seconds while run is active.
   */
  startAutoFlush() {
    this.stopAutoFlush();
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Stop auto-flush timer.
   */
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * End the current run and perform final flush.
   * Call this when apply session completes/fails/abandons.
   */
  async endRun(status = 'completed', failure_reason = null) {
    if (!this.currentRunId) {
      return;
    }
    
    // Log run_completed/run_failed/run_abandoned event
    const event_name = status === 'success' ? 'run_completed' : 
                       status === 'failed' ? 'run_failed' : 
                       'run_abandoned';
    
    this.enqueue({
      source: 'extension',
      severity: status === 'failed' ? 'error' : 'info',
      event_name: event_name,
      url: window.location.href,
      payload: {
        run_id: this.currentRunId,
        status: status,
        failure_reason: failure_reason
      }
    });
    
    // Final flush
    await this.flush();
    
    // Cleanup
    this.stopAutoFlush();
    this.currentRunId = null;
    console.log('[Observability] Run ended:', event_name);
  }

  /**
   * Get current run ID.
   * @returns {number|null}
   */
  getRunId() {
    return this.currentRunId;
  }
}

// Global singleton instance
const observabilityClient = new ObservabilityClient();

// Best-effort flush on page unload
window.addEventListener('beforeunload', () => {
  if (observabilityClient.getRunId()) {
    // Use sendBeacon for best-effort delivery
    const headers = { 'Content-Type': 'application/json' };
    const eventsToSend = observabilityClient.eventQueue;
    if (eventsToSend.length > 0) {
      navigator.sendBeacon(
        `${API_BASE_URL}/api/observability/events/batch`,
        JSON.stringify({
          run_id: observabilityClient.getRunId(),
          events: eventsToSend
        })
      );
    }
  }
});

