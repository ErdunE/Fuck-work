# Phase 2: Browser Extension Data Capture System - Engineering Specification

**Version:** 1.0  
**Last Updated:** December 8, 2025  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Phase 2 Core Module  
**Dependencies:** Phase 1 (Authenticity Scoring Engine) ✅ Complete

---

## Overview

The Browser Extension is the **data ingestion layer** for FuckWork. It captures job posting data from multiple platforms (LinkedIn, Indeed, Glassdoor, YC Jobs, GitHub, etc.) and sends it to the local backend for authenticity scoring.

**Goal:** Provide a seamless, one-click way to score any job posting the user is viewing in their browser.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Chrome/Edge/Brave)              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Job Platform Page                         │ │
│  │  (LinkedIn/Indeed/Glassdoor/YC/GitHub)               │ │
│  └────────────────┬──────────────────────────────────────┘ │
│                   │                                         │
│  ┌────────────────▼──────────────────────────────────────┐ │
│  │         Content Script (Injected)                      │ │
│  │  - Detects platform                                   │ │
│  │  - Extracts job data from DOM                         │ │
│  │  - Injects "Score This Job" button                    │ │
│  └────────────────┬──────────────────────────────────────┘ │
│                   │                                         │
│  ┌────────────────▼──────────────────────────────────────┐ │
│  │         Background Service Worker                      │ │
│  │  - Receives job data from content script              │ │
│  │  - Sends to local backend API                         │ │
│  │  - Manages extension state                            │ │
│  └────────────────┬──────────────────────────────────────┘ │
│                   │                                         │
│  ┌────────────────▼──────────────────────────────────────┐ │
│  │              Popup UI                                  │ │
│  │  - Shows scoring results                              │ │
│  │  - Displays red flags                                 │ │
│  │  - "Save to Queue" button                             │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST
                              │
┌─────────────────────────────▼───────────────────────────────┐
│               LOCAL BACKEND (Python FastAPI)                │
│                                                             │
│  POST /api/score-job → AuthenticityScorer                 │
│  GET  /api/health    → Health check                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Extension Structure

### File Layout

```
apps/browser_extension/
├── manifest.json                   # Manifest V3 configuration
├── package.json                    # Build tooling
├── tsconfig.json                   # TypeScript config
├── webpack.config.js               # Bundler config
│
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Background service worker
│   │
│   ├── content/
│   │   ├── index.ts               # Content script entry point
│   │   ├── platform-detector.ts   # Detect which platform we're on
│   │   ├── extractors/
│   │   │   ├── base-extractor.ts  # Base class for platform extractors
│   │   │   ├── linkedin.ts        # LinkedIn job data extractor
│   │   │   ├── indeed.ts          # Indeed job data extractor
│   │   │   ├── glassdoor.ts       # Glassdoor job data extractor
│   │   │   ├── ycombinator.ts     # YC Jobs extractor
│   │   │   ├── github.ts          # GitHub job lists extractor
│   │   │   └── index.ts           # Extractor factory
│   │   └── ui-injector.ts         # Inject "Score This Job" button
│   │
│   ├── popup/
│   │   ├── popup.html             # Extension popup UI
│   │   ├── popup.ts               # Popup logic
│   │   └── popup.css              # Popup styles
│   │
│   ├── lib/
│   │   ├── api-client.ts          # Backend API communication
│   │   ├── storage.ts             # Chrome storage wrapper
│   │   └── logger.ts              # Logging utility
│   │
│   └── types/
│       ├── job-data.ts            # TypeScript interface for JobData
│       ├── platform.ts            # Platform type definitions
│       └── api.ts                 # API request/response types
│
├── build/                          # Build output (gitignored)
└── dist/                           # Distribution package (gitignored)
```

---

## 2. Data Contracts

### 2.1 JobData Interface (Matches Phase 1)

**File:** `src/types/job-data.ts`

