"""
Test script for scoring v2.0 rules.
Tests the new rules against sample job data to verify improvements.

Run with: cd apps/backend && python -m pytest src/fuckwork/services/scoring/tests/test_scoring_v2.py -v
Or standalone: cd apps/backend && python src/fuckwork/services/scoring/tests/test_scoring_v2.py
"""

import sys
from pathlib import Path

# Add parent paths for imports when running standalone
if __name__ == "__main__":
    backend_root = Path(__file__).parent.parent.parent.parent.parent.parent
    sys.path.insert(0, str(backend_root))

from src.fuckwork.services.scoring.scorer import AuthenticityScorer

# Rule table path
RULE_TABLE_PATH = Path(__file__).parent.parent / "data" / "authenticity_rule_table.json"


# Sample jobs for testing
SAMPLE_JOBS = [
    {
        "job_id": "test_high_quality",
        "title": "Senior Software Engineer",
        "company_name": "NVIDIA",
        "location": "Santa Clara, CA",
        "platform": "Indeed",
        "jd_text": """About Us:
NVIDIA has been transforming computer graphics, PC gaming, and accelerated computing for more than 25 years.

Responsibilities:
- Collaborate with HW and SW engineering teams to define new features
- Craft and develop scalable, distributed systems
- Drive improvements to SW design and test processes

Qualifications:
- Development background in Linux software development
- MS or BS in Computer Science with 10+ years experience
- Experience with Python and distributed systems

Benefits:
- Competitive salary: $180,000 - $250,000
- Health insurance, dental, vision
- 401k matching
- Stock options and equity grants
""",
        "company_info": {
            "url": "https://linkedin.com/company/nvidia",
            "logo": "https://logo.com/nvidia.png",
            "industry": "Technology"
        },
        "expected_level": "likely real",
        "expected_positive_count": 5,  # benefits, responsibilities, qualifications, salary, company info
    },
    {
        "job_id": "test_recruiter_agency",
        "title": "Contract Java Developer",
        "company_name": "Apex Systems",
        "location": "United States (Remote)",
        "platform": "LinkedIn",
        "jd_text": """Our client is looking for a Java developer to join their team ASAP.

Requirements:
- 5+ years Java experience
- Must start immediately

Send resume to recruiter@gmail.com
""",
        "company_info": {},
        "expected_level": "likely fake",
        "expected_negative_count": 4,  # recruiter language, staffing firm, gmail, urgent, contract title
    },
    {
        "job_id": "test_google_good",
        "title": "Software Engineer",
        "company_name": "Google",
        "location": "Mountain View, CA",
        "platform": "LinkedIn",
        "jd_text": """About Us:
Google's mission is to organize the world's information and make it universally accessible.

About the Role:
Join our Cloud Platform team to build scalable infrastructure serving billions of users.

What you'll do:
- Design and implement distributed systems at massive scale
- Collaborate with cross-functional teams across the organization
- Write clean, maintainable code in Python, Go, or Java

Qualifications:
- BS in Computer Science or equivalent practical experience
- 3+ years of software development experience
- Experience with distributed systems and cloud infrastructure

Our Benefits:
- Competitive salary: $150,000 - $220,000
- Comprehensive health, dental, vision insurance
- 401k with generous company matching
- Equity grants (RSU)
- Unlimited PTO
- On-site meals and wellness programs

Interview Process:
Our interview process includes a recruiter call, technical phone screen, and virtual onsite interviews.
""",
        "company_info": {
            "url": "https://linkedin.com/company/google",
            "logo": "https://logo.com/google.png",
            "industry": "Technology",
            "url_direct": "https://careers.google.com"
        },
        "expected_level": "likely real",
        "expected_positive_count": 8,
    },
    {
        "job_id": "test_body_shop",
        "title": "Technical Consultant",
        "company_name": "ABC Solutions LLC",
        "location": "Remote",
        "platform": "Indeed",
        "jd_text": """Looking for developer. Apply now.""",
        "company_info": {},
        "expected_level": "likely fake",
        "expected_negative_count": 2,  # short JD, consultant title
    },
    {
        "job_id": "test_amazon_good",
        "title": "Data Scientist",
        "company_name": "Amazon",
        "location": "Seattle, WA",
        "platform": "LinkedIn",
        "jd_text": """About the team:
Amazon's Personalization team builds ML models that power product recommendations for hundreds of millions of customers.

What you'll do:
- Develop and deploy machine learning models at scale
- Analyze large datasets using Python, SQL, and Spark
- Collaborate with engineering teams to productionize models

Basic Qualifications:
- MS in Computer Science, Statistics, or related field
- 2+ years experience with ML/AI in production
- Proficiency in Python and SQL

Preferred Qualifications:
- PhD in relevant field
- Experience with deep learning frameworks (TensorFlow, PyTorch)
- Publications in top ML conferences

Interview Process:
Our interview process includes a phone screen, technical assessment, and onsite interviews with the team.

Compensation: $130,000 - $180,000 base salary plus equity and comprehensive benefits including 401k, health insurance, and RSUs.
""",
        "company_info": {
            "url": "https://linkedin.com/company/amazon",
            "logo": "https://logo.com/amazon.png",
            "industry": "E-commerce"
        },
        "expected_level": "likely real",
        "expected_positive_count": 7,
    },
    {
        "job_id": "test_medium_quality",
        "title": "Backend Developer",
        "company_name": "TechStartup Inc",
        "location": "Austin, TX",
        "platform": "LinkedIn",
        "jd_text": """We're hiring a backend developer.

Responsibilities:
- Build APIs
- Work with databases
- Deploy to cloud

Requirements:
- 2+ years experience
- Python or Node.js
""",
        "company_info": {
            "url": "https://linkedin.com/company/techstartup",
            "industry": "Technology"
        },
        "expected_level": "uncertain",
        "expected_positive_count": 2,
    },
]


