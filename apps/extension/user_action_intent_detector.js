/**
 * User Action Intent Detector
 * Semantic layer that interprets stage into actionable user intent.
 */

// User action intent types
const USER_ACTION_INTENT = {
  CLICK_APPLY: 'click_apply',
  CLICK_CONTINUE: 'click_continue',
  LOGIN_REQUIRED: 'login_required',
  REGISTRATION_REQUIRED: 'registration_required',
  EMAIL_VERIFICATION_REQUIRED: 'email_verification_required',
  UNKNOWN_MANUAL: 'unknown_manual'
};

/**
 * Detect what action the user needs to take
 * @param {object} ats - ATS detection result
 * @param {object} stage - Stage detection result
 * @returns {object} Intent with confidence and evidence
 */
function detectUserActionIntent(ats, stage) {
  const evidence = [];
  let intent = USER_ACTION_INTENT.UNKNOWN_MANUAL;
  let confidence = DETECTION_CONFIDENCE.LOW;
  
  const url = window.location.href.toLowerCase();
  const bodyText = document.body?.textContent.toLowerCase() || '';
  
  // Rule 1: Click Apply detection
  // Look for "Apply" or "Easy Apply" buttons on landing pages
  if (stage.stage === APPLY_STAGE.LANDING) {
    const applyButtons = findButtonsWithText([
      'apply', 'easy apply', 'apply now', 'apply for this job',
      'apply for position', 'submit application'
    ]);
    
    if (applyButtons.length > 0) {
      intent = USER_ACTION_INTENT.CLICK_APPLY;
      confidence = DETECTION_CONFIDENCE.HIGH;
      evidence.push(makeEvidence(
        'intent_button',
        `Found ${applyButtons.length} apply button(s)`,
        { button_texts: applyButtons.slice(0, 3).map(b => b.textContent.trim()) }
      ));
    } else {
      // Still on landing, but button not clearly detected
      evidence.push(makeEvidence(
        'intent_landing',
        'Landing page detected but no clear apply button',
        { stage: stage.stage }
      ));
    }
  }
  
  // Rule 2: Click Continue detection
  // Look for Continue/Next buttons in multi-step forms
  if (stage.stage === APPLY_STAGE.FORM_FILLING || stage.stage === APPLY_STAGE.READY_TO_SUBMIT) {
    const continueButtons = findButtonsWithText([
      'continue', 'next', 'proceed', 'next step', 'save and continue'
    ]);
    
    if (continueButtons.length > 0) {
      intent = USER_ACTION_INTENT.CLICK_CONTINUE;
      confidence = DETECTION_CONFIDENCE.MEDIUM;
      evidence.push(makeEvidence(
        'intent_button',
        `Found ${continueButtons.length} continue/next button(s)`,
        { button_texts: continueButtons.slice(0, 3).map(b => b.textContent.trim()) }
      ));
    }
  }
  
  // Rule 3: Login required
  if (stage.stage === APPLY_STAGE.LOGIN_REQUIRED) {
    // Check if registration is needed vs login
    const hasRegisterText = bodyText.includes('create account') ||
                           bodyText.includes('sign up') ||
                           bodyText.includes('register') ||
                           bodyText.includes('new user') ||
                           bodyText.includes('don\'t have an account');
    
    const registerButtons = findButtonsWithText([
      'create account', 'sign up', 'register', 'new user', 'create profile'
    ]);
    
    // If strong registration signals, mark as registration required
    if (hasRegisterText && registerButtons.length > 0) {
      intent = USER_ACTION_INTENT.REGISTRATION_REQUIRED;
      confidence = DETECTION_CONFIDENCE.MEDIUM;
      evidence.push(makeEvidence(
        'intent_registration',
        'Registration form detected',
        { has_register_text: true, button_count: registerButtons.length }
      ));
    } else {
      // Default to login required
      intent = USER_ACTION_INTENT.LOGIN_REQUIRED;
      confidence = DETECTION_CONFIDENCE.HIGH;
      evidence.push(makeEvidence(
        'intent_auth',
        'Login form detected',
        { stage: stage.stage }
      ));
    }
  }
  
  // Rule 4: Email verification
  if (stage.stage === APPLY_STAGE.VERIFICATION_REQUIRED) {
    const hasEmailVerify = bodyText.includes('check your email') ||
                          bodyText.includes('verify your email') ||
                          bodyText.includes('confirmation email') ||
                          bodyText.includes('sent to your inbox') ||
                          bodyText.includes('check your inbox') ||
                          bodyText.includes('verify email address');
    
    if (hasEmailVerify) {
      intent = USER_ACTION_INTENT.EMAIL_VERIFICATION_REQUIRED;
      confidence = DETECTION_CONFIDENCE.HIGH;
      evidence.push(makeEvidence(
        'intent_email_verify',
        'Email verification message detected',
        { text_found: true }
      ));
    } else {
      // Generic verification (could be CAPTCHA, 2FA, etc.)
      evidence.push(makeEvidence(
        'intent_verification',
        'Verification required but type unclear',
        { stage: stage.stage }
      ));
    }
  }
  
  // Rule 5: Blocked - needs manual intervention
  if (stage.stage === APPLY_STAGE.BLOCKED) {
    evidence.push(makeEvidence(
      'intent_blocked',
      'Access blocked - manual intervention required',
      { stage: stage.stage }
    ));
  }
  
  // Rule 6: Unknown stage - default to manual
  if (stage.stage === APPLY_STAGE.UNKNOWN && intent === USER_ACTION_INTENT.UNKNOWN_MANUAL) {
    evidence.push(makeEvidence(
      'intent_unknown',
      'Cannot determine specific action required',
      { stage: stage.stage, ats: ats.ats_kind }
    ));
  }
  
  console.log('[Intent Detector]', { intent, confidence, evidence });
  
  return { intent, confidence, evidence };
}

/**
 * Find buttons with specific text patterns
 * @param {string[]} textPatterns - Text patterns to search for
 * @returns {Element[]} Array of matching button elements
 */
function findButtonsWithText(textPatterns) {
  const buttons = [];
  const elements = document.querySelectorAll(
    'button, a[role="button"], input[type="submit"], input[type="button"], [role="link"]'
  );
  
  for (const el of elements) {
    const text = (el.textContent || el.value || '').toLowerCase().trim();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const combinedText = `${text} ${ariaLabel}`;
    
    for (const pattern of textPatterns) {
      if (combinedText.includes(pattern)) {
        buttons.push(el);
        break;
      }
    }
  }
  
  return buttons;
}

