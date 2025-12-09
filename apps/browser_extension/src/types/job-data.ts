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

