# Phase 5.2.1 Testing Guide: Derived ATS Answer Layer

## Overview

This guide provides step-by-step instructions to verify that Phase 5.2.1 has been implemented correctly.

**What Changed:**
- Backend now exposes `GET /api/users/me/derived-profile` endpoint
- Extension autofill now uses derived profile (ATS-ready answers) instead of raw profile
- Frontend API client updated with `getDerivedProfile()` method

---

## Backend Testing

### Prerequisites
```bash
cd /Users/erdune/Desktop/Fuck-work/apps/backend
python3 run_api.py
```

### Test 1: Verify Endpoint Exists

```bash
# Register a test user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test521@example.com","password":"testpass123"}'

# Login and get token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test521@example.com","password":"testpass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Test derived profile endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users/me/derived-profile | python3 -m json.tool
```

**Expected Response:**
```json
{
  "legal_name": null,
  "highest_degree": null,
  "graduation_year": null,
  "years_of_experience": null,
  "work_authorization_status": null,
  "willing_to_relocate": false,
  "government_employment_flag": false,
  "normalized_skills": [],
  "primary_email": null,
  "phone": null,
  "city": null,
  "state": null,
  "country": null,
  "postal_code": null,
  "linkedin_url": null,
  "portfolio_url": null,
  "github_url": null
}
```

### Test 2: Verify Computation Logic

Add profile data and verify derived values:

```bash
# Update raw profile
curl -X PUT http://localhost:8000/api/users/me/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "primary_email": "jane.smith@example.com",
    "phone": "+1-555-123-4567",
    "city": "San Francisco",
    "state": "CA",
    "work_authorization": "US Citizen",
    "willing_to_relocate": true,
    "government_employment_history": false
  }'

# Add education
curl -X POST http://localhost:8000/api/users/me/education \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_name": "Stanford University",
    "degree": "Bachelor of Science",
    "major": "Computer Science",
    "start_date": "2016-09-01",
    "end_date": "2020-05-30"
  }'

curl -X POST http://localhost:8000/api/users/me/education \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_name": "MIT",
    "degree": "Master of Science",
    "major": "Artificial Intelligence",
    "start_date": "2020-09-01",
    "end_date": "2022-05-30"
  }'

# Add experience
curl -X POST http://localhost:8000/api/users/me/experience \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechCorp",
    "job_title": "Software Engineer",
    "start_date": "2022-06-01",
    "end_date": "2024-01-01",
    "is_current": false
  }'

curl -X POST http://localhost:8000/api/users/me/experience \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "InnovateAI",
    "job_title": "Senior Software Engineer",
    "start_date": "2024-02-01",
    "is_current": true
  }'

# Add skills
curl -X POST http://localhost:8000/api/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill_name": "Python", "skill_category": "Programming"}'

curl -X POST http://localhost:8000/api/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill_name": "React", "skill_category": "Frontend"}'

curl -X POST http://localhost:8000/api/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill_name": "TypeScript", "skill_category": "Programming"}'

# Fetch derived profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users/me/derived-profile | python3 -m json.tool
```

**Expected Derived Response:**
```json
{
  "legal_name": "Jane Smith",
  "highest_degree": "MS",
  "graduation_year": 2022,
  "years_of_experience": 3,
  "work_authorization_status": "US_CITIZEN",
  "willing_to_relocate": true,
  "government_employment_flag": false,
  "normalized_skills": ["python", "react", "typescript"],
  "primary_email": "jane.smith@example.com",
  "phone": "+1-555-123-4567",
  "city": "San Francisco",
  "state": "CA",
  "country": null,
  "postal_code": null,
  "linkedin_url": null,
  "portfolio_url": null,
  "github_url": null
}
```

**Verify Computation:**
- ✅ `legal_name` = "Jane Smith" (computed from first_name + last_name)
- ✅ `highest_degree` = "MS" (Master of Science is higher than Bachelor)
- ✅ `graduation_year` = 2022 (most recent education end_date)
- ✅ `years_of_experience` = ~3 years (computed from experience records)
- ✅ `work_authorization_status` = "US_CITIZEN" (normalized from "US Citizen")
- ✅ `willing_to_relocate` = true (direct from profile)
- ✅ `normalized_skills` = ["python", "react", "typescript"] (lowercase, deduplicated)

---

## Extension Testing

### Prerequisites
1. Backend running on `http://localhost:8000`
2. Extension loaded in Chrome
3. User logged in via extension

### Test 3: Verify Extension Uses Derived Profile

1. **Open Chrome DevTools Console**
2. **Navigate to a job application page** (e.g., TikTok, Greenhouse, Workday)
3. **Look for Phase 5.2.1 logs:**

```
[Phase 5.2.1] Fetching DERIVED profile from backend API (authenticated)...
[FW API] Derived profile fetched successfully
[Phase 5.2.1] Derived profile source: backend (ATS-ready answers)
[Phase 5.2.1] Derived profile data loaded: {
  legal_name: "Jane Smith",
  primary_email: "jane.smith@example.com",
  phone: "+1-555-123-4567",
  highest_degree: "MS",
  graduation_year: 2022,
  years_of_experience: 3,
  work_authorization_status: "US_CITIZEN",
  normalized_skills: 3
}
```

