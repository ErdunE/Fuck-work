/**
 * Apply State Machine
 * Determines worker action based on detected ATS and stage.
 */

/**
 * Compute worker action based on current state
 * @param {object} params - Parameters
 * @param {object} params.task - Current apply task
 * @param {object} params.ats - ATS detection result
 * @param {object} params.stage - Stage detection result
 * @returns {object} Action with reason and evidence
 */
function computeWorkerAction({ task, ats, stage }) {
  const evidence = [];
  let action = 'noop';
  let reason = '';
  
  const stageValue = stage.stage;
  const atsKind = ats.ats_kind;
  
  // Rule 1: Stages that require user intervention
  if ([
    APPLY_STAGE.LOGIN_REQUIRED,
    APPLY_STAGE.VERIFICATION_REQUIRED,
    APPLY_STAGE.BLOCKED
  ].includes(stageValue)) {
    action = 'pause_needs_user';
    
    if (stageValue === APPLY_STAGE.LOGIN_REQUIRED) {
      reason = `Login required for ${atsKind} application`;
      evidence.push(makeEvidence(
        'action_decision',
        'Pausing for user login',
        { stage: stageValue, ats: atsKind }
      ));
    } else if (stageValue === APPLY_STAGE.VERIFICATION_REQUIRED) {
      reason = `Verification/CAPTCHA required for ${atsKind} application`;
      evidence.push(makeEvidence(
        'action_decision',
        'Pausing for verification/CAPTCHA',
        { stage: stageValue, ats: atsKind }
      ));
    } else if (stageValue === APPLY_STAGE.BLOCKED) {
      reason = `Access blocked on ${atsKind} - human intervention required`;
      evidence.push(makeEvidence(
        'action_decision',
        'Pausing due to blocked access',
        { stage: stageValue, ats: atsKind }
      ));
    }
    
    console.log('[State Machine] Action:', action, 'Reason:', reason);
    return { action, reason, evidence };
  }
  
  // Rule 2: Stages where autofill can proceed
  if ([
    APPLY_STAGE.FORM_FILLING,
    APPLY_STAGE.READY_TO_SUBMIT
  ].includes(stageValue)) {
    action = 'continue';
    reason = `Application form detected on ${atsKind} - autofill can proceed`;
    evidence.push(makeEvidence(
      'action_decision',
      'Continuing with autofill',
      { stage: stageValue, ats: atsKind }
    ));
    
    console.log('[State Machine] Action:', action, 'Reason:', reason);
    return { action, reason, evidence };
  }
  
  // Rule 3: Submitted stage - wait for user confirmation
  if (stageValue === APPLY_STAGE.SUBMITTED) {
    action = 'noop';
    reason = `Application appears submitted on ${atsKind} - awaiting user confirmation`;
    evidence.push(makeEvidence(
      'action_decision',
      'No action - user must confirm submission via popup',
      { stage: stageValue, ats: atsKind }
    ));
    
    console.log('[State Machine] Action:', action, 'Reason:', reason);
    return { action, reason, evidence };
  }
  
  // Rule 4: Unknown stage - pause for safety
  if (stageValue === APPLY_STAGE.UNKNOWN || stageValue === APPLY_STAGE.LANDING) {
    action = 'pause_needs_user';
    reason = `Unable to determine application stage on ${atsKind} - manual review needed`;
    evidence.push(makeEvidence(
      'action_decision',
      'Pausing due to unknown stage',
      { stage: stageValue, ats: atsKind, stage_confidence: stage.confidence }
    ));
    
    console.log('[State Machine] Action:', action, 'Reason:', reason);
    return { action, reason, evidence };
  }
  
  // Fallback: pause for safety
  action = 'pause_needs_user';
  reason = `Unexpected application state on ${atsKind} - manual review needed`;
  evidence.push(makeEvidence(
    'action_decision',
    'Pausing due to unexpected state',
    { stage: stageValue, ats: atsKind }
  ));
  
  console.log('[State Machine] Action:', action, 'Reason:', reason);
  return { action, reason, evidence };
}

