import axios, { AxiosInstance } from 'axios'
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User,
  Profile,
  DerivedProfile,
  AutomationPreferences,
  ApplyTask,
  AutomationEvent,
  Education,
  Experience,
  Project,
  Skill,
  Job,
  JobSearchResponse,
  RunListResponse,
  RunEventsResponse
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class APIService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add auth token to requests
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
          this.clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  getToken(): string | null {
    return localStorage.getItem('fw_jwt_token')
  }

  setToken(token: string): void {
    localStorage.setItem('fw_jwt_token', token)
  }

  clearAuth(): void {
    localStorage.removeItem('fw_jwt_token')
  }

  async register(data: RegisterRequest): Promise<{ user_id: number; email: string; message: string }> {
    const response = await this.client.post('/api/auth/register', data)
    return response.data
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/login', data)
    const authData = response.data
    this.setToken(authData.access_token)
    return authData
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/api/auth/me')
    return response.data
  }

  // Profile methods
  async getProfile(): Promise<Profile> {
    const response = await this.client.get('/api/users/me/profile')
    return response.data
  }

  async updateProfile(data: Partial<Profile>): Promise<{ id: number; updated_at: string; message: string }> {
    const response = await this.client.put('/api/users/me/profile', data)
    return response.data
  }

  // Phase 5.2.1: Derived Profile (ATS-ready answers)
  async getDerivedProfile(): Promise<DerivedProfile> {
    const response = await this.client.get('/api/users/me/derived-profile')
    return response.data
  }

  // Automation Preferences methods
  async getAutomationPreferences(): Promise<AutomationPreferences> {
    const response = await this.client.get('/api/users/me/automation-preferences')
    return response.data
  }

  async updateAutomationPreferences(data: Partial<AutomationPreferences>): Promise<{ id: number; updated_at: string; message: string }> {
    const response = await this.client.put('/api/users/me/automation-preferences', data)
    return response.data
  }

  // Apply Tasks methods
  async getApplyTasks(status?: string, limit = 50, offset = 0): Promise<{ tasks: ApplyTask[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    if (status) params.append('status', status)
    const response = await this.client.get(`/api/users/me/apply-tasks?${params}`)
    return response.data
  }

  // Automation Events methods
  async getAutomationEvents(filters?: { task_id?: number; session_id?: string; event_type?: string }, limit = 100, offset = 0): Promise<{ events: AutomationEvent[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() })
    if (filters?.task_id) params.append('task_id', filters.task_id.toString())
    if (filters?.session_id) params.append('session_id', filters.session_id)
    if (filters?.event_type) params.append('event_type', filters.event_type)
    const response = await this.client.get(`/api/users/me/automation-events?${params}`)
    return response.data
  }

  // Phase 5.2: Education methods
  async getEducation(): Promise<{ education: Education[]; total: number }> {
    const response = await this.client.get('/api/users/me/education')
    return response.data
  }

  async createEducation(data: Omit<Education, 'id'>): Promise<Education> {
    const response = await this.client.post('/api/users/me/education', data)
    return response.data
  }

  async updateEducation(id: number, data: Partial<Omit<Education, 'id'>>): Promise<Education> {
    const response = await this.client.put(`/api/users/me/education/${id}`, data)
    return response.data
  }

  async deleteEducation(id: number): Promise<void> {
    await this.client.delete(`/api/users/me/education/${id}`)
  }

  // Phase 5.2: Experience methods
  async getExperience(): Promise<{ experience: Experience[]; total: number }> {
    const response = await this.client.get('/api/users/me/experience')
    return response.data
  }

  async createExperience(data: Omit<Experience, 'id'>): Promise<Experience> {
    const response = await this.client.post('/api/users/me/experience', data)
    return response.data
  }

  async updateExperience(id: number, data: Partial<Omit<Experience, 'id'>>): Promise<Experience> {
    const response = await this.client.put(`/api/users/me/experience/${id}`, data)
    return response.data
  }

  async deleteExperience(id: number): Promise<void> {
    await this.client.delete(`/api/users/me/experience/${id}`)
  }

  // Phase 5.2: Projects methods
  async getProjects(): Promise<{ projects: Project[]; total: number }> {
    const response = await this.client.get('/api/users/me/projects')
    return response.data
  }

  async createProject(data: Omit<Project, 'id'>): Promise<Project> {
    const response = await this.client.post('/api/users/me/projects', data)
    return response.data
  }

  async updateProject(id: number, data: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const response = await this.client.put(`/api/users/me/projects/${id}`, data)
    return response.data
  }

  async deleteProject(id: number): Promise<void> {
    await this.client.delete(`/api/users/me/projects/${id}`)
  }

  // Phase 5.2: Skills methods
  async getSkills(): Promise<{ skills: Skill[]; total: number }> {
    const response = await this.client.get('/api/users/me/skills')
    return response.data
  }

  async createSkill(data: Omit<Skill, 'id'>): Promise<Skill> {
    const response = await this.client.post('/api/users/me/skills', data)
    return response.data
  }

  async updateSkill(id: number, data: Partial<Omit<Skill, 'id'>>): Promise<Skill> {
    const response = await this.client.put(`/api/users/me/skills/${id}`, data)
    return response.data
  }

  async deleteSkill(id: number): Promise<void> {
    await this.client.delete(`/api/users/me/skills/${id}`)
  }

  // Phase 5.2: Jobs methods
  async searchJobs(filters?: any, limit = 20, offset = 0): Promise<JobSearchResponse> {
    const payload = {
      filters: filters || {},
      sort_by: 'newest',
      limit,
      offset
    }
    const response = await this.client.post('/jobs/search', payload)
    return response.data
  }

  async addJobManually(job: { url: string; title: string; company_name: string; platform?: string }): Promise<Job> {
    const response = await this.client.post('/jobs/manual', job)
    return response.data
  }

  // Phase 5.2: Task creation
  async createApplyTask(job_id: string): Promise<{ id: number; job_id: string; status: string; created_at: string; message: string }> {
    const response = await this.client.post('/api/users/me/apply-tasks', { job_id })
    return response.data
  }

  // ============================================================
  // Phase 5.3.0: Observability Console API
  // ============================================================

  /**
   * Get observability runs with filters
   */
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

  /**
   * Get observability run detail
   */
  async getObservabilityRun(runId: number): Promise<any> {
    const response = await this.client.get(`/api/observability/runs/${runId}`)
    return response.data
  }

  /**
   * Get observability run events timeline
   */
  async getObservabilityRunEvents(runId: number, limit: number = 500): Promise<RunEventsResponse> {
    const response = await this.client.get(`/api/observability/runs/${runId}/events?limit=${limit}`)
    return response.data
  }
}

export default new APIService()