```typescript
/**
 * Complete job data structure for authenticity scoring.
 * 
 * This MUST match the Python JobData schema from Phase 1.
 */
export interface JobData {
  // Core identifiers
  job_id: string;
  title: string;
  company_name: string;
  platform: Platform;
  location: string;
  url: string;
  
  // Job description
  jd_text: string;
  
  // Poster information (LinkedIn/Indeed profile data)
  poster_info: {
    name: string;
    title: string;
    company: string;
    location: string;
    account_age_months: number | null;
    recent_job_count_7d: number | null;
  } | null;
  
  // Company metadata
  company_info: {
    website_domain: string | null;
    domain_matches_name: boolean;
    size_employees: number | null;
    glassdoor_rating: number | null;
    has_layoffs_recent: boolean;
  } | null;
  
  // Platform metadata
  platform_metadata: {
    posted_days_ago: number;
    repost_count: number;
    applicants_count: number | null;
    views_count: number | null;
    actively_hiring_tag: boolean;
    easy_apply: boolean;
  };
  
  // Derived signals (computed by extension)
  derived_signals: {
    company_domain_mismatch: boolean;
    poster_no_company: boolean;
    poster_job_location_mismatch: boolean;
    company_poster_mismatch: boolean;
    no_poster_identity: boolean;
  };
}

export type Platform = 
  | 'LinkedIn' 
  | 'Indeed' 
  | 'Glassdoor' 
  | 'YC Jobs' 
  | 'GitHub' 
  | 'Wellfound'
  | 'Hired'
  | 'Company Site'
  | 'Other';
```

### 2.2 Backend API Contract

**File:** `src/types/api.ts`

```typescript
/**
 * API request/response types for communication with local backend.
 */

export interface ScoreJobRequest {
  job_data: JobData;
}

export interface ScoreJobResponse {
  authenticity_score: number;
  level: 'likely real' | 'uncertain' | 'likely fake';
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  red_flags: string[];
  positive_signals: string[];
  activated_rules: Array<{
    id: string;
    weight: number;
    confidence: string;
  }>;
  computed_at: string;
}

export interface HealthCheckResponse {
  status: 'ok';
  version: string;
  scorer_loaded: boolean;
}

export interface ApiError {
  error: string;
  detail?: string;
}
```

---

## 3. Platform Detection & Extraction

### 3.1 Platform Detector

**File:** `src/content/platform-detector.ts`

```typescript
export type Platform = 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'YC Jobs' | 'GitHub' | 'Other';

export class PlatformDetector {
  /**
   * Detect which job platform we're currently on.
   */
  static detect(): Platform {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('linkedin.com') && pathname.includes('/jobs/')) {
      return 'LinkedIn';
    }
    
    if (hostname.includes('indeed.com')) {
      return 'Indeed';
    }
    
    if (hostname.includes('glassdoor.com') && pathname.includes('/job')) {
      return 'Glassdoor';
    }
    
    if (hostname.includes('ycombinator.com') && pathname.includes('/jobs')) {
      return 'YC Jobs';
    }
    
    if (hostname.includes('github.com') && 
        (pathname.includes('College-Jobs') || pathname.includes('AI-College-Jobs'))) {
      return 'GitHub';
    }
    
    if (hostname.includes('wellfound.com')) {
      return 'Wellfound';
    }
    
    if (hostname.includes('hired.com')) {
      return 'Hired';
    }
    
    return 'Other';
  }
  
  /**
   * Check if current page is a job posting page.
   */
  static isJobPage(): boolean {
    const platform = this.detect();
    
    if (platform === 'LinkedIn') {
      return document.querySelector('.jobs-details') !== null;
    }
    
    if (platform === 'Indeed') {
      return document.querySelector('.jobsearch-JobComponent') !== null;
    }
    
    // Add checks for other platforms
    
    return false;
  }
}
```

### 3.2 Base Extractor Interface

**File:** `src/content/extractors/base-extractor.ts`

