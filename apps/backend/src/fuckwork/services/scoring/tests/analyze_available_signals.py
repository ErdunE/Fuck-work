"""
Analyze what signals are actually available in our data.
This will help us design better rules.
"""

import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

SQL_FILE = Path.home() / "Desktop" / "jobs_data.sql"


def extract_jobs_with_full_data(sql_content: str, limit: int = 1000) -> list:
    """Extract jobs with more complete data parsing."""
    jobs = []

    # More comprehensive pattern to capture more fields
    pattern = r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*E?'((?:[^'\\]|\\.|'')*?)'"

    matches = list(re.finditer(pattern, sql_content))

    # Random sample
    if len(matches) > limit:
        sampled = random.sample(matches, limit)
    else:
        sampled = matches

    for match in sampled:
        try:
            jd_text = match.group(8).replace("''", "'").replace("\\n", "\n")
            jd_text = re.sub(r"\\(.)", r"\1", jd_text)

            if len(jd_text) < 50:
                continue

            job = {
                "id": int(match.group(1)),
                "job_id": match.group(2),
                "title": match.group(3).replace("''", "'"),
                "company_name": match.group(4).replace("''", "'"),
                "location": match.group(5).replace("''", "'"),
                "platform": match.group(7),
                "jd_text": jd_text,
            }
            jobs.append(job)
        except:
            continue

    return jobs


def analyze_jd_patterns(jobs: list):
    """Analyze patterns in JD text that could indicate issues."""

    print("=" * 80)
    print("JD TEXT PATTERN ANALYSIS")
    print("=" * 80)

    # Pattern counters
    patterns = {
        # Recruiter/Agency patterns
        "our_client": r"\bour client\b",
        "client_seeking": r"\bclient.{0,20}(seeking|looking|needs)\b",
        "on_behalf": r"\bon behalf of\b",
        "staffing": r"\b(staffing|recruiting|placement)\s*(agency|firm|company)\b",
        # Urgency patterns
        "asap": r"\basap\b",
        "immediately": r"\bimmediately\b",
        "urgent": r"\burgent\b",
        "right_away": r"\bright away\b",
        # Vague patterns
        "competitive_salary": r"\bcompetitive\s*(salary|compensation|pay)\b",
        "fast_paced": r"\bfast[- ]paced\b",
        "self_starter": r"\bself[- ]starter\b",
        "team_player": r"\bteam player\b",
        "dynamic": r"\bdynamic\s*(environment|team|company)\b",
        # Positive patterns
        "has_salary_range": r"\$\s*\d{2,3}[,.]?\d{0,3}\s*[-–to]+\s*\$?\s*\d{2,3}",
        "has_401k": r"\b401\s*k\b",
        "has_health": r"\bhealth\s*(insurance|benefits|coverage)\b",
        "has_equity": r"\b(equity|stock|rsu|options)\b",
        "has_pto": r"\b(pto|paid\s*time\s*off|vacation)\b",
        # Quality indicators
        "has_responsibilities": r"\b(responsibilities|what you.ll do|your role)\b",
        "has_requirements": r"\b(requirements|qualifications|what we.re looking)\b",
        "has_about_us": r"\b(about us|about the company|who we are)\b",
        "has_interview_process": r"\b(interview process|hiring process)\b",
        # Red flags
        "contact_gmail": r"@gmail\.com",
        "contact_yahoo": r"@yahoo\.com",
        "unpaid": r"\bunpaid\b",
        "commission_only": r"\bcommission[- ]only\b",
        "mlm_patterns": r"\b(unlimited earning|be your own boss|financial freedom)\b",
        # Contract indicators
        "contract_role": r"\b(contract|contractor|c2c|corp.to.corp)\b",
        "temp_role": r"\b(temporary|temp\s+to\s+perm|temp-to-hire)\b",
        "w2_c2c": r"\b(w2|1099|c2c)\b",
        # Remote patterns
        "fully_remote": r"\b(fully remote|100% remote|remote only)\b",
        "hybrid": r"\bhybrid\b",
        "onsite": r"\b(on-site|onsite|in-office)\b",
    }

    results = Counter()

    for job in jobs:
        jd_lower = job["jd_text"].lower()
        for name, pattern in patterns.items():
            if re.search(pattern, jd_lower, re.IGNORECASE):
                results[name] += 1

    print(f"\nAnalyzed {len(jobs)} jobs\n")

    # Group by category
    categories = {
        "Recruiter/Agency": ["our_client", "client_seeking", "on_behalf", "staffing"],
        "Urgency": ["asap", "immediately", "urgent", "right_away"],
        "Vague/Buzzwords": [
            "competitive_salary",
            "fast_paced",
            "self_starter",
            "team_player",
            "dynamic",
        ],
        "Benefits (Positive)": [
            "has_salary_range",
            "has_401k",
            "has_health",
            "has_equity",
            "has_pto",
        ],
        "Quality (Positive)": [
            "has_responsibilities",
            "has_requirements",
            "has_about_us",
            "has_interview_process",
        ],
        "Red Flags": [
            "contact_gmail",
            "contact_yahoo",
            "unpaid",
            "commission_only",
            "mlm_patterns",
        ],
        "Contract Type": ["contract_role", "temp_role", "w2_c2c"],
        "Work Location": ["fully_remote", "hybrid", "onsite"],
    }

    for category, pattern_names in categories.items():
        print(f"\n📊 {category}:")
        for name in pattern_names:
            count = results.get(name, 0)
            pct = count * 100 / len(jobs)
            bar = "█" * int(pct / 2)
            print(f"   {name:<25}: {bar} {count:4d} ({pct:5.1f}%)")


