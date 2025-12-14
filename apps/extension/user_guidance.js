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

