// =============================================================================
// Types Index - Phase 7.0
// Core types (Auth, Jobs, Tasks, Observability)
// Profile types moved to ./profile.ts
// =============================================================================

// -----------------------------------------------------------------------------
// User / Auth Types
// -----------------------------------------------------------------------------

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
  expires_at: string
}

// -----------------------------------------------------------------------------
// Derived Profile (ATS-ready answers) - Legacy, may be deprecated
// -----------------------------------------------------------------------------

export interface DerivedProfile {
  legal_name?: string
  highest_degree?: string
  graduation_year?: number
  years_of_experience?: number
  work_authorized_us?: boolean
  requires_sponsorship?: boolean
  work_auth_category?: string
  willing_to_relocate: boolean
  government_employment_flag: boolean
  normalized_skills: string[]
  primary_email?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
  missing_fields: string[]
  source_fields: Record<string, string[]>
}

// -----------------------------------------------------------------------------
// Automation Preferences - Legacy, may be deprecated
// -----------------------------------------------------------------------------

export interface AutomationPreferences {
  id: number
  user_id: number
  version: number
  auto_fill_after_login: boolean
  auto_submit_when_ready: boolean
  require_review_before_submit: boolean
  per_ats_overrides: Record<string, unknown>
  field_autofill_rules: Record<string, unknown>
  submit_review_timeout_ms: number
  last_synced_at?: string
  sync_source?: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Apply Task Types
// -----------------------------------------------------------------------------

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
  task_metadata?: {
    url?: string
    company?: string
    title?: string
    platform?: string
    [key: string]: unknown
  }
}

// -----------------------------------------------------------------------------
// Automation Event Types
// -----------------------------------------------------------------------------

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
  preferences_snapshot?: Record<string, unknown>
  event_payload?: Record<string, unknown>
  created_at: string
}

// -----------------------------------------------------------------------------
// Job Types
// -----------------------------------------------------------------------------

export interface Job {
  id: number
  job_id: string
  title: string
  company_name: string
  location?: string
  url: string
  platform: string
  authenticity_score?: number
  authenticity_level?: string
  posted_date?: string
  created_at: string
  decision_summary?: {
    decision: 'recommend' | 'caution' | 'avoid'
    score: number
  }
}

export interface JobSearchResponse {
  jobs: Job[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// -----------------------------------------------------------------------------
// Observability Console Types
// -----------------------------------------------------------------------------

export interface ApplyRun {
  id: number
  task_id?: number
  job_id?: string
  initial_url: string
  current_url: string
  ats_kind?: string
  intent?: string
  stage?: string
  status: string
  fill_rate?: number
  fields_attempted: number
  fields_filled: number
  fields_skipped: number
  failure_reason?: string
  created_at: string
  updated_at: string
  ended_at?: string
}

export interface ApplyEvent {
  id: number
  source: string
  severity: string
  event_name: string
  event_version: number
  ts: string
  url?: string
  payload: Record<string, unknown>
  detection_id?: string
  page_id?: string
}

export interface RunListResponse {
  runs: ApplyRun[]
  total: number
  limit: number
  offset: number
}

export interface RunEventsResponse {
  events: ApplyEvent[]
  total: number
}

// -----------------------------------------------------------------------------
// Re-export Profile Types
// -----------------------------------------------------------------------------

export * from './profile'