```typescript
import { JobData } from '../../types/job-data';

/**
 * Base interface for platform-specific job data extractors.
 */
export interface IJobExtractor {
  /**
   * Extract complete job data from current page.
   */
  extract(): Partial<JobData>;
  
  /**
   * Validate that we're on a valid job page for this platform.
   */
  canExtract(): boolean;
  
  /**
   * Get the platform name.
   */
  getPlatform(): string;
}

/**
 * Base extractor with common utility methods.
 */
export abstract class BaseExtractor implements IJobExtractor {
  abstract extract(): Partial<JobData>;
  abstract canExtract(): boolean;
  abstract getPlatform(): string;
  
  /**
   * Safely extract text from selector.
   */
  protected extractText(selector: string): string | null {
    try {
      const element = document.querySelector(selector);
      return element?.textContent?.trim() || null;
    } catch (e) {
      console.warn(`Failed to extract text from ${selector}:`, e);
      return null;
    }
  }
  
  /**
   * Safely extract attribute from selector.
   */
  protected extractAttr(selector: string, attr: string): string | null {
    try {
      const element = document.querySelector(selector);
      return element?.getAttribute(attr) || null;
    } catch (e) {
      console.warn(`Failed to extract ${attr} from ${selector}:`, e);
      return null;
    }
  }
  
  /**
   * Extract all text from multiple matching elements.
   */
  protected extractAllText(selector: string): string {
    try {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements)
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join('\n');
    } catch (e) {
      console.warn(`Failed to extract all text from ${selector}:`, e);
      return '';
    }
  }
  
  /**
   * Parse "X days ago" or "X weeks ago" to number of days.
   */
  protected parseDaysAgo(text: string | null): number {
    if (!text) return 0;
    
    const match = text.match(/(\d+)\s*(day|week|month|hour)/i);
    if (!match) return 0;
    
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('hour')) return 0;
    if (unit.startsWith('day')) return num;
    if (unit.startsWith('week')) return num * 7;
    if (unit.startsWith('month')) return num * 30;
    
    return 0;
  }
  
  /**
   * Parse "X applicants" to number.
   */
  protected parseApplicantCount(text: string | null): number | null {
    if (!text) return null;
    
    const match = text.match(/(\d+)\s*applicant/i);
    return match ? parseInt(match[1]) : null;
  }
  
  /**
   * Generate unique job ID from URL.
   */
  protected generateJobId(url: string): string {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const match = path.match(/\d+/);
    return match ? `job_${match[0]}` : `job_${Date.now()}`;
  }
}
```

---

## 4. Platform-Specific Extractors

### 4.1 LinkedIn Extractor Specification

**File:** `src/content/extractors/linkedin.ts`

**Critical DOM Selectors (as of Dec 2025):**

```typescript
export class LinkedInExtractor extends BaseExtractor {
  private selectors = {
    // Core job info
    jobTitle: '.job-details-jobs-unified-top-card__job-title',
    companyName: '.job-details-jobs-unified-top-card__company-name',
    location: '.job-details-jobs-unified-top-card__bullet',
    
    // Job description
    jobDescription: '.jobs-description__content',
    
    // Metadata
    postedDate: '.jobs-unified-top-card__posted-date',
    applicantCount: '.jobs-unified-top-card__applicant-count',
    
    // Poster info
    posterName: '.job-details-jobs-unified-top-card__primary-description-container a',
    posterTitle: '.jobs-poster__name',
    posterCompany: '.jobs-poster__company-name',
    
    // Company info
    companyLink: '.job-details-jobs-unified-top-card__company-name a',
    
    // Tags
    easyApplyTag: '.jobs-apply-button--easy-apply',
    activelyHiringTag: '.jobs-unified-top-card__subtitle-secondary-grouping',
  };
  
  getPlatform(): string {
    return 'LinkedIn';
  }
  
  canExtract(): boolean {
    return document.querySelector(this.selectors.jobTitle) !== null;
  }
  
  extract(): Partial<JobData> {
    const title = this.extractText(this.selectors.jobTitle) || 'Unknown';
    const company_name = this.extractText(this.selectors.companyName) || 'Unknown';
    const location = this.extractText(this.selectors.location) || 'Unknown';
    const jd_text = this.extractText(this.selectors.jobDescription) || '';
    const url = window.location.href;
    const job_id = this.generateJobId(url);
    
    // Extract metadata
    const postedDateText = this.extractText(this.selectors.postedDate);
    const posted_days_ago = this.parseDaysAgo(postedDateText);
    
    const applicantText = this.extractText(this.selectors.applicantCount);
    const applicants_count = this.parseApplicantCount(applicantText);
    
    const easy_apply = document.querySelector(this.selectors.easyApplyTag) !== null;
    const actively_hiring_tag = this.extractText(this.selectors.activelyHiringTag)?.includes('Actively') || false;
    
    // Extract poster info
    const poster_name = this.extractText(this.selectors.posterName);
    const poster_title = this.extractText(this.selectors.posterTitle);
    
    // Extract company website
    const companyLinkHref = this.extractAttr(this.selectors.companyLink, 'href');
    const website_domain = this.extractDomainFromCompanyLink(companyLinkHref);
    
    return {
      job_id,
      title,
      company_name,
      platform: 'LinkedIn',
      location,
      url,
      jd_text,
      poster_info: poster_name ? {
        name: poster_name,
        title: poster_title || '',
        company: company_name,
        location: location,
        account_age_months: null,  // Not easily accessible
        recent_job_count_7d: null,  // Requires additional scraping
      } : null,
      company_info: {
        website_domain,
        domain_matches_name: this.checkDomainMatch(company_name, website_domain),
        size_employees: null,  // Requires company page scraping
        glassdoor_rating: null,  // External API needed
        has_layoffs_recent: false,  // External API needed
      },
      platform_metadata: {
        posted_days_ago,
        repost_count: 0,  // Not accessible
        applicants_count,
        views_count: null,  // Not accessible
        actively_hiring_tag,
        easy_apply,
      },
      derived_signals: {
        company_domain_mismatch: !this.checkDomainMatch(company_name, website_domain),
        poster_no_company: !poster_name,
        poster_job_location_mismatch: false,  // Requires geolocation logic
        company_poster_mismatch: false,  // Requires comparison logic
        no_poster_identity: !poster_name,
      },
    };
  }
  
  private extractDomainFromCompanyLink(href: string | null): string | null {
    if (!href) return null;
    try {
      // LinkedIn company links are like /company/google/
      const match = href.match(/\/company\/([^/]+)/);
      if (match) return `${match[1]}.com`;  // Approximate
      return null;
    } catch (e) {
      return null;
    }
  }
  
  private checkDomainMatch(companyName: string, domain: string | null): boolean {
    if (!domain) return false;
    const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDomain = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanDomain.includes(cleanCompany) || cleanCompany.includes(cleanDomain);
  }
}
```

