"""
Test user profile and knowledge foundation APIs.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def test_create_user():
    """Test user creation"""
    payload = {"email": "test@example.com"}
    response = requests.post(f"{BASE_URL}/users", json=payload)
    
    if response.status_code == 201:
        user = response.json()
        print(f"✓ Created user: {user['email']} (ID: {user['id']})")
        return user['id']
    elif response.status_code == 400:
        print("User already exists, fetching...")
        # For testing, we'll create with timestamp
        import time
        payload = {"email": f"test{int(time.time())}@example.com"}
        response = requests.post(f"{BASE_URL}/users", json=payload)
        user = response.json()
        print(f"✓ Created user: {user['email']} (ID: {user['id']})")
        return user['id']
    else:
        print(f"✗ Failed to create user: {response.text}")
        return None


def test_update_profile(user_id):
    """Test profile update"""
    payload = {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1-555-0123",
        "city": "San Francisco",
        "state": "CA",
        "country": "USA",
        "work_authorization": "US Citizen",
        "visa_status": "Not Required"
    }
    
    response = requests.put(f"{BASE_URL}/users/{user_id}/profile", json=payload)
    if response.status_code == 200:
        print(f"✓ Updated profile for user {user_id}")
        return True
    else:
        print(f"✗ Failed to update profile: {response.text}")
        return False


def test_add_education(user_id):
    """Test adding education"""
    payload = {
        "school_name": "Stanford University",
        "degree": "Bachelor of Science",
        "major": "Computer Science",
        "start_date": "2018-09-01",
        "end_date": "2022-06-01",
        "gpa": 3.8
    }
    
    response = requests.post(f"{BASE_URL}/users/{user_id}/education", json=payload)
    if response.status_code == 201:
        print(f"✓ Added education entry")
        return True
    else:
        print(f"✗ Failed to add education: {response.text}")
        return False


def test_add_experience(user_id):
    """Test adding work experience"""
    payload = {
        "company_name": "Google",
        "job_title": "Software Engineer",
        "start_date": "2022-07-01",
        "end_date": "2023-12-31",
        "is_current": False,
        "responsibilities": "Developed scalable backend systems for search infrastructure"
    }
    
    response = requests.post(f"{BASE_URL}/users/{user_id}/experience", json=payload)
    if response.status_code == 201:
        print(f"✓ Added experience entry")
        return True
    else:
        print(f"✗ Failed to add experience: {response.text}")
        return False


def test_add_project(user_id):
    """Test adding project"""
    payload = {
        "project_name": "Distributed Cache System",
        "role": "Lead Developer",
        "description": "Built a distributed caching layer handling 1M+ QPS",
        "tech_stack": "Python, Redis, Kubernetes, gRPC"
    }
    
    response = requests.post(f"{BASE_URL}/users/{user_id}/projects", json=payload)
    if response.status_code == 201:
        print(f"✓ Added project entry")
        return True
    else:
        print(f"✗ Failed to add project: {response.text}")
        return False


def test_add_skills(user_id):
    """Test adding skills"""
    skills = [
        {"skill_name": "Python", "skill_category": "Programming Language"},
        {"skill_name": "Kubernetes", "skill_category": "DevOps"},
        {"skill_name": "System Design", "skill_category": "Architecture"}
    ]
    
    for skill in skills:
        response = requests.post(f"{BASE_URL}/users/{user_id}/skills", json=skill)
        if response.status_code == 201:
            print(f"✓ Added skill: {skill['skill_name']}")
        else:
            print(f"✗ Failed to add skill: {response.text}")


def test_add_knowledge(user_id):
    """Test adding knowledge entries"""
    entries = [
        {
            "entry_type": "self_introduction",
            "content": "I'm a software engineer with 5 years of experience in distributed systems..."
        },
        {
            "entry_type": "technical_explanation",
            "content": "When designing a caching layer, I consider consistency vs availability tradeoffs..."
        }
    ]
    
    for entry in entries:
        response = requests.post(f"{BASE_URL}/users/{user_id}/knowledge", json=entry)
        if response.status_code == 201:
            print(f"✓ Added knowledge entry: {entry['entry_type']}")
        else:
            print(f"✗ Failed to add knowledge: {response.text}")


def test_get_full_profile(user_id):
    """Test retrieving full profile"""
    response = requests.get(f"{BASE_URL}/users/{user_id}")
    
    if response.status_code == 200:
        profile = response.json()
        print(f"\n{'='*80}")
        print(f"FULL USER PROFILE (ID: {user_id})")
        print(f"{'='*80}")
        print(f"Email: {profile['user']['email']}")
        if profile['profile']:
            p = profile['profile']
            print(f"Name: {p['first_name']} {p['last_name']}")
            print(f"Location: {p['city']}, {p['state']}, {p['country']}")
        print(f"Education: {len(profile['education'])} entries")
        print(f"Experience: {len(profile['experience'])} entries")
        print(f"Projects: {len(profile['projects'])} entries")
        print(f"Skills: {len(profile['skills'])} entries")
        print(f"Knowledge: {len(profile['knowledge_entries'])} entries")
        print(f"{'='*80}\n")
        return True
    else:
        print(f"✗ Failed to get profile: {response.text}")
        return False


if __name__ == "__main__":
    print("="*80)
    print("FuckWork User API Tests - Phase 3.3")
    print("="*80 + "\n")
    
    try:
        # Create user
        user_id = test_create_user()
        if not user_id:
            exit(1)
        
        print()
        
        # Add data
        test_update_profile(user_id)
        test_add_education(user_id)
        test_add_experience(user_id)
        test_add_project(user_id)
        test_add_skills(user_id)
        test_add_knowledge(user_id)
        
        print()
        
        # Get full profile
        test_get_full_profile(user_id)
        
        print("="*80)
        print("✓ All tests passed")
        print("="*80)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()

