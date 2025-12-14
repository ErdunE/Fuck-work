/**
 * Apply Stage Detector
 * Detects current application stage with ATS-specific and general heuristics.
 */

/**
 * Detect current application stage
 * @param {string} ats_kind - Detected ATS platform
 * @returns {object} Detection result with stage, confidence, and evidence
 */
function detectApplyStage(ats_kind) {
  const evidence = [];
  let stage = APPLY_STAGE.UNKNOWN;
  let confidence = DETECTION_CONFIDENCE.LOW;
  
  const url = window.location.href.toLowerCase();
  const bodyText = document.body ? document.body.textContent.toLowerCase() : '';
  const pageTitle = document.title.toLowerCase();
  
  // General detection rules (apply to all platforms)
  
  // Check for blocked/access denied
  if (bodyText.includes('access denied') || 
      bodyText.includes('unusual traffic') ||
      bodyText.includes('temporarily blocked') ||
      bodyText.includes('security check')) {
    evidence.push(makeEvidence(
      'blocked_detection',
      'Found blocked/access denied text in page',
      { matches: ['access denied', 'unusual traffic', 'blocked'] }
    ));
    stage = APPLY_STAGE.BLOCKED;
    confidence = DETECTION_CONFIDENCE.HIGH;
    return { stage, confidence, evidence };
  }
  
  // Check for submission confirmation
  if (bodyText.includes('application submitted') ||
      bodyText.includes('thank you for applying') ||
      bodyText.includes('we received your application') ||
      bodyText.includes('application received') ||
      bodyText.includes('successfully submitted')) {
    evidence.push(makeEvidence(
      'submitted_detection',
      'Found application submission confirmation text',
      { matches: ['submitted', 'received', 'thank you'] }
    ));
    stage = APPLY_STAGE.SUBMITTED;
    confidence = DETECTION_CONFIDENCE.HIGH;
    return { stage, confidence, evidence };
  }
  
  // Check for verification/captcha requirements
  const hasCaptcha = document.querySelector('.g-recaptcha, .h-captcha, [class*="captcha"]') !== null;
  const verificationText = bodyText.includes('verification code') ||
                          bodyText.includes('enter code') ||
                          bodyText.includes('otp') ||
                          bodyText.includes('two-factor') ||
                          bodyText.includes('2fa') ||
                          bodyText.includes('mfa') ||
                          bodyText.includes('multi-factor');
  
  if (hasCaptcha || verificationText) {
    if (hasCaptcha) {
      evidence.push(makeEvidence(
        'verification_detection',
        'Found CAPTCHA element on page',
        { captcha_type: 'recaptcha or hcaptcha' }
      ));
    }
    if (verificationText) {
      evidence.push(makeEvidence(
        'verification_detection',
        'Found verification/2FA text in page',
        { type: 'code_verification' }
      ));
    }
    stage = APPLY_STAGE.VERIFICATION_REQUIRED;
    confidence = DETECTION_CONFIDENCE.HIGH;
    return { stage, confidence, evidence };
  }
  
  // Check for login requirement
  const passwordInput = document.querySelector('input[type="password"]');
  const loginButtons = Array.from(document.querySelectorAll('button, input[type="submit"], a')).filter(el => {
    const text = el.textContent.toLowerCase() || el.value?.toLowerCase() || '';
    return text.includes('sign in') || text.includes('log in') || text.includes('login');
  });
  
  const loginFormAction = Array.from(document.querySelectorAll('form')).some(form => {
    const action = (form.action || '').toLowerCase();
    return action.includes('login') || action.includes('signin');
  });
  
  if (passwordInput && (loginButtons.length > 0 || loginFormAction)) {
    evidence.push(makeEvidence(
      'login_detection',
      'Found password input with login button or form action',
      { 
        has_password: true,
        login_buttons: loginButtons.length,
        login_form_action: loginFormAction
      }
    ));
    stage = APPLY_STAGE.LOGIN_REQUIRED;
    confidence = DETECTION_CONFIDENCE.HIGH;
    return { stage, confidence, evidence };
  }
  
  // ATS-specific detection
  
  if (ats_kind === ATS_KIND.WORKDAY) {
    // Workday-specific rules
    
    if (url.includes('/login') || url.includes('signin')) {
      evidence.push(makeEvidence(
        'workday_login',
        'URL contains login/signin path',
        { url_fragment: 'login' }
      ));
      stage = APPLY_STAGE.LOGIN_REQUIRED;
      confidence = DETECTION_CONFIDENCE.HIGH;
      return { stage, confidence, evidence };
    }
    
    if (pageTitle.includes('sign in') && passwordInput) {
      evidence.push(makeEvidence(
        'workday_login',
        'Page title indicates sign in and password input present',
        null
      ));
      stage = APPLY_STAGE.LOGIN_REQUIRED;
      confidence = DETECTION_CONFIDENCE.HIGH;
      return { stage, confidence, evidence };
    }
    
    // Check for application form
    if (url.includes('/job/') || url.includes('/apply/')) {
      const submitButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.toLowerCase().includes('submit')
      );
      
      const hasFormFields = document.querySelectorAll('input[type="text"], input[type="email"], textarea').length > 2;
      
      if (submitButton && hasFormFields) {
        evidence.push(makeEvidence(
          'workday_form',
          'Found submit button and form fields in application URL',
          { has_submit: true, field_count: hasFormFields }
        ));
        
        // Check for inline errors to determine if ready to submit
        const hasErrors = document.querySelectorAll('[data-automation-id*="error"], .error, [class*="error"]').length > 0;
        
        if (!hasErrors) {
          stage = APPLY_STAGE.READY_TO_SUBMIT;
          confidence = DETECTION_CONFIDENCE.MEDIUM;
        } else {
          stage = APPLY_STAGE.FORM_FILLING;
          confidence = DETECTION_CONFIDENCE.HIGH;
        }
        
        return { stage, confidence, evidence };
      } else if (hasFormFields) {
        evidence.push(makeEvidence(
          'workday_form',
          'Found form fields in application URL',
          null
        ));
        stage = APPLY_STAGE.FORM_FILLING;
        confidence = DETECTION_CONFIDENCE.MEDIUM;
        return { stage, confidence, evidence };
      }
    }
  }
  
  if (ats_kind === ATS_KIND.GREENHOUSE) {
    // Greenhouse-specific rules
    
    if (url.match(/\/jobs\/\d+/) || url.includes('application')) {
      const hasFormFields = document.querySelectorAll('input[type="text"], input[type="email"], textarea, input[type="file"]').length > 0;
      const submitButton = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(btn => {
        const text = btn.textContent.toLowerCase() || btn.value?.toLowerCase() || '';
        return text.includes('submit application') || text.includes('submit');
      });
      
      if (hasFormFields) {
        evidence.push(makeEvidence(
          'greenhouse_form',
          'Found application form fields',
          { has_fields: true }
        ));
        
        if (submitButton) {
          stage = APPLY_STAGE.READY_TO_SUBMIT;
          confidence = DETECTION_CONFIDENCE.HIGH;
          evidence.push(makeEvidence(
            'greenhouse_submit',
            'Found "Submit application" button',
            null
          ));
        } else {
          stage = APPLY_STAGE.FORM_FILLING;
          confidence = DETECTION_CONFIDENCE.HIGH;
        }
        
        return { stage, confidence, evidence };
      }
    }
  }
  
  if (ats_kind === ATS_KIND.LEVER) {
    // Lever-specific rules
    
    const hasResumeUpload = document.querySelector('input[type="file"]') !== null;
    const hasApplicationForm = document.querySelectorAll('input[type="text"], input[type="email"]').length > 2;
    
    if (hasApplicationForm || hasResumeUpload) {
      evidence.push(makeEvidence(
        'lever_form',
        'Found application form with resume upload',
        { has_resume_upload: hasResumeUpload }
      ));
      
      const submitButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.toLowerCase().includes('submit')
      );
      
      if (submitButton) {
        stage = APPLY_STAGE.READY_TO_SUBMIT;
        confidence = DETECTION_CONFIDENCE.HIGH;
        evidence.push(makeEvidence(
          'lever_submit',
          'Found submit button',
          null
        ));
      } else {
        stage = APPLY_STAGE.FORM_FILLING;
        confidence = DETECTION_CONFIDENCE.MEDIUM;
      }
      
      return { stage, confidence, evidence };
    }
  }
  
  if (ats_kind === ATS_KIND.ICIMS) {
    // iCIMS-specific rules
    
    if (url.includes('candidate') && passwordInput) {
      evidence.push(makeEvidence(
        'icims_login',
        'Candidate portal login detected',
        null
      ));
      stage = APPLY_STAGE.LOGIN_REQUIRED;
      confidence = DETECTION_CONFIDENCE.HIGH;
      return { stage, confidence, evidence };
    }
    
    const hasFormFields = document.querySelectorAll('input[type="text"], input[type="email"], textarea').length > 2;
    
    if (hasFormFields) {
      evidence.push(makeEvidence(
        'icims_form',
        'Found application form',
        null
      ));
      
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
      
      if (submitButton) {
        stage = APPLY_STAGE.READY_TO_SUBMIT;
        confidence = DETECTION_CONFIDENCE.MEDIUM;
      } else {
        stage = APPLY_STAGE.FORM_FILLING;
        confidence = DETECTION_CONFIDENCE.MEDIUM;
      }
      
      return { stage, confidence, evidence };
    }
  }
  
  // Fallback: general form detection
  const hasAnyFormFields = document.querySelectorAll('input[type="text"], input[type="email"], textarea').length > 2;
  const hasSubmitButton = document.querySelector('button[type="submit"], input[type="submit"]') !== null;
  
  if (hasAnyFormFields) {
    evidence.push(makeEvidence(
      'general_form',
      'Found general form fields',
      { field_count: hasAnyFormFields }
    ));
    
    if (hasSubmitButton) {
      stage = APPLY_STAGE.READY_TO_SUBMIT;
      confidence = DETECTION_CONFIDENCE.LOW;
    } else {
      stage = APPLY_STAGE.FORM_FILLING;
      confidence = DETECTION_CONFIDENCE.LOW;
    }
    
    return { stage, confidence, evidence };
  }
  
  // If nothing detected, return unknown
  evidence.push(makeEvidence(
    'unknown_stage',
    'Could not determine application stage from page content',
    null
  ));
  
  console.log('[Stage Detector]', { stage, confidence, evidence });
  
  return { stage, confidence, evidence };
}

