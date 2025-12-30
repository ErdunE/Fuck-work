// =============================================================================
// API Service - Phase 7.0
// Core API methods (Auth, Jobs, Tasks, Observability, Active Session)
// Profile-related methods moved to profileApi.ts
// =============================================================================

import axios, { AxiosInstance } from 'axios'
import type {
  User,
  DerivedProfile,
  AutomationPreferences,
  ApplyTask,
  AutomationEvent,
  Job,
  JobSearchResponse,
  RunListResponse,
  RunEventsResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class APIService {
  public client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add Cognito token to requests
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('[API] 401 Unauthorized, clearing auth...')
          this.clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // ===========================================================================
  // Token Management
  // ===========================================================================

  getToken(): string | null {
    return localStorage.getItem('fw_id_token')
  }

  clearAuth(): void {
    localStorage.removeItem('fw_id_token')
    localStorage.removeItem('fw_access_token')
    localStorage.removeItem('fw_refresh_token')
    localStorage.removeItem('fw_token_expires_at')
  }

  // ===========================================================================
  // Auth
  // ===========================================================================

  async logout(): Promise<{ ok: boolean; message: string }> {
    const response = await this.client.post('/api/auth/logout')
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/api/auth/me')
    return response.data
  }

  // ===========================================================================
  // Derived Profile (ATS-ready answers) - Legacy, may be deprecated
  // ===========================================================================

  async getDerivedProfile(): Promise<DerivedProfile> {
    const response = await this.client.get('/api/users/me/derived-profile')
    return response.data
  }

  // ===========================================================================
  // Automation Preferences - Legacy, may be deprecated
  // ===========================================================================

  async getAutomationPreferences(): Promise<AutomationPreferences> {
    const response = await this.client.get('/api/users/me/automation-preferences')
    return response.data
  }

  async updateAutomationPreferences(
    data: Partial<AutomationPreferences>
  ): Promise<{ id: number; updated_at: string; message: string }> {
    const response = await this.client.put('/api/users/me/automation-preferences', data)
    return response.data
  }

  // ===========================================================================
  // Apply Tasks
  // ===========================================================================

  async getApplyTasks(
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<{ tasks: ApplyTask[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (status) params.append('status', status)
    const response = await this.client.get(`/api/users/me/apply-tasks?${params}`)
    return response.data
  }

  async createApplyTask(
    job_id: string
  ): Promise<{ id: number; job_id: string; status: string; created_at: string; message: string }> {
    const response = await this.client.post('/api/users/me/apply-tasks', { job_id })
    return response.data
  }

  async executeApplyTask(taskId: number): Promise<{
    run_id: number
    job_url: string
    ats_type?: string
    message: string
  }> {
    const response = await this.client.post(`/api/users/me/apply-tasks/${taskId}/execute`)
    return response.data
  }

  // ===========================================================================
  // Automation Events
  // ===========================================================================

  async getAutomationEvents(
    filters?: { task_id?: number; session_id?: string; event_type?: string },
    limit = 100,
    offset = 0
  ): Promise<{ events: AutomationEvent[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (filters?.task_id) params.append('task_id', filters.task_id.toString())
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.event_type) params.append('event_type', filters.event_type)
    const response = await this.client.get(`/api/users/me/automation-events?${params}`)
    return response.data
  }

  // ===========================================================================
  // Jobs
  // ===========================================================================

  async searchJobs(
    filters?: Record<string, unknown>,
    limit = 20,
    offset = 0,
    sortBy = 'newest'
  ): Promise<JobSearchResponse> {
    const payload = {
      filters: filters || {},
      sort_by: sortBy,
      limit,
      offset,
    }
    const response = await this.client.post('/jobs/search', payload)
    return response.data
  }

  async addJobManually(job: {
    url: string
    title: string
    company_name: string
    platform?: string
  }): Promise<Job> {
    const response = await this.client.post('/jobs/manual', job)
    return response.data
  }

  // ===========================================================================
  // Observability Console
  // ===========================================================================

  async getObservabilityRuns(filters: {
    limit?: number
    offset?: number
    status?: string
    ats_kind?: string
    q?: string
  }): Promise<RunListResponse> {
    const params = new URLSearchParams()
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.ats_kind) params.append('ats_kind', filters.ats_kind)
    if (filters.q) params.append('q', filters.q)

    const response = await this.client.get(`/api/observability/runs?${params.toString()}`)
    return response.data
  }

  async getObservabilityRun(runId: number): Promise<unknown> {
    const response = await this.client.get(`/api/observability/runs/${runId}`)
    return response.data
  }

  async getObservabilityRunEvents(runId: number, limit = 500): Promise<RunEventsResponse> {
    const response = await this.client.get(`/api/observability/runs/${runId}/events?limit=${limit}`)
    return response.data
  }

  // ===========================================================================
  // Active Session Bridge
  // ===========================================================================

  async setActiveSession(data: {
    task_id: number
    run_id: number
    job_url: string
    ats_type?: string
  }): Promise<{
    active: boolean
    task_id: number
    run_id: number
    job_url: string
    ats_type?: string
    created_at: string
    expires_at: string
  }> {
    const response = await this.client.post('/api/users/me/active-session', data)
    return response.data
  }

  async getActiveSession(): Promise<{
    active: boolean
    task_id?: number
    run_id?: number
    job_url?: string
    ats_type?: string
    created_at?: string
    expires_at?: string
  }> {
    const response = await this.client.get('/api/users/me/active-session')
    return response.data
  }

  async clearActiveSession(): Promise<{ ok: boolean; message: string }> {
    const response = await this.client.delete('/api/users/me/active-session')
    return response.data
  }
}

export default new APIService()
