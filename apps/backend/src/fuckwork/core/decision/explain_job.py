"""
Deterministic rule-based decision engine for job recommendations.

Rules:
- Score >= 80: Strong positive signal
- Score 60-79: Moderate positive signal
- Score 40-59: Neutral/caution zone
- Score < 40: Strong negative signal

Additional factors:
- Derived signals (job_level, work_mode, visa, salary)
- Red flags vs positive signals count
- Confidence level
"""

from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel
from src.fuckwork.database import Job


class JobDecision(BaseModel):
    """Structured decision explanation"""
    decision: Literal["recommend", "caution", "avoid"]
    reasons: List[str]
    risks: List[str]
    signals_used: Dict[str, Any]
    confidence_level: str


def explain_job_decision(job: Job) -> JobDecision:
    """
    Generate decision and explanation for a job posting.
    
    Pure function - no side effects, fully deterministic.
    
    Args:
        job: Job ORM object with all fields populated
        
    Returns:
        JobDecision object with decision, reasons, risks, signals
    """
    reasons = []
    risks = []
    signals_used = {}
    
    # Extract key signals
    score = job.authenticity_score
    level = job.authenticity_level
    confidence = job.confidence or "Unknown"
    derived = job.derived_signals or {}
    
    # Signal analysis
    signals_used['score'] = score
    signals_used['level'] = level
    signals_used['confidence'] = confidence
    
    # Count flags
    red_flags = job.red_flags or []
    positive_signals = job.positive_signals or []
    signals_used['red_flag_count'] = len(red_flags)
    signals_used['positive_signal_count'] = len(positive_signals)
    
    # Decision logic
    if score is None:
        return JobDecision(
            decision="caution",
            reasons=["Job not yet scored"],
            risks=["Unable to assess authenticity"],
            signals_used=signals_used,
            confidence_level="None"
        )
    
    # High score (>= 80)
    if score >= 80:
        reasons.append(f"High authenticity score ({score:.0f}/100)")
        if level == "likely_real":
            reasons.append("Classified as likely real")
        
        # Check derived signals
        if derived.get('job_level'):
            reasons.append(f"Clear job level: {derived['job_level']}")
        if derived.get('salary_range'):
            reasons.append(f"Salary disclosed: {derived['salary_range']}")
        
        # Still note any risks
        if len(red_flags) > 0:
            risks.append(f"Note: {len(red_flags)} potential concerns found")
        
        return JobDecision(
            decision="recommend",
            reasons=reasons,
            risks=risks,
            signals_used=signals_used,
            confidence_level=confidence
        )
    
    # Medium score (60-79)
    elif score >= 60:
        reasons.append(f"Moderate authenticity score ({score:.0f}/100)")
        
        if len(positive_signals) > 0:
            reasons.append(f"{len(positive_signals)} positive signals found")
        
        if len(red_flags) > 0:
            risks.append(f"{len(red_flags)} potential concerns")
            for flag in red_flags[:3]:  # Top 3 risks
                risks.append(f"• {flag}")
        
        return JobDecision(
            decision="caution",
            reasons=reasons,
            risks=risks,
            signals_used=signals_used,
            confidence_level=confidence
        )
    
    # Low score (40-59)
    elif score >= 40:
        risks.append(f"Below-average score ({score:.0f}/100)")
        
        if len(red_flags) > 0:
            risks.append(f"{len(red_flags)} red flags detected:")
            for flag in red_flags[:5]:
                risks.append(f"• {flag}")
        
        if len(positive_signals) > 0:
            reasons.append(f"Some positive aspects: {len(positive_signals)} signals")
        
        return JobDecision(
            decision="caution",
            reasons=reasons,
            risks=risks,
            signals_used=signals_used,
            confidence_level=confidence
        )
    
    # Very low score (< 40)
    else:
        risks.append(f"Low authenticity score ({score:.0f}/100)")
        if level == "likely_fake":
            risks.append("Classified as likely fake")
        
        if len(red_flags) > 0:
            risks.append(f"{len(red_flags)} major concerns:")
            for flag in red_flags:
                risks.append(f"• {flag}")
        
        return JobDecision(
            decision="avoid",
            reasons=["Strong indicators of inauthenticity"],
            risks=risks,
            signals_used=signals_used,
            confidence_level=confidence
        )
