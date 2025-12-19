#!/usr/bin/env python3
"""
Manual verification script for Phase 4.1 extension protocol.
Tests ATS detection and state machine without requiring screenshots.
"""

import requests
import time
import json
import sys

API_BASE = "http://127.0.0.1:8000"
USER_ID = 1


def queue_task(job_id):
    """Queue a single task"""
    try:
        response = requests.post(
            f"{API_BASE}/apply/queue",
            json={
                "user_id": USER_ID,
                "job_ids": [job_id],
                "priority_strategy": "decision_then_newest",
                "allow_duplicates": True
            },
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        print(f"✓ Queued task: {json.dumps(result, indent=2)}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to queue task: {e}")
        return None


def get_tasks(status=None):
    """Get tasks by status"""
    try:
        params = {"user_id": USER_ID}
        if status:
            params["status"] = status
        
        response = requests.get(f"{API_BASE}/apply/tasks", params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to get tasks: {e}")
        return {"tasks": [], "total": 0}


def main():
    print("=" * 70)
    print("Phase 4.1: Extension Protocol Verification")
    print("=" * 70)
    print()
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        print(f"✓ Backend is running (status: {response.status_code})")
    except requests.exceptions.RequestException:
        print("✗ Backend is not running!")
        print(f"  Please start it: cd apps/backend && python3 run_api.py")
        return
    
    print()
    job_id = input("Enter job_id to test (e.g., linkedin_728569): ").strip()
    if not job_id:
        print("No job_id provided, exiting")
        return
    
    print(f"\n1. Queueing task for {job_id}...")
    result = queue_task(job_id)
    if not result:
        print("Failed to queue task, exiting")
        return
    
    print("\n2. Waiting for extension worker to claim task...")
    print("   (Extension polls every 15 seconds)")
    print("   Make sure the extension is loaded in Chrome!")
    print()
    
    task = None
    for i in range(30):  # Wait up to 30 seconds
        sys.stdout.write(f"\r   Waiting... {i+1}s")
        sys.stdout.flush()
        time.sleep(1)
        
        # Check if in_progress
        tasks = get_tasks(status="in_progress")
        if tasks.get("total", 0) > 0:
            task = tasks["tasks"][0]
            print(f"\n\n✓ Task claimed: task_id={task['id']}, status={task['status']}")
            break
        
        # Check if needs_user
        tasks = get_tasks(status="needs_user")
        if tasks.get("total", 0) > 0:
            task = tasks["tasks"][0]
            print(f"\n\n✓ Task needs user: task_id={task['id']}, status={task['status']}")
            if task.get('last_error'):
                print(f"   Reason: {task['last_error']}")
            break
    else:
        print("\n\n✗ Task not claimed within 30 seconds")
        print("   Possible issues:")
        print("   - Extension not loaded in Chrome")
        print("   - Extension polling is disabled")
        print("   - Job URL could not be opened")
        return
    
    print("\n" + "=" * 70)
    print("MANUAL VERIFICATION CHECKLIST")
    print("=" * 70)
    print()
    
    if task['status'] == 'needs_user':
        print("✓ Task is in 'needs_user' state.")
        print()
        print("This means the extension detected a condition requiring human action.")
        print()
        print("Next steps:")
        print("1. Open the extension popup in Chrome (click extension icon)")
        print("2. Verify it shows:")
        print("   - ATS Platform (workday/greenhouse/lever/icims/unknown)")
        print("   - Stage (login_required/verification_required/blocked/etc)")
        print("   - Reason for needs_user")
        print("   - Evidence section (expandable)")
        print("3. Complete the required action on the page:")
        print("   - If login_required: Log in to the ATS")
        print("   - If verification_required: Complete CAPTCHA/2FA")
        print("   - If blocked: Wait or switch network")
        print("4. Click 'I Finished Login/Verification, Continue' button in popup")
        print("5. Verify task transitions back to 'in_progress'")
        print()
        print("To check task status after clicking continue:")
        print(f"   curl 'http://127.0.0.1:8000/apply/tasks/{task['id']}'")
        print()
        
    elif task['status'] == 'in_progress':
        print("✓ Task is in 'in_progress' state.")
        print()
        print("This means the extension detected no blockers and proceeded with autofill.")
        print()
        print("Verification steps:")
        print("1. Check the opened job page in the browser")
        print("2. Verify email/first_name/last_name fields are autofilled")
        print("3. Open extension popup to see detection info:")
        print("   - ATS Platform")
        print("   - Stage (should be form_filling or ready_to_submit)")
        print("   - Evidence")
        print("4. Click 'Copy Debug Report' in popup")
        print("5. Paste JSON below for validation")
        print()
        print("If the page suddenly requires login/verification:")
        print("   - Task should flip to needs_user automatically")
        print("   - Check task status:")
        print(f"     curl 'http://127.0.0.1:8000/apply/tasks/{task['id']}'")
        print()
    
    print("=" * 70)
    print("Evidence Validation")
    print("=" * 70)
    print()
    print("After clicking 'Copy Debug Report' in the extension popup,")
    print("paste the JSON here (press Ctrl+D when done):")
    print()
    
    try:
        debug_json = sys.stdin.read()
        if debug_json.strip():
            data = json.loads(debug_json)
            print("\n✓ Valid JSON received")
            print()
            print("Detection Summary:")
            print(f"  ATS: {data.get('ats', {}).get('ats_kind', 'N/A')}")
            print(f"  Confidence: {data.get('ats', {}).get('confidence', 'N/A')}")
            print(f"  Stage: {data.get('stage', {}).get('stage', 'N/A')}")
            print(f"  Stage Confidence: {data.get('stage', {}).get('confidence', 'N/A')}")
            print(f"  Action: {data.get('action', {}).get('action', 'N/A')}")
            print(f"  Evidence items (ATS): {len(data.get('ats', {}).get('evidence', []))}")
            print(f"  Evidence items (Stage): {len(data.get('stage', {}).get('evidence', []))}")
            print()
            
            # Validate evidence quality
            ats_evidence = data.get('ats', {}).get('evidence', [])
            stage_evidence = data.get('stage', {}).get('evidence', [])
            
            if len(ats_evidence) >= 2:
                print("✓ ATS detection has sufficient evidence (≥2 items)")
            else:
                print("⚠ ATS detection has weak evidence (<2 items)")
            
            if len(stage_evidence) >= 1:
                print("✓ Stage detection has evidence")
            else:
                print("⚠ Stage detection has no evidence")
            
            print()
            print("Full Evidence (formatted):")
            print(json.dumps(data, indent=2))
            
    except json.JSONDecodeError as e:
        print(f"\n✗ Invalid JSON: {e}")
    except KeyboardInterrupt:
        print("\n\nSkipped evidence validation")
    
    print()
    print("=" * 70)
    print("Verification Complete")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  Task ID: {task['id']}")
    print(f"  Job ID: {task['job_id']}")
    print(f"  Status: {task['status']}")
    print()
    print("Next steps:")
    if task['status'] == 'needs_user':
        print("  - Complete the user action and click Continue")
        print("  - Verify autofill happens after continue")
        print("  - Submit application manually")
        print("  - Mark as success via popup")
    else:
        print("  - Complete any remaining form fields manually")
        print("  - Submit application manually")
        print("  - Mark as success via popup")
    print()


if __name__ == "__main__":
    main()

