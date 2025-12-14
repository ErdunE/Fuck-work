/**
 * ATS Detection Types and Evidence Builder
 * Shared types for ATS detection and state machine.
 */

// ATS platforms
const ATS_KIND = {
  WORKDAY: 'workday',
  GREENHOUSE: 'greenhouse',
  LEVER: 'lever',
  ICIMS: 'icims',
  UNKNOWN: 'unknown'
};

// Application stages
const APPLY_STAGE = {
  LANDING: 'landing',
  LOGIN_REQUIRED: 'login_required',
  VERIFICATION_REQUIRED: 'verification_required',
  FORM_FILLING: 'form_filling',
  READY_TO_SUBMIT: 'ready_to_submit',
  SUBMITTED: 'submitted',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown'
};

// Detection confidence levels
const DETECTION_CONFIDENCE = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Create evidence object with timestamp
 * @param {string} type - Evidence type (e.g., 'url_match', 'dom_marker')
 * @param {string} message - Human-readable description
 * @param {*} data - Optional additional data
 * @returns {object} Evidence object with timestamp
 */
function makeEvidence(type, message, data = null) {
  const evidence = {
    type,
    message,
    ts: new Date().toISOString()
  };
  
  if (data !== null) {
    evidence.data = data;
  }
  
  return evidence;
}

