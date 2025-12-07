# Job Application Orchestration System - Master Plan

**Version:** 1.0  
**Date:** December 7, 2025  
**Project Codename:** Fuckwork

---

## Executive Summary

Fuckwork is a **local-first, privacy-focused job application orchestration system** designed to solve the core pain points of modern job searching: filtering fake/low-intent job postings, intelligent job-resume matching, and semi-automated application workflows.

**Key Innovation:** Unlike existing tools (Simplify, Jobscan, Teal) that focus on form-filling or tracking, Fuckwork acts as the "brain" of the job search process - filtering garbage, scoring authenticity, matching opportunities to the right resume, and coordinating with existing autofill tools.

**Architecture:** Browser Extension + Local Desktop Application (hybrid approach)

**Philosophy:** User-in-the-loop semi-automation, not 24/7 bot spam. Protect the user's time, attention, and account safety.

---

## Problem Statement

### Primary Pain Points (Prioritized)

1. **Fake/Low-Intent Job Waste (70% of pain)**
   - External recruiters/body shops collecting resumes
   - Evergreen postings that aren't really hiring
   - Stale jobs open for months with no real intent
   - Ghost roles decided internally

2. **Manual Application Overhead (20% of pain)**
   - Even with autofill, still need to:
     - Open each job individually
     - Read and evaluate manually
     - Choose resume version
     - Decide on cover letter
     - Track what was applied to
   - 2+ hours per day for 30-50 applications

3. **Poor Signal-to-Noise Ratio (10% of pain)**
   - Hard to distinguish "worth applying" vs "waste of time"
   - No consistent framework for evaluation
   - Gut-feeling decisions at 1am lead to poor choices

### Current Workflow Problems

**Typical Evening Session:**
- Browse LinkedIn/Indeed/other platforms
- Open 10-30 tabs of potentially relevant jobs
- Manually evaluate each for authenticity and fit
- Choose resume version and generate cover letter per job
- Fill forms (with Simplify help)
- Inconsistent tracking
- **Result:** Mental exhaustion, inconsistent quality, wasted applications

---

## Target User

### Primary User Profile
- **Who:** International CS students / new grads / early career engineers
- **Context:** Actively job searching across multiple platforms
- **Pain:** Overwhelmed by volume, struggling to identify quality opportunities
- **Tech Comfort:** High (comfortable with browser extensions, local apps, CLIs)
- **Platforms Used:** LinkedIn, Indeed, Simplify, YC Jobs, Glassdoor, GitHub Jobs, Wellfound, company sites

### User's Current State
- Maintains 3-4 resume variants (Backend, Full-Stack/Mobile, ML/AI, Startup/Product)
- Uses Simplify for autofill
- Applies to 10-20 jobs daily, 30-50+ on weekends
- Stores resumes as PDFs
- Primary OS: macOS
- Strong Python skills, comfortable with TypeScript

---

## Core Objectives

### System Goals

1. **Filter First (A-Priority)**
   - Automatically identify and filter fake/low-intent/body-shop jobs
   - Provide explainable authenticity scores
   - Surface only realistic opportunities worth human attention

2. **Match Smart (A-Priority)**
   - Automatically match jobs to best-fit resume variant
   - Score match quality with explanations
   - Identify skill gaps and strengths

3. **Prepare Efficiently (B-Priority)**
   - Auto-select appropriate resume version
   - Generate targeted cover letter snippets
   - Pre-populate application data

4. **Coordinate Gracefully (B-Priority)**
   - Work with existing autofill tools (Simplify, etc.)
   - Maintain minimal local tracking
   - Support batch review workflow

5. **Stay Safe (Critical)**
   - Local-first processing (privacy)
   - User-in-the-loop (no aggressive automation)
   - Platform ToS compliant
   - No account risk

---

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER EXTENSION                        │
│  - Job data capture from current page                        │
│  - Inline UI (scores, flags, save button)                    │
│  - Duplicate detection                                       │
│  - Communication with local app                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ IPC / WebSocket
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  LOCAL DESKTOP APP                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Scoring Engine (Python)                    │ │
│  │  - Authenticity scoring (rules + embeddings)           │ │
│  │  - Match scoring (resume-JD similarity)                │ │
│  │  - Resume selection logic                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Application Orchestrator                   │ │
│  │  - Batch review interface                              │ │
│  │  - Cover letter generation (LLM)                       │ │
│  │  - Browser coordination                                │ │
│  │  - Queue management                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Local Data Store                           │ │
│  │  - SQLite database                                     │ │
│  │  - Resume variants (PDF)                               │ │
│  │  - Job queue & history                                 │ │
│  │  - Application tracking                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack Recommendations

