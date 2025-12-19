/**
 * Submit Review Modal
 * MANDATORY review gate before any auto-submit.
 * Phase 4.3 - User-Controlled Autofill & Auto-Submit
 */

/**
 * HTML-escape utility for safe rendering
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create submit review modal element
 * @param {Array} formData - Array of {label, value} objects
 * @param {object} context - Additional context (ats_kind, job_id, etc.)
 * @returns {HTMLElement} Modal element
 */
function createSubmitReviewModal(formData, context = {}) {
  const modal = document.createElement('div');
  modal.id = 'fw-submit-review-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  const atsInfo = context.ats_kind ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">ATS: ${escapeHtml(context.ats_kind)}</div>` : '';
  const jobInfo = context.job_id ? `<div style="font-size: 12px; color: #666;">Job ID: ${escapeHtml(context.job_id)}</div>` : '';
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    ">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1a1a1a;">
        Review Application Before Submitting
      </h2>
      
      ${jobInfo}${atsInfo}
      
      <div style="margin-top: 16px; margin-bottom: 16px; padding: 12px; background: #fff3e0; border-radius: 6px; border-left: 3px solid #ff9800;">
        <strong>⚠️ Important:</strong> Please review all information below. Once submitted, you cannot undo this action.
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 8px;">
          Application Fields (${formData.length} fields)
        </div>
        <div class="fw-review-fields" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px; padding: 12px;">
          <!-- Form field summary will be inserted here -->
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="fw-cancel-submit" style="
          padding: 10px 20px;
          background: #e0e0e0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">
          Cancel
        </button>
        <button id="fw-confirm-submit" style="
          padding: 10px 20px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">
          Confirm & Submit Application
        </button>
      </div>
    </div>
  `;
  
  // Populate form data
  const fieldsContainer = modal.querySelector('.fw-review-fields');
  if (formData.length === 0) {
    fieldsContainer.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">No form data detected</div>';
  } else {
    fieldsContainer.innerHTML = formData.map(field => `
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px; font-weight: 500;">
          ${escapeHtml(field.label)}
        </div>
        <div style="font-size: 14px; color: #1a1a1a; word-break: break-word;">
          ${escapeHtml(field.value)}
        </div>
      </div>
    `).join('');
  }
  
  return modal;
}

/**
 * Show submit review modal and wait for user decision
 * @param {object} context - Context including session, ats_kind, job_id
 * @returns {Promise<boolean>} True if user confirmed, false if canceled
 */
async function showSubmitReviewModal(context = {}) {
  return new Promise((resolve) => {
    console.log('[SubmitReview] Showing review modal...');
    
    // Collect form data
    const formData = collectFormDataForReview();
    console.log('[SubmitReview] Collected', formData.length, 'form fields');
    
    const modal = createSubmitReviewModal(formData, context);
    document.body.appendChild(modal);
    
    // Mark that review was shown for this session
    if (context.activeSession && context.activeSession.task_id) {
      prefManager.setSessionOverride(context.activeSession.task_id, 'submit_review_shown', true);
    }
    
    // Confirm handler
    modal.querySelector('#fw-confirm-submit').addEventListener('click', () => {
      console.log('[SubmitReview] User confirmed submission');
      modal.remove();
      resolve(true);
    });
    
    // Cancel handler
    modal.querySelector('#fw-cancel-submit').addEventListener('click', () => {
      console.log('[SubmitReview] User canceled submission');
      modal.remove();
      resolve(false);
    });
    
    // ESC key handler
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        console.log('[SubmitReview] User canceled submission (ESC)');
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

/**
 * Collect form data for review
 * @returns {Array} Array of {label, value} objects
 */
function collectFormDataForReview() {
  const fields = [];
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
  
  for (const input of inputs) {
    // Skip if no value
    if (!input.value || input.value.trim() === '') {
      continue;
    }
    
    // Skip if not visible
    try {
      const style = window.getComputedStyle(input);
      if (style.display === 'none' || style.visibility === 'hidden') {
        continue;
      }
    } catch (_) {
      // If we can't compute style, include it anyway
    }
    
    const label = findLabelForField(input);
    
    // Handle different input types
    let value = input.value;
    
    if (input.type === 'password') {
      value = '••••••••'; // Mask passwords
    } else if (input.type === 'checkbox') {
      value = input.checked ? 'Yes' : 'No';
    } else if (input.type === 'radio') {
      if (input.checked) {
        value = input.value || 'Selected';
      } else {
        continue; // Skip unchecked radio buttons
      }
    } else if (input.tagName.toLowerCase() === 'select') {
      const selectedOption = input.options[input.selectedIndex];
      value = selectedOption ? selectedOption.text : input.value;
    }
    
    fields.push({
      label: label || 'Unnamed field',
      value: value
    });
  }
  
  return fields;
}

