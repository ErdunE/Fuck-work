# Phase 2: Browser Extension - Acceptance Criteria

**Version:** 1.0  
**Last Updated:** December 8, 2025  
**Module:** Phase 2 - Browser Extension Data Capture  
**Status:** Implementation Requirements

---

## Purpose

This document defines the **specific, measurable criteria** that must be met before the Browser Extension can be considered complete and ready for Phase 3 integration.

---

## 1. Functional Requirements

### 1.1 Extension Loads Successfully

**Requirement:** Extension installs and runs without errors in Chrome.

**Test:**
1. Build extension: `npm run build`
2. Open Chrome: `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select `apps/browser_extension/build/`

**Success Criteria:**
- ✅ Extension appears in extensions list
- ✅ No error messages
- ✅ Icon appears in toolbar
- ✅ Popup opens when clicked

---

### 1.2 LinkedIn Job Detection Works

**Requirement:** Extension correctly identifies LinkedIn job pages.

**Test:**
1. Visit https://linkedin.com (home page)
2. Visit https://linkedin.com/jobs/view/[any-job-id]

**Success Criteria:**
- ✅ Home page: No button injected
- ✅ Job page: "Score This Job" button appears
- ✅ Button appears within 3 seconds of page load
- ✅ Button positioned near job title

---

### 1.3 Data Extraction Accuracy

**Requirement:** Extract at least 80% of visible fields from LinkedIn jobs.

**Test:** Visit 10 diverse LinkedIn jobs:
- 2 FAANG jobs (Google, Meta, etc.)
- 2 Startup jobs
- 2 Jobs with Easy Apply
- 2 Jobs without poster info visible
- 2 Jobs with unusual formatting

**For each job, verify extraction:**

**P0 Fields (MUST extract 100%):**
- ✅ `title` - Job title text
- ✅ `company_name` - Company name
- ✅ `location` - Location string
- ✅ `jd_text` - Full job description (>50 chars)
- ✅ `url` - Current page URL
- ✅ `platform` - Set to "LinkedIn"
- ✅ `job_id` - Generated or extracted

**P1 Fields (MUST extract when visible, 80%+ success):**
- ✅ `posted_days_ago` - Parsed from "Posted X days ago"
- ✅ `applicants_count` - Parsed from "X applicants"
- ✅ `easy_apply` - Boolean, detected from button
- ✅ `actively_hiring_tag` - Boolean, detected from text

**P2 Fields (Nice to have, 50%+ success):**
- ⚠️ `poster_info.name` - When visible
- ⚠️ `poster_info.title` - When visible

**P3 Fields (Acceptable as null):**
- ❌ `account_age_months` - Set to null
- ❌ `company_info.size_employees` - Set to null
- ❌ `glassdoor_rating` - Set to null

**Success Criteria:**
- ✅ P0 fields: 100% extraction rate (10/10 jobs)
- ✅ P1 fields: ≥80% extraction rate
- ✅ No crashes on any test page
- ✅ Extracted `jd_text` length ≥50 characters

---

### 1.4 Backend Communication Works

**Requirement:** Extension successfully sends data to backend and receives results.

**Test:**
1. Start backend: `uvicorn apps.backend.main:app --port 5123`
2. Load extension
3. Visit LinkedIn job
4. Click "Score This Job"
5. Wait for results

**Success Criteria:**
- ✅ Request sent to `http://localhost:5123/api/score-job`
- ✅ Response received within 5 seconds
- ✅ Response contains valid `ScoreJobResponse` structure
- ✅ No CORS errors in console
- ✅ No network errors

---

### 1.5 UI Displays Results Correctly

**Requirement:** Scoring results displayed clearly and accurately.

**Test:**
Score 3 jobs with different expected scores:
- High score job (FAANG) - expect green
- Low score job (suspicious) - expect red
- Medium score job - expect orange

**Success Criteria:**
- ✅ Results overlay appears
- ✅ Score number displayed prominently
- ✅ Color matches score (green >80, orange 55-79, red <55)
- ✅ Level displayed ("likely real", "uncertain", "likely fake")
- ✅ Confidence displayed
- ✅ Red flags listed (if any)
- ✅ Overlay is closeable
- ✅ Button updates to show score after scoring

---

### 1.6 Error Handling

**Requirement:** Graceful handling of errors.

**Test scenarios:**

**Scenario 1: Backend offline**
1. Stop backend server
2. Click "Score This Job"

**Expected:**
- ✅ Error message: "Failed to connect to backend. Is the local app running?"
- ✅ Button shows error state
- ✅ No crash

