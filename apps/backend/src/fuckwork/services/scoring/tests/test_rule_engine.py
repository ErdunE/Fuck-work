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


# ---------------------------------------------------------------------
# B18 tests
# ---------------------------------------------------------------------


def test_B18_not_trigger_on_faang(rule_engine: RuleEngine) -> None:
    job = base_job()
    job[
        "jd_text"
    ] = """
    Google is hiring a Software Engineer.
    You'll work on building distributed systems.
    """
    ids = _activated_ids(rule_engine, job)
    assert "B18" not in ids


def test_B18_not_trigger_on_you_will(rule_engine: RuleEngine) -> None:
    job = base_job()
    job[
        "jd_text"
    ] = """
    In this role, you will design and develop features.
    """
    ids = _activated_ids(rule_engine, job)
    assert "B18" not in ids


def test_B18_trigger_on_generic_jd(rule_engine: RuleEngine) -> None:
    job = base_job()
    job[
        "jd_text"
    ] = """
    Software Engineer position.
    Competitive salary.
    """
    ids = _activated_ids(rule_engine, job)
    assert "B18" in ids


def test_B18_not_trigger_with_responsibilities(rule_engine: RuleEngine) -> None:
    job = base_job()
    job[
        "jd_text"
    ] = """
    Responsibilities:
    - Write code
    - Fix bugs
    """
    ids = _activated_ids(rule_engine, job)
    assert "B18" not in ids


# ---------------------------------------------------------------------
# B20 tests
# ---------------------------------------------------------------------


def test_B20_normal_formatting(rule_engine: RuleEngine) -> None:
    job = base_job()
    job[
        "jd_text"
    ] = """
    Software Engineer
    - Python
    - Cloud
    """
    ids = _activated_ids(rule_engine, job)
    assert "B20" not in ids


def test_B20_extreme_spaces(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Software          Engineer"
    ids = _activated_ids(rule_engine, job)
    assert "B20" in ids


def test_B20_extreme_tabs(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Software\t\t\t\t\tEngineer"
    ids = _activated_ids(rule_engine, job)
    assert "B20" in ids


def test_B20_bullet_artifacts(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Requirements: •••Python"
    ids = _activated_ids(rule_engine, job)
    assert "B20" in ids


def test_B20_blank_lines(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "A\n\n\n\n\n\nB"
    ids = _activated_ids(rule_engine, job)
    assert "B20" in ids


def test_B20_multiple_extremes(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Software          Engineer\t\t\t\t\t"
    ids = _activated_ids(rule_engine, job)
    assert "B20" in ids


def test_B20_single_minor_issue(rule_engine: RuleEngine) -> None:
    job = base_job()
    job["jd_text"] = "Software      Engineer"
    ids = _activated_ids(rule_engine, job)
    assert "B20" not in ids


# ---------------------------------------------------------------------
# A7 (Body-shop pattern) tests
# ---------------------------------------------------------------------


def test_A7_triggers_on_generic_llc(rule_engine: RuleEngine) -> None:
    """Generic name like 'ABC Solutions LLC' should trigger A7."""
    job = base_job()
    job["company_name"] = "ABC Solutions LLC"
    job["company_info"]["domain_matches_name"] = False
    job["company_info"]["size_employees"] = 30
    ids = _activated_ids(rule_engine, job)
    assert "A7" in ids


def test_A7_triggers_on_xyz_systems_inc(rule_engine: RuleEngine) -> None:
    """Generic name like 'XYZ Systems Inc' should trigger A7."""
    job = base_job()
    job["company_name"] = "XYZ Systems Inc"
    job["company_info"]["domain_matches_name"] = False
    job["company_info"]["size_employees"] = 45
    ids = _activated_ids(rule_engine, job)
    assert "A7" in ids


def test_A7_not_trigger_on_cafe_technologies(rule_engine: RuleEngine) -> None:
    """Legitimate company 'Café Technologies' should NOT trigger A7."""
    job = base_job()
    job["company_name"] = "Café Technologies"
    job["company_info"]["domain_matches_name"] = True
    job["company_info"]["size_employees"] = 120
    job["company_info"]["glassdoor_rating"] = 3.8
    ids = _activated_ids(rule_engine, job)
    assert "A7" not in ids, "A7 should not trigger on legitimate tech company"


def test_A7_not_trigger_on_adobe_systems(rule_engine: RuleEngine) -> None:
    """Large established company 'Adobe Systems' should NOT trigger A7."""
    job = base_job()
    job["company_name"] = "Adobe Systems"
    job["company_info"]["domain_matches_name"] = True
    job["company_info"]["size_employees"] = 25000
    ids = _activated_ids(rule_engine, job)
    assert "A7" not in ids


def test_A7_not_trigger_on_nvidia_technologies(rule_engine: RuleEngine) -> None:
    """'Nvidia Technologies' should NOT trigger A7."""
    job = base_job()
    job["company_name"] = "Nvidia Technologies"
    job["company_info"]["domain_matches_name"] = True
    job["company_info"]["size_employees"] = 30000
    ids = _activated_ids(rule_engine, job)
    assert "A7" not in ids


def test_A7_triggers_on_small_generic_no_domain(rule_engine: RuleEngine) -> None:
    """Small company with generic name and no domain match should trigger A7."""
    job = base_job()
    job["company_name"] = "IT Solutions"
    job["company_info"]["domain_matches_name"] = False
    job["company_info"]["size_employees"] = 20
    ids = _activated_ids(rule_engine, job)
    assert "A7" in ids


def test_A7_not_trigger_on_established_medium_company(rule_engine: RuleEngine) -> None:
    """Medium company (100-499) with good rating should NOT trigger A7."""
    job = base_job()
    job["company_name"] = "DataTech Solutions"
    job["company_info"]["domain_matches_name"] = True
    job["company_info"]["size_employees"] = 250
    job["company_info"]["glassdoor_rating"] = 4.0
    ids = _activated_ids(rule_engine, job)
    assert "A7" not in ids
