/**
 * Content script for page inspection and autofill.
 * Runs on job application pages.
 */

console.log('FuckWork content script loaded');

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('Initializing content script...');
  
  // Get active task and user profile
  const { activeTask, activeJob } = await chrome.storage.local.get(['activeTask', 'activeJob']);
  
  if (!activeTask) {
    console.log('No active task, skipping autofill');
    return;
  }
  
  console.log('Active task:', activeTask);
  
  // Get user profile for autofill
  const userProfile = await APIClient.getUserProfile(1);
  
  if (!userProfile || !userProfile.profile) {
    console.log('No user profile found, skipping autofill');
    return;
  }
  
  // Wait a bit for page to settle
  await sleep(2000);
  
  // Attempt autofill
  await attemptAutofill(userProfile.profile, userProfile.user);
}

/**
 * Attempt to autofill basic fields
 */
async function attemptAutofill(profile, user) {
  console.log('Attempting autofill with profile:', profile);
  
  let filledCount = 0;
  
  // Find and fill email field
  const emailFields = findFieldsByType(['email'], ['email', 'e-mail', 'e_mail']);
  for (const field of emailFields) {
    if (user.email && !field.value) {
      field.value = user.email;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled email:', user.email);
      filledCount++;
    }
  }
  
  // Find and fill first name
  const firstNameFields = findFieldsByType(['text'], ['first', 'fname', 'firstname', 'given']);
  for (const field of firstNameFields) {
    if (profile.first_name && !field.value) {
      field.value = profile.first_name;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled first name:', profile.first_name);
      filledCount++;
    }
  }
  
  // Find and fill last name
  const lastNameFields = findFieldsByType(['text'], ['last', 'lname', 'lastname', 'surname', 'family']);
  for (const field of lastNameFields) {
    if (profile.last_name && !field.value) {
      field.value = profile.last_name;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Filled last name:', profile.last_name);
      filledCount++;
    }
  }
  
  console.log(`Autofilled ${filledCount} fields`);
  
  if (filledCount === 0) {
    console.log('No fields were filled - form may be unrecognized');
  }
}

/**
 * Find input fields by type and name patterns
 */
function findFieldsByType(types, namePatterns) {
  const fields = [];
  
  const inputs = document.querySelectorAll('input');
  
  for (const input of inputs) {
    // Check type
    if (!types.includes(input.type)) {
      continue;
    }
    
    // Check name/id/placeholder for patterns
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const label = findLabel(input)?.toLowerCase() || '';
    
    const searchText = `${name} ${id} ${placeholder} ${label}`;
    
    for (const pattern of namePatterns) {
      if (searchText.includes(pattern)) {
        fields.push(input);
        break;
      }
    }
  }
  
  return fields;
}

/**
 * Find label for input field
 */
function findLabel(input) {
  // Check for <label for="id">
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent;
    }
  }
  
  // Check for wrapping <label>
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent;
  }
  
  return null;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