**Scenario 2: Malformed page**
1. Visit LinkedIn page with missing elements
2. Click score button

**Expected:**
- ✅ Error message: "Job description too short or missing"
- ✅ Graceful failure
- ✅ No crash

**Scenario 3: Network error**
1. Disconnect internet
2. Click score button

**Expected:**
- ✅ Timeout after 10 seconds
- ✅ Error message displayed
- ✅ No crash

**Success Criteria:**
- ✅ All error scenarios handled
- ✅ User-friendly error messages (no stack traces)
- ✅ Extension recovers after error
- ✅ No console spam

---

## 2. Technical Requirements

### 2.1 Build System

**Requirement:** Clean, reproducible builds.

**Test:**
```bash
cd apps/browser_extension
rm -rf build/ node_modules/
npm install
npm run build
```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ Build outputs to `build/` directory
- ✅ All required files present in `build/`:
  - manifest.json
  - background/service-worker.js
  - content/linkedin.js
  - popup/popup.html, popup.js, popup.css
- ✅ No webpack warnings (critical only)

---

### 2.2 Type Safety

**Requirement:** All TypeScript code properly typed.

**Test:**
```bash
npm run type-check
```

**Success Criteria:**
- ✅ No TypeScript errors
- ✅ No `any` types except in error handling
- ✅ All public functions typed
- ✅ JobData interface matches Phase 1 exactly

---

### 2.3 Code Quality

**Requirement:** Clean, maintainable code.

**Test:**
```bash
npm run lint
```

**Success Criteria:**
- ✅ No lint errors
- ✅ Consistent code style
- ✅ No unused imports
- ✅ Proper error handling (try/catch where appropriate)

---

### 2.4 Permissions Minimalism

**Requirement:** Request only necessary permissions.

**Check manifest.json:**

**Allowed permissions:**
- ✅ `storage` - For saving scored jobs
- ✅ `activeTab` - For current page access

**Forbidden permissions:**
- ❌ `tabs` (too broad)
- ❌ `<all_urls>` (too broad)
- ❌ `cookies`
- ❌ `history`

**Success Criteria:**
- ✅ Only `storage` and `activeTab` requested
- ✅ host_permissions only for localhost:5123

---

## 3. Integration Requirements

### 3.1 Backend API Contract

**Requirement:** Extension sends data in exact format expected by backend.

**Test:**

Extract data from LinkedIn, inspect JSON:
```javascript
const jobData = extractor.extract();
console.log(JSON.stringify(jobData, null, 2));
```

**Validate against Python JobData schema:**
```python
from apps.backend.main import JobDataModel

# Should parse without errors
job = JobDataModel(**json_data)
```

**Success Criteria:**
- ✅ All required fields present
- ✅ Field types match (string, number, boolean, null)
- ✅ Nested objects structured correctly
- ✅ No extra fields
- ✅ Python Pydantic validation passes

---

### 3.2 Phase 1 Scorer Integration

**Requirement:** Extracted data scores correctly in Phase 1 engine.

**Test:**

Send extracted LinkedIn data to scorer:
```bash
# Extract job data from extension
# Send via API
curl -X POST http://localhost:5123/api/score-job \
  -H "Content-Type: application/json" \
  -d @linkedin_extracted_data.json
```

**Success Criteria:**
- ✅ Scorer processes data without errors
- ✅ Returns valid ScoreJobResponse
- ✅ Score is reasonable (not always 50.0 or 0.0)
- ✅ Red flags make sense for the job
- ✅ No Python exceptions

---

## 4. User Experience Requirements

### 4.1 Performance

**Requirement:** Scoring feels fast and responsive.

**Test:** Score 10 jobs, measure time from click to results.

**Success Criteria:**
- ✅ Average latency: <3 seconds
- ✅ 95th percentile: <5 seconds
- ✅ Loading state shows immediately (<0.5s)
- ✅ No browser freezing or lag

---

### 4.2 Visual Polish

**Requirement:** UI looks professional and polished.

**Test:** Score 3 jobs on different screen sizes:
- 1920x1080 (common desktop)
- 1366x768 (common laptop)
- 2560x1440 (high-res)

**Success Criteria:**
- ✅ Button visible and clickable on all sizes
- ✅ Results overlay doesn't obscure important content
- ✅ Text is readable (font size ≥12px)
- ✅ Colors have sufficient contrast
- ✅ No layout issues or overlapping

---

### 4.3 Error Messages

