/**
 * User Guidance Generator
 * Standardized user-facing guidance messages for each intent type.
 */

/**
 * Generate user guidance based on detected intent
 * @param {string} intent - Detected user action intent
 * @param {object} ats - ATS detection result
 * @param {object} stage - Stage detection result
 * @returns {object} Guidance with title, what, action, and next
 */
function generateGuidance(intent, ats, stage) {
  const atsName = ats.ats_kind || 'unknown';
  
  const templates = {
    click_apply: {
      title: 'Click Apply Button',
      what: `The ${atsName} job page is loaded`,
      action: 'Click the "Apply" or "Easy Apply" button to start the application',
      after: 'The application form will open and I\'ll help you fill it'
    },
    
    click_continue: {
      title: 'Click Continue',
      what: 'You\'ve filled some fields in this application step',
      action: 'Review the form and click "Continue" or "Next" to proceed',
      after: 'I\'ll help you fill the next step'
    },
    
    login_required: {
      title: 'Sign In Required',
      what: `The ${atsName} system requires authentication`,
      action: 'Sign in with your existing account credentials',
      after: 'Once logged in, I\'ll resume the application process'
    },
    
    registration_required: {
      title: 'Create Account',
      what: `You need a ${atsName} account to apply`,
      action: 'Click "Create Account" or "Register" and complete the signup',
      after: 'After registration, I\'ll help with the application'
    },
    
    email_verification_required: {
      title: 'Verify Your Email',
      what: 'The system sent a verification email',
      action: 'Check your inbox and click the verification link',
      after: 'Return here after verification and click Continue in the popup'
    },
    
    unknown_manual: {
      title: 'Manual Action Needed',
      what: 'The application requires human attention',
      action: 'Review the page and complete any required actions',
      after: 'I\'ll detect when you\'re ready to continue'
    }
  };
  
  const template = templates[intent] || templates.unknown_manual;
  
  return {
    title: template.title,
    what_happening: template.what,
    user_action: template.action,
    what_next: template.after,
    intent: intent,
    ats_kind: atsName,
    confidence: stage.confidence
  };
}

/**
 * Generate session-aware guidance
 * @param {string} intent - User action intent
 * @param {object} ats - ATS detection result
 * @param {object} stage - Stage detection result
 * @param {object} session - Active apply session
 * @returns {object} Guidance with session context
 */
function generateSessionAwareGuidance(intent, ats, stage, session) {
  const atsName = ats.ats_kind || 'unknown';
  const taskId = session.task_id;
  const jobId = session.job_id;
  
  const templates = {
    click_apply: {
      title: 'Click Apply Button',
      what: `You are applying for job ${jobId} (Task #${taskId}). The ${atsName} job page is loaded.`,
      action: 'Click the "Apply" or "Easy Apply" button to start the application',
      after: 'The application form will open and I\'ll help you fill it'
    },
    
    click_continue: {
      title: 'Click Continue',
      what: `Continuing application for job ${jobId} (Task #${taskId})`,
      action: 'Review the form and click "Continue" or "Next" to proceed',
      after: 'I\'ll help you fill the next step'
    },
    
    login_required: {
      title: 'Sign In Required',
      what: `You are applying for job ${jobId} (Task #${taskId}). The ${atsName} system requires authentication.`,
      action: 'Sign in with your existing account credentials',
      after: 'Once logged in, I\'ll resume the application process automatically'
    },
    
    registration_required: {
      title: 'Create Account',
      what: `Applying for job ${jobId} (Task #${taskId}). You need a ${atsName} account to proceed.`,
      action: 'Click "Create Account" or "Register" and complete the signup',
      after: 'After registration, I\'ll help with the application'
    },
    
    email_verification_required: {
      title: 'Verify Your Email',
      what: `Application in progress for job ${jobId} (Task #${taskId}). The system sent a verification email.`,
      action: 'Check your inbox and click the verification link',
      after: 'Return here after verification and I\'ll continue automatically'
    },
    
    unknown_manual: {
      title: 'Manual Action Required',
      what: `You are applying for job ${jobId} (Task #${taskId}). I'm not sure what specific action is needed on this page.`,
      action: 'Please review the page and take the appropriate action (Apply, Continue, Sign In, etc.)',
      after: 'I will automatically detect when you move to the next step'
    }
  };
  
  const template = templates[intent] || templates.unknown_manual;
  
  return {
    title: template.title,
    what_happening: template.what,
    user_action: template.action,
    what_next: template.after,
    intent: intent,
    ats_kind: atsName,
    confidence: stage.confidence,
    task_id: taskId,
    job_id: jobId
  };
}

