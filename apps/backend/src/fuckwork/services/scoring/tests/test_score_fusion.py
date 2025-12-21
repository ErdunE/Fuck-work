import math
from pathlib import Path
from typing import Dict, List

import pytest

from apps.backend.authenticity_scoring.score_fusion import ScoreFusion


@pytest.fixture(scope="module")
def fusion() -> ScoreFusion:
    return ScoreFusion()


def test_exponential_formula(fusion: ScoreFusion) -> None:
    activated = [{"id": "A1", "weight": 0.25, "signal": "negative", "confidence": "high"}]
    result = fusion.calculate(activated)
    assert 60 <= result["authenticity_score"] <= 68
    assert result["level"] == "uncertain"


def test_level_thresholds(fusion: ScoreFusion) -> None:
    # likely real
    activated = [{"id": "neg", "weight": 0.05, "signal": "negative", "confidence": "high"}]
    result = fusion.calculate(activated)
    assert result["level"] == "likely real"

    # uncertain
    activated = [{"id": "neg", "weight": 0.3, "signal": "negative", "confidence": "high"}]
    result = fusion.calculate(activated)
    assert result["level"] == "uncertain"

    # likely fake
    activated = [{"id": "neg", "weight": 0.6, "signal": "negative", "confidence": "high"}]
    result = fusion.calculate(activated)
    assert result["level"] == "likely fake"


def test_positive_signal_boost(fusion: ScoreFusion) -> None:
    negatives = [{"id": "N1", "weight": 0.4, "signal": "negative", "confidence": "high"}]
    positives = [{"id": "P1", "weight": 0.4, "signal": "positive", "confidence": "high"}]
    base_result = fusion.calculate(negatives)
    boosted_result = fusion.calculate(negatives + positives)
    assert boosted_result["authenticity_score"] > base_result["authenticity_score"]
    assert boosted_result["authenticity_score"] <= base_result["authenticity_score"] * fusion.MAX_GAIN


def test_confidence_levels(fusion: ScoreFusion) -> None:
    job_full = {
        "jd_text": "text",
        "poster_info": {"dummy": True},
        "platform_metadata": {"posted_days_ago": 3},
        "company_name": "ACME",
    }

    # High: one strong rule plus full coverage
    activated = [{"id": "S1", "weight": 0.2, "signal": "negative", "confidence": "high"}]
    assert fusion.calculate(activated, job_full)["confidence"] == "High"

    # Medium: one strong rule, partial coverage (2/4)
    job_partial = {"jd_text": "text", "company_name": "ACME"}
    activated = [{"id": "S1", "weight": 0.18, "signal": "negative", "confidence": "high"}]
    assert fusion.calculate(activated, job_partial)["confidence"] == "Medium"

    # Low: no data and no strong rules
    activated = [{"id": "S1", "weight": 0.05, "signal": "negative", "confidence": "high"}]
    assert fusion.calculate(activated)["confidence"] == "Low"


def test_clamping(fusion: ScoreFusion) -> None:
    # Extreme negative sum drives towards 0
    activated = [{"id": "N1", "weight": 5.0, "signal": "negative", "confidence": "high"}]
    result = fusion.calculate(activated)
    assert 0 <= result["authenticity_score"] <= 1

    # No negatives yields 100
    result = fusion.calculate([])
    assert result["authenticity_score"] == 100.0


def test_sample_dataset_scores_within_tolerance(fusion: ScoreFusion) -> None:
    """
    Validate scoring against representative weight combinations (±5 tolerance).
    Integration with full rule activation is covered in later stages.
    """
    # EXAMPLE_HIGH_1: expected ~92 (likely real)
    activated = [
        {"id": "minor", "weight": 0.05, "signal": "negative", "confidence": "low"},
    ]
    result = fusion.calculate(activated)
    assert 85 <= result["authenticity_score"] <= 100
    assert result["level"] == "likely real"

    # EXAMPLE_MEDIUM_1: expected ~73 (uncertain)
    activated = [
        {"id": "N1", "weight": 0.18, "signal": "negative", "confidence": "medium"},
    ]
    result = fusion.calculate(activated)
    assert 68 <= result["authenticity_score"] <= 78
    assert result["level"] == "uncertain"

    # EXAMPLE_LOW_BODYSHOP_1: expected ~34 (likely fake)
    activated = [
        {"id": "N1", "weight": 0.25, "signal": "negative", "confidence": "high"},
        {"id": "N2", "weight": 0.22, "signal": "negative", "confidence": "high"},
        {"id": "N3", "weight": 0.20, "signal": "negative", "confidence": "high"},
    ]
    result = fusion.calculate(activated)
    assert 29 <= result["authenticity_score"] <= 39
    assert result["level"] == "likely fake"

    # EXAMPLE_STALE_1: expected ~49 (likely fake)
    activated = [
        {"id": "N1", "weight": 0.20, "signal": "negative", "confidence": "high"},
        {"id": "N2", "weight": 0.15, "signal": "negative", "confidence": "medium"},
    ]
    result = fusion.calculate(activated)
    assert 44 <= result["authenticity_score"] <= 54
    assert result["level"] == "likely fake"

    # EXAMPLE_SCAM_1: expected ~12 (likely fake)
    activated = [
        {"id": "N1", "weight": 0.25, "signal": "negative", "confidence": "high"},
        {"id": "N2", "weight": 0.22, "signal": "negative", "confidence": "high"},
        {"id": "N3", "weight": 0.20, "signal": "negative", "confidence": "high"},
        {"id": "N4", "weight": 0.18, "signal": "negative", "confidence": "high"},
        {"id": "N5", "weight": 0.18, "signal": "negative", "confidence": "high"},
        {"id": "N6", "weight": 0.15, "signal": "negative", "confidence": "medium"},
    ]
    result = fusion.calculate(activated)
    assert 7 <= result["authenticity_score"] <= 17
    assert result["level"] == "likely fake"