**Requirement:** Errors are clear and actionable.

**Test:** Trigger various error states.

**Good error messages:**
- ✅ "Failed to connect to backend. Is the local app running on port 5123?"
- ✅ "Job description missing or too short. Please try a different page."
- ✅ "LinkedIn page not fully loaded. Please wait and try again."

**Bad error messages:**
- ❌ "Error: undefined"
- ❌ "Failed to fetch"
- ❌ Stack traces

**Success Criteria:**
- ✅ All errors have user-friendly messages
- ✅ Messages explain what went wrong
- ✅ Messages suggest how to fix (when possible)
- ✅ No technical jargon

---

## 5. Platform Coverage

### 5.1 LinkedIn Support (REQUIRED)

**Requirement:** Full LinkedIn support.

**Test pages:**
```
✅ Standard job posting
✅ Easy Apply job
✅ Job with "Actively hiring" badge
✅ Job posted months ago
✅ Job with minimal poster info
✅ Job from large company
✅ Job from startup
✅ Job with international characters
✅ Mobile view (responsive)
✅ Different LinkedIn locales (linkedin.com/jobs/view vs /in/jobs)
```

**Success Criteria:**
- ✅ Works on all 10 test pages
- ✅ Extraction accuracy ≥80% across all pages
- ✅ No crashes

---

### 5.2 Other Platforms (NOT REQUIRED for MVP)

**Indeed, Glassdoor, YC, GitHub:**
- ❌ Not required for Phase 2 MVP
- ⚠️ Code structure should support adding later
- ✅ ExtractorFactory designed for extensibility

---

## 6. Security & Privacy

### 6.1 Data Privacy

**Requirement:** No user data leaves local machine.

**Verification:**
- ✅ Check Network tab: only localhost requests
- ✅ No analytics or tracking
- ✅ No third-party API calls
- ✅ No telemetry

---

### 6.2 Platform ToS Compliance

**Requirement:** Read-only access, no automation.

**Verification:**
- ✅ Extension only reads DOM (no writes)
- ✅ No form submission
- ✅ No auto-clicking
- ✅ No auto-scrolling
- ✅ No credential storage
- ✅ User must manually click "Score This Job"

---

## 7. Documentation

### 7.1 Code Documentation

**Requirement:** Code is understandable.

**Success Criteria:**
- ✅ All classes have docstrings
- ✅ Complex logic has comments
- ✅ Type definitions documented
- ✅ Public methods documented

---

### 7.2 User Documentation

**Requirement:** Users know how to use extension.

**Deliverable:** `apps/browser_extension/README.md`

**Must include:**
- Installation instructions
- How to use (visit job → click button)
- Troubleshooting (backend not running, etc.)
- Supported platforms
- Known limitations

---

## 8. Testing Checklist

### Manual Testing (Required)

**Test on 10 LinkedIn jobs:**

| Job Type | Company | Expected Score | Result | Notes |
|----------|---------|----------------|--------|-------|
| FAANG | Google | 85-100 | [ ] | |
| FAANG | Meta | 85-100 | [ ] | |
| Startup | YC W24 | 60-80 | [ ] | |
| Body-shop | Infosys | 20-40 | [ ] | |
| Recruiting | Kforce | 10-30 | [ ] | |
| Small legit | 50-200 emp | 70-90 | [ ] | |
| Old posting | 60+ days | 40-60 | [ ] | |
| Easy Apply | Any | Varies | [ ] | |
| No poster | Anonymous | Varies | [ ] | |
| Contract | Contract role | 50-70 | [ ] | |

**All 10 jobs must:**
- Extract without errors
- Send to backend successfully
- Receive and display results
- Show appropriate score and red flags

---

### Error Handling Tests

| Scenario | Expected Behavior | Result |
|----------|-------------------|--------|
| Backend offline | Error message shown | [ ] |
| Malformed page | Graceful failure | [ ] |
| No internet | Timeout message | [ ] |
| Very long JD | Processes normally | [ ] |
| Missing title | Error or fallback | [ ] |

---

## 9. Performance Benchmarks

### Latency Requirements

**Test:** Score 10 jobs, record time from click to results.

**Success Criteria:**
- ✅ Average: <3 seconds
- ✅ Median: <2 seconds
- ✅ 95th percentile: <5 seconds
- ✅ Max: <10 seconds

**If latency >5s consistently:**
- Check network tab for slow requests
- Verify backend is running locally (not remote)
- Check if extraction is slow (optimize selectors)

---

### Memory Usage