**Key LinkedIn Extraction Challenges:**
1. **Dynamic content:** LinkedIn uses React hydration - DOM may not be ready immediately
2. **Poster info:** Limited without visiting poster's profile
3. **Company size:** Requires separate company page visit
4. **Account age:** Not visible on job page

**MVP Strategy:** Extract what's visible on job page, leave complex fields as `null`.

---

### 4.2 Indeed Extractor Specification

**File:** `src/content/extractors/indeed.ts`

```typescript
export class IndeedExtractor extends BaseExtractor {
  private selectors = {
    jobTitle: '.jobsearch-JobInfoHeader-title',
    companyName: '[data-company-name="true"]',
    location: '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
    jobDescription: '#jobDescriptionText',
    postedDate: '.jobsearch-JobMetadataFooter',
    // Indeed has different structure than LinkedIn
  };
  
  getPlatform(): string {
    return 'Indeed';
  }
  
  canExtract(): boolean {
    return document.querySelector(this.selectors.jobTitle) !== null;
  }
  
  extract(): Partial<JobData> {
    // Similar to LinkedIn but with Indeed-specific selectors
    // ...implementation details
  }
}
```

---

### 4.3 GitHub Job Lists Extractor

**Challenge:** GitHub job lists are **Markdown tables**, not traditional job boards.

**Example URLs:**
- `https://github.com/speedyapply/2026-SWE-College-Jobs`
- `https://github.com/speedyapply/2026-AI-College-Jobs`

**Approach:**
```typescript
export class GitHubExtractor extends BaseExtractor {
  getPlatform(): string {
    return 'GitHub';
  }
  
  canExtract(): boolean {
    // Check if we're on a job list README
    return window.location.pathname.includes('College-Jobs') &&
           document.querySelector('.markdown-body table') !== null;
  }
  
  extract(): Partial<JobData> {
    // GitHub requires different approach:
    // 1. User clicks on a table row
    // 2. Extension extracts company, role from table
    // 3. Opens actual job link
    // 4. Extracts from destination site (LinkedIn/company site)
    
    // For MVP: Just extract table data, mark as "GitHub" source
    return {
      platform: 'GitHub',
      // Extract from markdown table
    };
  }
}
```

---

## 5. Content Script Implementation

### 5.1 Main Content Script

**File:** `src/content/index.ts`

