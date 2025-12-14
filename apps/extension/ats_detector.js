/**
 * ATS Platform Detector
 * Rule-based detection with evidence collection.
 */

/**
 * Detect ATS platform from URL and DOM markers
 * @returns {object} Detection result with ats_kind, confidence, and evidence
 */
function detectATS() {
  const evidence = [];
  const signals = {
    workday: 0,
    greenhouse: 0,
    lever: 0,
    icims: 0
  };
  
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  
  // URL Pattern Matching
  
  // Workday detection
  if (hostname.includes('myworkdayjobs.com') || hostname.includes('myworkdaysite.com')) {
    signals.workday += 2;
    evidence.push(makeEvidence(
      'url_match',
      `Hostname matches Workday pattern: ${hostname}`,
      { hostname, pattern: 'myworkdayjobs.com|myworkdaysite.com' }
    ));
  } else if (url.includes('/workday/') || hostname.startsWith('wd1.')) {
    signals.workday += 1;
    evidence.push(makeEvidence(
      'url_match',
      'URL contains Workday identifier',
      { url_fragment: 'workday' }
    ));
  }
  
  // Greenhouse detection
  if (hostname.includes('greenhouse.io') || hostname === 'boards.greenhouse.io') {
    signals.greenhouse += 2;
    evidence.push(makeEvidence(
      'url_match',
      `Hostname matches Greenhouse pattern: ${hostname}`,
      { hostname, pattern: 'greenhouse.io' }
    ));
  }
  
  // Lever detection
  if (hostname.includes('lever.co') || hostname === 'jobs.lever.co') {
    signals.lever += 2;
    evidence.push(makeEvidence(
      'url_match',
      `Hostname matches Lever pattern: ${hostname}`,
      { hostname, pattern: 'lever.co' }
    ));
  }
  
  // iCIMS detection
  if (hostname.includes('icims.com') || hostname === 'candidate.icims.com') {
    signals.icims += 2;
    evidence.push(makeEvidence(
      'url_match',
      `Hostname matches iCIMS pattern: ${hostname}`,
      { hostname, pattern: 'icims.com' }
    ));
  } else if (url.includes('/icims/')) {
    signals.icims += 1;
    evidence.push(makeEvidence(
      'url_match',
      'URL contains iCIMS identifier',
      { url_fragment: 'icims' }
    ));
  }
  
  // DOM Marker Detection
  
  // Workday DOM markers
  const workdayElements = document.querySelectorAll('[data-automation-id]');
  if (workdayElements.length > 0) {
    signals.workday += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      `Found ${workdayElements.length} elements with data-automation-id attribute`,
      { count: workdayElements.length }
    ));
  }
  
  const pageTitle = document.title.toLowerCase();
  const metaTags = Array.from(document.querySelectorAll('meta')).map(m => 
    (m.getAttribute('content') || '').toLowerCase()
  ).join(' ');
  
  if (pageTitle.includes('workday') || metaTags.includes('workday')) {
    signals.workday += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found "Workday" in page title or meta tags',
      { in_title: pageTitle.includes('workday') }
    ));
  }
  
  // Greenhouse DOM markers
  const ghElements = document.querySelectorAll('[id*="gh_jid"], [class*="greenhouse"]');
  if (ghElements.length > 0) {
    signals.greenhouse += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found Greenhouse-specific elements (gh_jid, greenhouse class)',
      { count: ghElements.length }
    ));
  }
  
  const footerText = Array.from(document.querySelectorAll('footer')).map(f => 
    f.textContent.toLowerCase()
  ).join(' ');
  
  if (footerText.includes('greenhouse')) {
    signals.greenhouse += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found "greenhouse" in footer text',
      null
    ));
  }
  
  // Lever DOM markers
  const leverElements = document.querySelectorAll('.posting-title, .lever-form, [class*="lever"]');
  if (leverElements.length > 0) {
    signals.lever += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found Lever-specific elements (posting-title, lever-form)',
      { count: leverElements.length }
    ));
  }
  
  const scripts = Array.from(document.querySelectorAll('script')).map(s => 
    (s.src || s.textContent || '').toLowerCase()
  ).join(' ');
  
  if (scripts.includes('lever')) {
    signals.lever += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found "lever" in script tags',
      null
    ));
  }
  
  // iCIMS DOM markers
  if (scripts.includes('icims')) {
    signals.icims += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found "icims" in script tags',
      null
    ));
  }
  
  if (footerText.includes('icims') || pageTitle.includes('icims')) {
    signals.icims += 1;
    evidence.push(makeEvidence(
      'dom_marker',
      'Found "iCIMS" in footer or title',
      null
    ));
  }
  
  // Determine ATS kind and confidence
  let ats_kind = ATS_KIND.UNKNOWN;
  let confidence = DETECTION_CONFIDENCE.LOW;
  
  const maxSignal = Math.max(signals.workday, signals.greenhouse, signals.lever, signals.icims);
  const totalEvidence = evidence.length;
  
  if (maxSignal > 0) {
    if (signals.workday === maxSignal) {
      ats_kind = ATS_KIND.WORKDAY;
    } else if (signals.greenhouse === maxSignal) {
      ats_kind = ATS_KIND.GREENHOUSE;
    } else if (signals.lever === maxSignal) {
      ats_kind = ATS_KIND.LEVER;
    } else if (signals.icims === maxSignal) {
      ats_kind = ATS_KIND.ICIMS;
    }
    
    // Confidence scoring
    // High: >=2 strong signals (hostname + DOM) OR >=3 signals total
    // Medium: 1 strong hostname match
    // Low: weak signals only
    const hasHostnameMatch = evidence.some(e => 
      e.type === 'url_match' && e.data && e.data.pattern
    );
    const hasDomMarker = evidence.some(e => e.type === 'dom_marker');
    
    if ((hasHostnameMatch && hasDomMarker) || totalEvidence >= 3) {
      confidence = DETECTION_CONFIDENCE.HIGH;
    } else if (hasHostnameMatch) {
      confidence = DETECTION_CONFIDENCE.MEDIUM;
    } else {
      confidence = DETECTION_CONFIDENCE.LOW;
    }
  }
  
  console.log('[ATS Detector]', { ats_kind, confidence, signals, evidence });
  
  return {
    ats_kind,
    confidence,
    evidence
  };
}