def analyze_title_patterns(jobs: list):
    """Analyze patterns in job titles."""

    print("\n" + "=" * 80)
    print("JOB TITLE PATTERN ANALYSIS")
    print("=" * 80)

    patterns = {
        "contract_title": r"\bcontract\b",
        "contractor_title": r"\bcontractor\b",
        "consultant_title": r"\bconsultant\b",
        "temp_title": r"\btemp\b",
        "intern_title": r"\bintern\b",
        "senior_title": r"\bsenior\b",
        "junior_title": r"\bjunior\b",
        "lead_title": r"\blead\b",
        "manager_title": r"\bmanager\b",
        "director_title": r"\bdirector\b",
        "remote_title": r"\bremote\b",
        "hybrid_title": r"\bhybrid\b",
    }

    results = Counter()

    for job in jobs:
        title_lower = job["title"].lower()
        for name, pattern in patterns.items():
            if re.search(pattern, title_lower, re.IGNORECASE):
                results[name] += 1

    print(f"\nAnalyzed {len(jobs)} job titles\n")

    for name, count in sorted(results.items(), key=lambda x: -x[1]):
        pct = count * 100 / len(jobs)
        bar = "█" * int(pct / 2)
        print(f"   {name:<25}: {bar} {count:4d} ({pct:5.1f}%)")


