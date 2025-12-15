/**
 * Observability Client - Phase A
 * 
 * Production-grade observability logging for browser extension.
 * Token-based auth with Bearer authorization.
 */

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
   */
  async startRun(session, pageContext) {
    // Check if run_id already set from session bridge
    if (this.currentRunId) {
      console.log('[Observability] Run already started from session bridge:', this.currentRunId);
      this.startAutoFlush();
      return this.currentRunId;
    }
    
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
      const response = await fetch(`${API_BASE_URL}/api/observability/runs/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
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

  maskEmail(email) {
    if (!email || typeof email !== 'string') return '[MASKED]';
    const parts = email.split('@');
    if (parts.length !== 2) return '[MASKED]';
    const local = parts[0];
    return local.substring(0, 2) + '***@' + parts[1];
  }

  maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '[MASKED]';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return '***' + digits.slice(-4);
  }

  /**
   * Flush queued events to backend (batch).
   */
  async flush() {
    if (this.eventQueue.length === 0 || !this.currentRunId) {
      return;
    }
    
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/observability/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
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
   * Get current run_id.
   */
  getRunId() {
    return this.currentRunId;
  }

  /**
   * End run (flush and stop auto-flush).
   */
  async endRun() {
    await this.flush();
    this.stopAutoFlush();
    this.currentRunId = null;
    console.log('[Observability] Run ended');
  }
}
