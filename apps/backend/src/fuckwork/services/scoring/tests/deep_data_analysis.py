"""
Deep analysis of job data to understand quality distribution.
Goal: Define what makes a job "good", "bad", or "average".
"""

import sys
import re
import random
from pathlib import Path
from collections import Counter, defaultdict
import statistics

backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_root))

SQL_FILE = Path.home() / "Desktop" / "jobs_data.sql"


def extract_jobs(sql_content: str, limit: int = 5000) -> list:
    """Extract jobs with full data."""
    jobs = []
    pattern = r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*E?'((?:[^'\\]|\\.|'')*?)'"
    
    matches = list(re.finditer(pattern, sql_content))
    if len(matches) > limit:
        sampled = random.sample(matches, limit)
    else:
        sampled = matches
    
    for match in sampled:
        try:
            jd_text = match.group(8).replace("''", "'").replace("\\n", "\n")
            jd_text = re.sub(r'\\(.)', r'\1', jd_text)
            
            if len(jd_text) < 50:
                continue
                
            job = {
                'job_id': match.group(2),
                'title': match.group(3).replace("''", "'"),
                'company_name': match.group(4).replace("''", "'"),
                'location': match.group(5).replace("''", "'"),
                'platform': match.group(7),
                'jd_text': jd_text,
                'jd_length': len(jd_text),
            }
            jobs.append(job)
        except:
            continue
    
    return jobs


def calculate_quality_signals(job: dict) -> dict:
    """Calculate all quality signals for a job."""
    jd = job['jd_text'].lower()
    title = job['title'].lower()
    company = job['company_name'].lower()
    
    signals = {
        # === POSITIVE SIGNALS ===
        # Salary transparency
        'has_salary_range': bool(re.search(r'\$\s*\d{2,3}[,.]?\d{0,3}\s*[-–to]+\s*\$?\s*\d{2,3}', jd)),
        'has_salary_mention': bool(re.search(r'\$\d{2,3}', jd)),
        
        # Benefits
        'has_401k': bool(re.search(r'401\s*k', jd)),
        'has_health_insurance': bool(re.search(r'health\s*(insurance|benefits|coverage)', jd)),
        'has_equity': bool(re.search(r'\b(equity|stock|rsu|espp|options)\b', jd)),
        'has_pto': bool(re.search(r'\b(pto|paid\s*time\s*off|vacation|paid\s*leave)\b', jd)),
        
        # Structure
        'has_responsibilities': bool(re.search(r'\b(responsibilities|what you.ll do|your role|in this role)\b', jd)),
        'has_requirements': bool(re.search(r'\b(requirements|qualifications|what we.re looking|who you are)\b', jd)),
        'has_about_us': bool(re.search(r'\b(about us|about the company|who we are|our mission)\b', jd)),
        'has_interview_process': bool(re.search(r'\b(interview process|hiring process|application process)\b', jd)),
        
        # Team info
        'has_team_info': bool(re.search(r'\b(our team|the team|your team|engineering team|product team)\b', jd)),
        'has_manager_info': bool(re.search(r'\b(report(s|ing)? to|manager|director)\b', jd)),
        
        # Specificity
        'has_tech_stack': bool(re.search(r'\b(python|java|javascript|react|aws|sql|docker|kubernetes)\b', jd)),
        'has_years_exp': bool(re.search(r'\d+\+?\s*years?\s*(of\s*)?(experience|exp)', jd)),
        
        # === NEGATIVE SIGNALS ===
        # Recruiter/Agency
        'is_staffing_company': any(x in company for x in ['apex systems', 'kforce', 'insight global', 'robert half', 'teksystems', 'randstad', 'adecco', 'jobot', 'cybercoders', 'lensa']),
        'has_our_client': bool(re.search(r'\bour client\b', jd)),
        'has_on_behalf': bool(re.search(r'\bon behalf of\b', jd)),
        'has_c2c': bool(re.search(r'\b(c2c|w2|1099|corp.to.corp)\b', jd)),
        
        # Urgency
        'has_urgency': bool(re.search(r'\b(asap|urgent|immediately|right away)\b', jd)),
        
        # Vague
        'has_competitive_salary': bool(re.search(r'\bcompetitive\s*(salary|compensation|pay)\b', jd)),
        'has_fast_paced': bool(re.search(r'\bfast[- ]paced\b', jd)),
        
        # Red flags
        'is_short_jd': job['jd_length'] < 500,
        'is_very_short_jd': job['jd_length'] < 200,
        'is_contract_title': bool(re.search(r'\b(contract|contractor)\b', title)),
        'is_consultant_title': 'consultant' in title,
        'is_confidential': any(x in company for x in ['confidential', 'stealth', 'anonymous']),
        
        # === METADATA ===
        'jd_length': job['jd_length'],
        'platform': job['platform'],
    }
    
    # Calculate composite scores
    positive_count = sum([
        signals['has_salary_range'],
        signals['has_401k'],
        signals['has_health_insurance'],
        signals['has_equity'],
        signals['has_pto'],
        signals['has_responsibilities'],
        signals['has_requirements'],
        signals['has_about_us'],
        signals['has_interview_process'],
        signals['has_team_info'],
        signals['has_tech_stack'],
    ])
    
    negative_count = sum([
        signals['is_staffing_company'],
        signals['has_our_client'],
        signals['has_on_behalf'],
        signals['has_c2c'],
        signals['has_urgency'],
        signals['is_short_jd'],
        signals['is_contract_title'],
        signals['is_confidential'],
    ])
    
    signals['positive_count'] = positive_count
    signals['negative_count'] = negative_count
    
    return signals


