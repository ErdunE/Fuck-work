#!/usr/bin/env python3
"""
Verification script for Phase 4.1.2 page transition awareness.
Tests automatic re-detection on page changes.
"""

import requests
import time
import json
import sys

API_BASE = "http://127.0.0.1:8000"

def print_header():
    print("=" * 70)
    print("Phase 4.1.2: Page Transition Awareness Verification")
    print("=" * 70)
    print()

def print_section(title):
    print()
    print(f"{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}")
    print()

def test_page_transitions():
    print_header()
    
    print("This script verifies automatic re-detection on page transitions.")
    print()
    
    print_section("SETUP")
    
    print("1. Ensure backend is running: python3 run_api.py")
    print("2. Ensure extension is loaded and active")
    print("3. Have a multi-step job URL ready (Workday, Greenhouse, etc.)")
    print()
    
    print_section("TEST SCENARIO 1: Click Apply Button")
    
    print("Steps:")
    print("  1. Queue a LinkedIn Easy Apply job")
    print("  2. Extension opens landing page")
    print("  3. Overlay shows: 'Click Apply Button'")
    print("  4. User clicks Apply button")
    print("  5. Page navigates to application form")
    print()
    print("Expected Behavior:")
    print("  ✓ Overlay briefly shows 'Checking new page...'")
    print("  ✓ Overlay updates to show new stage (form_filling)")
    print("  ✓ Autofill runs automatically")
    print("  ✓ Popup shows recheck_count: 1+")
    print("  ✓ Debug report includes 'last_recheck_reason': 'url_changed'")
    print()
    
    print_section("TEST SCENARIO 2: Login Flow")
    
    print("Steps:")
    print("  1. Queue a Workday job requiring login")
    print("  2. Extension opens page")
    print("  3. Overlay shows: 'Sign In Required'")
    print("  4. User logs in")
    print("  5. Page redirects to application page")
    print()
    print("Expected Behavior:")
    print("  ✓ Overlay auto-updates after login redirect")
    print("  ✓ New guidance appears (form guidance or next step)")
    print("  ✓ No manual 'Continue' button click needed")
    print("  ✓ recheck_reason: 'url_changed' or 'dom_changed'")
    print()
    
    print_section("TEST SCENARIO 3: Multi-Step Form")
    
    print("Steps:")
    print("  1. Start application with multi-step form")
    print("  2. Fill first page, click Continue")
    print("  3. SPA navigates to step 2")
    print()
    print("Expected Behavior:")
    print("  ✓ Detection reruns automatically")
    print("  ✓ Overlay updates if needed")
    print("  ✓ Popup reflects current step")
    print("  ✓ recheck_count increments")
    print()
    
    print_section("TEST SCENARIO 4: Tab Switch")
    
    print("Steps:")
    print("  1. Switch to another browser tab")
    print("  2. Return to application tab")
    print()
    print("Expected Behavior:")
    print("  ✓ Recheck triggers on visibility change")
    print("  ✓ Overlay refreshes if page changed while away")
    print("  ✓ recheck_reason: 'visibility_change'")
    print()
    
    print_section("VALIDATION CHECKLIST")
    
    checklist = [
        ("URL changes trigger automatic re-detection", "□"),
        ("SPA navigation detected (pushState/replaceState)", "□"),
        ("DOM mutations trigger debounced re-detection", "□"),
        ("Tab visibility changes trigger recheck", "□"),
        ("Overlay updates automatically with new guidance", "□"),
        ("Popup syncs without manual refresh", "□"),
        ("recheck_count increments correctly", "□"),
        ("last_recheck_reason logged accurately", "□"),
        ("No duplicate overlays appear", "□"),
        ("No automatic clicking occurs", "□"),
        ("System remains responsive (no loops)", "□"),
    ]
    
    for item, checkbox in checklist:
        print(f"{checkbox} {item}")
    print()
    
    print_section("DEBUG REPORT STRUCTURE")
    
    print("Copy debug report from popup should include:")
    print()
    print(json.dumps({
        "ats": {"ats_kind": "...", "confidence": "..."},
        "stage": {"stage": "...", "confidence": "..."},
        "action": {"action": "...", "reason": "..."},
        "intent": {"intent": "...", "confidence": "..."},
        "guidance": {"title": "...", "user_action": "..."},
        "page_url": "https://...",
        "last_recheck_reason": "url_changed|dom_changed|visibility_change|page_load",
        "recheck_count": 3,
        "timestamp": "ISO_8601"
    }, indent=2))
    print()
    
    print_section("COMMON ISSUES")
    
    print("Issue: Overlay doesn't update after clicking Apply")
    print("  → Check console for '[Page Lifecycle]' logs")
    print("  → Verify history API hooks are working")
    print("  → Check if SPA or hard navigation")
    print()
    
    print("Issue: Too many rechecks (infinite loop)")
    print("  → Check debounce timeout (should be 800ms)")
    print("  → Verify same URL guard is working")
    print("  → Check MutationObserver isn't triggering on own changes")
    print()
    
    print("Issue: Popup doesn't auto-refresh")
    print("  → Verify chrome.storage.onChanged listener is set up")
    print("  → Check if popup is using cached state")
    print()
    
    print_section("CONSOLE LOG VERIFICATION")
    
    print("Open browser console (F12) and look for these log patterns:")
    print()
    print("On initial page load:")
    print("  [Page Lifecycle] Initializing observers...")
    print("  [Page Lifecycle] All observers initialized")
    print()
    print("After clicking Apply/Continue:")
    print("  [Page Lifecycle] pushState detected")
    print("  [Recheck] Executing detection pipeline (reason: url_changed)")
    print("  [Recheck] Detection pipeline complete: {...}")
    print()
    print("After switching tabs:")
    print("  [Page Lifecycle] Tab became visible")
    print("  [Recheck] Executing detection pipeline (reason: visibility_change)")
    print()
    print("On DOM changes:")
    print("  [Page Lifecycle] DOM changed significantly")
    print("  [Recheck] Executing detection pipeline (reason: dom_changed)")
    print()
    
    print("=" * 70)
    print()
    print("Ready to test page transitions.")
    print()
    input("Press Enter when ready to start...")

if __name__ == "__main__":
    test_page_transitions()

