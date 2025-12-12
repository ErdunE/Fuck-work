# FuckWork Phase 2 Implementation - Official Kickoff Document

**Project:** FuckWork  
**Phase:** 2 - Browser Extension Data Capture  
**Status:** Ready for Implementation  
**Engineer:** Cursor  
**Governance:** Strict - Follow ALL rules in `.cursor/rules/`  
**Dependencies:** Phase 1 (Authenticity Scoring Engine) ✅ Complete

---

## 🎯 Mission

Build a **Chrome browser extension** that extracts job posting data from LinkedIn (MVP) and sends it to the local backend for authenticity scoring.

**Scope:** LinkedIn only for MVP. Other platforms (Indeed, Glassdoor, etc.) in Phase 2.5+.

---

## 📋 Required Reading

Before ANY code, read:
- ✅ `/specs/phase2-extension-spec.md` (complete technical spec)
- ✅ `fuck_work_structure.md` (directory layout)
- ✅ `branching_strategy.md` (Git workflow)
- ✅ `.cursor/rules/*` (ALL enforcement files)

---

## 🌳 Git Workflow

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/browser-extension

# Verify Phase 1 exists
ls apps/backend/authenticity_scoring/  # Should show scorer files
```

---

## 📦 12-Stage Implementation Plan

### **STAGE 1: Project Scaffolding** ⏱️ 1-2 hours

**Create directory structure:**
```bash
mkdir -p apps/browser_extension/{src/{background,content/extractors,popup,lib,types},icons,build}
```

**Files to create (in order):**

1. `apps/browser_extension/manifest.json`
2. `apps/browser_extension/package.json`
3. `apps/browser_extension/tsconfig.json`
4. `apps/browser_extension/webpack.config.js`
5. `apps/browser_extension/.eslintrc.json`

**Get content from:** `/specs/phase2-extension-spec.md` sections 9-10

**Test:**
```bash
cd apps/browser_extension
npm install
npm run build  # Should succeed
```

**Commit:**
```
feat: initialize browser extension project structure

- Manifest V3 configuration
- TypeScript + Webpack build system
- Directory structure created
- Dependencies installed
- Build verified
```

---

### **STAGE 2: Type Definitions** ⏱️ 30 minutes

**Files:**
1. `src/types/job-data.ts` - JobData interface (copy from spec section 2.1)
2. `src/types/api.ts` - API types (copy from spec section 2.2)
3. `src/types/platform.ts` - Platform types

**Test:**
```bash
npm run type-check  # Should pass
```

**Commit:**
```
feat: add TypeScript type definitions

- JobData interface matching Phase 1 Python schema
- API request/response types
- Platform type definitions
- Type-checking passes
```

---

### **STAGE 3: Utility Libraries** ⏱️ 1 hour

**Files:**
1. `src/lib/logger.ts` - Logging utility
2. `src/lib/api-client.ts` - Backend API client (from spec section 7)
3. `src/lib/storage.ts` - Chrome storage wrapper

**Test:**
```bash
npm run build  # Should include lib files
```

**Commit:**
```
feat: add utility libraries

- Logger with debug/log/warn/error
- ApiClient for backend communication (localhost:5123)
- Storage wrapper for chrome.storage.local
- Type-safe utilities ready for use
```

---

### **STAGE 4: Platform Detector** ⏱️ 30 minutes

**File:**
1. `src/content/platform-detector.ts` (from spec section 3.1)

**Methods:**
- `static detect(): Platform` - Detect current platform
- `static isJobPage(): boolean` - Check if on job page

**Commit:**
```
feat: add platform detection logic

- Detects LinkedIn, Indeed, Glassdoor, YC, GitHub
- Validates job page vs other pages
- Returns 'Other' for unsupported platforms
```

---

### **STAGE 5: Base Extractor** ⏱️ 1 hour

**File:**
1. `src/content/extractors/base-extractor.ts` (from spec section 3.2)

**Key utilities:**
- `extractText(selector)` - Safe DOM text extraction
- `extractAttr(selector, attr)` - Safe attribute extraction
- `parseDaysAgo(text)` - Parse "X days ago"
- `parseApplicantCount(text)` - Parse "X applicants"
- `generateJobId(url)` - Generate unique ID

**Commit:**
```
feat: add BaseExtractor with DOM utilities

- Safe extraction methods with error handling
- Date/number parsing utilities
- Job ID generation
- Foundation for platform extractors
```

---

### **STAGE 6: LinkedIn Extractor** ⭐ ⏱️ 3-4 hours

**File:**
1. `src/content/extractors/linkedin.ts` (from spec section 4.1)

**Critical selectors (LinkedIn DOM as of Dec 2025):**
```typescript
jobTitle: '.job-details-jobs-unified-top-card__job-title'
companyName: '.job-details-jobs-unified-top-card__company-name'
jobDescription: '.jobs-description__content'
postedDate: '.jobs-unified-top-card__posted-date'
applicantCount: '.jobs-unified-top-card__applicant-count'
```

**Must extract:**
- P0: title, company_name, location, jd_text, url, platform ✅
- P1: posted_days_ago, applicants_count, easy_apply, tags ✅
- P2: poster_info (if visible) ⚠️
- P3: Set to null: account_age_months, company_size, glassdoor_rating ❌

**Testing:**
Visit 5 real LinkedIn jobs, extract data, inspect in console:
```javascript
const extractor = new LinkedInExtractor();
const data = extractor.extract();
console.log(data);  // Verify all P0/P1 fields present
```

**Commit:**
```
feat: implement LinkedIn job data extractor

