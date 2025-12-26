"""
Test scoring v2.0 with edge cases - specifically targeting suspicious jobs.
"""

import re
import sys
from collections import Counter
from pathlib import Path

backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

from src.fuckwork.services.scoring.scorer import AuthenticityScorer

RULE_TABLE_PATH = Path(__file__).parent.parent / "data" / "authenticity_rule_table.json"
SQL_FILE = Path.home() / "Desktop" / "jobs_data.sql"


def find_suspicious_jobs(sql_content: str, limit: int = 20) -> list:
    """Find jobs that should be flagged as suspicious."""
    jobs = []

    # Pattern to extract job data
    pattern = r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*E?'((?:[^'\\]|\\.|'')*?)'"

    # Keywords that indicate suspicious jobs
    recruiter_keywords = ["our client is", "client is looking", "hiring on behalf"]
    staffing_companies = [
        "apex systems",
        "kforce",
        "insight global",
        "robert half",
        "teksystems",
        "randstad",
    ]
    contract_keywords = ["contract", "contractor", "c2c"]

    matches = list(re.finditer(pattern, sql_content))

    categories = {
        "recruiter_language": [],
        "staffing_company": [],
        "contract_title": [],
        "short_jd": [],
        "consultant_title": [],
    }

    for match in matches:
        try:
            jd_text = match.group(8).replace("''", "'").replace("\\n", "\n").lower()
            title = match.group(3).replace("''", "'").lower()
            company = match.group(4).replace("''", "'").lower()

            job = {
                "id": int(match.group(1)),
                "job_id": match.group(2),
                "title": match.group(3).replace("''", "'"),
                "company_name": match.group(4).replace("''", "'"),
                "location": match.group(5).replace("''", "'"),
                "url": match.group(6),
                "platform": match.group(7),
                "jd_text": match.group(8).replace("''", "'").replace("\\n", "\n"),
                "company_info": {},
            }

            # Categorize
            if (
                any(kw in jd_text for kw in recruiter_keywords)
                and len(categories["recruiter_language"]) < limit
            ):
                categories["recruiter_language"].append(job)
            elif (
                any(sc in company for sc in staffing_companies)
                and len(categories["staffing_company"]) < limit
            ):
                categories["staffing_company"].append(job)
            elif (
                any(kw in title for kw in contract_keywords)
                and len(categories["contract_title"]) < limit
            ):
                categories["contract_title"].append(job)
            elif "consultant" in title and len(categories["consultant_title"]) < limit:
                categories["consultant_title"].append(job)
            elif len(jd_text) < 500 and len(categories["short_jd"]) < limit:
                categories["short_jd"].append(job)

        except Exception:
            continue

    return categories


def test_edge_cases():
    """Test scoring on edge cases that should be flagged."""

    print("=" * 80)
    print("Scoring System v2.0 - Edge Case Validation")
    print("=" * 80)

    print(f"\n📂 Reading SQL file...")
    with open(SQL_FILE, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    print(f"🔍 Finding suspicious jobs...")
    categories = find_suspicious_jobs(content, limit=10)

    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))

    for category, jobs in categories.items():
        print(f"\n" + "=" * 80)
        print(f"📋 Category: {category.upper()} ({len(jobs)} jobs)")
        print("=" * 80)

        if not jobs:
            print("   No jobs found in this category")
            continue

        scores = []
        levels = Counter()

        for job in jobs[:5]:  # Test first 5 of each category
            result = scorer.score_job(job)
            scores.append(result["authenticity_score"])
            levels[result["level"]] += 1

            print(f"\n🔹 {job['title'][:50]} @ {job['company_name'][:25]}")
            print(
                f"   Score: {result['authenticity_score']:.1f} | Level: {result['level']} | Confidence: {result['confidence']}"
            )

            if result["red_flags"]:
                print(f"   ❌ Red flags: {result['red_flags'][:3]}")
            if result["positive_signals"]:
                print(f"   ✅ Positive: {result['positive_signals'][:2]}")

            # Show JD snippet for context
            jd_snippet = job["jd_text"][:150].replace("\n", " ")
            print(f"   📝 JD: {jd_snippet}...")

        if scores:
            print(
                f"\n   📊 Category Stats: Avg={sum(scores)/len(scores):.1f}, Min={min(scores):.1f}, Max={max(scores):.1f}"
            )
            print(f"   📊 Levels: {dict(levels)}")

    print("\n" + "=" * 80)
    print("✅ Edge Case Validation Complete!")


if __name__ == "__main__":
    test_edge_cases()
