/**
 * Submit Readiness Detector
 * Detects when an application form is ready for submission.
 * Phase 4.3 - User-Controlled Autofill & Auto-Submit
 */

/**
 * Detect if the application form is ready to submit
 * @returns {object} Readiness result with ready flag, reason, and blocker info
 */
function detectSubmitReadiness() {
  console.log('[SubmitReadiness] Checking if application is ready to submit...');
  
  // Step 1: Find submit button
  const submitButton = findSubmitButton();
  
  if (!submitButton) {
    return {
      ready: false,
      reason: 'no_submit_button',
      blocker: 'Could not find submit button',
      submitButton: null
    };
  }
  
  console.log('[SubmitReadiness] Found submit button:', submitButton);
  
  // Step 2: Check if button is enabled
  if (submitButton.disabled || submitButton.getAttribute('aria-disabled') === 'true') {
    return {
      ready: false,
      reason: 'submit_button_disabled',
      blocker: 'Submit button is disabled',
      submitButton: submitButton
    };
  }
  
  // Step 3: Check for required fields
  const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');
  const emptyRequired = [];
  
  for (const field of requiredFields) {
    // Skip hidden fields and buttons
    if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
      continue;
    }
    
    const value = field.value || '';
    if (value.trim() === '') {
      const fieldName = field.name || field.id || field.getAttribute('aria-label') || 'unnamed field';
      emptyRequired.push(fieldName);
    }
  }
  
  if (emptyRequired.length > 0) {
    return {
      ready: false,
      reason: 'required_fields_empty',
      blocker: `Required fields not filled: ${emptyRequired.join(', ')}`,
      submitButton: submitButton,
      emptyFields: emptyRequired
    };
  }
  
  // Step 4: Check for validation errors
  const errorSelectors = [
    '.error',
    '[aria-invalid="true"]',
    '.invalid',
    '.has-error',
    '.field-error',
    '.form-error'
  ];
  
  const errorElements = document.querySelectorAll(errorSelectors.join(', '));
  const visibleErrors = Array.from(errorElements).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  
  if (visibleErrors.length > 0) {
    return {
      ready: false,
      reason: 'validation_errors',
      blocker: `${visibleErrors.length} validation error(s) present`,
      submitButton: submitButton,
      errorCount: visibleErrors.length
    };
  }
  
  // Step 5: Check for CAPTCHA / OTP / verification
  const captchaSelectors = [
    '[class*="captcha"]',
    '[id*="captcha"]',
    '[class*="recaptcha"]',
    '[id*="recaptcha"]',
    '[class*="hcaptcha"]',
    '.g-recaptcha',
    '.h-captcha'
  ];
  
  const captchaPresent = document.querySelector(captchaSelectors.join(', '));
  if (captchaPresent) {
    // Check if it's visible
    const style = window.getComputedStyle(captchaPresent);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      return {
        ready: false,
        reason: 'captcha_present',
        blocker: 'CAPTCHA verification required',
        submitButton: submitButton
      };
    }
  }
  
  // Check for OTP/verification code fields
  const otpSelectors = [
    'input[type="tel"][maxlength="6"]',
    'input[name*="otp"]',
    'input[name*="code"]',
    'input[id*="otp"]',
    'input[id*="verification"]'
  ];
  
  const otpField = document.querySelector(otpSelectors.join(', '));
  if (otpField && !otpField.value) {
    return {
      ready: false,
      reason: 'verification_required',
      blocker: 'Verification code required',
      submitButton: submitButton
    };
  }
  
  // All checks passed
  console.log('[SubmitReadiness] Application is ready to submit');
  return {
    ready: true,
    reason: 'all_checks_passed',
    blocker: null,
    submitButton: submitButton
  };
}

/**
 * Find the submit button on the page
 * @returns {HTMLElement|null} Submit button element or null
 */
function findSubmitButton() {
  // Priority 1: Look for explicit submit buttons
  const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
  
  for (const btn of submitButtons) {
    // Check if visible
    const style = window.getComputedStyle(btn);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      return btn;
    }
  }
  
  // Priority 2: Look for buttons with submit-related text
  const allButtons = document.querySelectorAll('button, a[role="button"]');
  const submitKeywords = [
    'submit',
    'send application',
    'apply now',
    'complete application',
    'finish',
    'send',
    'confirm'
  ];
  
  for (const btn of allButtons) {
    const text = (btn.textContent || btn.value || '').toLowerCase().trim();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const combined = `${text} ${ariaLabel}`;
    
    for (const keyword of submitKeywords) {
      if (combined.includes(keyword)) {
        // Check if visible
        const style = window.getComputedStyle(btn);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return btn;
        }
      }
    }
  }
  
  // Priority 3: Look for primary action button (heuristic)
  const primaryButtons = document.querySelectorAll('button.btn-primary, button.primary, button[class*="primary"]');
  for (const btn of primaryButtons) {
    const style = window.getComputedStyle(btn);
    if (style.display !== 'none' && style.visibility !== 'hidden' && !btn.disabled) {
      return btn;
    }
  }
  
  return null;
}

/**
 * Helper to find label for a field (used by review modal)
 * @param {HTMLElement} field - Form field element
 * @returns {string} Label text or fallback
 */
function findLabelForField(field) {
  // Try explicit label with for attribute
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }
  
  // Try parent label
  const parentLabel = field.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }
  
  // Try aria-label
  const ariaLabel = field.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }
  
  // Try aria-labelledby
  const labelledBy = field.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) {
      return labelEl.textContent.trim();
    }
  }
  
  // Try placeholder as last resort
  const placeholder = field.getAttribute('placeholder');
  if (placeholder) {
    return placeholder;
  }
  
  // Fallback to name or id
  return field.name || field.id || 'Unnamed field';
}

