// User types
export interface User {
  user_id: number
  email: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: number
  email: string
}

// Profile types
export interface Profile {
  id: number
  user_id: number
  version: number
  first_name?: string
  last_name?: string
  full_name?: string
  primary_email?: string
  secondary_email?: string
  phone?: string
  resume_url?: string
  resume_filename?: string
  resume_uploaded_at?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
  work_authorization?: string
  visa_status?: string
  // Phase 5.2: Collections
  education?: Education[]
  experience?: Experience[]
  projects?: Project[]
  skills?: Skill[]
  // Phase 5.2: Compliance
  willing_to_relocate?: boolean
  government_employment_history?: boolean
  updated_at: string
}

// Phase 5.2: Education
export interface Education {
  id: number
  school_name: string
  degree?: string
  major?: string
  start_date?: string
  end_date?: string
  gpa?: number
}

// Phase 5.2: Experience
export interface Experience {
  id: number
  company_name: string
  job_title: string
  start_date?: string
  end_date?: string
  is_current: boolean
  responsibilities?: string
}

// Phase 5.2: Project
export interface Project {
  id: number
  project_name: string
  role?: string
  description?: string
  tech_stack?: string
}

// Phase 5.2: Skill
export interface Skill {
  id: number
  skill_name: string
  skill_category?: string
}

// Phase 5.2.1: Derived Profile (ATS-ready answers)
export interface DerivedProfile {
  // Identity (computed)
  legal_name?: string
  
  // Education (computed)
  highest_degree?: string  // PhD, MS, BS, AS
  graduation_year?: number
  
  // Experience (computed)
  years_of_experience?: number
  
  // Compliance (normalized + direct)
  work_authorization_status?: string  // US_CITIZEN, GREEN_CARD, H1B, OPT, etc.
  willing_to_relocate: boolean
  government_employment_flag: boolean
  
  // Skills (normalized)
  normalized_skills: string[]
  
  // Contact (passthrough)
  primary_email?: string
  phone?: string
  
  // Location (passthrough)
  city?: string
  state?: string
  country?: string
  postal_code?: string
  
  // Professional Links (passthrough)
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
}

// Automation Preferences types
export interface AutomationPreferences {
  id: number
  user_id: number
  version: number
  auto_fill_after_login: boolean
  auto_submit_when_ready: boolean
  require_review_before_submit: boolean
  per_ats_overrides: Record<string, any>
  field_autofill_rules: Record<string, any>
  submit_review_timeout_ms: number
  last_synced_at?: string
  sync_source?: string
  updated_at: string
}

// Apply Task types
export interface ApplyTask {
  id: number
  job_id: string
  status: string
  priority: number
  company?: string
  source?: string
  current_stage?: string
  last_action?: string
  blocked_reason?: string
  created_at: string
  updated_at: string
}

// Automation Event types
export interface AutomationEvent {
  id: number
  user_id?: number
  task_id?: number
  session_id?: string
  event_type: string
  event_category?: string
  detection_id?: string
  page_url?: string
  page_intent?: string
  ats_kind?: string
  apply_stage?: string
  automation_decision?: string
  decision_reason?: string
  preferences_snapshot?: Record<string, any>
  event_payload?: Record<string, any>
  created_at: string
}

// Phase 5.2: Job types
export interface Job {
  id: number
  job_id: string
  title: string
  company_name: string
  url: string
  platform: string
  authenticity_score?: number
  authenticity_level?: string
  posted_date?: string
  created_at: string
}

export interface JobSearchResponse {
  jobs: Job[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

