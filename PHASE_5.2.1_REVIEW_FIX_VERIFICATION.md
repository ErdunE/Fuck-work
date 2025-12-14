# Phase 5.2.1 Review Fix — 3-Step Manual Verification

This guide provides a simple, definitive 3-step verification that all review fixes have been implemented correctly.

---

## Step 1: Verify Backend Derived Profile Endpoint

**Test the endpoint and confirm review fixes:**

```bash
# 1. Register and login (skip if already registered)
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewfix@example.com","password":"testpass123"}'

# 2. Get JWT token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewfix@example.com","password":"testpass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 3. Add profile data
curl -X PUT http://localhost:8000/api/users/me/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "primary_email": "jane.doe@example.com",
    "phone": "+1-555-0199",
    "city": "San Francisco",
    "state": "CA",
    "work_authorization": "H1B",
    "willing_to_relocate": true
  }'

# 4. Add education (for highest_degree derivation)
curl -X POST http://localhost:8000/api/users/me/education \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_name": "Stanford",
    "degree": "Master of Science",
    "major": "Computer Science",
    "end_date": "2022-05-30"
  }'

# 5. Add experience (for years_of_experience derivation)
curl -X POST http://localhost:8000/api/users/me/experience \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechCorp",
    "job_title": "Engineer",
    "start_date": "2022-06-01",
    "is_current": true
  }'

# 6. Add skills
curl -X POST http://localhost:8000/api/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill_name": "Python"}'

curl -X POST http://localhost:8000/api/users/me/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skill_name": "React"}'

# 7. TEST DERIVED PROFILE ENDPOINT
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users/me/derived-profile | python3 -m json.tool
```

### ✅ Expected Response (Review Fix Verification):

```json
{
  "legal_name": "Jane Doe",
  "highest_degree": "MS",
  "graduation_year": 2022,
  "years_of_experience": 2,
  "work_authorized_us": true,
  "requires_sponsorship": true,
  "work_auth_category": "H1B",
  "willing_to_relocate": true,
  "government_employment_flag": false,
  "normalized_skills": ["python", "react"],
  "primary_email": "jane.doe@example.com",
  "phone": "+1-555-0199",
  "city": "San Francisco",
  "state": "CA",
  "country": null,
  "postal_code": null,
  "linkedin_url": null,
  "portfolio_url": null,
  "github_url": null,
  "missing_fields": [],
  "source_fields": {
    "legal_name": ["first_name", "last_name", "full_name"],
    "highest_degree": ["user_education.degree"],
    "graduation_year": ["user_education.end_date"],
    "years_of_experience": ["user_experience.start_date", "user_experience.end_date", "user_experience.is_current"],
    "work_authorization": ["work_authorization"],
    "normalized_skills": ["user_skills.skill_name"]
  }
}
```

### ✅ Review Fix Checklist (Step 1):

- [ ] `legal_name` is "Jane Doe" (not "Jane null" or extra spaces)
- [ ] `work_authorized_us` is `true` (boolean primitive, not string)
- [ ] `requires_sponsorship` is `true` (boolean primitive)
- [ ] `work_auth_category` is "H1B" (enum category)
- [ ] `missing_fields` array is present (empty in this case)
- [ ] `source_fields` object is present with mappings

---

## Step 2: Verify Extension Console Telemetry

**Test the extension and confirm telemetry proves derived profile usage:**

### Prerequisites:
- Backend running on `http://localhost:8000`
- Extension loaded and user logged in
- Navigate to any job application page (e.g., TikTok, Greenhouse, Workday)

### Actions:
1. Open Chrome DevTools Console
2. Navigate to a job application page
3. Wait for autofill to trigger (or trigger manually if configured)

### ✅ Expected Console Output (Review Fix Verification):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Phase 5.2.1 Review Fix] PROOF OF DERIVED PROFILE USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Telemetry] profile_source: "derived-profile" (NOT raw profile)
[Telemetry] endpoint: GET /api/users/me/derived-profile
[Telemetry] Derived profile data received: {
  legal_name: "Jane Doe",
  primary_email: "jane.doe@example.com",
  phone: "+1-555-0199",
  highest_degree: "MS",
  graduation_year: 2022,
  years_of_experience: 2,
  work_authorized_us: true,
  requires_sponsorship: true,
  work_auth_category: "H1B",
  normalized_skills: 2,
  missing_fields: [],
  source_fields_count: 6
}
[Telemetry] Source field mapping (traceability): {
  legal_name: ["first_name", "last_name", "full_name"],
  highest_degree: ["user_education.degree"],
  graduation_year: ["user_education.end_date"],
  years_of_experience: [...],
  work_authorization: ["work_authorization"],
  normalized_skills: ["user_skills.skill_name"]
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ Expected Autofill Telemetry:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Phase 5.2.1 Review Fix] AUTOFILL TELEMETRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Telemetry] profile_source: "derived-profile"
[Telemetry] autofill_trigger_reason: application_form detected + auto_fill_enabled
[Telemetry] fields_attempted: 10
[Telemetry] fields_filled: 8
[Telemetry] fields_skipped: 2
[Telemetry] Detailed skip reasons: {
  "linkedin_url": "missing_profile_field",
  "portfolio_url": "missing_profile_field"
}
[Telemetry] ⚠️ ATS-specific selectors NOT FOUND on page: ["highest_degree", "work_authorization"]
[Telemetry] fill_rate: 80%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ Review Fix Checklist (Step 2):