- Extracts all required fields from LinkedIn jobs
- Multiple fallback selectors for robustness
- Handles React hydration delays
- Graceful handling of missing poster/company data
- Tested on 5 real LinkedIn jobs

Extraction accuracy: P0=100%, P1=85%
```

---

### **STAGE 7: UI Injector** ⏱️ 2-3 hours

**File:**
1. `src/content/ui-injector.ts` (from spec section 5.2)

**Must implement:**
- `inject()` - Add "Score This Job" button to page
- `onScoreClick(callback)` - Handle button clicks
- `showLoading()` - Show loading state
- `showResults(result)` - Display score + red flags
- `showError(message)` - Display errors

**Button design:**
- Blue background (#2563eb)
- White text
- "🎯 Score This Job"
- Appears near job title

**Results overlay design:**
- Fixed position (top-right)
- Score prominently displayed (48px)
- Color-coded (green >80, orange 55-79, red <55)
- Red flags list
- Close button

**Testing:**
1. Button appears on LinkedIn job page
2. Button styled correctly
3. Click shows loading state
4. Results overlay appears
5. Close button works

**Commit:**
```
feat: implement UI injection

- Score button injection with platform-specific placement
- Loading states during scoring
- Results overlay with score/confidence/red flags
- Color-coded scoring display
- Responsive design
- Close button functionality
```

---

### **STAGE 8: Content Script Main** ⏱️ 2 hours

**File:**
1. `src/content/index.ts` (from spec section 5.1)
2. `src/content/extractors/index.ts` - Extractor factory

**Flow:**
1. Detect platform
2. Check if job page
3. Wait for content to load
4. Inject UI button
5. On click: extract → send to background

**Critical:** Handle React hydration - wait for DOM to be ready.

**Commit:**
```
feat: integrate content script components

- Platform detection on load
- Dynamic content waiting (React hydration)
- UI injection orchestration
- Click handler wiring
- ExtractorFactory for multi-platform support

End-to-end content script flow complete.
```

---

### **STAGE 9: Background Service Worker** ⏱️ 1-2 hours

**File:**
1. `src/background/service-worker.ts` (from spec section 6)

**Message handlers:**
- `SCORE_JOB` - Forward to backend API
- `HEALTH_CHECK` - Check backend status

**Critical:** Async message handling (return `true` from listener).

**Commit:**
```
feat: implement background service worker

- Message routing from content scripts
- Backend API integration
- Storage management
- Error handling
- Health check support
```

---

### **STAGE 10: Backend API Endpoints** ⏱️ 2-3 hours

**File:**
1. `apps/backend/main.py` (from spec section 8)

**Endpoints:**
- `POST /api/score-job`
- `GET /api/health`

**Critical:**
- CORS must allow extension origin
- Pydantic models must match TypeScript interfaces
- Integrate Phase 1 scorer correctly

**Test with curl:**
```bash
curl http://localhost:5123/api/health
# Should return: {"status": "ok", ...}
```

**Commit:**
```
feat: add FastAPI backend for extension

- POST /api/score-job endpoint
- GET /api/health endpoint
- CORS configured for extension
- Pydantic models for validation
- Phase 1 scorer integration

Tested with curl, returns correct results.
```

---

### **STAGE 11: End-to-End Integration** ⏱️ 3-4 hours

**Objective:** Test complete flow and fix integration issues

**Steps:**
1. Start backend: `uvicorn apps.backend.main:app --port 5123`
2. Build extension: `cd apps/browser_extension && npm run build`
3. Load in Chrome: chrome://extensions → Load unpacked → select `build/`
4. Visit LinkedIn job page
5. Click "Score This Job"
6. Verify results appear

**Expected issues to debug:**
- CORS headers
- JobData serialization
- Selector failures
- Timing issues

**Fix all issues, test on 5 different LinkedIn jobs.**

**Commit:**
```
feat: complete end-to-end integration

- Extension extracts LinkedIn data
- Background sends to API
- API scores and returns
- UI displays results

Tested on 5 LinkedIn jobs:
- Avg latency: 1.2s
- Extraction accuracy: 85%
- No crashes

Phase 2 MVP functional.
```

---

### **STAGE 12: Popup UI** ⏱️ 1-2 hours

**Files:**
1. `src/popup/popup.html`
2. `src/popup/popup.ts`
3. `src/popup/popup.css`

**Features:**
- Backend status indicator
- Jobs scored today count
- Clear history button

**Commit:**
```
feat: add extension popup UI

- Backend health check display
- Scoring statistics
- Clean minimal design

Popup complete, Phase 2 MVP done.
```

---

## ✅ Acceptance Criteria Checklist

Before creating PR, verify:

- [ ] Extension loads without errors
- [ ] Button appears on LinkedIn jobs
- [ ] Click extracts data correctly
- [ ] Data sends to backend successfully
- [ ] Results display in UI
- [ ] Tested on 5+ real jobs
- [ ] No console errors
- [ ] Build succeeds
- [ ] Type-check passes
- [ ] Lint passes

---

## 🎯 Success Metrics

**MVP success when:**
- Works on LinkedIn ✅
- Extracts 80%+ of visible fields ✅
- Scoring latency <3 seconds ✅
- No crashes on test pages ✅
- UI displays correctly ✅

---

**Status:** 🟢 Ready to Begin  
**Next:** Create feature branch and start Stage 1

**Begin Phase 2 implementation.** 🚀