def analyze_quality_distribution(jobs: list):
    """Analyze how quality signals are distributed."""
    
    print("=" * 80)
    print("DEEP QUALITY ANALYSIS")
    print("=" * 80)
    
    # Calculate signals for all jobs
    all_signals = []
    for job in jobs:
        signals = calculate_quality_signals(job)
        signals['job'] = job
        all_signals.append(signals)
    
    # === POSITIVE SIGNAL DISTRIBUTION ===
    print(f"\n📊 POSITIVE SIGNAL DISTRIBUTION (n={len(jobs)})")
    print("-" * 60)
    
    positive_fields = [
        'has_salary_range', 'has_salary_mention',
        'has_401k', 'has_health_insurance', 'has_equity', 'has_pto',
        'has_responsibilities', 'has_requirements', 'has_about_us', 'has_interview_process',
        'has_team_info', 'has_manager_info', 'has_tech_stack', 'has_years_exp',
    ]
    
    for field in positive_fields:
        count = sum(1 for s in all_signals if s.get(field))
        pct = count * 100 / len(all_signals)
        bar = "█" * int(pct / 2)
        print(f"   {field:<25}: {bar} {count:4d} ({pct:5.1f}%)")
    
    # === NEGATIVE SIGNAL DISTRIBUTION ===
    print(f"\n📊 NEGATIVE SIGNAL DISTRIBUTION")
    print("-" * 60)
    
    negative_fields = [
        'is_staffing_company', 'has_our_client', 'has_on_behalf', 'has_c2c',
        'has_urgency', 'has_competitive_salary', 'has_fast_paced',
        'is_short_jd', 'is_very_short_jd', 'is_contract_title', 'is_consultant_title', 'is_confidential',
    ]
    
    for field in negative_fields:
        count = sum(1 for s in all_signals if s.get(field))
        pct = count * 100 / len(all_signals)
        bar = "█" * int(pct / 2)
        print(f"   {field:<25}: {bar} {count:4d} ({pct:5.1f}%)")
    
    # === QUALITY TIERS ===
    print(f"\n📊 QUALITY TIER DISTRIBUTION")
    print("-" * 60)
    
    tiers = {
        'excellent': [],  # 5+ positive, 0 negative
        'good': [],       # 3-4 positive, 0-1 negative
        'average': [],    # 1-2 positive, 0-1 negative
        'poor': [],       # 0 positive OR 2+ negative
        'suspicious': [], # staffing company OR multiple red flags
    }
    
    for s in all_signals:
        pos = s['positive_count']
        neg = s['negative_count']
        
        if s['is_staffing_company'] or s['has_our_client'] or neg >= 3:
            tiers['suspicious'].append(s)
        elif neg >= 2 or pos == 0:
            tiers['poor'].append(s)
        elif pos >= 5 and neg == 0:
            tiers['excellent'].append(s)
        elif pos >= 3 and neg <= 1:
            tiers['good'].append(s)
        else:
            tiers['average'].append(s)
    
    for tier_name, tier_jobs in tiers.items():
        pct = len(tier_jobs) * 100 / len(all_signals)
        bar = "█" * int(pct / 2)
        print(f"   {tier_name:<12}: {bar} {len(tier_jobs):4d} ({pct:5.1f}%)")
    
    # === SAMPLE JOBS FROM EACH TIER ===
    print(f"\n📋 SAMPLE JOBS BY TIER")
    print("=" * 80)
    
    for tier_name, tier_jobs in tiers.items():
        print(f"\n--- {tier_name.upper()} ({len(tier_jobs)} jobs) ---")
        samples = random.sample(tier_jobs, min(3, len(tier_jobs)))
        for s in samples:
            job = s['job']
            print(f"\n   🔹 {job['title'][:45]} @ {job['company_name'][:25]}")
            print(f"      Platform: {job['platform']} | JD Length: {s['jd_length']}")
            print(f"      Positive: {s['positive_count']} | Negative: {s['negative_count']}")
            
            # Show which signals triggered
            pos_triggers = [f for f in positive_fields if s.get(f)]
            neg_triggers = [f for f in negative_fields if s.get(f)]
            
            if pos_triggers:
                print(f"      ✅ {', '.join(pos_triggers[:4])}{'...' if len(pos_triggers) > 4 else ''}")
            if neg_triggers:
                print(f"      ❌ {', '.join(neg_triggers[:3])}")
    
    # === SCORING RECOMMENDATION ===
    print(f"\n📊 RECOMMENDED SCORE RANGES")
    print("=" * 80)
    
    recommendations = {
        'excellent': '90-100',
        'good': '75-89',
        'average': '60-74',
        'poor': '40-59',
        'suspicious': '0-39',
    }
    
    print("\n   Based on data distribution:")
    for tier_name, score_range in recommendations.items():
        count = len(tiers[tier_name])
        pct = count * 100 / len(all_signals)
        print(f"   {tier_name:<12} → {score_range:<8} ({pct:5.1f}% of jobs)")
    
    return tiers, all_signals


def main():
    print("Loading data...")
    with open(SQL_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("Extracting jobs...")
    jobs = extract_jobs(content, limit=5000)
    print(f"Extracted {len(jobs)} jobs")
    
    random.seed(42)
    tiers, all_signals = analyze_quality_distribution(jobs)
    
    print("\n" + "=" * 80)
    print("✅ ANALYSIS COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
