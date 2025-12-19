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
from database.models import Job


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
    red_flags = job.red_flags or []
    positive_signals = job.positive_signals or []
    
    # Track signals used
    signals_used["authenticity_score"] = score
    signals_used["authenticity_level"] = level
    signals_used["confidence"] = confidence
    signals_used["job_level"] = derived.get("job_level")
    signals_used["work_mode"] = derived.get("work_mode")
    signals_used["visa_signal"] = derived.get("visa_signal")
    signals_used["employment_type"] = derived.get("employment_type")
    signals_used["has_salary"] = bool(derived.get("salary", {}).get("min"))
    signals_used["red_flag_count"] = len(red_flags)
    signals_used["positive_signal_count"] = len(positive_signals)
    
    # Decision logic: Score-based primary classification
    if score is None:
        # No score available - maximum caution
        decision = "caution"
        risks.append("Authenticity score unavailable")
    elif score >= 80:
        # High score - likely recommend unless red flags
        decision = "recommend"
        reasons.append(f"High authenticity score ({score:.0f})")
    elif score >= 60:
        # Moderate score - caution or recommend based on signals
        decision = "caution"
        reasons.append(f"Moderate authenticity score ({score:.0f})")
    elif score >= 40:
        # Low-moderate score - caution
        decision = "caution"
        risks.append(f"Below-average authenticity score ({score:.0f})")
    else:
        # Very low score - avoid
        decision = "avoid"
        risks.append(f"Low authenticity score ({score:.0f})")
    
    # Confidence level impact
    if confidence == "High" and score and score >= 70:
        reasons.append("High confidence in authenticity assessment")
    elif confidence == "Low":
        risks.append("Low confidence in authenticity assessment")
    
    # Derived signal analysis
    job_level = derived.get("job_level")
    if job_level in ["intern", "new_grad", "junior"]:
        reasons.append(f"Entry-level position ({job_level})")
    elif job_level in ["senior", "staff", "principal"]:
        reasons.append(f"Senior-level position ({job_level})")
    
    work_mode = derived.get("work_mode")
    if work_mode == "remote":
        reasons.append("Remote work available")
    elif work_mode == "hybrid":
        reasons.append("Hybrid work arrangement")
    
    visa_signal = derived.get("visa_signal")
    if visa_signal == "explicit_yes":
        reasons.append("Visa sponsorship explicitly offered")
    elif visa_signal == "explicit_no":
        risks.append("No visa sponsorship")
    elif visa_signal == "unclear":
        risks.append("Visa sponsorship unclear")
    
    salary_info = derived.get("salary", {})
    if salary_info.get("min"):
        reasons.append("Salary information provided")
    else:
        risks.append("No salary information")
    
    # Red flags analysis
    if len(red_flags) > 3:
        risks.append(f"Multiple red flags detected ({len(red_flags)})")
        # Downgrade decision if too many red flags
        if decision == "recommend":
            decision = "caution"
    elif len(red_flags) > 0:
        risks.append(f"{len(red_flags)} red flag(s) detected")
    
    # Positive signals boost
    if len(positive_signals) > 5:
        reasons.append(f"Strong positive indicators ({len(positive_signals)})")
        # Upgrade from caution to recommend if score is decent
        if decision == "caution" and score and score >= 65:
            decision = "recommend"
    
    # Final safety check: if no reasons, add generic one
    if not reasons:
        reasons.append("Basic job information available")
    
    # Ensure decision consistency
    if len(risks) > len(reasons) and decision == "recommend":
        decision = "caution"
    
    return JobDecision(
        decision=decision,
        reasons=reasons,
        risks=risks,
        signals_used=signals_used,
        confidence_level=confidence
    )