**Browser Extension:**
- **Language:** TypeScript
- **Framework:** Manifest V3 (Chrome/Edge/Brave)
- **Storage:** chrome.storage.local
- **Communication:** Native messaging / WebSocket to local app

**Local Desktop Application:**
- **Backend:** Python 3.11+
  - Scoring engines, ML models, data processing
  - FastAPI for internal API (extension ↔ app communication)
- **Frontend:** Electron or Tauri
  - TypeScript/React for UI
  - Better integration with Python backend
- **Recommendation:** **Tauri** (lighter, more modern, better security)

**ML/NLP Stack:**
- **Embeddings:** sentence-transformers (all-MiniLM-L6-v2 or bge-small)
- **PDF Parsing:** PyPDF2 or pdfplumber
- **Text Processing:** spaCy (lightweight) or pure regex
- **LLM (Optional):** OpenAI/Claude API for cover letters only

**Data Storage:**
- **Primary:** SQLite (local, zero-config, sufficient for use case)
- **Alternative:** JSON files (simpler, but less query flexibility)

**Deployment:**
- **Extension:** Chrome Web Store (or manual install during development)
- **Desktop App:** Packaged executable (pyinstaller + Tauri bundler)

---

## Feature Breakdown & Implementation Priority

### Module A: Authenticity Scoring (CRITICAL - MVP)

**Purpose:** Filter fake/low-intent jobs before wasting time

**Key Signals to Detect:**

1. **Recruiter/Body Shop Indicators**
   - External recruiter posting (not direct company)
   - Generic consulting firm names
   - "Our client" language in JD
   - Suspicious contact domains
   - Recruiter profile analysis (new, empty, hiring everything)

2. **Staleness Indicators**
   - Posted date > 60 days
   - Reposted multiple times with minor changes
   - Abnormal applicant/view ratio
   - No recent updates

3. **Content Red Flags**
   - Extremely generic descriptions
   - Buzzword density ("rockstar ninja guru")
   - Unrealistic skill combinations
   - Junior role requiring 5+ years experience
   - No specific team/product/stack mentioned
   - Template-only language

4. **Company Context**
   - Recent layoffs (check layoffs.fyi API)
   - Poor Glassdoor ratings
   - Known problematic hiring patterns

**Technical Implementation:**

```python
# Authenticity Scoring Architecture (Pseudocode)

class AuthenticityScorer:
    def __init__(self):
        self.rules_engine = RulesEngine()
        self.embeddings_model = load_embedding_model()
        self.company_db = CompanyDatabase()
    
    def score_job(self, job_data):
        scores = {
            'recruiter_score': self.check_recruiter(job_data),
            'staleness_score': self.check_staleness(job_data),
            'content_score': self.check_content(job_data),
            'company_score': self.check_company(job_data)
        }
        
        # Weighted combination
        final_score = self.combine_scores(scores)
        explanation = self.generate_explanation(scores)
        
        return {
            'authenticity_score': final_score,  # 0-100
            'confidence': self.calculate_confidence(scores),
            'red_flags': self.extract_red_flags(scores),
            'explanation': explanation
        }
```

**Scoring Output:**
- **Score:** 0-100 (higher = more authentic)
- **Confidence:** Low/Medium/High
- **Red Flags:** List of specific issues detected
- **Explanation:** Human-readable reasoning

**Data Sources:**
- Job board HTML/metadata (from extension)
- LinkedIn/Indeed public API data (if available)
- Layoffs.fyi data (periodic scraping)
- Manual rules database (continuously refined)

**MVP Scope:**
- Focus on LinkedIn and Indeed patterns first
- Rule-based scoring (no ML initially)
- Embeddings for content similarity only
- Manual company database (small curated list)

---

### Module B: Job-Resume Matching (CRITICAL - MVP)

**Purpose:** Automatically select best-fit resume variant and score match quality

**Matching Strategy:**

1. **Parse Job Description**
   - Extract required skills
   - Extract optional/preferred skills
   - Identify role type (Backend, Full-Stack, ML, etc.)
   - Extract experience level
   - Extract key technologies

