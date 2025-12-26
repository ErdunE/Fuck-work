"""Rule evaluation engine for authenticity scoring (spec section 2)."""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)


class RuleEngine:
    """Evaluate authenticity rules loaded from a JSON rule table."""

    def __init__(self, rule_table_path: str) -> None:
        """
        Load rules from JSON file.

        Args:
            rule_table_path: Path to authenticity_rule_table.json.
        """
        path = Path(rule_table_path)
        if not path.is_file():
            raise FileNotFoundError(f"Rule table not found at {path}")

        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        self.rules: List[Dict[str, Any]] = data.get("rules", [])
        if not isinstance(self.rules, list):
            raise ValueError("Rule table must contain a 'rules' list")

        logger.info(f"Loaded {len(self.rules)} rules from {path}")

    def check(self, job_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluate all rules against job data.

        Returns:
            List of activated rules with metadata.
        """
        activated_rules: List[Dict[str, Any]] = []

        for rule in self.rules:
            try:
                if self._evaluate_rule(rule, job_data):
                    effective_weight = self._effective_weight(rule, job_data)
                    activated_rules.append(
                        {
                            "id": rule["id"],
                            "weight": effective_weight,
                            "confidence": rule["confidence"],
                            "signal": rule["signal"],
                            "description": rule["description"],
                        }
                    )
            except Exception as exc:  # fail-safe per spec
                logger.exception("Error evaluating rule %s: %s", rule.get("id"), exc)
                continue

        logger.debug("Activated rules: %s", [r["id"] for r in activated_rules])
        return activated_rules

    def _evaluate_rule(self, rule: Dict[str, Any], job_data: Dict[str, Any]) -> bool:
        """Evaluate a single rule against job data."""
        data_source = rule.get("data_source")
        if not data_source:
            return False

        value = self._get_nested_value(job_data, data_source)

        pattern_type = rule.get("pattern_type")
        pattern_value = rule.get("pattern_value")
        rule_id = rule.get("id")

        # Handle field_exists pattern type (checks if value is not None/empty)
        if pattern_type == "field_exists":
            return self._check_field_exists(value)

        # For other pattern types, value must exist
        if value is None:
            return False

        if pattern_type == "regex":
            return self._match_regex(value, self._ensure_iterable(pattern_value))
        if pattern_type == "string_contains":
            return self._string_contains(value, pattern_value)
        if pattern_type == "string_contains_any":
            return self._string_contains_any(value, self._ensure_iterable(pattern_value))
        if pattern_type == "string_equals_any":
            return self._string_equals_any(value, self._ensure_iterable(pattern_value))
        if pattern_type == "numeric_threshold":
            return self._numeric_threshold(value, pattern_value)
        if pattern_type == "numeric_less_than":
            return self._numeric_less_than(value, pattern_value)
        if pattern_type == "boolean":
            return self._boolean_match(value, pattern_value, job_data)
        if pattern_type == "body_shop_pattern_check":
            return self._check_body_shop_pattern(value, job_data)
        if pattern_type == "action_verb_check":
            return self._check_missing_action_verbs(value)
        if pattern_type == "extreme_formatting_check":
            return self._check_extreme_formatting(value)
        if pattern_type == "jd_length_check":
            # Returns True if JD is SHORTER than threshold (negative signal)
            return self._check_jd_length_short(value, pattern_value)
        if pattern_type == "jd_length_check_min":
            # Returns True if JD is LONGER than threshold (positive signal)
            return self._check_jd_length_long(value, pattern_value)

        return False

    @staticmethod
    def _check_field_exists(value: Any) -> bool:
        """Check if a field exists and has a meaningful value."""
        if value is None:
            return False
        if isinstance(value, str) and value.strip() == "":
            return False
        if isinstance(value, (list, dict)) and len(value) == 0:
            return False
        return True

    @staticmethod
    def _check_jd_length_short(text: Any, threshold: Any) -> bool:
        """Return True if JD is shorter than threshold characters."""
        try:
            text_str = str(text) if text else ""
            threshold_int = int(threshold) if threshold else 500
            return len(text_str) < threshold_int
        except (TypeError, ValueError):
            return False

    @staticmethod
    def _check_jd_length_long(text: Any, threshold: Any) -> bool:
        """Return True if JD is longer than threshold characters."""
        try:
            text_str = str(text) if text else ""
            threshold_int = int(threshold) if threshold else 3000
            return len(text_str) > threshold_int
        except (TypeError, ValueError):
            return False

    @staticmethod
    def _match_regex(text: Any, patterns: Iterable[str]) -> bool:
        """Return True if any regex pattern matches text (case-insensitive)."""
        text_str = str(text)
        for pattern in patterns:
            try:
                if re.search(pattern, text_str, re.IGNORECASE):
                    return True
            except re.error:
                logger.warning("Invalid regex pattern skipped: %s", pattern)
                continue
        return False

    @staticmethod
    def _string_contains(value: Any, pattern: Any) -> bool:
        if pattern is None:
            return False
        return str(pattern).lower() in str(value).lower()

    @staticmethod
    def _string_contains_any(value: Any, patterns: Iterable[Any]) -> bool:
        value_str = str(value).lower()
        return any(str(p).lower() in value_str for p in patterns)

    @staticmethod
    def _string_equals_any(value: Any, patterns: Iterable[Any]) -> bool:
        value_str = str(value).lower()
        return any(value_str == str(p).lower() for p in patterns)

    @staticmethod
    def _numeric_threshold(value: Any, threshold: Any) -> bool:
        try:
            return float(value) > float(threshold)
        except (TypeError, ValueError):
            return False

    @staticmethod
    def _numeric_less_than(value: Any, threshold: Any) -> bool:
        try:
            return float(value) < float(threshold)
        except (TypeError, ValueError):
            return False

    def _boolean_match(self, value: Any, expected: Any, job_data: Dict[str, Any]) -> bool:
        # Only evaluate boolean types by default to avoid misfiring on dict/int.
        if isinstance(value, bool):
            try:
                return value is bool(expected) and value == expected
            except Exception:
                return False
        return False

    @staticmethod
    def _get_nested_value(data: Dict[str, Any], path: str) -> Optional[Any]:
        """
        Extract value from nested dictionary using dot notation.

        Example: "poster_info.company" -> data['poster_info']['company']
        """
        keys = path.split(".")
        current: Any = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current

    @staticmethod
    def _ensure_iterable(value: Any) -> Iterable[Any]:
        if value is None:
            return []
        if isinstance(value, (list, tuple, set)):
            return value
        return [value]

    @staticmethod
    def _is_company_info_complete(job_data: Dict[str, Any]) -> bool:
        """Return True when company_info contains at least one meaningful value."""
        company_info = job_data.get("company_info")
        if not isinstance(company_info, dict):
            return False
        values = list(company_info.values())
        return any(v not in (None, "", [], {}) for v in values)

    def _check_body_shop_pattern(self, company_name: Any, job_data: Dict[str, Any]) -> bool:
        """
        Detect generic body-shop company name patterns.

        A company is flagged if:
        1. Name contains generic keywords + legal suffix
        2. AND has additional suspicious signals (small size, domain issues, etc.)

        This prevents false positives on legitimate companies like:
        - Adobe Systems, Cisco Systems, Nvidia Technologies, etc.

        Returns True if company matches body-shop pattern.
        """
        name = str(company_name).lower()

        generic_keywords = [
            "consulting",
            "solutions",
            "systems",
            "technologies",
            "staffing",
            "recruiting",
            "talent",
            "services",
            "global",
        ]

        legal_suffixes = ["llc", "inc", "corp", "ltd", "limited", "incorporated"]

        has_generic_keyword = any(keyword in name for keyword in generic_keywords)
        if not has_generic_keyword:
            return False

        domain_matches = self._get_nested_value(job_data, "company_info.domain_matches_name")
        company_size = self._get_nested_value(job_data, "company_info.size_employees")
        glassdoor = self._get_nested_value(job_data, "company_info.glassdoor_rating")

        has_legal_suffix = any(suffix in name for suffix in legal_suffixes)
        generic_count = sum(1 for keyword in generic_keywords if keyword in name)

        # If no legal suffix and only one generic keyword, allow trigger only when small and domain mismatch.
        if not has_legal_suffix and generic_count < 2:
            if (
                domain_matches is False
                and isinstance(company_size, (int, float))
                and company_size < 100
            ):
                return True
            return False

        if (
            domain_matches is True
            and isinstance(company_size, (int, float))
            and company_size >= 500
        ):
            return False

        if (
            domain_matches is True
            and isinstance(company_size, (int, float))
            and company_size >= 100
            and isinstance(glassdoor, (int, float))
            and glassdoor >= 3.5
        ):
            return False

        if domain_matches is False:
            return True

        if isinstance(company_size, (int, float)) and company_size < 50:
            return True

        words = name.split()
        if len(words) <= 3 and generic_count >= 2:
            return True

        return False

    @staticmethod
    def _check_missing_action_verbs(jd_text: Any) -> bool:
        text = str(jd_text).lower()
        action_verbs = [
            "build",
            "develop",
            "create",
            "design",
            "implement",
            "architect",
            "construct",
            "code",
            "write",
            "program",
            "work",
            "collaborate",
            "partner",
            "coordinate",
            "contribute",
            "participate",
            "engage",
            "join",
            "support",
            "lead",
            "manage",
            "direct",
            "oversee",
            "supervise",
            "guide",
            "mentor",
            "coach",
            "drive",
            "own",
            "improve",
            "optimize",
            "enhance",
            "refine",
            "streamline",
            "scale",
            "upgrade",
            "modernize",
            "analyze",
            "solve",
            "troubleshoot",
            "debug",
            "investigate",
            "research",
            "evaluate",
            "assess",
            "maintain",
            "operate",
            "monitor",
            "ensure",
            "deploy",
            "run",
            "execute",
            "perform",
            "communicate",
            "document",
            "present",
            "report",
            "share",
            "explain",
            "demonstrate",
        ]
        responsibility_phrases = [
            "responsibilities",
            "you will",
            "you'll",
            "your role",
            "what you'll do",
            "day-to-day",
            "in this role",
        ]
        has_action_verbs = any(verb in text for verb in action_verbs)
        has_responsibility_section = any(p in text for p in responsibility_phrases)
        return not (has_action_verbs or has_responsibility_section)

    @staticmethod
    def _check_extreme_formatting(jd_text: Any) -> bool:
        text = str(jd_text)
        suspect = 0

        if re.search(r" {10,}", text):
            suspect += 1
        if re.search(r"\t{5,}", text):
            suspect += 1
        if re.search(r"[•●○■□▪▫]{3,}", text):
            suspect += 1
        if re.search(r"\n{5,}", text):
            suspect += 1
        if re.search(r"\t\s{6,}", text):
            suspect += 1
        if re.search(r"[=\\-_]{10,}", text):
            suspect += 1
        return suspect >= 1

    def _effective_weight(self, rule: Dict[str, Any], job_data: Dict[str, Any]) -> float:
        """Compute context-aware weight adjustments."""
        try:
            weight = float(rule.get("weight", 0.0))
        except (TypeError, ValueError):
            return 0.0

        # No complex weight adjustments in v2.0 - keep it simple
        return weight
