"""Score fusion logic for authenticity scoring (spec section 3)."""

from __future__ import annotations

import math
from typing import Any, Dict, Iterable, List, Optional


class ScoreFusion:
    """Calculate authenticity score, level, and confidence from activated rules."""

    PENALTY_FACTOR: float = 1.8
    MAX_GAIN: float = 1.15  # 15% max boost
    STRONG_RULE_THRESHOLD: float = 0.18
    LEVEL_LIKELY_REAL: float = 80.0
    LEVEL_UNCERTAIN: float = 55.0

    def calculate(
        self, activated_rules: List[Dict[str, Any]], job_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate authenticity score from activated rules.

        Args:
            activated_rules: List of activated rule dictionaries.
            job_data: Optional job data for confidence coverage calculation.

        Returns:
            Dictionary with score, level, confidence, and weight sums.
        """
        # Extract collection metadata for platform-aware weight adjustment (Phase 2A)
        collection_meta = {}
        if job_data is not None:
            collection_meta = job_data.get('collection_metadata', {})
        
        negative_rules = [r for r in activated_rules if r.get("signal") == "negative"]
        positive_rules = [r for r in activated_rules if r.get("signal") == "positive"]

        # Apply platform-aware weight adjustment (Phase 2A Stage 7)
        negative_sum = sum(self._adjust_weight_for_platform(r, collection_meta) for r in negative_rules)
        base_score = 100 * math.exp(-negative_sum * self.PENALTY_FACTOR)

        positive_sum = sum(self._adjust_weight_for_platform(r, collection_meta) for r in positive_rules)
        gain = min(self.MAX_GAIN, (1 + positive_sum) ** 0.25)

        final_score = base_score * gain
        final_score = self._clamp(final_score, 0.0, 100.0)

        level = self._determine_level(final_score)
        confidence = self._calculate_confidence(activated_rules, job_data)

        return {
            "authenticity_score": round(final_score, 1),
            "level": level,
            "confidence": confidence,
            "negative_weight_sum": round(negative_sum, 2),
            "positive_weight_sum": round(positive_sum, 2),
        }

    def _determine_level(self, score: float) -> str:
        """Map numeric score to categorical level."""
        if score >= self.LEVEL_LIKELY_REAL:
            return "likely real"
        if score >= self.LEVEL_UNCERTAIN:
            return "uncertain"
        return "likely fake"

    def _calculate_confidence(
        self, activated_rules: List[Dict[str, Any]], job_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Confidence is based on:
        1. Count of strong rules (weight >= STRONG_RULE_THRESHOLD)
        2. Data coverage of required fields (if job_data provided)
        """
        strong_count = sum(1 for r in activated_rules if self._safe_weight(r) >= self.STRONG_RULE_THRESHOLD)

        coverage = 0.0
        if job_data is not None:
            required_fields = [
                "jd_text",
                "poster_info",
                "platform_metadata.posted_days_ago",
                "company_name",
            ]
            present = sum(1 for field in required_fields if self._get_nested_value(job_data, field) is not None)
            coverage = present / len(required_fields)

        confidence_score = (0.5 * min(1.0, strong_count / 3.0)) + (0.5 * coverage)

        if strong_count == 0 and coverage >= 0.75:
            max_weight = max((self._safe_weight(r) for r in activated_rules), default=0.0)
            if not activated_rules or max_weight < 0.05:
                return "High"
            if len(activated_rules) >= 5 and max_weight < 0.2:
                return "High"
        if confidence_score >= 0.66:
            return "High"
        if confidence_score >= 0.33:
            return "Medium"
        return "Low"

    def _adjust_weight_for_platform(self, rule: Dict[str, Any], collection_meta: Dict[str, Any]) -> float:
        """
        Adjust rule weight based on platform capabilities.
        
        KEY LOGIC (Phase 2A Stage 7):
        - A-series (Recruiter) rules: Only apply if poster expected AND present
        - Other rules: Keep original weight
        
        Args:
            rule: Rule dict with rule_id and weight
            collection_meta: Platform metadata with poster_expected/present
        
        Returns:
            Adjusted weight (0.0 if should skip rule)
        """
        rule_id = rule.get('rule_id', '')
        base_weight = self._safe_weight(rule)
        
        # A-series rules (Recruiter signals)
        if rule_id.startswith('A'):
            poster_expected = collection_meta.get('poster_expected', False)
            poster_present = collection_meta.get('poster_present', False)
            
            # If poster not expected (e.g., Indeed), skip rule entirely
            if not poster_expected:
                return 0.0
            
            # If poster expected but not present (extraction failure), reduce weight
            if not poster_present:
                return base_weight * 0.5
        
        # All other rules: keep original weight
        return base_weight

    @staticmethod
    def _safe_weight(rule: Dict[str, Any]) -> float:
        try:
            return float(rule.get("weight", 0.0))
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _clamp(value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    @staticmethod
    def _get_nested_value(data: Dict[str, Any], path: str) -> Optional[Any]:
        keys = path.split(".")
        current: Any = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current
