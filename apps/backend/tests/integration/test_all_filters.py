"""
Test all 18 new filters for Job Search API.

Run: python test_all_filters.py

Prerequisites:
- Backend API running on localhost:8000
- Database with sample job data
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_filter(name: str, filters: dict, expected_behavior: str):
    """Test a single filter configuration"""
    print(f"\n{'='*60}")
    print(f"Test: {name}")
    print(f"Expected: {expected_behavior}")
    print(f"Filters: {json.dumps(filters, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/jobs/search",
        json={"filters": filters, "limit": 5}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: 200 OK")
        print(f"✓ Results: {data['total']} jobs found")
        if data['jobs']:
            print(f"✓ Sample: {data['jobs'][0]['title'][:60]}...")
    else:
        print(f"✗ Status: {response.status_code}")
        print(f"✗ Error: {response.text[:200]}")
    
    return response.status_code == 200


def main():
    print("="*60)
    print("Job Search API - 18 Filter Test Suite")
    print("="*60)
    
    tests = [
        # Tier 1: Platform Features
        ("Easy Apply Only", 
         {"easy_apply": True, "min_score": 60},
         "Jobs with easy apply enabled"),
        
        ("Low Competition", 
         {"max_applicants": 50},
         "Jobs with ≤50 applicants"),
        
        ("High Visibility", 
         {"has_views_data": True, "min_applicants": 100},
         "Jobs with view tracking and 100+ applicants"),
        
        ("Actively Hiring", 
         {"actively_hiring": True},
         "Jobs marked as actively hiring"),
        
        # Tier 2: Experience Requirements
        ("Entry Level", 
         {"max_experience_years": 2, "job_level": ["new_grad", "junior"]},
         "Jobs requiring ≤2 years experience"),
        
        ("Salary Disclosed", 
         {"has_salary_info": True, "min_salary": 80000},
         "Jobs with salary info ≥$80k"),
        
        ("Yearly Salary", 
         {"salary_interval": ["yearly"]},
         "Jobs with yearly salary"),
        
        ("Mid-Level with Experience", 
         {"min_experience_years": 3, "max_experience_years": 5},
         "Jobs requiring 3-5 years experience"),
        
        # Tier 3: Computed Fields
        ("Recent Postings", 
         {"is_recent": True, "min_score": 70},
         "Jobs posted in last 3 days with score ≥70"),
        
        ("Low Competition Level", 
         {"competition_level": ["low"]},
         "Jobs with <50 applicants"),
        
        ("High Quality No Red Flags", 
         {"has_red_flags": False, "min_score": 80},
         "High-scoring jobs with zero red flags"),
        
        ("Max 2 Red Flags", 
         {"max_red_flags": 2, "min_score": 60},
         "Jobs with ≤2 red flags and decent score"),
        
        ("Strong Positive Signals", 
         {"min_positive_signals": 5, "min_score": 70},
         "Jobs with ≥5 positive signals"),
        
        # Tier 4: Advanced Features
        ("Exclude FAANG", 
         {"exclude_companies": ["Google", "Meta", "Amazon"], "min_score": 70},
         "High-quality jobs excluding FAANG"),
        
        ("Target Companies Only", 
         {"include_companies_only": ["Stripe", "OpenAI", "Anthropic"]},
         "Jobs only from specific companies"),
        
        ("Python & React Keywords", 
         {"keywords_in_description": ["Python", "React"], "work_mode": ["remote"]},
         "Remote jobs mentioning Python AND React"),
        
        ("Exclude Agencies", 
         {"exclude_keywords": ["staffing", "agency", "recruiting firm"]},
         "Jobs not from staffing agencies"),
        
        # Combined Filters
        ("Dream Job Filter", 
         {
             "min_score": 80,
             "has_red_flags": False,
             "work_mode": ["remote"],
             "has_salary_info": True,
             "min_salary": 100000,
             "max_experience_years": 3,
             "easy_apply": True,
             "competition_level": ["low", "medium"]
         },
         "Remote, high-quality, well-paid entry roles with low competition"),
    ]
    
    passed = 0
    failed = 0
    
    for name, filters, expected in tests:
        if test_filter(name, filters, expected):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"Results: {passed} passed, {failed} failed")
    print("="*60)


if __name__ == "__main__":
    main()

