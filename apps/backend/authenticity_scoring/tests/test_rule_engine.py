from pathlib import Path
from typing import Dict, List

import pytest

from apps.backend.authenticity_scoring.rule_engine import RuleEngine


@pytest.fixture(scope="module")
def rule_engine() -> RuleEngine:
    rule_path = Path(__file__).resolve().parent.parent / "data" / "authenticity_rule_table.json"
    return RuleEngine(str(rule_path))


def base_job() -> Dict:
    """Provide a baseline job structure to override in tests."""
    return {
        "jd_text": "",
        "title": "",
        "company_name": "",
        "poster_info": {
            "name": "",
            "title": "",
            "company": "",
            "location": "",
            "account_age_months": 24,
            "recent_job_count_7d": 0,
        },
        "company_info": {
            "website_domain": "",
            "domain_matches_name": True,
            "size_employees": 100,
            "glassdoor_rating": 4.0,
            "has_layoffs_recent": False,
        },
        "platform_metadata": {
            "posted_days_ago": 5,
            "repost_count": 0,
            "applicants_count": 10,
            "views_count": 100,
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


def _activated_ids(engine: RuleEngine, job_data: Dict) -> List[str]:
    return [r["id"] for r in engine.check(job_data)]


def test_regex_activation_A1(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Our client is looking for engineers."
    ids = _activated_ids(rule_engine, job)
    assert "A1" in ids


def test_string_contains_any_A5(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["poster_info"]["title"] = "Technical Recruiter"
    ids = _activated_ids(rule_engine, job)
    assert "A5" in ids


def test_string_contains_B13(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["title"] = "Software Consultant"
    ids = _activated_ids(rule_engine, job)
    assert "B13" in ids


def test_string_equals_any_A12(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["company_name"] = "Confidential"
    ids = _activated_ids(rule_engine, job)
    assert "A12" in ids


def test_numeric_threshold_A3(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["poster_info"]["recent_job_count_7d"] = 9
    ids = _activated_ids(rule_engine, job)
    assert "A3" in ids


def test_numeric_less_than_A9(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["poster_info"]["account_age_months"] = 3
    ids = _activated_ids(rule_engine, job)
    assert "A9" in ids


def test_boolean_true_A4(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["derived_signals"]["poster_no_company"] = True
    ids = _activated_ids(rule_engine, job)
    assert "A4" in ids


def test_boolean_true_A6(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["derived_signals"]["company_poster_mismatch"] = True
    ids = _activated_ids(rule_engine, job)
    assert "A6" in ids


def test_nested_field_A2(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["poster_info"]["company"] = "Infosys"
    ids = _activated_ids(rule_engine, job)
    assert "A2" in ids


def test_platform_numeric_threshold_C1(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["platform_metadata"]["posted_days_ago"] = 40
    ids = _activated_ids(rule_engine, job)
    assert "C1" in ids


def test_regex_positive_signal_B6(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "We will sponsor H1B for the right candidate."
    ids = _activated_ids(rule_engine, job)
    assert "B6" in ids


def test_no_activation_when_missing_data(rule_engine: RuleEngine) -> None:
    ids = _activated_ids(rule_engine, {"jd_text": None})
    assert ids == []


def test_multiple_rules_trigger(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Our client offers contract work; apply ASAP and email hiring2025@gmail.com"
    job["platform_metadata"]["repost_count"] = 4
    job["poster_info"]["recent_job_count_7d"] = 12
    ids = _activated_ids(rule_engine, job)
    expected = {"A1", "B12", "B10", "A3", "C2", "A14"}
    assert expected.issubset(set(ids))


def test_case_insensitive_matching(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Looking for a ROCKSTAR engineer"
    ids = _activated_ids(rule_engine, job)
    assert "B7" in ids