```typescript
import { PlatformDetector } from './platform-detector';
import { ExtractorFactory } from './extractors';
import { UIInjector } from './ui-injector';
import { logger } from '../lib/logger';

/**
 * Main content script entry point.
 * 
 * Runs on every job platform page and:
 * 1. Detects platform
 * 2. Injects "Score This Job" button
 * 3. Extracts job data when clicked
 * 4. Sends to background script for scoring
 */

class ContentScriptMain {
  private platform: string;
  private uiInjector: UIInjector | null = null;
  
  async init() {
    logger.log('Content script initializing...');
    
    // Detect platform
    this.platform = PlatformDetector.detect();
    
    if (this.platform === 'Other') {
      logger.log('Not on a supported job platform, exiting');
      return;
    }
    
    if (!PlatformDetector.isJobPage()) {
      logger.log(`On ${this.platform} but not on job page, exiting`);
      return;
    }
    
    logger.log(`Detected platform: ${this.platform}`);
    
    // Wait for page to fully load (handle dynamic content)
    await this.waitForContent();
    
    // Inject UI
    this.uiInjector = new UIInjector(this.platform);
    this.uiInjector.inject();
    
    // Listen for score button click
    this.uiInjector.onScoreClick(() => this.handleScoreClick());
  }
  
  private async waitForContent(): Promise<void> {
    // Wait for key elements to appear (handle React hydration)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const extractor = ExtractorFactory.create(this.platform);
        if (extractor && extractor.canExtract()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }
  
  private async handleScoreClick() {
    logger.log('Score button clicked, extracting job data...');
    
    try {
      // Extract job data
      const extractor = ExtractorFactory.create(this.platform);
      if (!extractor) {
        throw new Error(`No extractor for platform: ${this.platform}`);
      }
      
      const jobData = extractor.extract();
      
      // Validate required fields
      if (!jobData.jd_text || jobData.jd_text.length < 10) {
        throw new Error('Job description too short or missing');
      }
      
      // Send to background script
      const response = await chrome.runtime.sendMessage({
        type: 'SCORE_JOB',
        payload: jobData,
      });
      
      // Show results in UI
      this.uiInjector?.showResults(response);
      
    } catch (error) {
      logger.error('Failed to score job:', error);
      this.uiInjector?.showError(error.message);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScriptMain().init();
  });
} else {
  new ContentScriptMain().init();
}
```

---

### 5.2 UI Injector

**File:** `src/content/ui-injector.ts`

