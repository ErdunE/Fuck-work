"""Main authenticity scorer orchestrating all components (spec section 6)."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

from .explanation_engine import ExplanationEngine
from .rule_engine import RuleEngine
from .score_fusion import ScoreFusion

logger = logging.getLogger(__name__)


class AuthenticityScorer:
    """
    Main orchestrator for authenticity scoring pipeline.

    Coordinates RuleEngine, ScoreFusion, and ExplanationEngine to produce
    complete authenticity results for job postings.
    """

    def __init__(self, rule_table_path: str) -> None:
        """
        Initialize scorer with rule table.

        Args:
            rule_table_path: Path to authenticity_rule_table.json
        """
        self.rule_engine = RuleEngine(rule_table_path)
        self.score_fusion = ScoreFusion()
        self.explanation_engine = ExplanationEngine()

        logger.info("AuthenticityScorer initialized with rules from %s", rule_table_path)

    def score_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete authenticity scoring pipeline.

        Args:
            job_data: Job data structure (see JobData interface in spec)

        Returns:
            Complete AuthenticityResult with score, level, confidence,
            summary, red_flags, positive_signals, activated_rules, and timestamp.
        """
        if not job_data.get("jd_text"):
            logger.warning("Missing jd_text, returning low confidence result")
            return self._insufficient_data_result()

        try:
            activated_rules = self.rule_engine.check(job_data)
            logger.debug(
                "Activated %d rules for job %s",
                len(activated_rules),
                job_data.get("job_id", "unknown"),
            )

            score_result = self.score_fusion.calculate(activated_rules, job_data)

            explanation = self.explanation_engine.generate(
                score_result["authenticity_score"],
                score_result["level"],
                activated_rules,
            )

            result = {
                "authenticity_score": score_result["authenticity_score"],
                "level": score_result["level"],
                "confidence": score_result["confidence"],
                "summary": explanation["summary"],
                "red_flags": explanation["red_flags"],
                "positive_signals": explanation["positive_signals"],
                "activated_rules": [
                    {
                        "id": r["id"],
                        "weight": r["weight"],
                        "confidence": r["confidence"],
                    }
                    for r in activated_rules
                ],
                "computed_at": datetime.utcnow().isoformat() + "Z",
            }

            logger.info(
                "Scored job %s: score=%.1f, level=%s, confidence=%s",
                job_data.get("job_id", "unknown"),
                result["authenticity_score"],
                result["level"],
                result["confidence"],
            )

            return result

        except Exception as exc:
            logger.exception("Error scoring job: %s", exc)
            return self._error_result(str(exc))

    @staticmethod
    def _insufficient_data_result() -> Dict[str, Any]:
        """Return result when critical data is missing."""
        return {
            "authenticity_score": 50.0,
            "level": "uncertain",
            "confidence": "Low",
            "summary": "Insufficient data to evaluate authenticity",
            "red_flags": ["Missing job description text"],
            "positive_signals": [],
            "activated_rules": [],
            "computed_at": datetime.utcnow().isoformat() + "Z",
        }

    @staticmethod
    def _error_result(error_message: str) -> Dict[str, Any]:
        """Return result when scoring fails."""
        return {
            "authenticity_score": 50.0,
            "level": "uncertain",
            "confidence": "Low",
            "summary": "Error during scoring",
            "red_flags": [f"Scoring error: {error_message}"],
            "positive_signals": [],
            "activated_rules": [],
            "computed_at": datetime.utcnow().isoformat() + "Z",
        }
