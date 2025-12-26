"""
Comprehensive scoring v2.0 analysis with larger sample size.
Provides statistical analysis and comparison.
"""

import random
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

from src.fuckwork.services.scoring.scorer import AuthenticityScorer

RULE_TABLE_PATH = Path(__file__).parent.parent / "data" / "authenticity_rule_table.json"
SQL_FILE = Path.home() / "Desktop" / "jobs_data.sql"


def extract_all_jobs(sql_content: str) -> list:
    """Extract ALL job records from SQL dump."""
    jobs = []

    pattern = r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*E?'((?:[^'\\]|\\.|'')*?)'"

    for match in re.finditer(pattern, sql_content):
        try:
            jd_text = match.group(8).replace("''", "'").replace("\\n", "\n")
            jd_text = re.sub(r"\\(.)", r"\1", jd_text)

            if len(jd_text) < 50:  # Skip invalid entries
                continue

            job = {
                "id": int(match.group(1)),
                "job_id": match.group(2),
                "title": match.group(3).replace("''", "'"),
                "company_name": match.group(4).replace("''", "'"),
                "location": match.group(5).replace("''", "'"),
                "platform": match.group(7),
                "jd_text": jd_text,
                "company_info": {},
            }
            jobs.append(job)
        except:
            continue

    return jobs


def analyze_scoring(jobs: list, scorer: AuthenticityScorer, sample_size: int = 500):
    """Perform comprehensive scoring analysis."""

    # Random sample for unbiased analysis
    if len(jobs) > sample_size:
        sample = random.sample(jobs, sample_size)
    else:
        sample = jobs

    print(f"\n📊 Analyzing {len(sample)} jobs...")

    results = []
    rule_trigger_counts = Counter()
    positive_rule_counts = Counter()

    for job in sample:
        result = scorer.score_job(job)

        # Track which rules triggered
        for flag in result.get("red_flags", []):
            rule_trigger_counts[flag] += 1
        for signal in result.get("positive_signals", []):
            positive_rule_counts[signal] += 1

        results.append(
            {
                "job_id": job["job_id"],
                "title": job["title"],
                "company": job["company_name"],
                "platform": job["platform"],
                "jd_length": len(job["jd_text"]),
                "score": result["authenticity_score"],
                "level": result["level"],
                "confidence": result["confidence"],
                "negative_count": len(result.get("red_flags", [])),
                "positive_count": len(result.get("positive_signals", [])),
                "red_flags": result.get("red_flags", []),
                "positive_signals": result.get("positive_signals", []),
            }
        )

    return results, rule_trigger_counts, positive_rule_counts