```typescript
/**
 * Injects "Score This Job" button and results UI into job pages.
 */
export class UIInjector {
  private scoreButton: HTMLElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  
  constructor(private platform: string) {}
  
  /**
   * Inject "Score This Job" button into page.
   */
  inject() {
    // Create button
    this.scoreButton = this.createScoreButton();
    
    // Find appropriate insertion point based on platform
    const insertionPoint = this.findInsertionPoint();
    if (insertionPoint) {
      insertionPoint.appendChild(this.scoreButton);
    }
    
    // Create results container (hidden initially)
    this.resultsContainer = this.createResultsContainer();
    document.body.appendChild(this.resultsContainer);
  }
  
  private createScoreButton(): HTMLElement {
    const button = document.createElement('button');
    button.id = 'fuckwork-score-button';
    button.textContent = '🎯 Score This Job';
    button.style.cssText = `
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 8px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#1d4ed8';
      button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '#2563eb';
      button.style.transform = 'translateY(0)';
    });
    
    return button;
  }
  
  private findInsertionPoint(): Element | null {
    // Platform-specific insertion points
    if (this.platform === 'LinkedIn') {
      return document.querySelector('.jobs-unified-top-card__content--two-pane');
    }
    
    if (this.platform === 'Indeed') {
      return document.querySelector('.jobsearch-JobInfoHeader-title-container');
    }
    
    return null;
  }
  
  onScoreClick(callback: () => void) {
    this.scoreButton?.addEventListener('click', () => {
      this.showLoading();
      callback();
    });
  }
  
  showLoading() {
    if (this.scoreButton) {
      this.scoreButton.textContent = '⏳ Scoring...';
      this.scoreButton.style.pointerEvents = 'none';
    }
  }
  
  showResults(result: ScoreJobResponse) {
    // Update button
    if (this.scoreButton) {
      this.scoreButton.textContent = `✓ Score: ${result.authenticity_score}`;
      this.scoreButton.style.background = this.getScoreColor(result.authenticity_score);
    }
    
    // Show detailed results in container
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = this.renderResults(result);
      this.resultsContainer.style.display = 'block';
    }
  }
  
  showError(message: string) {
    if (this.scoreButton) {
      this.scoreButton.textContent = '✗ Error';
      this.scoreButton.style.background = '#dc2626';
    }
    
    alert(`Failed to score job: ${message}`);
  }
  
  private getScoreColor(score: number): string {
    if (score >= 80) return '#059669';  // Green
    if (score >= 55) return '#d97706';  // Orange
    return '#dc2626';  // Red
  }
  
  private renderResults(result: ScoreJobResponse): string {
    return `
      <div style="
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Authenticity Score</h3>
          <button onclick="this.parentElement.parentElement.style.display='none'" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>
        
        <div style="text-align: center; margin: 16px 0;">
          <div style="
            font-size: 48px;
            font-weight: 700;
            color: ${this.getScoreColor(result.authenticity_score)};
          ">${result.authenticity_score}</div>
          <div style="
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${result.level}</div>
        </div>
        
        <div style="margin: 16px 0;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Confidence</div>
          <div style="font-size: 14px; font-weight: 600;">${result.confidence}</div>
        </div>
        
        ${result.red_flags.length > 0 ? `
          <div style="margin: 16px 0;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Red Flags</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
              ${result.red_flags.map(flag => `<li style="margin: 4px 0;">${flag}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${result.positive_signals.length > 0 ? `
          <div style="margin: 16px 0;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Positive Signals</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #059669;">
              ${result.positive_signals.map(signal => `<li style="margin: 4px 0;">${signal}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <button style="
            width: 100%;
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">Save to Queue</button>
        </div>
      </div>
    `;
  }
}
```

---

## 6. Background Service Worker

**File:** `src/background/service-worker.ts`

```typescript
import { ScoreJobRequest, ScoreJobResponse } from '../types/api';
import { JobData } from '../types/job-data';
import { ApiClient } from '../lib/api-client';
import { logger } from '../lib/logger';

/**
 * Background service worker for extension.
 * 
 * Handles:
 * - Communication between content scripts and backend API
 * - Extension lifecycle events
 * - Storage management
 */

const apiClient = new ApiClient('http://localhost:5123');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCORE_JOB') {
    handleScoreJob(message.payload)
      .then(sendResponse)
      .catch(error => {
        logger.error('Error scoring job:', error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate async response
    return true;
  }
  
  if (message.type === 'HEALTH_CHECK') {
    handleHealthCheck()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleScoreJob(jobData: Partial<JobData>): Promise<ScoreJobResponse> {
  logger.log('Scoring job:', jobData.job_id);
  
  try {
    // Send to backend
    const response = await apiClient.scoreJob(jobData as JobData);
    
    // Save to local storage for history
    await saveJobScore(jobData, response);
    
    return response;
  } catch (error) {
    logger.error('Backend API error:', error);
    throw new Error('Failed to connect to backend. Is the local app running?');
  }
}

async function handleHealthCheck(): Promise<{ status: string }> {
  try {
    const health = await apiClient.healthCheck();
    return { status: health.status };
  } catch (error) {
    return { status: 'error' };
  }
}

async function saveJobScore(jobData: Partial<JobData>, score: ScoreJobResponse) {
  const { storage } = chrome;
  
  // Save to chrome.storage.local
  const key = `score_${jobData.job_id}`;
  await storage.local.set({
    [key]: {
      job_data: jobData,
      score_result: score,
      timestamp: Date.now(),
    },
  });
}
```

---

## 7. API Client

**File:** `src/lib/api-client.ts`

```typescript
import { JobData } from '../types/job-data';
import { ScoreJobRequest, ScoreJobResponse, HealthCheckResponse, ApiError } from '../types/api';

/**
 * Client for communicating with local backend API.
 */
export class ApiClient {
  constructor(private baseUrl: string = 'http://localhost:5123') {}
  
  /**
   * Score a job via backend API.
   */
  async scoreJob(jobData: JobData): Promise<ScoreJobResponse> {
    const response = await fetch(`${this.baseUrl}/api/score-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_data: jobData }),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    
    return await response.json();
  }
  
  /**
   * Check if backend is healthy.
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return await response.json();
  }
}
```

---

## 8. Backend API Endpoints (Python)

**File:** `apps/backend/main.py` (new file)

```python
"""FastAPI backend for FuckWork extension."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from authenticity_scoring import AuthenticityScorer

logger = logging.getLogger(__name__)

app = FastAPI(title="FuckWork API", version="1.0.0")

# Enable CORS for localhost extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Extension runs from chrome-extension://
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scorer
scorer = AuthenticityScorer("authenticity_scoring/data/authenticity_rule_table.json")


# Request/Response models
class PosterInfo(BaseModel):
    name: str
    title: str
    company: str
    location: str
    account_age_months: Optional[int] = None
    recent_job_count_7d: Optional[int] = None


class CompanyInfo(BaseModel):
    website_domain: Optional[str] = None
    domain_matches_name: bool
    size_employees: Optional[int] = None
    glassdoor_rating: Optional[float] = None
    has_layoffs_recent: bool


class PlatformMetadata(BaseModel):
    posted_days_ago: int
    repost_count: int
    applicants_count: Optional[int] = None
    views_count: Optional[int] = None
    actively_hiring_tag: bool
    easy_apply: bool


class DerivedSignals(BaseModel):
    company_domain_mismatch: bool
    poster_no_company: bool
    poster_job_location_mismatch: bool
    company_poster_mismatch: bool
    no_poster_identity: bool


class JobDataModel(BaseModel):
    job_id: str
    title: str
    company_name: str
    platform: str
    location: str
    url: str
    jd_text: str
    poster_info: Optional[PosterInfo] = None
    company_info: Optional[CompanyInfo] = None
    platform_metadata: PlatformMetadata
    derived_signals: DerivedSignals


class ScoreJobRequest(BaseModel):
    job_data: JobDataModel


@app.post("/api/score-job")
async def score_job(request: ScoreJobRequest):
    """Score a job posting for authenticity."""
    try:
        # Convert to dict for scorer
        job_dict = request.job_data.model_dump()
        
        # Score it
        result = scorer.score_job(job_dict)
        
        logger.info(
            f"Scored job {job_dict['job_id']}: "
            f"score={result['authenticity_score']}, level={result['level']}"
        )
        
        return result
        
    except Exception as e:
        logger.exception(f"Error scoring job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "scorer_loaded": scorer is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5123)
```

---

## 9. Manifest V3 Configuration

**File:** `apps/browser_extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "FuckWork - Job Authenticity Scorer",
  "version": "0.1.0",
  "description": "Score job postings for authenticity to avoid fake jobs and body shops",
  
  "permissions": [
    "storage",
    "activeTab"
  ],
  
  "host_permissions": [
    "http://localhost:5123/*"
  ],
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "content_scripts": [
    {
      "matches": [
        "https://www.linkedin.com/jobs/*",
        "https://linkedin.com/jobs/*"
      ],
      "js": ["content/linkedin.js"],
      "run_at": "document_idle"
    },
    {
      "matches": [
        "https://www.indeed.com/viewjob*",
        "https://indeed.com/viewjob*"
      ],
      "js": ["content/indeed.js"],
      "run_at": "document_idle"
    },
    {
      "matches": [
        "https://www.glassdoor.com/job-listing/*",
        "https://glassdoor.com/job-listing/*"
      ],
      "js": ["content/glassdoor.js"],
      "run_at": "document_idle"
    },
    {
      "matches": [
        "https://www.ycombinator.com/jobs/*"
      ],
      "js": ["content/yc.js"],
      "run_at": "document_idle"
    },
    {
      "matches": [
        "https://github.com/*/College-Jobs*",
        "https://github.com/*/AI-College-Jobs*"
      ],
      "js": ["content/github.js"],
      "run_at": "document_idle"
    }
  ],
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## 10. Build Configuration

### 10.1 Package.json

**File:** `apps/browser_extension/package.json`

```json
{
  "name": "fuckwork-extension",
  "version": "0.1.0",
  "description": "Job authenticity scoring extension",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.253",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "copy-webpack-plugin": "^11.0.0",
    "eslint": "^8.50.0",
    "ts-loader": "^9.5.0",
    "typescript": "^5.2.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0"
  }
}
```

### 10.2 Webpack Config

**File:** `apps/browser_extension/webpack.config.js`

```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content/linkedin': './src/content/linkedin-entry.ts',
    'content/indeed': './src/content/indeed-entry.ts',
    'popup/popup': './src/popup/popup.ts',
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  resolve: {
    extensions: ['.ts', '.js'],
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
  },
  
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'icons', to: 'icons' },
      ],
    }),
  ],
};
```

---

## 11. Testing Strategy

### 11.1 Manual Testing Approach

**Phase 2 has no automated tests initially** - testing happens manually because:
- DOM scraping requires real browser context
- Each platform has different structure
- Visual validation needed

**Test Process:**
1. Load unpacked extension in Chrome
2. Visit job page on each platform
3. Click "Score This Job" button
4. Verify data extraction accuracy
5. Verify backend communication
6. Verify UI display

### 11.2 Test Cases

**Test Suite:**
```
TC1: LinkedIn - Extract FAANG job → verify all fields populated
TC2: Indeed - Extract job → verify extraction works
TC3: Glassdoor - Extract job → verify extraction works
TC4: Missing backend → show error message gracefully
TC5: Malformed page → handle extraction failure
TC6: Very long JD → no performance issues
TC7: Unicode content → extract correctly
TC8: Multiple tabs → each scores independently
```

---

## 12. Implementation Phases

### Phase 2.1: Foundation (Week 1)
- Set up extension project structure
- Configure build system (webpack + TypeScript)
- Create manifest.json
- Test extension loads

### Phase 2.2: LinkedIn Extractor (Week 2)
- Implement LinkedInExtractor
- Test on 10+ real LinkedIn jobs
- Verify data accuracy

### Phase 2.3: Backend API (Week 2-3)
- Create FastAPI endpoints
- Test extension → backend communication
- Verify CORS working

### Phase 2.4: UI Injection (Week 3)
- Implement UIInjector
- Design results display
- Test button placement

### Phase 2.5: Additional Platforms (Week 4)
- Implement Indeed extractor
- Implement other platforms (Glassdoor, YC, GitHub)
- Test each platform

### Phase 2.6: Polish & Error Handling (Week 5)
- Improve error messages
- Add loading states
- Handle edge cases
- Final testing

---

## 13. Acceptance Criteria

### MVP Complete When:

**Functional:**
- ✅ Extension loads in Chrome
- ✅ LinkedIn extraction works (10+ jobs tested)
- ✅ Backend API receives data correctly
- ✅ Scoring results display in UI
- ✅ "Save to Queue" button present (doesn't need to work yet)

**Technical:**
- ✅ TypeScript compiles with no errors
- ✅ Webpack builds successfully
- ✅ No console errors on job pages
- ✅ CORS configured correctly
- ✅ Extension permissions minimal

**Quality:**
- ✅ At least 80% of visible fields extracted from LinkedIn
- ✅ Extracted data passes to Phase 1 scorer without errors
- ✅ UI displays correctly on 1920x1080 and 1366x768 screens
- ✅ No crashes on malformed pages

---

## 14. Known Limitations (Acceptable for MVP)

**NOT required for Phase 2 MVP:**
- ❌ Automatic poster account age extraction (set to null)
- ❌ Recent job count extraction (requires profile visit)
- ❌ Company size extraction (requires company page)
- ❌ Glassdoor rating (external API needed)
- ❌ Layoffs data (external API needed)
- ❌ Indeed/Glassdoor extractors (LinkedIn only for MVP)
- ❌ Popup dashboard (just results display)
- ❌ Job queue management (Phase 3)

These will be added in later phases.

---

## 15. Security & Privacy

### Permissions Strategy
- **Minimal permissions:** Only `storage` and `activeTab`
- **No broad host permissions:** Only localhost API
- **No data sent to cloud:** All local processing
- **No tracking:** No analytics, no telemetry

### Data Handling
- Job data stays local (extension storage + backend SQLite)
- No passwords or credentials stored
- No form autofill (respects platform ToS)
- Read-only DOM access (no manipulation)

---

## END OF SPECIFICATION

**Status:** Ready for Cursor Implementation  
**Next Step:** Create extension project structure
