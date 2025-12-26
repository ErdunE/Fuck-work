"""Integration tests for complete authenticity scoring pipeline (spec section 7)."""

import json
import time
from pathlib import Path
from typing import Dict

import pytest
from apps.backend.authenticity_scoring import AuthenticityScorer


@pytest.fixture(scope="module")
def scorer() -> AuthenticityScorer:
    """Initialize scorer with rule table."""
    rule_path = Path(__file__).resolve().parent.parent / "data" / "authenticity_rule_table.json"
    return AuthenticityScorer(str(rule_path))


@pytest.fixture(scope="module")
def sample_jobs() -> Dict:
    """Load sample dataset."""
    dataset_path = Path(__file__).resolve().parent / "data" / "authenticity_sample_dataset.json"
    with dataset_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_end_to_end_pipeline(scorer: AuthenticityScorer) -> None:
    """Test complete pipeline with representative job data."""
    job_data = {
        "job_id": "test_001",
        "jd_text": "Our client is looking for a Software Engineer.",
        "title": "Software Engineer",
        "company_name": "Tech Corp",
        "platform": "LinkedIn",
        "location": "San Francisco, CA",
        "url": "https://example.com/job",
        "poster_info": {
            "name": "Jane Doe",
            "title": "Recruiter",
            "company": "Staffing Agency",
            "location": "San Francisco, CA",
            "account_age_months": 12,
            "recent_job_count_7d": 5,
        },
        "company_info": {
            "website_domain": "techcorp.com",
            "domain_matches_name": True,
            "size_employees": 100,
            "glassdoor_rating": 3.5,
            "has_layoffs_recent": False,
        },
        "platform_metadata": {
            "posted_days_ago": 10,
            "repost_count": 0,
            "applicants_count": 50,
            "views_count": 500,
            "actively_hiring_tag": True,
            "easy_apply": True,
        },
        "derived_signals": {
            "company_domain_mismatch": False,
            "poster_no_company": False,
            "poster_job_location_mismatch": False,
            "company_poster_mismatch": False,
            "no_poster_identity": False,
        },
    }

    result = scorer.score_job(job_data)

    # Verify structure
    assert "authenticity_score" in result
    assert "level" in result
    assert "confidence" in result
    assert "summary" in result
    assert "red_flags" in result
    assert "positive_signals" in result
    assert "activated_rules" in result
    assert "computed_at" in result

    # Verify types
    assert isinstance(result["authenticity_score"], (int, float))
    assert result["level"] in ["likely real", "uncertain", "likely fake"]
    assert result["confidence"] in ["Low", "Medium", "High"]
    assert isinstance(result["red_flags"], list)
    assert isinstance(result["positive_signals"], list)
    assert isinstance(result["activated_rules"], list)

    activated_ids = [r["id"] for r in result["activated_rules"]]
    assert "A1" in activated_ids  # "our client" language
    assert "A5" in activated_ids  # "Recruiter" in title


def test_sample_dataset_validation(scorer: AuthenticityScorer, sample_jobs: Dict) -> None:
    """
    Validate scoring against all 5 sample jobs from dataset.

    This is the CRITICAL test - validates entire pipeline with real data.
    """
    for job in sample_jobs["jobs"]:
        job_id = job["job_id"]
        expected = job["expected_output"]

        result = scorer.score_job(job)

        score_diff = abs(result["authenticity_score"] - expected["authenticity_score"])
        assert score_diff <= 5, (
            f"Job {job_id}: score {result['authenticity_score']} "
            f"not within ±5 of expected {expected['authenticity_score']}"
        )

        assert result["level"] == expected["level"], "Level mismatch"
        assert result["confidence"] == expected["confidence"], "Confidence mismatch"


def test_missing_jd_text_handling(scorer: AuthenticityScorer) -> None:
    """Test graceful handling when critical data is missing."""
    job_data = {
        "job_id": "missing_jd",
        "jd_text": None,
        "company_name": "Test Corp",
    }

    result = scorer.score_job(job_data)

    assert result["confidence"] == "Low"
    assert "Insufficient data" in result["summary"]
    assert len(result["red_flags"]) > 0


def test_performance_single_job(scorer: AuthenticityScorer) -> None:
    """Test that scoring completes within performance requirements (<5 sec)."""
    job_data = {
        "job_id": "perf_test",
        "jd_text": "Software Engineer role at a great company.",
        "title": "Software Engineer",
        "company_name": "Tech Inc",
        "poster_info": {"title": "HR Manager"},
        "platform_metadata": {"posted_days_ago": 5},
        "derived_signals": {
            "company_domain_mismatch": False,
            "poster_no_company": False,
            "poster_job_location_mismatch": False,
            "company_poster_mismatch": False,
            "no_poster_identity": False,
        },
    }

    start = time.time()
    result = scorer.score_job(job_data)
    elapsed = time.time() - start

    assert elapsed < 5.0, f"Scoring took {elapsed:.2f}s, requirement is <5s"
    assert "authenticity_score" in result


def test_high_quality_job_scores_well(scorer: AuthenticityScorer, sample_jobs: Dict) -> None:
    """Verify EXAMPLE_HIGH_1 scores highly."""
    stripe_job = next(j for j in sample_jobs["jobs"] if j["job_id"] == "EXAMPLE_HIGH_1")
    result = scorer.score_job(stripe_job)

    assert result["authenticity_score"] >= 85
    assert result["level"] == "likely real"
    assert len(result["red_flags"]) <= 2


def test_scam_job_scores_poorly(scorer: AuthenticityScorer, sample_jobs: Dict) -> None:
    """Verify EXAMPLE_SCAM_1 scores very low."""
    scam_job = next(j for j in sample_jobs["jobs"] if j["job_id"] == "EXAMPLE_SCAM_1")
    result = scorer.score_job(scam_job)

    assert result["authenticity_score"] <= 20
    assert result["level"] == "likely fake"
    assert len(result["red_flags"]) >= 3


def test_faang_job_scores_high(scorer: AuthenticityScorer) -> None:
    job = {
        "job_id": "faang_job",
        "jd_text": """
        Google is hiring a Software Engineer for our Cloud Infrastructure team.
        You'll work on building distributed systems using Go and Python.
        """,
        "title": "Software Engineer, Cloud Infrastructure",
        "company_name": "Google",
        "platform": "LinkedIn",
        "location": "Mountain View, CA",
        "poster_info": {
            "name": "Sarah Chen",
            "title": "Engineering Manager",
            "company": "Google",
            "location": "Mountain View, CA",
            "account_age_months": 48,
            "recent_job_count_7d": 1,
        },
        "company_info": {
            "website_domain": "google.com",
            "domain_matches_name": True,
            "size_employees": 150000,
            "glassdoor_rating": 4.4,
            "has_layoffs_recent": False,
        },
        "platform_metadata": {
            "posted_days_ago": 2,
            "repost_count": 0,
            "applicants_count": 85,
            "views_count": 1200,
            "actively_hiring_tag": True,
            "easy_apply": False,
        },
        "derived_signals": {
            "company_domain_mismatch": False,
            "poster_no_company": False,
            "poster_job_location_mismatch": False,
            "company_poster_mismatch": False,
            "no_poster_identity": False,
        },
    }
    result = scorer.score_job(job)
    assert 85 <= result["authenticity_score"] <= 95
    assert result["level"] == "likely real"
    activated_ids = [r["id"] for r in result["activated_rules"]]
    assert "B18" not in activated_ids
    assert "B20" not in activated_ids