2. **Parse Resume Variants**
   - Extract skills from each PDF
   - Identify strength areas
   - Build skill embeddings

3. **Compute Match Score**
   - Required skill coverage (weighted heavily)
   - Optional skill coverage
   - Role type alignment
   - Semantic similarity (embeddings)
   - Experience level fit

**Technical Implementation:**

```python
class ResumeMatchScorer:
    def __init__(self, resume_variants):
        self.resumes = self.load_resumes(resume_variants)
        self.embeddings_model = load_embedding_model()
    
    def score_match(self, job_data):
        jd_parsed = self.parse_jd(job_data['description'])
        
        matches = []
        for resume_id, resume in self.resumes.items():
            score = self.compute_match(jd_parsed, resume)
            matches.append({
                'resume_id': resume_id,
                'match_score': score['overall'],
                'required_coverage': score['required'],
                'optional_coverage': score['optional'],
                'missing_skills': score['gaps'],
                'strengths': score['strengths']
            })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            'best_match': matches[0],
            'all_matches': matches,
            'recommendation': self.generate_recommendation(matches[0])
        }
```

**Resume Data Model:**

```json
{
  "resume_id": "backend",
  "file_path": "/path/to/Resume_A_Backend.pdf",
  "parsed_text": "...",
  "skills": {
    "languages": ["Python", "Java", "SQL"],
    "frameworks": ["Django", "Spring Boot"],
    "cloud": ["AWS", "EC2"],
    "focus_areas": ["Backend", "Infrastructure", "Distributed Systems"]
  },
  "experience_level": "entry",
  "embedding": [0.123, 0.456, ...]
}
```

**Matching Output:**
- **Best Resume:** ID and reason
- **Match Score:** 0-100
- **Coverage:** Required (85%), Optional (60%)
- **Gaps:** Missing skills list
- **Strengths:** Skills that align strongly

**MVP Scope:**
- Simple keyword extraction + embeddings
- Manual skill taxonomy (refined over time)
- PDF text extraction (no advanced parsing)
- Four resume variants (hardcoded initially)

---

### Module C: Cover Letter Generation (MEDIUM - MVP)

**Purpose:** Generate short, targeted cover letter snippets

**Approach:** Cloud LLM (OpenAI/Claude API) with structured prompts

**Key Principles:**
- Short (2-3 paragraphs max)
- Specific to role and company
- Highlights relevant experience from selected resume
- Natural, not overly formal
- ESL-friendly language

**Technical Implementation:**

```python
class CoverLetterGenerator:
    def __init__(self, api_key):
        self.llm_client = OpenAI(api_key=api_key)
    
    def generate(self, job_data, resume_data, user_preferences):
        prompt = self.build_prompt(job_data, resume_data, user_preferences)
        
        response = self.llm_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a job application assistant..."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        cover_letter = response.choices[0].message.content
        
        return {
            'cover_letter': cover_letter,
            'length': len(cover_letter.split()),
            'style': user_preferences.get('style', 'professional')
        }
```

**Prompt Template:**

```
Generate a brief, professional cover letter paragraph (2-3 sentences) for:

Job Title: {title}
Company: {company}
Key Requirements: {requirements}

My Background:
{resume_highlights}

Style: {style_preference}

Focus on specific alignment between my experience and their needs. Keep it concise and natural.
```

**User Preferences:**
- Style: professional / casual / startup-friendly
- Length: short / medium / long
- Emphasis: technical skills / leadership / product focus

**MVP Scope:**
- Simple template-based generation
- User can edit before applying
- Optional feature (can skip for many applications)
- API key stored locally (not hardcoded)

---

### Module D: Autofill Integration (LOW - NOT MVP)

**Purpose:** Coordinate with existing autofill tools, not replace them

**Strategy:** **Do not build a full autofill engine**

**Integration Approach:**

**Phase 1 (MVP):**
- System opens job URL in browser
- User manually clicks Simplify/Jobright autofill button
- System provides clipboard data if needed

**Phase 2 (Future):**
- Pre-populate clipboard with structured data
- System can detect when autofill is complete
- Possible programmatic trigger (if Simplify exposes API)

**Why Not Build Autofill?**
- Simplify, Jobright, Huntr already solve this well
- High maintenance burden (ATS platforms change constantly)
- Legal/ToS risks
- Not core differentiator
- Better to focus on "brain" functions

