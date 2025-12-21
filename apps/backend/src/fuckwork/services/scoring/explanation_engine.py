"""Explanation generation engine for authenticity scoring (spec section 5)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class ExplanationEngine:
    """Generate human-readable explanations from scoring results."""

    # Summary templates per level (spec section 5.3)
    SUMMARY_TEMPLATES: Dict[str, str] = {
        "likely real": "High authenticity ({score:.0f}). No major red flags detected.",
        "uncertain": "Uncertain authenticity ({score:.0f}). Some signals need manual review.",
        "likely fake": "Low authenticity ({score:.0f}). Multiple high-weight red flags detected.",
    }

    # Maximum number of red flags to include
    MAX_RED_FLAGS: int = 5

    def generate(
        self,
        authenticity_score: float,
        level: str,
        activated_rules: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate human-readable explanation.

        Args:
            authenticity_score: Score from 0-100.
            level: One of 'likely real', 'uncertain', 'likely fake'.
            activated_rules: List of activated rule dicts with 'signal', 'weight',
                'description' keys.

        Returns:
            Dictionary with 'summary', 'red_flags', 'positive_signals'.
        """
        summary = self._generate_summary(authenticity_score, level)
        red_flags = self._extract_red_flags(activated_rules)
        positive_signals = self._extract_positive_signals(activated_rules)

        logger.debug(
            "Generated explanation: score=%s, level=%s, red_flags=%d, positive=%d",
            authenticity_score,
            level,
            len(red_flags),
            len(positive_signals),
        )

        return {
            "summary": summary,
            "red_flags": red_flags,
            "positive_signals": positive_signals,
        }

    def _generate_summary(self, score: float, level: str) -> str:
        """
        Generate summary sentence including score and level.

        Uses templates from spec section 5.3.
        """
        template = self.SUMMARY_TEMPLATES.get(
            level, "Authenticity score: {score:.0f}"
        )
        return template.format(score=score)

    def _extract_red_flags(
        self, activated_rules: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Extract top red flags from activated negative rules.

        - Filters to negative signals only
        - Sorts by weight descending
        - Returns top MAX_RED_FLAGS descriptions
        - No rule IDs in output
        """
        negative_rules = [
            r for r in activated_rules if r.get("signal") == "negative"
        ]

        # Sort by weight descending
        negative_rules.sort(key=lambda r: r.get("weight", 0), reverse=True)

        # Take top N
        top_rules = negative_rules[: self.MAX_RED_FLAGS]

        # Convert to readable strings (use description, no IDs)
        red_flags = [self._rule_to_readable(r) for r in top_rules]

        return red_flags

    def _extract_positive_signals(
        self, activated_rules: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Extract positive signals from activated rules.

        Returns list of human-readable descriptions.
        """
        positive_rules = [
            r for r in activated_rules if r.get("signal") == "positive"
        ]

        return [self._rule_to_readable(r) for r in positive_rules]

    @staticmethod
    def _rule_to_readable(rule: Dict[str, Any]) -> str:
        """
        Convert rule to human-readable string.

        Uses the rule's description field directly.
        No rule IDs or technical jargon in output.
        """
        description = rule.get("description", "")
        if description:
            return description
        # Fallback if description missing (should not happen with valid rules)
        return "Unknown signal detected"

