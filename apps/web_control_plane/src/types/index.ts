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
  updated_at: string
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