**Requirement:** Extension doesn't leak memory.

**Test:**
1. Open Chrome Task Manager
2. Load extension
3. Score 20 jobs
4. Check memory usage

**Success Criteria:**
- ✅ Memory usage <50MB after 20 scorings
- ✅ No continuous growth (memory leak)
- ✅ Background worker restarts cleanly

---

## 10. Browser Compatibility

### Chrome/Edge/Brave (Required)

**Test on:**
- ✅ Chrome 120+ (primary target)
- ✅ Edge 120+ (Chromium-based)
- ✅ Brave (Chromium-based)

**Success Criteria:**
- ✅ Works identically on all three
- ✅ No browser-specific bugs

### Firefox (NOT REQUIRED for MVP)

Firefox support in Phase 2.5+.

---

## 11. Deployment Readiness

### 11.1 Build Artifacts

**Requirement:** Clean build output ready for distribution.

**Check `build/` directory:**

**Required files:**
```
build/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   └── linkedin.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

**Success Criteria:**
- ✅ All files present
- ✅ No source maps in production build
- ✅ JavaScript minified
- ✅ Total size <1MB

---

### 11.2 Installation Instructions

**Deliverable:** Clear README.md

**Must include:**
```markdown
# Installation

1. Build the extension:
   cd apps/browser_extension
   npm install
   npm run build

2. Start the backend:
   cd apps/backend
   source .venv/bin/activate
   uvicorn main:app --port 5123

3. Load in Chrome:
   - Go to chrome://extensions
   - Enable "Developer Mode"
   - Click "Load unpacked"
   - Select apps/browser_extension/build/

4. Visit a LinkedIn job page
5. Click "🎯 Score This Job"
```

---

## 12. Known Issues & Limitations (Acceptable for MVP)

**Document these limitations:**

### Expected Limitations (OK):
- ✅ LinkedIn only (other platforms in Phase 2.5+)
- ✅ Some fields always null (account age, company size)
- ✅ Requires backend running locally
- ✅ Manual button click (no auto-scoring)
- ✅ "Save to Queue" button non-functional (Phase 3)

### Unexpected Issues (NOT OK):
- ❌ Frequent crashes
- ❌ Data corruption
- ❌ Privacy violations
- ❌ Platform ToS violations

---

## 13. Sign-Off Checklist

Before marking Phase 2 complete:

### Functional
- [ ] Extension loads in Chrome
- [ ] Button appears on LinkedIn jobs
- [ ] Data extraction works (80%+ accuracy)
- [ ] Backend communication works
- [ ] Results display correctly
- [ ] Tested on 10+ real jobs

### Technical
- [ ] Build succeeds
- [ ] Type-check passes
- [ ] Lint passes
- [ ] No console errors
- [ ] CORS working

### Quality
- [ ] Error handling complete
- [ ] Performance acceptable (<3s avg)
- [ ] UI polished
- [ ] Documentation complete

### Integration
- [ ] Phase 1 scorer receives valid data
- [ ] No serialization errors
- [ ] Scores make sense

### Process
- [ ] Feature branch created from dev
- [ ] All commits follow conventions
- [ ] PR created targeting dev
- [ ] PR template filled out
- [ ] CI passes (if applicable)

---

## 14. Definition of Done

**Phase 2 MVP is COMPLETE when:**

1. ✅ User can install extension in Chrome
2. ✅ User can visit any LinkedIn job page
3. ✅ User sees "Score This Job" button
4. ✅ User clicks button → sees authenticity score + explanation
5. ✅ Process takes <3 seconds on average
6. ✅ Works on 10/10 test LinkedIn jobs
7. ✅ Backend API integrated with Phase 1 scorer
8. ✅ No critical bugs
9. ✅ Code merged to `dev`

**Then proceed to Phase 3: Desktop App UI**

---

## 15. Failure Conditions

**Phase 2 must be RESTARTED if:**

- ❌ Extraction accuracy <60% on test jobs
- ❌ Extension crashes on >30% of pages
- ❌ Cannot communicate with backend
- ❌ Data corruption (Phase 1 scorer fails on extension data)
- ❌ Unresolvable CORS issues
- ❌ Performance consistently >10 seconds

**If any failure condition met, STOP and report to CTO.**

---

**Approved By:** [Erdun]  
**Date:** [Completion Date]  
**Status:** [ ] In Progress / [ ] Complete / [ ] Blocked

---

## END OF ACCEPTANCE CRITERIA

**Next Module:** Phase 3 - Desktop App Batch Review UI