/**
 * Extract company name from page
 * Simple heuristic - can be enhanced later
 * @returns {string} Company name or fallback
 */
function extractCompanyName() {
  // Try h1 first (common pattern)
  const h1 = document.querySelector('h1');
  if (h1) {
    const text = h1.textContent.trim();
    if (text.length > 0 && text.length < 50) {
      return text;
    }
  }
  
  // Try meta tags
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName && ogSiteName.content) {
    return ogSiteName.content;
  }
  
  // Fallback to hostname
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    // Get the main domain part (e.g., 'linkedin' from 'www.linkedin.com')
    const mainPart = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  } catch (_) {
    return 'this employer';
  }
}

/**
 * Calculate apply flow step based on page intent
 * @param {string} pageIntent - Current page intent
 * @returns {object} Step info with current, total, and label
 */
function calculateApplyStep(pageIntent) {
  // Simple step mapping (approximate is OK)
  const stepMap = {
    job_landing: 1,
    apply_entry: 2,
    login_required: 3,
    account_creation: 3,
    application_form: 4,
    post_submit: 5
  };
  
  const currentStep = stepMap[pageIntent] || 1;
  
  return {
    current: currentStep,
    total: 5,
    label: getStepLabel(currentStep)
  };
}

/**
 * Get human-readable label for step number
 * @param {number} step - Step number (1-5)
 * @returns {string} Step label
 */
function getStepLabel(step) {
  const labels = {
    1: 'Job Page',
    2: 'Starting Application',
    3: 'Authentication',
    4: 'Application Form',
    5: 'Submitted'
  };
  return labels[step] || 'In Progress';
}

/**
 * Generate intent-based guidance (Phase 4.2 UX upgrade)
 * Maps page intent to human-readable, reassuring guidance
 * @param {object} pageIntent - Page intent classification result
 * @param {object} session - Active apply session
 * @returns {object} Enhanced guidance with title, instruction, reassurance, what_next, step
 */
function generateIntentBasedGuidance(pageIntent, session) {
  const taskId = session.task_id;
  const jobId = session.job_id;
  const companyName = extractCompanyName();
  
  const guidanceMap = {
    job_landing: {
      title: 'Viewing Job Listing',
      instruction: "You're viewing a job description. Click Apply when you're ready to begin.",
      reassurance: "I'll guide you through each step of the application process.",
      whatNext: "Next: You'll be directed to the employer's application site."
    },
    
    apply_entry: {
      title: 'Ready to Apply',
      instruction: 'Click the Apply or Continue button to start your application.',
      reassurance: "I'll stay with you and track your progress automatically.",
      whatNext: "Next: You may be asked to log in or create an account."
    },
    
    login_required: {
      title: 'Sign In Required',
      instruction: 'Sign in with your existing account to continue.',
      reassurance: "After signing in, I'll resume tracking automatically.",
      whatNext: "Next: You'll return to the application flow."
    },
    
    account_creation: {
      title: 'Create Account',
      instruction: 'Create a new account with this employer to apply.',
      reassurance: "I'm tracking this step and will continue once you're done.",
      whatNext: "Next: You'll proceed to the application form."
    },
    
    application_form: {
      title: 'Application Form',
      instruction: "Complete the form with your information. I'm staying active to track your progress.",
      reassurance: "I'll detect when you move to the next step.",
      whatNext: "Next: Submit when all required fields are complete."
    },
    
    post_submit: {
      title: 'Application Submitted',
      instruction: 'Your application appears to be submitted successfully.',
      reassurance: "I've saved this completion for tracking.",
      whatNext: "You can close this tab or mark this task as complete in the popup."
    }
  };
  
  const guidance = guidanceMap[pageIntent.intent] || guidanceMap.job_landing;
  const step = calculateApplyStep(pageIntent.intent);
  
  return {
    title: guidance.title,
    instruction: guidance.instruction,
    reassurance: guidance.reassurance,
    what_next: guidance.whatNext,
    company: companyName,
    task_id: taskId,
    job_id: jobId,
    intent: pageIntent.intent,
    confidence: pageIntent.confidence,
    step: step,
    progress_text: `Step ${step.current} of ${step.total}: ${step.label}`
  };
}

