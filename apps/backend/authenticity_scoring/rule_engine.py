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
                    activated_rules.append(
                        {
                            "id": rule["id"],
                            "weight": rule["weight"],
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
        if value is None:
            return False

        pattern_type = rule.get("pattern_type")
        pattern_value = rule.get("pattern_value")

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
            return self._boolean_match(value, pattern_value)

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

    @staticmethod
    def _boolean_match(value: Any, expected: Any) -> bool:
        try:
            return bool(value) is bool(expected) and bool(value) == expected
        except Exception:
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