def analyze_company_patterns(jobs: list):
    """Analyze company name patterns."""

    print("\n" + "=" * 80)
    print("COMPANY NAME PATTERN ANALYSIS")
    print("=" * 80)

    # Known staffing companies
    staffing_companies = [
        "apex systems",
        "kforce",
        "insight global",
        "robert half",
        "teksystems",
        "randstad",
        "adecco",
        "manpowergroup",
        "kelly services",
        "hays",
        "aerotek",
        "modis",
        "accenture",
        "infosys",
        "tata",
        "cognizant",
        "wipro",
        "hcl",
        "deloitte",
        "ey",
        "kpmg",
        "pwc",
        "jobot",
        "cybercoders",
    ]

    patterns = {
        "solutions_llc": r"\bsolutions\s*(llc|inc|corp)\b",
        "technologies_llc": r"\btechnologies\s*(llc|inc|corp)\b",
        "consulting_llc": r"\bconsulting\s*(llc|inc|corp)\b",
        "staffing_name": r"\b(staffing|recruiting|talent)\b",
        "global_name": r"\bglobal\b",
        "systems_name": r"\bsystems\b",
    }

    staffing_count = 0
    pattern_results = Counter()

    for job in jobs:
        company_lower = job["company_name"].lower()

        # Check known staffing
        if any(sc in company_lower for sc in staffing_companies):
            staffing_count += 1

        for name, pattern in patterns.items():
            if re.search(pattern, company_lower, re.IGNORECASE):
                pattern_results[name] += 1

    print(f"\nAnalyzed {len(jobs)} companies\n")

    pct = staffing_count * 100 / len(jobs)
    print(f"   Known staffing companies: {staffing_count:4d} ({pct:5.1f}%)")
    print()

    for name, count in sorted(pattern_results.items(), key=lambda x: -x[1]):
        pct = count * 100 / len(jobs)
        bar = "█" * int(pct / 2)
        print(f"   {name:<25}: {bar} {count:4d} ({pct:5.1f}%)")


def analyze_jd_length_distribution(jobs: list):
    """Analyze JD length distribution."""

    print("\n" + "=" * 80)
    print("JD LENGTH DISTRIBUTION")
    print("=" * 80)

    lengths = [len(job["jd_text"]) for job in jobs]

    buckets = Counter()
    for length in lengths:
        if length < 200:
            buckets["<200"] += 1
        elif length < 500:
            buckets["200-500"] += 1
        elif length < 1000:
            buckets["500-1000"] += 1
        elif length < 2000:
            buckets["1000-2000"] += 1
        elif length < 3000:
            buckets["2000-3000"] += 1
        elif length < 5000:
            buckets["3000-5000"] += 1
        else:
            buckets["5000+"] += 1

    print(f"\nAnalyzed {len(jobs)} JDs\n")

    order = ["<200", "200-500", "500-1000", "1000-2000", "2000-3000", "3000-5000", "5000+"]
    for bucket in order:
        count = buckets.get(bucket, 0)
        pct = count * 100 / len(jobs)
        bar = "█" * int(pct / 2)
        print(f"   {bucket:<15}: {bar} {count:4d} ({pct:5.1f}%)")


def find_duplicate_jds(jobs: list):
    """Find potential duplicate or template JDs."""

    print("\n" + "=" * 80)
    print("DUPLICATE/TEMPLATE JD ANALYSIS")
    print("=" * 80)

    # Group by first 200 chars (to find templates)
    jd_prefixes = defaultdict(list)
    for job in jobs:
        prefix = job["jd_text"][:200].strip()
        jd_prefixes[prefix].append(job)

    duplicates = {k: v for k, v in jd_prefixes.items() if len(v) > 1}

    print(f"\nFound {len(duplicates)} duplicate JD prefixes\n")

    # Show top duplicates
    sorted_dups = sorted(duplicates.items(), key=lambda x: -len(x[1]))[:5]

    for prefix, dup_jobs in sorted_dups:
        print(f"   {len(dup_jobs)} jobs share prefix: {prefix[:80]}...")
        for j in dup_jobs[:2]:
            print(f"      - {j['title'][:40]} @ {j['company_name'][:25]}")
        print()


def main():
    print("=" * 80)
    print("AVAILABLE SIGNALS ANALYSIS")
    print("=" * 80)

    print(f"\n📂 Loading SQL file...")
    with open(SQL_FILE, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    print(f"🔍 Extracting jobs...")
    jobs = extract_jobs_with_full_data(content, limit=2000)
    print(f"   Extracted {len(jobs)} jobs")

    # Run analyses
    analyze_jd_patterns(jobs)
    analyze_title_patterns(jobs)
    analyze_company_patterns(jobs)
    analyze_jd_length_distribution(jobs)
    find_duplicate_jds(jobs)

    print("\n" + "=" * 80)
    print("✅ ANALYSIS COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    random.seed(42)
    main()