def print_statistical_analysis(results: list):
    """Print detailed statistical analysis."""

    scores = [r["score"] for r in results]

    print("\n" + "=" * 80)
    print("📈 STATISTICAL ANALYSIS")
    print("=" * 80)

    # Basic statistics
    print(f"\n📊 Score Statistics (n={len(scores)})")
    print(f"   Mean:   {statistics.mean(scores):.1f}")
    print(f"   Median: {statistics.median(scores):.1f}")
    print(f"   StdDev: {statistics.stdev(scores):.1f}")
    print(f"   Min:    {min(scores):.1f}")
    print(f"   Max:    {max(scores):.1f}")

    # Percentiles
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    print(f"\n📊 Percentiles:")
    print(f"   10th: {sorted_scores[int(n*0.1)]:.1f}")
    print(f"   25th: {sorted_scores[int(n*0.25)]:.1f}")
    print(f"   50th: {sorted_scores[int(n*0.5)]:.1f}")
    print(f"   75th: {sorted_scores[int(n*0.75)]:.1f}")
    print(f"   90th: {sorted_scores[int(n*0.9)]:.1f}")

    # Score distribution histogram
    print(f"\n📊 Score Distribution:")
    buckets = defaultdict(int)
    for s in scores:
        bucket = int(s // 10) * 10
        buckets[bucket] += 1

    for bucket in sorted(buckets.keys()):
        count = buckets[bucket]
        pct = count * 100 / len(scores)
        bar = "█" * int(pct / 2)
        print(f"   {bucket:3d}-{bucket+9:3d}: {bar} {count:3d} ({pct:5.1f}%)")

    # Level distribution
    print(f"\n📊 Level Distribution:")
    levels = Counter(r["level"] for r in results)
    for level in ["likely real", "uncertain", "likely fake"]:
        count = levels.get(level, 0)
        pct = count * 100 / len(results)
        print(f"   {level:<12}: {count:4d} ({pct:5.1f}%)")

    # Confidence distribution
    print(f"\n📊 Confidence Distribution:")
    confs = Counter(r["confidence"] for r in results)
    for conf in ["High", "Medium", "Low"]:
        count = confs.get(conf, 0)
        pct = count * 100 / len(results)
        print(f"   {conf:<8}: {count:4d} ({pct:5.1f}%)")

    # Signal counts
    print(f"\n📊 Signal Distribution:")
    pos_counts = [r["positive_count"] for r in results]
    neg_counts = [r["negative_count"] for r in results]
    print(f"   Avg positive signals: {statistics.mean(pos_counts):.2f}")
    print(f"   Avg negative signals: {statistics.mean(neg_counts):.2f}")
    print(
        f"   Jobs with 0 positive: {pos_counts.count(0):4d} ({pos_counts.count(0)*100/len(results):5.1f}%)"
    )
    print(
        f"   Jobs with 0 negative: {neg_counts.count(0):4d} ({neg_counts.count(0)*100/len(results):5.1f}%)"
    )

    # Score vs signal correlation
    print(f"\n📊 Score by Signal Count:")
    by_neg_count = defaultdict(list)
    for r in results:
        by_neg_count[r["negative_count"]].append(r["score"])

    print("   Negative signals -> Avg score:")
    for neg_count in sorted(by_neg_count.keys())[:6]:
        scores_list = by_neg_count[neg_count]
        avg = statistics.mean(scores_list)
        print(f"     {neg_count} negatives: {avg:5.1f} (n={len(scores_list)})")


def print_rule_analysis(rule_counts: Counter, positive_counts: Counter, total: int):
    """Print rule trigger analysis."""

    print("\n" + "=" * 80)
    print("🔍 RULE TRIGGER ANALYSIS")
    print("=" * 80)

    print(f"\n📊 Top Red Flags (negative rules):")
    for rule, count in rule_counts.most_common(15):
        pct = count * 100 / total
        print(f"   {count:4d} ({pct:5.1f}%): {rule[:65]}{'...' if len(rule) > 65 else ''}")

    print(f"\n📊 Top Positive Signals:")
    for rule, count in positive_counts.most_common(15):
        pct = count * 100 / total
        print(f"   {count:4d} ({pct:5.1f}%): {rule[:65]}{'...' if len(rule) > 65 else ''}")


def print_problem_cases(results: list):
    """Identify and print potential problem cases."""

    print("\n" + "=" * 80)
    print("⚠️  POTENTIAL ISSUES")
    print("=" * 80)

    # High score but no positive signals
    high_no_positive = [r for r in results if r["score"] >= 95 and r["positive_count"] == 0]
    print(f"\n🔍 High score (>=95) but 0 positive signals: {len(high_no_positive)} jobs")
    for r in random.sample(high_no_positive, min(3, len(high_no_positive))):
        print(f"   - {r['title'][:40]} @ {r['company'][:20]} (score={r['score']:.1f})")

    # Low score but many positive signals
    low_many_positive = [r for r in results if r["score"] < 60 and r["positive_count"] >= 3]
    print(f"\n🔍 Low score (<60) but 3+ positive signals: {len(low_many_positive)} jobs")
    for r in random.sample(low_many_positive, min(3, len(low_many_positive))):
        print(
            f"   - {r['title'][:40]} @ {r['company'][:20]} (score={r['score']:.1f}, +{r['positive_count']}/-{r['negative_count']})"
        )

    # Score exactly 100 (no rules triggered at all)
    perfect_scores = [r for r in results if r["score"] == 100.0]
    print(
        f"\n🔍 Perfect score (100.0): {len(perfect_scores)} jobs ({len(perfect_scores)*100/len(results):.1f}%)"
    )

    # By platform
    print(f"\n📊 Score by Platform:")
    by_platform = defaultdict(list)
    for r in results:
        by_platform[r["platform"]].append(r["score"])
    for platform, scores in sorted(by_platform.items(), key=lambda x: -len(x[1])):
        avg = statistics.mean(scores)
        print(f"   {platform}: avg={avg:.1f}, n={len(scores)}")


def print_sample_jobs(results: list):
    """Print sample jobs from different score ranges."""

    print("\n" + "=" * 80)
    print("📋 SAMPLE JOBS BY SCORE RANGE")
    print("=" * 80)

    ranges = [
        ("Low (0-50)", lambda r: r["score"] < 50),
        ("Medium-Low (50-70)", lambda r: 50 <= r["score"] < 70),
        ("Medium (70-85)", lambda r: 70 <= r["score"] < 85),
        ("High (85-99)", lambda r: 85 <= r["score"] < 100),
        ("Perfect (100)", lambda r: r["score"] == 100),
    ]

    for range_name, filter_fn in ranges:
        filtered = [r for r in results if filter_fn(r)]
        print(f"\n📊 {range_name}: {len(filtered)} jobs")

        for r in random.sample(filtered, min(2, len(filtered))):
            print(f"   🔹 {r['title'][:45]} @ {r['company'][:25]}")
            print(
                f"      Score: {r['score']:.1f} | Level: {r['level']} | +{r['positive_count']}/-{r['negative_count']}"
            )
            if r["red_flags"]:
                print(f"      ❌ {r['red_flags'][0][:60]}...")
            if r["positive_signals"]:
                print(f"      ✅ {r['positive_signals'][0][:60]}...")


def main():
    print("=" * 80)
    print("SCORING SYSTEM v2.0 - COMPREHENSIVE ANALYSIS")
    print("=" * 80)

    # Load data
    print(f"\n📂 Loading SQL file...")
    with open(SQL_FILE, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    print(f"🔍 Extracting jobs...")
    all_jobs = extract_all_jobs(content)
    print(f"   Found {len(all_jobs)} valid jobs")

    # Initialize scorer
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    print(f"✅ Loaded {len(scorer.rule_engine.rules)} rules")

    # Analyze with 500 random samples
    results, rule_counts, positive_counts = analyze_scoring(all_jobs, scorer, sample_size=500)

    # Print analyses
    print_statistical_analysis(results)
    print_rule_analysis(rule_counts, positive_counts, len(results))
    print_problem_cases(results)
    print_sample_jobs(results)

    print("\n" + "=" * 80)
    print("✅ COMPREHENSIVE ANALYSIS COMPLETE")
    print("=" * 80)

    return results


if __name__ == "__main__":
    # Set random seed for reproducibility
    random.seed(42)
    main()
