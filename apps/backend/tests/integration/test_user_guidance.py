#!/usr/bin/env python3
"""
Verification script for Phase 4.1.1 user action guidance.
Tests intent detection and resume flow.
"""

import requests
import time
import json
import sys

API_BASE = "http://127.0.0.1:8000"

def print_header():
    print("=" * 70)
    print("Phase 4.1.1: User Action Guidance Verification")
    print("=" * 70)
    print()

def print_section(title):
    print()
    print(f"{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}")
    print()

def print_step(number, description):
    print(f"{number}. {description}")

def test_guidance_flow():
    print_header()
    
    print("This script guides you through manual verification of user action")
    print("guidance and automatic resume detection.")
    print()
    
    print_section("MANUAL TEST STEPS")
    
    print_step(1, "Queue a job that requires login (e.g., Workday/Greenhouse)")
    print("   Use: curl -X POST 'http://127.0.0.1:8000/apply/queue' \\")
    print("          -H 'Content-Type: application/json' \\")
    print("          -d '{\"user_id\": 1, \"job_ids\": [\"your_job_id\"], \"allow_duplicates\": true}'")
    print()
    
    print_step(2, "Extension opens page → pauses at login screen")
    print("   Wait for the extension worker to claim the task and open the job page.")
    print()
    
    print_step(3, "Verify overlay shows:")
    print("   - Clear title (e.g., 'Sign In Required')")
    print("   - What's happening explanation")
    print("   - Specific action to take")
    print("   - What happens next")
    print()
    
    print_step(4, "Open popup → verify it shows:")
    print("   - User action intent (login_required)")
    print("   - Confidence level")
    print("   - Clear guidance message")
    print()
    
    print_step(5, "Complete the action (log in)")
    print("   Sign in with your credentials on the ATS platform.")
    print()
    
    print_step(6, "Watch for automatic resume:")
    print("   - Overlay should disappear automatically")
    print("   - Autofill should run (email/name fields)")
    print("   - Task should stay in_progress (not needs_user)")
    print()
    
    print_step(7, "Check backend event log:")
    print("   curl 'http://127.0.0.1:8000/apply/tasks/{task_id}'")
    print("   - Should show 'Resumed after user completed: login_required'")
    print("   - Check the details field for evidence")
    print()
    
    print_section("TEST SCENARIOS")
    
    print("Scenario A: Login Required → User Logs In → Auto Resume")
    print("  - Queue a Workday or Greenhouse job")
    print("  - Extension detects login screen → shows 'Sign In Required'")
    print("  - User logs in → page redirects to application form")
    print("  - Extension detects form → removes overlay → autofills fields")
    print()
    
    print("Scenario B: Click Apply Button → User Clicks → Auto Resume")
    print("  - Queue a LinkedIn Easy Apply job")
    print("  - Extension detects landing page → shows 'Click Apply Button'")
    print("  - User clicks 'Apply' → form opens")
    print("  - Extension detects form → removes overlay → autofills fields")
    print()
    
    print("Scenario C: Email Verification → User Verifies → Manual Continue")
    print("  - Extension detects 'check your email' message")
    print("  - Shows 'Verify Your Email' with instruction to check inbox")
    print("  - User clicks verification link in email")
    print("  - Returns to page → clicks Continue in popup")
    print("  - Extension resumes autofill")
    print()
    
    print_section("VALIDATION CHECKLIST")
    
    checklist = [
        ("User action intent detected correctly", "□"),
        ("Overlay shows clear, actionable guidance", "□"),
        ("Guidance includes: title, what, action, next", "□"),
        ("Popup displays intent and guidance", "□"),
        ("Resume detection triggers automatically", "□"),
        ("Task transitions needs_user → in_progress on resume", "□"),
        ("Resume event logged with evidence", "□"),
        ("Debug payload includes intent + guidance", "□"),
        ("All guidance messages are human-readable", "□"),
        ("NO automatic clicking or form submission", "□"),
    ]
    
    for item, checkbox in checklist:
        print(f"{checkbox} {item}")
    print()
    
    print_section("DEBUG REPORT VALIDATION")
    
    print("To validate the debug report:")
    print("1. In the extension popup, click 'Copy Debug Report'")
    print("2. Paste the JSON below and verify it contains:")
    print("   - ats: { ats_kind, confidence, evidence[] }")
    print("   - stage: { stage, confidence, evidence[] }")
    print("   - action: { action, reason, evidence[] }")
    print("   - intent: { intent, confidence, evidence[] }")
    print("   - guidance: { title, what_happening, user_action, what_next }")
    print()
    print("Example validation command:")
    print("  pbpaste | python3 -m json.tool")
    print("  (macOS: pbpaste, Linux: xclip -o)")
    print()
    
    print_section("EXPECTED OUTCOMES")
    
    print("After completing all scenarios, you should observe:")
    print()
    print("1. Intent Detection Works:")
    print("   - login_required detected on login pages")
    print("   - click_apply detected on job landing pages")
    print("   - email_verification_required detected when appropriate")
    print()
    print("2. Guidance Is Clear:")
    print("   - Every intent has specific, actionable instructions")
    print("   - User always knows what to do next")
    print("   - Reassurance that system will continue after action")
    print()
    print("3. Resume Detection Works:")
    print("   - Overlay disappears when condition clears")
    print("   - Autofill runs automatically after resume")
    print("   - Backend receives resume event with evidence")
    print()
    print("4. Safety Maintained:")
    print("   - No automatic clicking")
    print("   - No CAPTCHA bypass")
    print("   - User confirmation required for state changes")
    print()
    
    print("=" * 70)
    print()
    print("Ready to begin testing.")
    print()
    input("Press Enter to continue...")

if __name__ == "__main__":
    test_guidance_flow()

