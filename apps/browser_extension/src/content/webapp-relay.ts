/**
 * Web App Relay Content Script
 * 
 * Runs on localhost:3000 (Web Control Plane)
 * Relays window.postMessage to chrome.runtime.sendMessage
 */

console.log('[FW Content] Web App relay loaded on', window.location.href)

// Set flag so Web App knows content script is loaded
;(window as any).FW_CONTENT_SCRIPT_LOADED = true

// Listen for messages from Web App
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return
  }
  
  const { type, ...data } = event.data
  
  // Relay auth-related messages to extension background
  if (type === 'FW_EXTENSION_TOKEN' || 
      type === 'FW_AUTH_BOOTSTRAP' ||
      type === 'FW_AUTH_CHANGED' ||
      type === 'FW_AUTH_CLEAR' ||
      type === 'FW_EXTENSION_LOGOUT') {
    
    console.log('[FW Content] Relaying message to background:', type)
    
    chrome.runtime.sendMessage({
      type,
      ...data
    }).catch(err => {
      console.error('[FW Content] Failed to relay message:', err)
    })
  }
})

console.log('[FW Content] Web App relay ready, listening for messages')
