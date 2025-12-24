"""
Score fusion logic for authenticity scoring - v3.1

Adjustments from v3.0:
- Raised BASE_SCORE from 55 to 60
- Increased MAX_POSITIVE_GAIN from 45 to 40 (max score now 100)
- Reduced short JD penalty
- Better scaling for positive signals
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional


class ScoreFusion:
    """Calculate authenticity score based on positive and negative signals."""

    # Base score for a job with no signals
    BASE_SCORE: float = 60.0
    
    # Maximum points that can be gained from positive signals
    MAX_POSITIVE_GAIN: float = 40.0  # 60 + 40 = 100
    
    # Maximum points that can be lost from negative signals  
    MAX_NEGATIVE_LOSS: float = 55.0  # 60 - 55 = 5 (minimum score ~5)
    
    # Thresholds for levels
    LEVEL_LIKELY_REAL: float = 75.0
    LEVEL_UNCERTAIN: float = 50.0

    def calculate(
        self,
        activated_rules: List[Dict[str, Any]],
        job_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Calculate authenticity score using v3.1 formula.
        """
        negative_rules = [r for r in activated_rules if r.get("signal") == "negative"]
        positive_rules = [r for r in activated_rules if r.get("signal") == "positive"]

        # Calculate positive contribution with diminishing returns
        positive_sum = sum(self._safe_weight(r) for r in positive_rules)
        # Adjusted scaling: easier to reach higher scores with good signals
        if positive_sum > 0:
            # Faster growth curve for positive signals
            positive_gain = self.MAX_POSITIVE_GAIN * (1 - math.exp(-positive_sum * 2.5))
        else:
            positive_gain = 0.0

        # Calculate negative contribution
        negative_sum = sum(self._safe_weight(r) for r in negative_rules)
        if negative_sum > 0:
            # Softer penalty curve for minor issues
            negative_loss = self.MAX_NEGATIVE_LOSS * (1 - math.exp(-negative_sum * 1.8))
        else:
            negative_loss = 0.0

        # Check for critical negative signals (staffing company, recruiter language)
        has_critical = any(
            r.get("confidence") == "high" and self._safe_weight(r) >= 0.20
            for r in negative_rules
        )
        
        # If critical signal present, cap the maximum score
        if has_critical:
            max_possible = 45.0  # Can't be "likely real" if critical red flag
            positive_gain = min(positive_gain, max_possible - self.BASE_SCORE + negative_loss)

        # Calculate final score
        final_score = self.BASE_SCORE + positive_gain - negative_loss
        final_score = self._clamp(final_score, 0.0, 100.0)

        # Determine level
        level = self._determine_level(final_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            activated_rules, job_data, positive_sum, negative_sum
        )

        return {
            "authenticity_score": round(final_score, 1),
            "level": level,
            "confidence": confidence,
            "positive_weight_sum": round(positive_sum, 2),
            "negative_weight_sum": round(negative_sum, 2),
            "positive_gain": round(positive_gain, 1),
            "negative_loss": round(negative_loss, 1),
        }

    def _determine_level(self, score: float) -> str:
        """Map numeric score to categorical level."""
        if score >= self.LEVEL_LIKELY_REAL:
            return "likely real"
        if score >= self.LEVEL_UNCERTAIN:
            return "uncertain"
        return "likely fake"

    def _calculate_confidence(
        self,
        activated_rules: List[Dict[str, Any]],
        job_data: Optional[Dict[str, Any]],
        positive_sum: float,
        negative_sum: float,
    ) -> str:
        """Calculate confidence based on signal strength and data coverage."""
        high_conf_rules = sum(1 for r in activated_rules if r.get("confidence") == "high")
        total_rules = len(activated_rules)
        total_weight = positive_sum + negative_sum
        
        # Data completeness check
        data_fields_present = 0
        if job_data:
            check_fields = [
                ("jd_text", lambda x: x and len(str(x)) > 200),
                ("title", lambda x: x and len(str(x)) > 3),
                ("company_name", lambda x: x and len(str(x)) > 1),
                ("company_info.url", lambda x: x is not None),
                ("company_info.industry", lambda x: x is not None),
            ]
            for field, validator in check_fields:
                value = self._get_nested_value(job_data, field)
                if validator(value):
                    data_fields_present += 1
        
        data_coverage = data_fields_present / 5.0
        
        # High confidence: Clear signals or multiple high-weight rules
        if high_conf_rules >= 2:
            return "High"
        if total_weight >= 0.4 and (high_conf_rules >= 1 or total_rules >= 4):
            return "High"
        if negative_sum >= 0.25:  # Clear negative signal
            return "High"
        
        # Medium confidence: Some signals present
        if total_rules >= 2 or total_weight >= 0.15 or data_coverage >= 0.4:
            return "Medium"
        
        # Low confidence: Few signals, poor data
        return "Low"

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
