/**
 * Page Intent Classifier
 * Lightweight heuristic-based classification for application flow pages.
 * Pure UX upgrade - no AI, no perfect accuracy required.
 */

const PAGE_INTENT = {
  JOB_LANDING: 'job_landing',          // Viewing job description
  APPLY_ENTRY: 'apply_entry',          // Ready to start application
  LOGIN_REQUIRED: 'login_required',     // Must sign in
  ACCOUNT_CREATION: 'account_creation', // Must create account
  APPLICATION_FORM: 'application_form', // Filling out application
  POST_SUBMIT: 'post_submit'           // Application submitted
};

/**
 * Find buttons containing specific text patterns
 * @param {string[]} patterns - Text patterns to search for
 * @returns {HTMLElement[]} Array of matching button elements
 */
function findButtonsWithText(patterns) {
  const buttons = [];
  const candidates = document.querySelectorAll('button, a[role="button"], input[type="submit"], input[type="button"]');
  
  for (const el of candidates) {
    const text = el.textContent?.toLowerCase() || '';
    const value = el.value?.toLowerCase() || '';
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    const combined = `${text} ${value} ${ariaLabel}`;
    
    for (const pattern of patterns) {
      if (combined.includes(pattern.toLowerCase())) {
        buttons.push(el);
        break;
      }
    }
  }
  
  return buttons;
}

/**
 * Classify current page intent based on heuristics
 * @returns {object} Intent classification with confidence and evidence
 */
function classifyPageIntent() {
  const bodyText = document.body?.textContent.toLowerCase() || '';
  const url = window.location.href.toLowerCase();
  
  // Priority 1: Post-submit detection (highest confidence)
  if (bodyText.includes('application submitted') ||
      bodyText.includes('thank you for applying') ||
      bodyText.includes('we received your application') ||
      bodyText.includes('application received') ||
      bodyText.includes('successfully submitted') ||
      bodyText.includes('thanks for applying')) {
    return {
      intent: PAGE_INTENT.POST_SUBMIT,
      confidence: 'high',
      evidence: ['submission confirmation text']
    };
  }
  
  // Priority 2: Login detection
  const hasPasswordField = document.querySelector('input[type="password"]') !== null;
  const hasLoginButton = findButtonsWithText(['sign in', 'log in', 'login']).length > 0;
  
  if (hasPasswordField && hasLoginButton) {
    return {
      intent: PAGE_INTENT.LOGIN_REQUIRED,
      confidence: 'high',
      evidence: ['password field', 'login button']
    };
  }
  
  // Priority 3: Account creation
  if ((bodyText.includes('create account') || 
       bodyText.includes('sign up') || 
       bodyText.includes('register')) &&
      hasPasswordField) {
    return {
      intent: PAGE_INTENT.ACCOUNT_CREATION,
      confidence: 'medium',
      evidence: ['create account text', 'password field']
    };
  }
  
  // Priority 4: Application form (multi-field detection)
  const formFields = document.querySelectorAll('input:not([type="hidden"]), textarea, select').length;
  const hasFileUpload = document.querySelector('input[type="file"]') !== null;
  
  // Strong signals: file upload or many fields
  if (hasFileUpload || formFields >= 5) {
    const evidenceList = [];
    if (formFields >= 5) evidenceList.push(`${formFields} form fields`);
    if (hasFileUpload) evidenceList.push('file upload field');
    
    return {
      intent: PAGE_INTENT.APPLICATION_FORM,
      confidence: hasFileUpload ? 'high' : 'medium',
      evidence: evidenceList
    };
  }
  
  // Priority 5: Apply entry (buttons to start application)
  const applyButtons = findButtonsWithText([
    'apply', 'apply now', 'start application', 'continue', 'easy apply', 'quick apply'
  ]);
  
  if (applyButtons.length > 0) {
    return {
      intent: PAGE_INTENT.APPLY_ENTRY,
      confidence: 'high',
      evidence: [`${applyButtons.length} apply/continue button(s)`]
    };
  }
  
  // Default: Job landing page (viewing description)
  // This is a safe fallback - better to assume viewing than to misclassify
  return {
    intent: PAGE_INTENT.JOB_LANDING,
    confidence: 'low',
    evidence: ['no specific signals, defaulting to job landing']
  };
}

