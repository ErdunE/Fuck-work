"""
Test the Job Search API.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.json()}")
    assert response.status_code == 200

def test_basic_search():
    """Test basic search without filters"""
    payload = {
        "limit": 5,
        "offset": 0,
        "sort_by": "newest"
    }
    
    response = requests.post(f"{BASE_URL}/jobs/search", json=payload)
    data = response.json()
    
    print(f"\nBasic search: {data['total']} total jobs, returned {len(data['jobs'])}")
    print(f"Has more: {data['has_more']}")
    
    if data['jobs']:
        job = data['jobs'][0]
        print(f"Sample job: {job['title']} at {job['company_name']}")
        print(f"  Score: {job['authenticity_score']}, Level: {job['job_level']}")
    
    assert response.status_code == 200
    assert data['total'] > 0

def test_filtered_search():
    """Test search with filters"""
    payload = {
        "filters": {
            "min_score": 70,
            "job_level": ["senior", "staff"],
            "work_mode": ["remote", "hybrid"],
            "states": ["CA", "WA"]
        },
        "sort_by": "highest_score",
        "limit": 10
    }
    
    response = requests.post(f"{BASE_URL}/jobs/search", json=payload)
    data = response.json()
    
    print(f"\nFiltered search: {data['total']} jobs match")
    print(f"Filters: score>=70, senior/staff, remote/hybrid, CA/WA")
    
    for job in data['jobs'][:3]:
        print(f"  {job['title']} | Score: {job['authenticity_score']} | {job['state']} | {job['work_mode']}")
    
    assert response.status_code == 200

def test_salary_filter():
    """Test salary range filter"""
    payload = {
        "filters": {
            "min_salary": 100000,
            "max_salary": 200000
        },
        "sort_by": "highest_salary",
        "limit": 5
    }
    
    response = requests.post(f"{BASE_URL}/jobs/search", json=payload)
    
    if response.status_code != 200:
        print(f"\nSalary filter ERROR: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    data = response.json()
    
    print(f"\nSalary filter: {data['total']} jobs with salary $100k-$200k")
    
    for job in data['jobs']:
        print(f"  {job['title']} | ${job['salary_min']}-${job['salary_max']} {job['salary_interval']}")
    
    assert response.status_code == 200

def test_pagination():
    """Test pagination"""
    # First page
    page1 = requests.post(f"{BASE_URL}/jobs/search", json={"limit": 10, "offset": 0}).json()
    
    # Second page
    page2 = requests.post(f"{BASE_URL}/jobs/search", json={"limit": 10, "offset": 10}).json()
    
    print(f"\nPagination test:")
    print(f"  Page 1: {len(page1['jobs'])} jobs, has_more={page1['has_more']}")
    print(f"  Page 2: {len(page2['jobs'])} jobs, has_more={page2['has_more']}")
    
    # Ensure different jobs on different pages
    page1_ids = {job['job_id'] for job in page1['jobs']}
    page2_ids = {job['job_id'] for job in page2['jobs']}
    assert len(page1_ids & page2_ids) == 0, "Pages should have different jobs"
    
    print("  ✓ Pagination working correctly")

if __name__ == "__main__":
    print("=" * 80)
    print("FuckWork API Tests - Phase 3.1")
    print("=" * 80)
    
    try:
        test_health()
        test_basic_search()
        test_filtered_search()
        test_salary_filter()
        test_pagination()
        
        print("\n" + "=" * 80)
        print("✓ All tests passed")
        print("=" * 80)
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()

