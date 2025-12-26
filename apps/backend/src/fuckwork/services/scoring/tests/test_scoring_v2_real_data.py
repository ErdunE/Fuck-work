"""
Test scoring v2.0 with real data extracted from SQL dump.
Provides comprehensive validation across diverse job types.

Run with: python src/fuckwork/services/scoring/tests/test_scoring_v2_real_data.py
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

# Add parent paths for imports
backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

from src.fuckwork.services.scoring.scorer import AuthenticityScorer

RULE_TABLE_PATH = Path(__file__).parent.parent / "data" / "authenticity_rule_table.json"
SQL_FILE = Path.home() / "Desktop" / "jobs_data.sql"


def extract_jobs_from_sql(sql_file: Path, limit: int = 100) -> list:
    """Extract job records from SQL dump file."""
    print(f"📂 Reading SQL file: {sql_file}")

    jobs = []

    with open(sql_file, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Split by INSERT statements to find job data
    # Look for VALUES clause patterns
    # Format: (id, 'job_id', 'title', 'company_name', 'location', 'url', 'platform', 'jd_text', ...)

    # Find all job entries - simplified pattern
    pattern = r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*E?'((?:[^'\\]|\\.|'')*?)'"

    print(f"🔍 Searching for job records...")
    matches = list(re.finditer(pattern, content))
    print(f"   Found {len(matches)} potential matches")

    # Sample diverse jobs
    step = max(1, len(matches) // limit)
    sampled_indices = list(range(0, len(matches), step))[:limit]

    for idx in sampled_indices:
        match = matches[idx]
        try:
            jd_text = match.group(8)
            # Unescape PostgreSQL string
            jd_text = jd_text.replace("''", "'").replace("\\n", "\n").replace("\\t", "\t")
            jd_text = re.sub(r"\\(.)", r"\1", jd_text)  # Remove other escapes

            job = {
                "id": int(match.group(1)),
                "job_id": match.group(2),
                "title": match.group(3).replace("''", "'"),
                "company_name": match.group(4).replace("''", "'"),
                "location": match.group(5).replace("''", "'"),
                "url": match.group(6),
                "platform": match.group(7),
                "jd_text": jd_text,
                # Add empty placeholders for other fields
                "company_info": {},
                "poster_info": None,
                "platform_metadata": {},
                "collection_metadata": {},
                "derived_signals": {},
            }

            # Skip if JD is too short (likely parsing error)
            if len(jd_text) > 100:
                jobs.append(job)

        except Exception as e:
            continue

    print(f"✅ Extracted {len(jobs)} valid jobs")
    return jobs


def test_with_real_data():
    """Test scoring on real data from SQL dump."""

    print("=" * 80)
    print("Scoring System v2.0 - Real Data Validation")
    print("=" * 80)

    # Check files exist
    if not SQL_FILE.exists():
        print(f"❌ SQL file not found: {SQL_FILE}")
        return

    if not RULE_TABLE_PATH.exists():
        print(f"❌ Rule table not found: {RULE_TABLE_PATH}")
        return

    # Extract jobs
    jobs = extract_jobs_from_sql(SQL_FILE, limit=100)

    if not jobs:
        print("❌ No jobs extracted from SQL file")
        return

    # Initialize scorer
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    print(f"\n✅ Loaded {len(scorer.rule_engine.rules)} rules")

    # Score all jobs
    print(f"\n📊 Scoring {len(jobs)} jobs...\n")

    results = []
    score_distribution = Counter()
    level_distribution = Counter()
    confidence_distribution = Counter()
    positive_signal_counts = []
    negative_signal_counts = []
    all_red_flags = Counter()
    all_positive_signals = Counter()

    for i, job in enumerate(jobs):
        result = scorer.score_job(job)

        # Round score to nearest 5 for distribution
        score_bucket = round(result["authenticity_score"] / 5) * 5
        score_distribution[score_bucket] += 1
        level_distribution[result["level"]] += 1
        confidence_distribution[result["confidence"]] += 1

        positive_count = len(result.get("positive_signals", []))
        negative_count = len(result.get("red_flags", []))
        positive_signal_counts.append(positive_count)
        negative_signal_counts.append(negative_count)

        # Track which signals are most common
        for flag in result.get("red_flags", []):
            all_red_flags[flag] += 1
        for signal in result.get("positive_signals", []):
            all_positive_signals[signal] += 1

        results.append(
            {
                "job_id": job["job_id"],
                "title": job["title"],
                "company": job["company_name"],
                "platform": job["platform"],
                "score": result["authenticity_score"],
                "level": result["level"],
                "confidence": result["confidence"],
                "positive_count": positive_count,
                "negative_count": negative_count,
                "red_flags": result.get("red_flags", []),
                "positive_signals": result.get("positive_signals", []),
            }
        )

        # Print progress every 20 jobs
        if (i + 1) % 20 == 0:
            print(f"   Processed {i + 1}/{len(jobs)} jobs...")

    # Print detailed results for sample jobs
    print("\n" + "=" * 80)
    print("📋 Sample Results (10 random jobs)")
    print("=" * 80)

    import random

    sample_results = random.sample(results, min(10, len(results)))

    for r in sample_results:
        print(f"\n🔹 {r['title'][:50]} @ {r['company'][:30]}")
        print(
            f"   Platform: {r['platform']} | Score: {r['score']:.1f} | Level: {r['level']} | Confidence: {r['confidence']}"
        )
        if r["red_flags"]:
            print(
                f"   ❌ Red flags ({r['negative_count']}): {r['red_flags'][:2]}{'...' if len(r['red_flags']) > 2 else ''}"
            )
        if r["positive_signals"]:
            print(
                f"   ✅ Positive ({r['positive_count']}): {r['positive_signals'][:2]}{'...' if len(r['positive_signals']) > 2 else ''}"
            )

    # Summary statistics
    print("\n" + "=" * 80)
    print("📈 Summary Statistics")
    print("=" * 80)

    scores = [r["score"] for r in results]
    print(f"\n📊 Score Distribution:")
    print(
        f"   Min: {min(scores):.1f} | Max: {max(scores):.1f} | Avg: {sum(scores)/len(scores):.1f}"
    )
    print(f"\n   Histogram (by 5-point buckets):")
    for bucket in sorted(score_distribution.keys()):
        bar = "█" * (score_distribution[bucket] // 2)
        print(f"   {bucket:3.0f}: {bar} ({score_distribution[bucket]})")

    print(f"\n📊 Level Distribution:")
    for level, count in sorted(level_distribution.items(), key=lambda x: -x[1]):
        pct = count * 100 / len(results)
        print(f"   {level:<12}: {count:3d} ({pct:.1f}%)")

    print(f"\n📊 Confidence Distribution:")
    for conf, count in sorted(confidence_distribution.items(), key=lambda x: -x[1]):
        pct = count * 100 / len(results)
        print(f"   {conf:<8}: {count:3d} ({pct:.1f}%)")

    print(f"\n📊 Signal Counts:")
    print(
        f"   Avg positive signals per job: {sum(positive_signal_counts)/len(positive_signal_counts):.1f}"
    )
    print(
        f"   Avg negative signals per job: {sum(negative_signal_counts)/len(negative_signal_counts):.1f}"
    )
    print(
        f"   Jobs with 0 positive signals: {positive_signal_counts.count(0)} ({positive_signal_counts.count(0)*100/len(positive_signal_counts):.1f}%)"
    )
    print(
        f"   Jobs with 0 negative signals: {negative_signal_counts.count(0)} ({negative_signal_counts.count(0)*100/len(negative_signal_counts):.1f}%)"
    )

    print(f"\n📊 Most Common Red Flags:")
    for flag, count in all_red_flags.most_common(10):
        pct = count * 100 / len(results)
        print(f"   {count:3d} ({pct:4.1f}%): {flag[:60]}{'...' if len(flag) > 60 else ''}")

    print(f"\n📊 Most Common Positive Signals:")
    for signal, count in all_positive_signals.most_common(10):
        pct = count * 100 / len(results)
        print(f"   {count:3d} ({pct:4.1f}%): {signal[:60]}{'...' if len(signal) > 60 else ''}")

    # Identify potential issues
    print("\n" + "=" * 80)
    print("⚠️  Potential Issues to Review")
    print("=" * 80)

    # Jobs with very high scores but might be suspicious
    high_score_short_jd = [
        r for r in results if r["score"] >= 90 and len(r["positive_signals"]) <= 2
    ]
    if high_score_short_jd:
        print(f"\n🔍 High score (>=90) but few positive signals ({len(high_score_short_jd)} jobs):")
        for r in high_score_short_jd[:3]:
            print(
                f"   - {r['title'][:40]} @ {r['company'][:20]} (score={r['score']:.1f}, +{r['positive_count']}/-{r['negative_count']})"
            )

    # Jobs with both high positive and negative counts
    mixed_signals = [r for r in results if r["positive_count"] >= 3 and r["negative_count"] >= 2]
    if mixed_signals:
        print(f"\n🔍 Mixed signals - both high positive and negative ({len(mixed_signals)} jobs):")
        for r in mixed_signals[:3]:
            print(
                f"   - {r['title'][:40]} @ {r['company'][:20]} (score={r['score']:.1f}, +{r['positive_count']}/-{r['negative_count']})"
            )

    print("\n" + "=" * 80)
    print("✅ Validation Complete!")
    print("=" * 80)

    return results


if __name__ == "__main__":
    test_with_real_data()
