"""
Test apply task queue and orchestration APIs.

Example curl commands:

# Queue tasks
curl -X POST http://127.0.0.1:8000/apply/queue \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "job_ids": ["indeed_123", "linkedin_456", "indeed_789"],
    "priority_strategy": "decision_then_newest",
    "allow_duplicates": false
  }'

# List queued tasks
curl "http://127.0.0.1:8000/apply/tasks?user_id=1&status=queued&limit=10"

# Get specific task
curl "http://127.0.0.1:8000/apply/tasks/1"

# Transition task
curl -X POST http://127.0.0.1:8000/apply/tasks/1/transition \
  -H "Content-Type: application/json" \
  -d '{
    "to_status": "in_progress",
    "reason": "Extension started processing"
  }'
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def test_queue_tasks(user_id: int, job_ids: list):
    """Test queuing jobs for application"""
    payload = {
        "user_id": user_id,
        "job_ids": job_ids,
        "priority_strategy": "decision_then_newest",
        "allow_duplicates": False
    }
    
    print(f"\n{'='*80}")
    print("TEST: Queue Apply Tasks")
    print(f"{'='*80}")
    print(f"Queuing {len(job_ids)} jobs for user {user_id}")
    
    response = requests.post(f"{BASE_URL}/apply/queue", json=payload)
    
    if response.status_code == 201:
        result = response.json()
        print(f"✓ Queued {result['total']} tasks")
        for task in result['tasks']:
            print(f"  - Task {task['id']}: job_id={task['job_id']}, priority={task['priority']}, status={task['status']}")
        return result['tasks']
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return []


def test_list_tasks(user_id: int, status: str = None):
    """Test listing tasks"""
    params = {"user_id": user_id, "limit": 50}
    if status:
        params["status"] = status
    
    print(f"\n{'='*80}")
    print(f"TEST: List Tasks (status={status or 'all'})")
    print(f"{'='*80}")
    
    response = requests.get(f"{BASE_URL}/apply/tasks", params=params)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Found {result['total']} tasks")
        for task in result['tasks'][:5]:  # Show first 5
            print(f"  - Task {task['id']}: {task['job_id']} [{task['status']}] priority={task['priority']}")
        return result['tasks']
    else:
        print(f"✗ Failed: {response.status_code}")
        return []


def test_transition_task(task_id: int, to_status: str, reason: str = None):
    """Test transitioning task status"""
    payload = {
        "to_status": to_status,
        "reason": reason,
        "details": {"test": True, "timestamp": "2024-01-01T00:00:00"}
    }
    
    print(f"\n{'='*80}")
    print(f"TEST: Transition Task {task_id} -> {to_status}")
    print(f"{'='*80}")
    
    response = requests.post(
        f"{BASE_URL}/apply/tasks/{task_id}/transition",
        json=payload
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ {result['message']}")
        print(f"  Event ID: {result['event_id']}")
        print(f"  Task status: {result['task']['status']}")
        print(f"  Attempt count: {result['task']['attempt_count']}")
        return True
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return False


def test_full_workflow():
    """Test complete workflow: queue -> in_progress -> needs_user -> success"""
    USER_ID = 1
    
    # Get some job IDs from database
    print("Fetching job IDs from database...")
    response = requests.post(
        f"{BASE_URL}/jobs/search",
        json={"filters": {}, "limit": 5}
    )
    
    if response.status_code != 200:
        print("✗ Failed to fetch jobs")
        return False
    
    jobs_data = response.json()
    job_ids = [job['job_id'] for job in jobs_data['jobs'][:3]]
    
    if not job_ids:
        print("✗ No jobs found in database")
        return False
    
    print(f"Using job IDs: {job_ids}")
    
    # 1. Queue tasks
    tasks = test_queue_tasks(USER_ID, job_ids)
    if not tasks:
        return False
    
    # 2. List queued tasks
    queued = test_list_tasks(USER_ID, status="queued")
    
    # 3. Transition first task through workflow
    task_id = tasks[0]['id']
    
    # queued -> in_progress
    if not test_transition_task(task_id, "in_progress", "Extension started processing"):
        return False
    
    # in_progress -> needs_user
    if not test_transition_task(task_id, "needs_user", "Form filled, awaiting user confirmation"):
        return False
    
    # needs_user -> success
    if not test_transition_task(task_id, "success", "User submitted application"):
        return False
    
    # 4. Transition second task to failed
    if len(tasks) > 1:
        task_id_2 = tasks[1]['id']
        test_transition_task(task_id_2, "in_progress", "Starting second task")
        test_transition_task(task_id_2, "failed", "Network error: timeout")
    
    # 5. Final status check
    test_list_tasks(USER_ID)
    
    return True


if __name__ == "__main__":
    print("="*80)
    print("FuckWork Apply Pipeline Tests - Phase 3.5")
    print("="*80)
    
    try:
        if test_full_workflow():
            print(f"\n{'='*80}")
            print("✓ All tests passed")
            print(f"{'='*80}")
        else:
            print(f"\n{'='*80}")
            print("✗ Some tests failed")
            print(f"{'='*80}")
    
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()

