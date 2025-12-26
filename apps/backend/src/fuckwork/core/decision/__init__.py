"""
Decision engine for job explainability.
Phase 3.2 - Decision & Explainability Layer.
"""

from .explain_job import JobDecision, explain_job_decision

__all__ = ["explain_job_decision", "JobDecision"]