- [ ] Console shows `profile_source: "derived-profile"` (EXACT string)
- [ ] Console shows `endpoint: GET /api/users/me/derived-profile`
- [ ] Console shows `work_authorized_us` and `requires_sponsorship` boolean values
- [ ] Console shows `work_auth_category` enum value (not work_authorization_status)
- [ ] Console shows `missing_fields` array
- [ ] Console shows `source_fields` mapping
- [ ] If ATS-specific fields not found on page, console shows `selector_not_found` warnings
- [ ] Console explicitly logs `fields_attempted`, `fields_filled`, `fields_skipped`
- [ ] Detailed skip reasons are logged

---

## Step 3: Confirm No Placeholder Values Used

**Verify that autofill ONLY uses backend derived profile data (no placeholders):**

### Test Scenario: Missing Profile Data

```bash
# 1. Create a new user with INCOMPLETE profile
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"incomplete@example.com","password":"testpass123"}'

TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"incomplete@example.com","password":"testpass123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. Check derived profile (SHOULD HAVE MISSING FIELDS)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/users/me/derived-profile | python3 -m json.tool
```

### ✅ Expected Response (Incomplete Profile):

```json
{
  "legal_name": null,
  "highest_degree": null,
  "graduation_year": null,
  "years_of_experience": null,
  "work_authorized_us": null,
  "requires_sponsorship": null,
  "work_auth_category": null,
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
  "github_url": null,
  "missing_fields": [
    "legal_name",
    "primary_email",
    "phone",
    "highest_degree",
    "years_of_experience",
    "work_authorization"
  ],
  "source_fields": {}
}
```

### ✅ Extension Behavior with Incomplete Profile:

- [ ] Extension console shows `missing_fields: ["legal_name", "primary_email", ...]`
- [ ] Extension console shows skip reasons: `"missing_profile_field"` for missing data
- [ ] **NO PLACEHOLDER VALUES** are filled (no "John Doe", no "user@example.com", no fake phone numbers)
- [ ] Form fields remain empty if profile data is missing
- [ ] Console explicitly logs: `Skipped legal_name: missing_profile_field`

---

## Review Fix Success Criteria

Phase 5.2.1 Review Fixes are complete when ALL of the following are true:

### Backend:
- [x] `/api/users/me/derived-profile` includes `missing_fields` array
- [x] `/api/users/me/derived-profile` includes `source_fields` mapping
- [x] `legal_name` is null-safe (never "null null" or extra spaces)
- [x] `legal_name` returns `null` if first or last name is missing (not partial name)
- [x] Work authorization split into `work_authorized_us`, `requires_sponsorship`, `work_auth_category`
- [x] H1B correctly returns `(True, True, "H1B")` (authorized but requires sponsorship)
- [x] US Citizen correctly returns `(True, False, "US_CITIZEN")`

### Extension:
- [x] Console explicitly shows `profile_source: "derived-profile"`
- [x] Console shows endpoint: `GET /api/users/me/derived-profile`
- [x] Console logs `fields_attempted`, `fields_filled`, `fields_skipped`
- [x] Console logs detailed skip reasons
- [x] Console logs `selector_not_found` for ATS-specific fields if missing
- [x] Extension uses `work_auth_category` (not `work_authorization_status`)
- [x] Extension logs `work_authorized_us` and `requires_sponsorship` values
- [x] Extension logs `missing_fields` from backend response
- [x] Extension logs `source_fields` mapping

### No Placeholders:
- [x] Autofill skips fields with missing profile data
- [x] No hardcoded fallback values ("John Doe", "user@example.com", etc.)
- [x] Console explicitly logs `missing_profile_field` for skipped fields

---

## Quick Pass/Fail Test

Run all 3 steps in sequence. If ANY of the following appear, the review fixes FAILED:

❌ **FAIL:** `legal_name: "null null"` or `"Jane null"` in response
❌ **FAIL:** `work_authorization_status` field in response (should be `work_auth_category`)
❌ **FAIL:** `missing_fields` array is missing from response
❌ **FAIL:** `source_fields` object is missing from response
❌ **FAIL:** Console shows `profile_source: "derived_backend"` (should be `"derived-profile"`)
❌ **FAIL:** Console does NOT show `selector_not_found` warnings for missing ATS fields
❌ **FAIL:** Placeholder values filled when profile data is missing
❌ **FAIL:** `work_authorized_us` is a string (should be boolean or null)

✅ **PASS:** All 3 steps complete with expected output, no placeholder values used, telemetry proves derived profile usage.

---

**Phase 5.2.1 Review Fix Verification Complete**