def test_scoring_v2():
    """Test the new scoring rules on sample data."""
    
    print("=" * 70)
    print("Scoring System v2.0 Test Suite")
    print("=" * 70)
    
    # Verify rule table exists
    assert RULE_TABLE_PATH.exists(), f"Rule table not found: {RULE_TABLE_PATH}"
    
    # Initialize scorer
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    print(f"\n✅ Loaded rules from {RULE_TABLE_PATH.name}")
    
    print(f"\n📊 Testing {len(SAMPLE_JOBS)} sample jobs:\n")
    print("-" * 70)
    
    results = []
    for job in SAMPLE_JOBS:
        result = scorer.score_job(job)
        
        print(f"\n🔹 {job['title']} @ {job['company_name']}")
        print(f"   Score: {result['authenticity_score']:5.1f} | Level: {result['level']:<12} | Confidence: {result['confidence']}")
        
        negative_count = len(result.get('red_flags', []))
        positive_count = len(result.get('positive_signals', []))
        
        if result['red_flags']:
            flags_display = result['red_flags'][:3]
            suffix = f"... (+{len(result['red_flags'])-3} more)" if len(result['red_flags']) > 3 else ""
            print(f"   ❌ Red flags ({negative_count}): {flags_display}{suffix}")
        else:
            print(f"   ❌ Red flags: None")
            
        if result['positive_signals']:
            signals_display = result['positive_signals'][:3]
            suffix = f"... (+{len(result['positive_signals'])-3} more)" if len(result['positive_signals']) > 3 else ""
            print(f"   ✅ Positive ({positive_count}): {signals_display}{suffix}")
        else:
            print(f"   ✅ Positive: None")
        
        # Check expectations
        expected_level = job.get('expected_level')
        if expected_level:
            status = "✓" if result['level'] == expected_level else "✗"
            if result['level'] != expected_level:
                print(f"   ⚠️  Expected level '{expected_level}', got '{result['level']}'")
        
        results.append({
            'job_id': job['job_id'],
            'score': result['authenticity_score'],
            'level': result['level'],
            'confidence': result['confidence'],
            'positive_count': positive_count,
            'negative_count': negative_count,
        })
    
    # Summary statistics
    print("\n" + "=" * 70)
    print("📈 Summary Statistics")
    print("=" * 70)
    
    scores = [r['score'] for r in results]
    print(f"   Score range: {min(scores):.1f} - {max(scores):.1f}")
    print(f"   Average score: {sum(scores)/len(scores):.1f}")
    
    levels = [r['level'] for r in results]
    print(f"   Likely Real: {levels.count('likely real')}")
    print(f"   Uncertain: {levels.count('uncertain')}")
    print(f"   Likely Fake: {levels.count('likely fake')}")
    
    avg_positive = sum(r['positive_count'] for r in results) / len(results)
    avg_negative = sum(r['negative_count'] for r in results) / len(results)
    print(f"   Avg positive signals: {avg_positive:.1f}")
    print(f"   Avg negative signals: {avg_negative:.1f}")
    
    print("\n✅ Test complete!")
    return results


def test_positive_signals_populated():
    """Verify that positive signals are now being detected."""
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    
    # High quality job should have positive signals
    good_job = SAMPLE_JOBS[0]  # NVIDIA job
    result = scorer.score_job(good_job)
    
    assert len(result['positive_signals']) > 0, "Good job should have positive signals"
    print(f"✅ Positive signals working: {len(result['positive_signals'])} detected")


def test_recruiter_detection():
    """Verify recruiter/agency jobs are properly flagged."""
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    
    recruiter_job = SAMPLE_JOBS[1]  # Apex Systems job
    result = scorer.score_job(recruiter_job)
    
    assert result['level'] == 'likely fake', f"Recruiter job should be 'likely fake', got '{result['level']}'"
    assert len(result['red_flags']) >= 2, "Recruiter job should have multiple red flags"
    print(f"✅ Recruiter detection working: score={result['authenticity_score']}, flags={len(result['red_flags'])}")


def test_short_jd_detection():
    """Verify short JDs are flagged."""
    scorer = AuthenticityScorer(str(RULE_TABLE_PATH))
    
    short_job = SAMPLE_JOBS[3]  # ABC Solutions job
    result = scorer.score_job(short_job)
    
    has_short_flag = any('short' in flag.lower() or 'under' in flag.lower() for flag in result['red_flags'])
    assert has_short_flag, "Short JD should be flagged"
    print(f"✅ Short JD detection working: {result['red_flags']}")


if __name__ == "__main__":
    # Run all tests
    test_scoring_v2()
    print("\n")
    test_positive_signals_populated()
    test_recruiter_detection()
    test_short_jd_detection()
