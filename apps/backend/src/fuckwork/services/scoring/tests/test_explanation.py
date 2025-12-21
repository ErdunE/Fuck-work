"""Tests for ExplanationEngine (spec section 5)."""

from typing import Dict, List

import pytest

from apps.backend.authenticity_scoring.explanation_engine import ExplanationEngine


@pytest.fixture(scope="module")
def engine() -> ExplanationEngine:
    return ExplanationEngine()


def _make_rule(
    rule_id: str,
    weight: float,
    signal: str,
    description: str,
    confidence: str = "high",
) -> Dict:
    return {
        "id": rule_id,
        "weight": weight,
        "signal": signal,
        "description": description,
        "confidence": confidence,
    }


# -----------------------------------------------------------------------------
# Summary generation tests
# -----------------------------------------------------------------------------


def test_summary_likely_real(engine: ExplanationEngine) -> None:
    result = engine.generate(92.0, "likely real", [])
    assert "92" in result["summary"]
    assert "High authenticity" in result["summary"]


def test_summary_uncertain(engine: ExplanationEngine) -> None:
    result = engine.generate(65.0, "uncertain", [])
    assert "65" in result["summary"]
    assert "Uncertain authenticity" in result["summary"]


def test_summary_likely_fake(engine: ExplanationEngine) -> None:
    result = engine.generate(34.0, "likely fake", [])
    assert "34" in result["summary"]
    assert "Low authenticity" in result["summary"]


def test_summary_fallback_unknown_level(engine: ExplanationEngine) -> None:
    result = engine.generate(50.0, "unknown_level", [])
    assert "50" in result["summary"]


# -----------------------------------------------------------------------------
# Red flags extraction tests
# -----------------------------------------------------------------------------


def test_red_flags_sorted_by_weight(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule("A1", 0.10, "negative", "Low weight issue"),
        _make_rule("A2", 0.25, "negative", "High weight issue"),
        _make_rule("A3", 0.18, "negative", "Medium weight issue"),
    ]
    result = engine.generate(50.0, "likely fake", activated)

    # Should be sorted descending by weight
    assert result["red_flags"][0] == "High weight issue"
    assert result["red_flags"][1] == "Medium weight issue"
    assert result["red_flags"][2] == "Low weight issue"


def test_red_flags_max_five(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule(f"R{i}", 0.1 + i * 0.01, "negative", f"Issue number {i}")
        for i in range(10)
    ]
    result = engine.generate(30.0, "likely fake", activated)

    assert len(result["red_flags"]) == 5


def test_red_flags_excludes_positive(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule("N1", 0.20, "negative", "Negative signal"),
        _make_rule("P1", 0.15, "positive", "Positive signal"),
    ]
    result = engine.generate(60.0, "uncertain", activated)

    assert "Negative signal" in result["red_flags"]
    assert "Positive signal" not in result["red_flags"]


def test_red_flags_no_rule_ids(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule("A1", 0.25, "negative", "Posted by external recruiter"),
        _make_rule("B2", 0.20, "negative", "Job posted more than 30 days ago"),
    ]
    result = engine.generate(40.0, "likely fake", activated)

    for flag in result["red_flags"]:
        # Rule IDs should NOT appear in output
        assert "A1" not in flag
        assert "B2" not in flag
        # Should be readable strings (length > 10)
        assert len(flag) > 10


# -----------------------------------------------------------------------------
# Positive signals extraction tests
# -----------------------------------------------------------------------------


def test_positive_signals_extracted(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule("N1", 0.20, "negative", "Negative signal"),
        _make_rule("P1", 0.05, "positive", "Visa sponsorship available"),
    ]
    result = engine.generate(75.0, "uncertain", activated)

    assert "Visa sponsorship available" in result["positive_signals"]
    assert "Negative signal" not in result["positive_signals"]


def test_positive_signals_empty_when_none(engine: ExplanationEngine) -> None:
    activated = [
        _make_rule("N1", 0.20, "negative", "Negative only"),
    ]
    result = engine.generate(60.0, "uncertain", activated)

    assert result["positive_signals"] == []


# -----------------------------------------------------------------------------
# Edge cases
# -----------------------------------------------------------------------------


def test_empty_activated_rules(engine: ExplanationEngine) -> None:
    result = engine.generate(100.0, "likely real", [])

    assert "summary" in result
    assert result["red_flags"] == []
    assert result["positive_signals"] == []


def test_readable_strings_not_ids(engine: ExplanationEngine) -> None:
    """Ensure output contains human-readable descriptions, not rule IDs."""
    activated = [
        _make_rule(
            "A1",
            0.25,
            "negative",
            "Posted by external recruiter (uses 'our client' language)",
        ),
        _make_rule(
            "C1",
            0.20,
            "negative",
            "Job posted more than 30 days ago",
        ),
        _make_rule(
            "B6",
            0.05,
            "positive",
            "States willingness to sponsor visa",
        ),
    ]
    result = engine.generate(45.0, "likely fake", activated)

    # Verify descriptions are used, not IDs
    assert "Posted by external recruiter" in result["red_flags"][0]
    assert "Job posted more than 30 days ago" in result["red_flags"][1]
    assert "States willingness to sponsor visa" in result["positive_signals"][0]

    # Verify no rule IDs leak through
    all_text = " ".join(result["red_flags"]) + " ".join(result["positive_signals"])
    assert "A1" not in all_text
    assert "C1" not in all_text
    assert "B6" not in all_text


def test_missing_description_fallback(engine: ExplanationEngine) -> None:
    activated = [
        {"id": "X1", "weight": 0.15, "signal": "negative"},  # No description
    ]
    result = engine.generate(50.0, "uncertain", activated)

    # Should use fallback text
    assert len(result["red_flags"]) == 1
    assert "Unknown signal" in result["red_flags"][0] or len(result["red_flags"][0]) > 0