4. **Verify autofill executes:**

```
[Phase 5.2.1] Autofill using DERIVED profile (ATS-ready answers)
[Autofill] Filled legal_name: Jane Smith
[Autofill] Filled email: jane.smith@example.com
[Autofill] Filled phone: +1-555-123-4567
[Autofill] Filled highest_degree: MS
[Autofill] Filled years_of_experience: 3
[Autofill] Filled work_authorization_status: US_CITIZEN
[Autofill] Checked willing_to_relocate: true
```

5. **Verify ATS-specific fields telemetry:**

```
[Phase 5.2.1] Autofill used DERIVED profile exclusively
[Phase 5.2.1] ATS-specific fields filled: {
  legal_name: true,
  highest_degree: true,
  years_of_experience: true,
  work_authorization_status: true,
  willing_to_relocate: true,
  government_employment_flag: false
}
```

### Test 4: Verify No Raw Profile Access

**Search console for deprecated warning:**
```
[DEPRECATED] getMyProfile() - Autofill should use getMyDerivedProfile() instead
```

- ✅ If this warning appears, raw profile is still being called somewhere (should NOT happen)
- ✅ If this warning does NOT appear, autofill is correctly using derived profile only

---

## Frontend Testing

### Test 5: Verify Frontend API Client

Open frontend dev console:

```javascript
import api from './services/api'

// Test getDerivedProfile method exists
const derivedProfile = await api.getDerivedProfile()
console.log('Derived Profile:', derivedProfile)
```

**Expected:**
- Method exists and returns DerivedProfile type
- No TypeScript errors
- Response matches backend `/api/users/me/derived-profile` shape

---

## Success Criteria Checklist

Phase 5.2.1 is complete when ALL of the following are true:

### Backend
- ✅ `GET /api/users/me/derived-profile` endpoint exists and responds
- ✅ Derived profile computes `legal_name` correctly
- ✅ Derived profile computes `highest_degree` correctly (PhD > MS > BS > AS)
- ✅ Derived profile computes `graduation_year` correctly (most recent)
- ✅ Derived profile computes `years_of_experience` correctly (sum of all experience)
- ✅ Derived profile normalizes `work_authorization_status` correctly (US_CITIZEN, GREEN_CARD, etc.)
- ✅ Derived profile passes through `willing_to_relocate` and `government_employment_flag`
- ✅ Derived profile normalizes skills (lowercase, deduplicated)
- ✅ No linting errors in `derived_profile.py` or `app.py`

### Extension
- ✅ Extension calls `getMyDerivedProfile()` instead of `getMyProfile()`
- ✅ Autofill uses derived profile exclusively (console logs confirm)
- ✅ Autofill fills ATS-specific fields (highest_degree, years_of_experience, work_authorization_status)
- ✅ Autofill checks checkboxes for willing_to_relocate and government_employment_flag
- ✅ Console shows "[Phase 5.2.1]" logs (not "[Phase 5.1]")
- ✅ No errors in extension background or content scripts

### Frontend
- ✅ `DerivedProfile` TypeScript interface exists in `types/index.ts`
- ✅ `api.getDerivedProfile()` method exists in `services/api.ts`
- ✅ No TypeScript compilation errors

### Integration
- ✅ Real E2E test: Register → Add profile → Add education/experience/skills → Navigate to job → Autofill triggers → Fills correctly
- ✅ Fill rate ≥ 80% on real ATS pages
- ✅ All filled values come from derived profile (no placeholders)

---

## Common Issues & Debugging

### Issue: Derived profile returns all null values
**Cause:** No profile data in database  
**Fix:** Add profile, education, experience, and skills via Web Control Plane or API

### Issue: Extension still uses getMyProfile()
**Cause:** Extension not reloaded  
**Fix:** Chrome → Extensions → Reload extension → Hard refresh page

### Issue: Autofill not triggering
**Cause:** `auto_fill_after_login` preference is false  
**Fix:** Update automation preferences:
```bash
curl -X PUT http://localhost:8000/api/users/me/automation-preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auto_fill_after_login": true}'
```

### Issue: years_of_experience is 0 or null
**Cause:** Experience records missing `start_date` or computation error  
**Fix:** Ensure experience records have valid `start_date` and either `end_date` or `is_current=true`

---

## Next Steps After Testing

Once all success criteria are met:

1. ✅ Mark all Phase 5.2.1 TODOs as complete
2. ✅ Commit all changes with message: `feat: Phase 5.2.1 - Derived ATS Answer Layer`
3. ⏸️ STOP and wait for review
4. ⏸️ Do NOT proceed to Phase 5.2.2 or 5.2.3 without explicit approval

---

**Phase 5.2.1 Testing Complete**