**Coordination Mechanism:**

```python
class AutofillCoordinator:
    def prepare_for_apply(self, job_data, resume_data, cover_letter):
        # Open job URL in browser
        self.open_in_browser(job_data['url'])
        
        # Prepare clipboard data
        clipboard_data = {
            'resume_path': resume_data['file_path'],
            'cover_letter': cover_letter,
            'contact_info': self.user_profile
        }
        
        self.copy_to_clipboard(json.dumps(clipboard_data))
        
        # Log application attempt
        self.db.log_application_started(job_data['id'])
```

**MVP Scope:**
- Open URL only
- No programmatic autofill
- Manual Simplify usage
- Clipboard support optional

---

### Module E: Semi-Automated Application (CRITICAL - MVP UX)

**Purpose:** Batch review interface + controlled application workflow

**Key Principle:** User confirms each application (no 24/7 bot spam)

**Workflow:**

```
Daily Flow:
1. User browses jobs (LinkedIn, Indeed, etc.)
2. Extension captures jobs user views/saves
3. Background: System scores jobs (authenticity + match)
4. User opens desktop app → sees "Today's Queue: 17 jobs"
5. User reviews batch in list interface
6. For each job: Approve / Reject / Skip
7. System opens approved jobs + coordinates autofill
8. User completes applications with Simplify
9. System tracks results
```

**Batch Review UI (Desktop App):**

**List View:**
```
┌─────────────────────────────────────────────────────────────┐
│  Fuckwork - Today's Queue (17 jobs)                         │
│  [Filter: All | High Match | New] [Sort: Score | Date]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ▶ Software Engineer - Backend | Stripe                     │
│    Auth: 87 | Match: 92 | LinkedIn | 2h ago                │
│    Resume: Backend | Red Flags: None                        │
│                                                              │
│  ▼ Machine Learning Engineer | Anthropic ──────────────────┤
│    Auth: 95 | Match: 78 | Company Site | 5h ago           │
│    Resume: ML_AI                                           │
│    Required: Python, TensorFlow, ML deployment             │
│    Coverage: 80% (missing: distributed training)           │
│    Red Flags: None                                         │
│                                                             │
│    [Approve] [Reject] [Open in Browser] [Change Resume]    │
│                                                             │
│  ▶ Full Stack Developer | TechCorp                         │
│    Auth: 62 | Match: 71 | Indeed | 1d ago                 │
│    Resume: Fullstack_Mobile | Red Flags: 🚩 External recruiter
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**
- `↑/↓` - Navigate list
- `Enter` - Expand/collapse job
- `A` - Approve
- `X` - Reject
- `O` - Open in browser
- `R` - Switch resume
- `Space` - Quick approve + next

**Interaction Model:**
- See overview list (scrollable)
- Click to expand details
- Make decision (Approve/Reject)
- System auto-advances to next
- Return to list when done

**Similar to:** Email triage, GitHub PR review, task inbox processing

**Technical Implementation:**

```typescript
// Desktop App - Batch Review Component (React)

interface Job {
  id: string;
  title: string;
  company: string;
  platform: string;
  postedDate: string;
  authScore: number;
  matchScore: number;
  resumeId: string;
  redFlags: string[];
  url: string;
}

const BatchReview: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleApprove = (jobId: string) => {
    // Add to apply queue
    api.approveJob(jobId);
    // Move to next
    setSelectedIndex(prev => prev + 1);
  };

  const handleReject = (jobId: string) => {
    api.rejectJob(jobId);
    setSelectedIndex(prev => prev + 1);
  };

  const handleOpenInBrowser = (url: string) => {
    api.openURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') setSelectedIndex(prev => Math.min(prev + 1, jobs.length - 1));
      if (e.key === 'ArrowUp') setSelectedIndex(prev => Math.max(prev - 1, 0));
      if (e.key === 'a') handleApprove(jobs[selectedIndex].id);
      if (e.key === 'x') handleReject(jobs[selectedIndex].id);
      // ... more shortcuts
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, jobs]);

  return (
    <div className="batch-review">
      <Header count={jobs.length} />
      <JobList 
        jobs={jobs}
        selectedIndex={selectedIndex}
        expandedId={expandedId}
        onExpand={setExpandedId}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpen={handleOpenInBrowser}
      />
    </div>
  );
};
```

**MVP Scope:**
- Basic list view (no fancy animations)
- Expand/collapse per job
- Approve/Reject buttons
- Open in browser
- Keyboard navigation (high priority for UX)
- Local queue management

---

### Module F: Application Tracking (LOW - MVP)

**Purpose:** Maintain minimal local log of applications

**Tracking Needs:**
- What jobs applied to
- When applied
- Which resume used
- Current status
- Basic notes

**Data Model:**

```python
# SQLite Schema

CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    title TEXT,
    company TEXT,
    platform TEXT,
    url TEXT,
    posted_date TEXT,
    discovered_date TEXT,
    auth_score INTEGER,
    match_score INTEGER,
    red_flags TEXT,  -- JSON array
    status TEXT  -- queued, approved, applied, rejected, interview, closed
);

CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT,
    applied_date TEXT,
    resume_id TEXT,
    cover_letter TEXT,
    status TEXT,  -- submitted, viewed, rejected, interview, offer
    notes TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE resumes (
    id TEXT PRIMARY KEY,
    file_path TEXT,
    name TEXT,
    focus_area TEXT,
    last_updated TEXT
);
```

**Export Functionality:**
- CSV export (for Excel/Sheets)
- JSON export (for Notion/custom tools)
- Integration with Teal/Huntr (future)

**UI:**
- Simple table view in desktop app
- Filter by status
- Search by company/title
- Export button

**MVP Scope:**
- Basic SQLite database
- Manual status updates (not auto-detected)
- CSV export only
- No advanced analytics

---

## Conceptual Data Flow

### End-to-End User Journey

**Step 1: Job Discovery**
```
User browses LinkedIn → Extension detects job page
→ Captures: title, company, URL, posted_date, description, applicants
→ Sends to local app via IPC
```

**Step 2: Background Processing**
```
Local app receives job data
→ Authenticity scoring (rules + embeddings)
→ Match scoring (resume comparison)
→ Stores in SQLite with scores
→ Adds to "Today's Queue" if scores are high
```

**Step 3: Batch Review**
```
User opens desktop app
→ Sees list of queued jobs sorted by score
→ Expands job details
→ Reviews authenticity explanation, match details, cover letter
→ Clicks "Approve" or "Reject"
→ Approved jobs added to "Apply Queue"
```

**Step 4: Application Execution**
```
User clicks "Start Applying" in app
→ App opens first job URL in browser
→ User clicks Simplify autofill
→ User submits application
→ App logs completion and opens next job
→ Repeat until queue empty
```

**Step 5: Tracking**
```
App automatically logs:
- Job applied to
- Resume used
- Timestamp
User can later:
- Export to CSV
- Update status (rejected, interview, offer)
- Add notes
```

---

## Security & Privacy Considerations

### Data Privacy

**Principles:**
- **Local-first:** All data stored locally (no cloud sync by default)
- **User control:** User owns all data, can delete anytime
- **No telemetry:** No analytics or usage tracking (unless explicitly opt-in)
- **Encryption:** Consider encrypting resume files and sensitive data at rest

**Sensitive Data:**
- Resume PDFs
- Cover letters
- Personal contact info
- Application history

**Storage:**
- Local SQLite database
- File system (for PDFs)
- No cloud storage in MVP

### Platform Safety

**ToS Compliance:**
- **No aggressive automation:** User confirms each application
- **Rate limiting:** Natural human-like pace (not 100 apps/minute)
- **No credential storage:** Don't ask for LinkedIn/Indeed passwords
- **Respect robots.txt:** Extension only reads current page (no scraping)

**Account Safety:**
- User remains in control
- All actions attributable to user clicks
- No background bot behavior
- Extension doesn't manipulate DOM (just reads)

### API Security

**LLM API Keys:**
- Stored locally (encrypted)
- User provides own key
- Optional feature (can work without)

**Extension Permissions:**
- Minimal: `activeTab`, `storage`
- No broad host permissions
- No unnecessary data access

---

## Development Phases & Milestones

### Phase 0: Foundation (Week 1-2)

**Goals:**
- Set up development environment
- Design data models
- Create basic project structure

**Deliverables:**
- Project repo with structure
- SQLite schema
- Python environment with dependencies
- Basic Electron/Tauri shell

**Tasks:**
- [ ] Initialize Git repo
- [ ] Set up Python virtual environment
- [ ] Install dependencies (sentence-transformers, PyPDF2, FastAPI, etc.)
- [ ] Create SQLite database schema
- [ ] Set up Tauri project (or Electron)
- [ ] Create basic extension manifest

---

### Phase 1: Core Scoring Engine (Week 3-4)

**Goals:**
- Build authenticity scoring (Module A)
- Build match scoring (Module B)
- Test with real job data

**Deliverables:**
- Working authenticity scorer
- Working match scorer
- Test suite with sample jobs
- Resume parser

**Tasks:**
- [ ] Implement rules-based authenticity checks
- [ ] Integrate embedding model
- [ ] Build PDF resume parser
- [ ] Implement resume-JD matching logic
- [ ] Create scoring API endpoints
- [ ] Test with 50+ real job postings
- [ ] Refine scoring weights

**Validation:**
- Manually label 100 jobs (real vs fake)
- Test authenticity scorer accuracy
- Compare match scores to manual judgments

---

### Phase 2: Browser Extension (Week 5-6)

**Goals:**
- Capture job data from browser
- Display inline scores
- Save to queue

**Deliverables:**
- Working extension for Chrome
- LinkedIn and Indeed support
- Communication with local app

**Tasks:**
- [ ] Build content script for LinkedIn
- [ ] Build content script for Indeed
- [ ] Extract job data from page DOM
- [ ] Create popup UI (score display)
- [ ] Implement "Save to Queue" button
- [ ] Set up IPC with local app
- [ ] Add duplicate detection

**Validation:**
- Test on 20+ job pages
- Verify data extraction accuracy
- Test communication reliability

---

### Phase 3: Desktop App UI (Week 7-8)

**Goals:**
- Build batch review interface
- Implement keyboard shortcuts
- Queue management

**Deliverables:**
- Working desktop app with list view
- Approve/Reject workflow
- Job detail expansion
- Export functionality

**Tasks:**
- [ ] Design UI mockups
- [ ] Build list view component
- [ ] Implement expand/collapse
- [ ] Add keyboard navigation
- [ ] Create job detail view
- [ ] Implement approve/reject logic
- [ ] Build CSV export
- [ ] Add filtering/sorting

**Validation:**
- User test with 20-job queue
- Measure time to review 20 jobs
- Test keyboard shortcuts flow

---

### Phase 4: Cover Letter & Integration (Week 9-10)

**Goals:**
- Add cover letter generation
- Integrate with autofill workflow
- End-to-end testing

**Deliverables:**
- Cover letter generator
- Browser coordination
- Complete application flow

**Tasks:**
- [ ] Implement LLM integration
- [ ] Create cover letter templates
- [ ] Add user preference settings
- [ ] Build browser opening logic
- [ ] Test with Simplify
- [ ] Add application logging
- [ ] End-to-end workflow testing

**Validation:**
- Apply to 10 real jobs using system
- Measure time saved vs manual process
- Test cover letter quality

---

### Phase 5: Polish & Optimization (Week 11-12)

**Goals:**
- Bug fixes
- Performance optimization
- Documentation

**Deliverables:**
- Stable MVP
- User documentation
- Installation guide

**Tasks:**
- [ ] Fix bugs from testing
- [ ] Optimize scoring performance
- [ ] Improve UI responsiveness
- [ ] Write user guide
- [ ] Create video walkthrough
- [ ] Package for distribution
- [ ] Set up GitHub releases

**Validation:**
- Use daily for 1 week
- Collect feedback from 2-3 beta users
- Measure reliability

---

## Technical Challenges & Solutions

### Challenge 1: Accurate Authenticity Scoring

**Problem:** Job authenticity is subjective and context-dependent

**Solutions:**
- Start with high-confidence rules (external recruiter, obvious templates)
- Collect user feedback (thumbs up/down on scores)
- Continuously refine weights based on outcomes
- Show explanation (not just score) for transparency
- Allow manual override

**Fallback:** Conservative scoring (mark as "uncertain" rather than wrong guess)

---

### Challenge 2: Platform Diversity

**Problem:** LinkedIn, Indeed, Glassdoor, company sites all have different HTML structures

**Solutions:**
- Use flexible CSS selectors
- Multiple fallback strategies per platform
- Store platform-specific parsers
- Allow manual data entry if parsing fails
- Focus on most-used platforms first (LinkedIn, Indeed)

**Fallback:** User can manually input missing fields

---

### Challenge 3: Resume Parsing Accuracy

**Problem:** PDFs have varied formats, hard to extract skills reliably

**Solutions:**
- Use multiple parsing libraries (try PyPDF2, then pdfplumber)
- Manual skill list as fallback (user provides JSON)
- Pre-process: user can review parsed skills once
- Focus on keyword matching (not perfect NLP)
- Allow manual correction of parsed skills

**Fallback:** User maintains manual skill lists per resume

---

### Challenge 4: Autofill Coordination

**Problem:** Simplify doesn't have API, hard to programmatically trigger

**Solutions:**
- Don't try to trigger Simplify programmatically
- Just open URL and let user click Simplify
- Provide clipboard data for manual paste
- Focus on preparing data (not automating filling)

**Fallback:** Fully manual autofill (system just opens tab)

---

### Challenge 5: Rate Limiting & Performance

**Problem:** Scoring 100 jobs per day could be slow

**Solutions:**
- Async scoring (don't block UI)
- Cache embeddings (don't recompute)
- Batch process queued jobs (not real-time)
- Prioritize recent jobs (score latest first)
- Use lightweight models (all-MiniLM, not BERT-large)

**Fallback:** Process top 20 jobs per day only

---

## Future Expansion Possibilities

### Phase 2 Features (Post-MVP)

1. **Advanced Resume Variants**
   - Auto-generate resume variations
   - AI-powered bullet point rewriting
   - Dynamic section reordering

2. **Company Intelligence**
   - Pull Glassdoor reviews
   - Check Blind discussions
   - Layoff tracking integration
   - Engineering blog analysis

3. **Network Effects**
   - Anonymous job authenticity crowdsourcing
   - Share "known good" companies
   - Collective red flag database

4. **Advanced Matching**
   - Salary expectation matching
   - Visa sponsorship prediction
   - Culture fit analysis
   - Career trajectory alignment

5. **Multi-User Support**
   - Team job search (for bootcamp cohorts)
   - Shared company lists
   - Referral coordination

6. **Mobile App**
   - iOS/Android companion
   - Quick review on phone
   - Push notifications for new high-match jobs

7. **Analytics Dashboard**
   - Application funnel metrics
   - Response rate by company/role type
   - Time invested tracking
   - Interview conversion rates

8. **Auto-Response Detection**
   - Monitor email for rejections/interviews
   - Auto-update application status
   - Set follow-up reminders

---

## Success Metrics

### MVP Success Criteria

**Efficiency Gains:**
- **Time saved:** Reduce 2-hour application session to <45 minutes
- **Quality:** 80%+ of reviewed jobs feel "worth applying to"
- **Accuracy:** Authenticity scores align with user judgment 75%+ of time

**User Experience:**
- **Ease of use:** New user can complete workflow in <10 minutes
- **Reliability:** <5% failure rate in data capture/scoring
- **Satisfaction:** User prefers system over manual process

**Technical:**
- **Performance:** Score a job in <5 seconds
- **Stability:** No crashes during 1-week daily use
- **Compatibility:** Works on Chrome, Edge, Brave

### Long-Term Goals

- Save job seekers 50+ hours over a 3-month search
- Improve application quality (higher response rate)
- Reduce emotional fatigue (less time on fake jobs)
- Build a sustainable open-source tool for job seekers

---

## Risk Assessment & Mitigation

### Risk 1: Platform Terms of Service Violations

**Likelihood:** Medium  
**Impact:** High (account bans)

**Mitigation:**
- User-in-the-loop design (no autonomous bot)
- Read-only extension (no DOM manipulation)
- Natural pacing (no rapid-fire submissions)
- Clear user guidelines
- No credential storage

---

### Risk 2: Scoring Accuracy Too Low

**Likelihood:** Medium  
**Impact:** Medium (user loses trust)

**Mitigation:**
- Conservative scoring (prefer "uncertain" to "wrong")
- Show explanations (user can judge)
- Quick feedback loop (thumbs up/down)
- Continuous refinement
- Manual override always available

---

### Risk 3: Maintenance Burden (Platform Changes)

**Likelihood:** High  
**Impact:** Medium (broken parsers)

**Mitigation:**
- Flexible parsing strategies
- Graceful degradation (manual fallback)
- Community contributions (open source)
- Focus on major platforms only
- Version compatibility tracking

---

### Risk 4: User Adoption (Too Complex)

**Likelihood:** Medium  
**Impact:** High (product failure)

**Mitigation:**
- Simple MVP (fewer features, more polish)
- Video walkthrough
- Clear value proposition
- Iterative UX testing
- Progressive disclosure (advanced features hidden)

---

### Risk 5: Dependency on External APIs

**Likelihood:** Low  
**Impact:** Medium (cover letters break)

**Mitigation:**
- Make LLM features optional
- Support multiple LLM providers
- Fallback to templates
- Local LLM option (Ollama)
- Cache common cover letters

---

## Open Questions & Decisions Needed

### Technical Decisions

1. **Tauri vs Electron?**
   - Recommendation: **Tauri** (lighter, more secure, better Python integration)
   - Trade-off: Smaller ecosystem, newer framework

2. **Embedding Model?**
   - Recommendation: **all-MiniLM-L6-v2** (fast, good quality, small)
   - Alternative: bge-small-en-v1.5

3. **Database?**
   - Recommendation: **SQLite** (simple, local, zero-config)
   - Alternative: JSON files (simpler but less queryable)

4. **Extension Manifest?**
   - Recommendation: **Manifest V3** (future-proof)
   - Trade-off: More restrictive than V2

### Product Decisions

1. **Freemium vs Open Source?**
   - Recommendation: **Open source** (community, transparency, trust)
   - Monetization: Donations, consulting, enterprise features

2. **Cover Letter: Required or Optional?**
   - Recommendation: **Optional** (many jobs don't need it)
   - User can toggle per application

3. **Desktop App: Always Running?**
   - Recommendation: **On-demand** (launch when needed, not background daemon)
   - Trade-off: Can't do real-time scoring while browsing

4. **Beta Testing Strategy?**
   - Recommendation: **Private beta with 3-5 users first**
   - Then gradual expansion

---

## Conclusion & Next Steps

### Summary

Fuckwork is a **technically feasible, high-impact project** that solves real pain points in modern job searching. By focusing on the "brain" (filtering, scoring, matching) rather than reinventing autofill, it occupies a unique position in the market.

**Key Differentiators:**
- Authenticity scoring (no one does this well)
- Local-first, privacy-focused
- User-in-the-loop (not aggressive bot)
- Integrates with existing tools
- Open source potential

**Realistic MVP Timeline:** 10-12 weeks (part-time)

**Main Technical Challenges:** Platform diversity, scoring accuracy, autofill coordination

**Success Depends On:** Good authenticity scoring, smooth UX, user trust

---

### Immediate Next Steps

**Week 1 Actions:**

1. **Set up development environment**
   - [ ] Create Git repo
   - [ ] Set up Python environment
   - [ ] Install dependencies
   - [ ] Create SQLite schema

2. **Collect sample data**
   - [ ] Save 50 real job postings (25 good, 25 suspicious)
   - [ ] Save your 4 resume PDFs
   - [ ] Document red flags you notice

3. **Build prototype scorer**
   - [ ] Implement 3-5 basic authenticity rules
   - [ ] Test on sample jobs
   - [ ] Measure accuracy

4. **Design key UI mockups**
   - [ ] Batch review list view
   - [ ] Job detail expansion
   - [ ] Extension popup

5. **Create project roadmap**
   - [ ] Break down into weekly sprints
   - [ ] Identify blockers
   - [ ] Set milestones

---

## Appendix: References & Resources

### Existing Tools (For Comparison)

- **Simplify:** Autofill + tracking
- **Jobscan:** Resume-JD matching
- **Teal:** Job tracking + career tools
- **Jobright:** AI job copilot
- **Huntr:** Job tracker + autofill

### Technical Resources

- **sentence-transformers:** https://www.sbert.net/
- **Tauri:** https://tauri.app/
- **PyPDF2:** https://pypdf2.readthedocs.io/
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **FastAPI:** https://fastapi.tiangolo.com/

### Datasets & APIs

- **Layoffs.fyi:** Public layoff data
- **Glassdoor API:** Company reviews (if available)
- **LinkedIn Public API:** Job postings (limited)
- **Indeed API:** Job search (limited)

---

**END OF MASTER PLAN**

---

## Feedback & Iteration

This master plan is a living document. As development progresses, update sections based on:
- Technical discoveries
- User feedback
- Market changes
- New priorities

**Version History:**
- v1.0 (Dec 7, 2025): Initial master plan based on user interviews and requirements gathering

---

**Ready to build? Let's go! 🚀**
